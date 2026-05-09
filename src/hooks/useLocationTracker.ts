import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { useLocationStore } from "@/src/store/useLocationStore";
import { Logger } from "@/src/utils/logger";

const mapLogger = Logger.category('MAP');

export const useLocationTracker = () => {
  const { setUserLocation, setPermissionGranted } = useLocationStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let subscriber: Location.LocationSubscription | null = null;
    let isCancelled = false;

    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("위치 권한이 거부되었습니다.");
          setPermissionGranted(false);
          return;
        }

        setPermissionGranted(true);

        // 1. OS 캐시에서 즉시 가져오기 (Fast Load)
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          setUserLocation({
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
          });
          mapLogger.debug("OS 캐시 위치 로드 완료", {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
          });
        }

        // 2. 백그라운드 실시간 구독 (Cache Updating)
        if (!isCancelled) {
          subscriber = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: 10, // 10미터 이동 시 갱신
              timeInterval: 5000, // 최소 5초 간격
            },
          (location) => {
            setUserLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
            mapLogger.debug("실시간 위치 갱신", {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
        );
        }

        // [ML-2] 구독 완료 직후에 이미 언마운트된 경우 (Race Condition 방어)
        if (isCancelled && subscriber) {
          subscriber.remove();
          subscriber = null;
        }
      } catch (error) {
        mapLogger.error("위치 추적 초기화 실패", error);
        setErrorMsg("위치 추적을 시작할 수 없습니다.");
        setPermissionGranted(false);
      }
    };

    startTracking();

    return () => {
      isCancelled = true;
      if (subscriber) {
        subscriber.remove(); // 언마운트 시 구독 해제
        mapLogger.debug("위치 추적 구독 해제 완료");
      }
    };
  }, [setUserLocation, setPermissionGranted]);

  return { errorMsg };
};
