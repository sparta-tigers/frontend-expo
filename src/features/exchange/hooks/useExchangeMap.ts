/**
 * 교환 화면 지도/위치 관련 로직 훅
 *
 * Why: exchange.tsx(918줄)에서 지도/위치 관련 상태와 핸들러를 분리하여
 * 지도 UI 변경이 아이템 목록/모달 렌더링에 영향을 미치지 않도록 한다.
 */
import { useLocationStore } from "@/src/store/useLocationStore";
import { useLocationTracker } from "@/src/hooks/useLocationTracker";
import { Logger } from "@/src/utils/logger";
import * as Location from "expo-location";
import React, { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";
import MapView from "react-native-maps";

const mapLogger = Logger.category('MAP');

/** 지도 영역 정보 */
interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

/** 좌표 정보 */
interface Coordinates {
  latitude: number;
  longitude: number;
}

/** 서울 디폴트 좌표 (1km 반경) */
const DEFAULT_REGION: MapRegion = {
  latitude: 37.5665,
  longitude: 126.978,
  latitudeDelta: 0.009,
  longitudeDelta: 0.009,
} as const;

/** 지도 애니메이션 지속 시간 (ms) */
const MAP_ANIMATE_DURATION = 500;
const MAP_INITIAL_ANIMATE_DURATION = 1000;

/** useExchangeMap 훅의 반환 타입 */
export interface UseExchangeMapReturn {
  mapRef: React.RefObject<MapView | null>;
  mapRegion: MapRegion;
  isMapMoved: boolean;
  isMapReady: boolean;
  currentLocation: Coordinates | null;
  userLocation: Coordinates | null;
  locationError: string | null;
  defaultRegion: MapRegion;
  setIsMapMoved: (moved: boolean) => void;
  handleRegionChangeComplete: (region: MapRegion) => void;
  moveToCurrentLocation: () => void;
  initializeLocation: () => Promise<void>;
  setIsMapReady: (ready: boolean) => void;
}

/**
 * 지도/위치 관련 상태와 핸들러를 캡슐화하는 훅
 *
 * @param isInitialFetched - 초기 데이터 로딩 완료 여부 (지도 이동 감지 조건)
 */
export function useExchangeMap(isInitialFetched: boolean): UseExchangeMapReturn {
  const mapRef = useRef<MapView>(null);

  // 전역 위치 스토어 연동
  const { userLocation } = useLocationStore();
  const { errorMsg: locationError } = useLocationTracker();

  // 로컬 위치 상태 (초기 마운트 시 설정)
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);

  // 지도 상태
  const [isMapMoved, setIsMapMoved] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapRegion, setMapRegion] = useState<MapRegion>(DEFAULT_REGION);

  /**
   * 지도 이동 완료 핸들러
   *
   * 초기 데이터 로딩 이후의 유저 이동만 "지도 이동"으로 간주하여
   * 재검색 버튼 표시를 트리거한다.
   */
  const handleRegionChangeComplete = useCallback((region: MapRegion) => {
    setMapRegion(region);
    if (isMapReady && isInitialFetched) {
      setIsMapMoved(true);
    }
  }, [isMapReady, isInitialFetched]);

  /**
   * 현재 위치로 즉시 이동
   *
   * GPS 재요청 없이 메모리(useLocationStore)의 좌표를 사용하여
   * 지연 없는 즉각 반응을 보장한다.
   */
  const moveToCurrentLocation = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: DEFAULT_REGION.latitudeDelta,
          longitudeDelta: DEFAULT_REGION.longitudeDelta,
        },
        MAP_ANIMATE_DURATION,
      );
    } else {
      Alert.alert(
        "알림",
        locationError
          ? "위치 권한이 거부되었습니다.\n설정에서 권한을 허용해주세요."
          : "현재 위치를 확인하는 중입니다.\n잠시 후 다시 시도해주세요.",
      );
    }
  }, [userLocation, locationError]);

  /**
   * 컴포넌트 마운트 시 초기 위치 설정
   *
   * expo-location의 getCurrentPositionAsync로 좌표를 가져오고
   * 지도를 해당 위치로 이동시킨다.
   */
  const initializeLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      const coords: Coordinates = { latitude, longitude };

      setCurrentLocation(coords);

      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            ...coords,
            latitudeDelta: DEFAULT_REGION.latitudeDelta,
            longitudeDelta: DEFAULT_REGION.longitudeDelta,
          },
          MAP_INITIAL_ANIMATE_DURATION,
        );
      }
    } catch (error) {
      mapLogger.error("초기 위치 가져오기 실패", error);
      // 🚨 [Senior Architect] 초기 위치 설정 실패는 Critical 에러로 간주하여 전파
      throw error;
    }
  }, []);

  return {
    mapRef,
    mapRegion,
    isMapMoved,
    isMapReady,
    currentLocation,
    userLocation,
    locationError,
    defaultRegion: DEFAULT_REGION,
    setIsMapMoved,
    handleRegionChangeComplete,
    moveToCurrentLocation,
    initializeLocation,
    setIsMapReady,
  };
}
