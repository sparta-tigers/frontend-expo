# Context: Phase 03 - Core Business Logic and Data Integrity

## Domain Knowledge

- **Exchange Parameters**: Radius and coordinates (lat, lon) are crucial for location-based item search. `0` is a valid coordinate/radius, so falsy checks (`!val`) should be avoided in favor of nullish checks.
- **Optimistic Updates**: Changing "My Team" immediately reflects in the UI. If persistence (`AsyncStorage`) fails, the UI should ideally revert or warn the user.
- **Notification Data**: Notifications for match schedules need correct `opponentTeam` data.
- **Mock Data**: Team IDs should be standardized to prevent fallback to default teams in dev mode.
- **Team Mapping**: `TEAM_NAME_TO_COLOR` maps team IDs/names to branding colors. Incomplete mapping causes fallback color (usually gray or default) issues.

## Requirements

- **REQ-3.1**: Fix coordinate/radius falsy checks in `src/features/exchange/api.ts` using `??` or `!== undefined`.
- **REQ-3.2**: Enhance error handling for `AsyncStorage.setItem` in `AuthContext.tsx` during `updateMyTeam`.
- **REQ-3.3**: Fix hardcoded `opponentTeam` string in `app/(tabs)/notification.tsx`.
- **REQ-3.4**: Normalize team ID formats in `src/features/home/mocks.ts` to ensure correct team data retrieval.
- **REQ-3.5**: Expand team name mapping in `src/utils/team.ts` to include all supported teams and fix fallback color issues.

## Technical Decisions

- **Nullish Coalescing**: Use `val !== undefined` for optional parameters that can be `0`.
- **Error Propagation**: In `AuthContext`, if storage fails, log the error and potentially show an Alert to the user.
- **Team ID Standard**: Use the canonical team ID format (e.g., lowercase or specific enum keys) throughout the app.
