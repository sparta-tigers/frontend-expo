import { Box, Typography } from "@/components/ui";
import { SafeLayout } from "@/components/ui/safe-layout";
import {
  attendanceKeys,
  useCreateAttendance,
  useMyAttendanceByMatchId,
  useUpdateAttendance,
  RNFormDataFile,
  RNFormDataString,
} from "@/src/features/match-attendance/queries";
import { theme } from "@/src/styles/theme";
import { Logger } from "@/src/utils/logger";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

/**
 * 레이아웃 고정 상수
 * Why: StyleSheet 내에서 매직 넘버 사용을 방지하고 일관된 UI 규격을 유지하기 위함.
 */
const LOCAL_LAYOUT = {
  textAreaMinHeight: 150,
  imageSize: 100,
  removeButtonSize: 24,
  submitButtonHeight: 56,
} as const;

/**
 * 🚨 [Phase 24] 직관 기록 작성/수정 화면
 *
 * Why: 사용자가 특정 경기에 대한 직관 일기(내용, 사진, 좌석)를 기록함.
 * Zero-Magic: 클라이언트 단에서 이미지 리사이징(1024px) 및 압축을 수행하여 서버 부하를 최소화함.
 */
export default function AttendanceFormScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const matchIdNumber = Number(matchId);
  const logger = Logger.category("APP");

  const { data: attendance, isLoading: isAttendanceLoading } =
    useMyAttendanceByMatchId(matchIdNumber);
  const createAttendanceMutation = useCreateAttendance();
  const updateAttendanceMutation = useUpdateAttendance();
  const queryClient = useQueryClient();

  const [contents, setContents] = useState("");
  const [seat, setSeat] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [existingId, setExistingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 🎯 [Phase 2] 결정론적 수정 모드 판별 및 데이터 초기화
   * Why: matchId 단건 조회 결과(attendance)가 존재하면 수정 모드로 동작함.
   * 100건 제한 목록에 의존하지 않아 데이터 누락 위험이 없음.
   */
  useEffect(() => {
    if (attendance) {
      setExistingId(attendance.id);
      setContents(attendance.contents || "");
      setSeat(attendance.seat || "");
      // 🛡️ [Senior Architect] images 필드 유무 및 타입 체크 강화
      const safeImages = Array.isArray(attendance.images) ? attendance.images : [];
      setImages(safeImages.map((img) => img.imageUrl));
    } else {
      // 🎯 [Phase 36] 결정론적 상태 리셋: 데이터 부재 시(기록 없음 등) 폼 초기화
      setExistingId(null);
      setContents("");
      setSeat("");
      setImages([]);
    }
  }, [attendance]);

  if (isAttendanceLoading) {
    return (
      <SafeLayout style={styles.safeLayout}>
        <Box flex={1} justify="center" align="center">
          <ActivityIndicator size="large" color={theme.colors.brand.mint} />
          <Typography variant="caption" color="text.secondary" mt="md">
            기록을 확인하고 있습니다...
          </Typography>
        </Box>
      </SafeLayout>
    );
  }

  if (!matchId || isNaN(matchIdNumber)) {
    // 화이트 스크린 방지: 명시적인 에러 UI 렌더링
    return (
      <SafeLayout style={styles.safeLayout}>
        <Box flex={1} justify="center" align="center" p="SCREEN">
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={theme.colors.error}
          />
          <Typography
            variant="h3"
            color="text.primary"
            weight="bold"
            center
            mt="md"
          >
            유효하지 않은 경기 ID
          </Typography>
          <Typography variant="body2" color="text.secondary" center mt="sm">
            경기 정보를 불러올 수 없습니다.
          </Typography>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/(tabs)/history")}
          >
            <Typography variant="body1" color="background" weight="bold">
              이전 화면으로
            </Typography>
          </TouchableOpacity>
        </Box>
      </SafeLayout>
    );
  }

  /**
   * 사진 선택 핸들러
   * Why: 네이티브 갤러리 API를 호출하여 직관 인증샷을 안전하게 메모리에 적재하기 위함.
   */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
      quality: 1,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      setImages([...images, ...newImages]);
    }
  };

  /**
   * 사진 제거 핸들러
   * Why: 업로드 전 사용자가 잘못 선택한 사진을 목록에서 제외하기 위함.
   */
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  /**
   * 기록 저장 핸들러
   * Why: 작성된 일기와 사진을 Multipart/form-data 형태로 백엔드에 전송하여 영구 저장하기 위함.
   */
  const handleSubmit = async () => {
    if (!seat.trim()) {
      Alert.alert("알림", "좌석 정보를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();

      // 🎯 [Phase 41] 앙드레 카파시: 백엔드 DTO와 1:1 매핑 (Zero Magic)
      // trim()을 통해 불필요한 공백 제거 후 전송
      const requestDto = existingId
        ? {
            seat: seat.trim(),
            contents: contents?.trim() || "",
            oldImageUrls: images.filter((img) => img.startsWith("http")),
          }
        : {
            matchId: matchIdNumber,
            seat: seat.trim(),
            contents: contents?.trim() || "",
          };

      /**
       * 🎯 [Zero Magic] as any 대신 명시적 타입 선언 후 Blob으로 우회 캐스팅.
       * 이렇게 하면 객체 생성 시점에 오타를 TS가 완벽히 잡아냅니다.
       */
      const requestPart: RNFormDataString = {
        string: JSON.stringify(requestDto),
        type: "application/json",
      };
      formData.append("request", requestPart as unknown as Blob);

      // New Image Processing
      const newImages = images.filter((img) => !img.startsWith("http"));
      for (const uri of newImages) {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 1024 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
        );

        const timestamp = Date.now();
        const filename = `attendance_${matchIdNumber}_${timestamp}.jpg`;

        const imagePart: RNFormDataFile = {
          uri: manipulatedImage.uri,
          name: filename,
          type: "image/jpeg",
        };

        formData.append("images", imagePart as unknown as Blob);
      }

      if (existingId) {
        await updateAttendanceMutation.mutateAsync({
          id: existingId,
          formData,
        });
      } else {
        await createAttendanceMutation.mutateAsync(formData);
      }

      // 🚨 [Phase 34] 쿼리 무효화 정상화
      // 🚨 [Zero Magic UX] Alert 노출 전 백그라운드에서 캐시 갱신을 시작함.
      // 사용자가 Alert을 확인하는 동안 갱신이 진행되도록 await 대신 void 사용.
      queryClient
        .invalidateQueries({ queryKey: attendanceKeys.byMatch(matchIdNumber) })
        .catch((err) => logger.error("Invalidate failed", err));

      Alert.alert("성공", "직관 기록이 저장되었습니다.", [
        { text: "확인", onPress: () => router.replace("/(tabs)/history") },
      ]);
    } catch (error) {
      // 🚨 [Phase 37] 관측성 확보: 운영 환경 디버깅을 위해 에러 로깅 추가 (UX용 Alert는 유지)
      logger.error("save failed", error);
      Alert.alert("오류", "기록 저장 중 문제가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeLayout style={styles.safeLayout}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex1}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Box mb="xl">
            <Typography variant="h2" weight="bold" color="text.primary" mb="xs">
              직관 일기 작성
            </Typography>
            <Typography variant="caption" color="text.secondary">
              오늘의 분위기와 소중한 기억을 남겨보세요.
            </Typography>
          </Box>

          <Box mb="lg">
            <Typography variant="label" color="text.primary" mb="xs">
              좌석 정보
            </Typography>
            <TextInput
              style={styles.input}
              placeholder="예: 3루 레드석 204블록 12열"
              value={seat}
              onChangeText={setSeat}
              placeholderTextColor={theme.colors.text.secondary}
            />
          </Box>

          <Box mb="lg">
            <Typography variant="label" color="text.primary" mb="xs">
              내용
            </Typography>
            <TextInput
              style={styles.textArea}
              placeholder="오늘의 직관은 어땠나요? 팀의 분위기, 직관 후기 등을 남겨보세요."
              value={contents}
              onChangeText={setContents}
              multiline
              textAlignVertical="top"
              placeholderTextColor={theme.colors.text.secondary}
            />
          </Box>

          <Box mb="xxl">
            <Typography variant="label" color="text.primary" mb="sm">
              사진 (최대 5장)
            </Typography>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Box flexDir="row">
                {images.length < 5 && (
                  <TouchableOpacity
                    style={styles.imagePickerButton}
                    onPress={pickImage}
                  >
                    <Ionicons
                      name="camera-outline"
                      size={32}
                      color={theme.colors.text.secondary}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      mt="xs"
                    >
                      {images.length}/5
                    </Typography>
                  </TouchableOpacity>
                )}

                {images.map((uri, index) => (
                  <Box key={uri} mr="sm" position="relative">
                    <Image
                      source={{ uri }}
                      style={styles.thumbnail}
                      contentFit="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons
                        name="close"
                        size={14}
                        color={theme.colors.background}
                      />
                    </TouchableOpacity>
                  </Box>
                ))}
              </Box>
            </ScrollView>
          </Box>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={theme.colors.background} />
            ) : (
              <Typography variant="body1" weight="bold" color="background">
                직관 기록 저장
              </Typography>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  safeLayout: {
    backgroundColor: theme.colors.background,
  },
  flex1: {
    flex: 1,
  },
  container: {
    padding: theme.spacing.SCREEN,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.md,
    borderWidth: theme.colors.border.width.light,
    borderColor: theme.colors.border.medium,
  },
  textArea: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.md,
    borderWidth: theme.colors.border.width.light,
    borderColor: theme.colors.border.medium,
    minHeight: LOCAL_LAYOUT.textAreaMinHeight,
  },
  imagePickerButton: {
    width: LOCAL_LAYOUT.imageSize,
    height: LOCAL_LAYOUT.imageSize,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.colors.border.width.light,
    borderStyle: "dashed",
    borderColor: theme.colors.border.medium,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.sm,
  },
  thumbnail: {
    width: LOCAL_LAYOUT.imageSize,
    height: LOCAL_LAYOUT.imageSize,
    borderRadius: theme.radius.md,
  },
  removeButton: {
    position: "absolute",
    top: -theme.spacing.xs,
    right: -theme.spacing.xs,
    backgroundColor: theme.colors.error,
    width: LOCAL_LAYOUT.removeButtonSize,
    height: LOCAL_LAYOUT.removeButtonSize,
    borderRadius: theme.radius.full,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: theme.colors.border.width.medium,
    borderColor: theme.colors.background,
  },
  submitButton: {
    backgroundColor: theme.colors.brand.mint,
    height: LOCAL_LAYOUT.submitButtonHeight,
    borderRadius: theme.radius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xxl,
  },
  disabledButton: {
    opacity: 0.6,
  },
  backButton: {
    backgroundColor: theme.colors.brand.mint,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.lg,
  },
});
