# 🚀 Feature Implementation: Item Image Upload (Multipart/form-data)

## 🛑 배경 (Context)

현재 아이템 등록 로직은 이미지를 제외하고 순수 JSON(`application/json`) 통신으로 임시 통합되어 있다.
이를 수정하여, 프론트엔드의 갤러리/카메라에서 선택한 이미지를 백엔드로 전송하기 위한 `multipart/form-data` 통신 구조로 전면 전환한다.

## 🛠 1. 백엔드 수정 (Spring Boot)

React Native의 FormData는 내부 파트의 `Content-Type`을 명시하기 까다로운 한계가 있다.
가장 안전한 방법은 JSON 데이터를 `String`으로 받고, 이미지는 `MultipartFile`로 받는 것이다.

**`ItemController.java` 수정:**

```java
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ApiResponse<ItemResponseDto> createItem(
    @RequestPart("request") String requestString,
    @RequestPart(value = "itemImage", required = false) MultipartFile itemImage,
    @Auth TokenClaim tokenClaim) throws JsonProcessingException {

    // 1. JSON 문자열을 DTO로 수동 변환
    ObjectMapper objectMapper = new ObjectMapper();
    CreateItemWithLocationRequestDto request = 
        objectMapper.readValue(requestString, CreateItemWithLocationRequestDto.class);

    // 2. 서비스 로직 호출 (Service 계층도 MultipartFile을 처리하도록 수정 필요)
    ItemResponseDto response = itemService.createItem(request, itemImage, tokenClaim);

    return ApiResponse.success(response);
}
```

## 🛠 2. 프론트엔드 API 계층 수정 (src/api)

현재 JSON을 강제하는 axios 설정을 유연하게 바꾼다.

### 1. src/api/client.ts 수정

post 메서드가 config 옵션을 받을 수 있도록 확장한다.

```typeScript
  post: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig // 추가된 부분
  ): Promise<T> => {
    const response = await axiosInstance.post(url, data, config);
    return response.data;
  },
```

### 2. src/api/items.ts 수정

itemsCreateAPI가 JSON 객체 대신 FormData를 받도록 타입을 변경하고, 헤더를 오버라이드한다.

```typeScript
// 기존 CreateItemRequest 대신 FormData를 받도록 변경
export async function itemsCreateAPI(
  requestFormData: FormData,
): Promise<ApiResponse<Item>> {
  return apiClient.post("/api/v1/items", requestFormData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}
```

## 🛠 3. 프론트엔드 UI 컴포넌트 수정 (app/exchange/create.tsx)

현재 JSON을 구성하는 코드를 FormData 구성 코드로 치환한다.
수정 대상: handleCreateItem 함수

```typeScript
const handleCreateItem = async () => {
  if (!validateForm()) return;

  try {
    const itemDto = {
      category: formData.category,
      title: formData.title.trim(),
      description: formData.description.trim(),
      seatInfo: "", // 필요 시 추가
    };

    const locationDto = {
      latitude: formData.latitude,
      longitude: formData.longitude,
    };

    // 1. FormData 인스턴스 생성
    const requestFormData = new FormData();

    // 2. JSON 데이터를 문자열로 직렬화하여 'request' 파트에 추가 (백엔드 @RequestPart("request")와 매핑)
    const requestData = { itemDto, locationDto };
    requestFormData.append("request", JSON.stringify(requestData));

    // 3. 이미지 파일이 존재하면 'itemImage' 파트에 추가
    if (formData.imageUrl) {
      const filename = formData.imageUrl.split("/").pop() || "image.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      requestFormData.append("itemImage", {
        uri: formData.imageUrl,
        name: filename,
        type,
      } as any); // React Native 특수한 FormData 타입 우회용 any
    }

    console.log("FormData 전송 준비 완료 (이미지 포함 여부:", !!formData.imageUrl, ")");

    // 4. API 호출
    await _createItem(itemsCreateAPI(requestFormData));

    Alert.alert("성공", "아이템이 성공적으로 등록되었습니다.", [
      { text: "확인", onPress: () => router.back() },
    ]);
  } catch (error) {
    console.error("아이템 생성 에러:", error);
    Alert.alert("오류", "아이템 등록에 실패했습니다.");
  }
};
```
