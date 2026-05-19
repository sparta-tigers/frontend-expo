import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import {Logger} from "@/src/utils/logger";

export function useNotificationListeners() {
    const notificationListener = useRef<Notifications.EventSubscription | null>(null);
    const responseListener = useRef<Notifications.EventSubscription | null>(null);

    useEffect(() => {
        notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
            Logger.info("알림 수신: ", notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            Logger.info("알림 클릭: ", response);
        });

        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }

            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, []);
}