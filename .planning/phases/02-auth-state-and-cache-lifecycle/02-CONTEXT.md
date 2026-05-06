# Context: Phase 02 - Auth State and Cache Lifecycle

## Domain Knowledge
- **Auth State Hydration**: `useAuth` provides `user` and `isLoading`. `isLoading` is true while tokens are being loaded from storage.
- **React Query Cache**: Queries should be isolated by user ID to prevent data leakage between accounts on the same device.
- **Cache Clearing**: Logging out should clear the entire React Query cache to prevent the next user from seeing previous data (especially since we use `PersistQueryClientProvider`).
- **User-specific Storage**: Preferences like "My Team" should be stored with a user-specific key.

## Requirements
- **REQ-2.1**: Wait for `isLoading` in `app/exchange/apply/[id].tsx` to prevent premature redirect to login or error.
- **REQ-2.2**: Wait for `isLoading` in `app/exchange/[id].tsx` to prevent authentication flicker.
- **REQ-2.3**: Include `user?.userId` in the query key for `exchangeRequests` in `app/(tabs)/_layout.tsx`.
- **REQ-2.4**: Call `queryClient.clear()` during `signout` to wipe sensitive user data from memory and persistent cache.
- **REQ-2.5**: Make `MY_TEAM_STORAGE_KEY` user-specific (e.g., `yaguniv_my_team_${userId}`) in `context/AuthContext.tsx`.

## Technical Decisions
- **Query Client Access**: Since `AuthProvider` is a child of `PersistQueryClientProvider` in `CombinedProvider.tsx`, we can use `useQueryClient()` inside a hook or pass the client as a prop if needed. However, `AuthProvider` itself is defined in `AuthContext.tsx` which is imported by `CombinedProvider.tsx`.
- **Signout Hook**: We'll update the `signout` function in `AuthContext.tsx`. To access `queryClient`, we'll ensure `AuthProvider` has access to it.

## Research Findings
- `app/exchange/apply/[id].tsx`: `user === null` check happens in `useEffect`. Should check `isLoading` first.
- `app/exchange/[id].tsx`: `user === null && !isLoading` check is present but might need refinement to handle the "loading" state UI more gracefully.
- `app/(tabs)/_layout.tsx`: `queryKey: ["exchangeRequests", "receiver", "PENDING"]` needs `user?.userId`.
- `context/AuthContext.tsx`: `MY_TEAM_STORAGE_KEY` is a constant. Needs to be a function or dynamic key.
