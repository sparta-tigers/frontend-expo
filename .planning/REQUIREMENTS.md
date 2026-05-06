# Project Requirements

## Milestone 1

### Phase 1: Infrastructure, Environment Setup, and Documentation
- [x] **REQ-1.1**: Upgrade `@tanstack/react-query` to `^5.100.9` (Completed 2026-05-06)
- [x] **REQ-1.2**: Update `throttleTime` comment in `src/core/persistence.ts` (Completed 2026-05-06)

### Phase 2: Auth State and Cache Lifecycle
- [x] **REQ-2.1**: Update `useAuth` hook to handle hydration state correctly.
- [x] **REQ-2.2**: Ensure `user !== null` check accounts for hydration window.
- [x] **REQ-2.3**: Include user identifier in React Query `queryKey`.
- [x] **REQ-2.4**: Clear query cache on signout.
- [x] **REQ-2.5**: Namespace or clear team storage key on logout.
