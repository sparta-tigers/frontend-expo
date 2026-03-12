import { create } from "zustand";

interface LocationState {
  userLocation: { latitude: number; longitude: number } | null;
  permissionGranted: boolean;
  setUserLocation: (location: { latitude: number; longitude: number }) => void;
  setPermissionGranted: (granted: boolean) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>(
  (set: (state: Partial<LocationState>) => void) => ({
    userLocation: null,
    permissionGranted: false,
    setUserLocation: (location: { latitude: number; longitude: number }) =>
      set({ userLocation: location }),
    setPermissionGranted: (granted: boolean) =>
      set({ permissionGranted: granted }),
    clearLocation: () => set({ userLocation: null }),
  }),
);
