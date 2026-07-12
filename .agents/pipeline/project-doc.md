# Project Documentation

> Generated: 2026-07-12T17:21:43+09:00 | Mode: FULL

## Tech Stack

- Runtime: React Native (via Expo)
- Language: TypeScript
- Framework: React Native, Expo Router
- Database / Storage: AsyncStorage
- Styling: React Native Paper, plus Expo/React Native primitives
- State Management: Zustand (Client state), TanStack React Query (Server state)

## Dependencies

- Core: `expo`, `expo-router`, `react`, `react-native`, `axios`, `@tanstack/react-query`, `zustand`, `@stomp/stompjs`, `sockjs-client`, `react-hook-form`, `zod`, `@hookform/resolvers`
- Dev: `typescript`, `eslint`, `husky`, `tsx`, `dependency-cruiser`
- Testing: `fast-check`

## Architecture Pattern

Feature-Sliced Design / Feature-Driven
The app separates domain logic into `src/features/*` (e.g., auth, chat, exchange, home, liveboard, match). File-Based Routing is used via Expo Router (`app/` directory). Strict boundary enforcement via `dependency-cruiser` to validate module boundaries.

## Folder Structure

- `app/`: Expo Router file-based route definitions and screens
- `assets/`: Static assets (images, fonts)
- `components/`: Global reusable UI components
- `src/`: Core application logic
  - `src/core/`: Global configs, API client setup, token stores
  - `src/features/`: Feature modules
  - `src/store/`: Global Zustand state stores
- `scripts/`: Utilities and scripts (primarily architecture-guard)
- `docs/`: Project documentation

## Code Style Conventions

Strict typing with runtime API response validation using `zod` schemas. Logging via centralized `Logger` utility for masking sensitive data. Strict ESLint rules enforced on pre-commit via Husky (`eslint --max-warnings=0`).

## Modularity Practices

Domain logic is isolated inside `src/features/`. UI/Routing is decoupled from business logic. Imports are strictly monitored by `dependency-cruiser` to enforce a unidirectional dependency graph.

## Data Architecture

Server Data managed via `@tanstack/react-query` with caching/offline support. Client Data managed via `zustand`. Tokens and query caches persisted via `AsyncStorage`.

## Cross-Cutting Concerns

Auth is JWT-based, handling automatic 401 token refresh via Mutex queue. Error handling via `react-error-boundary` and centralized API error logging. Data validation enforced at the boundary with Zod schemas.

## Service Communication

REST via custom `axiosInstance` wrapped in an `apiClient`. Real-Time STOMP over WebSockets (`@stomp/stompjs` + `sockjs-client`).

## Test Coverage

- Overall coverage: N/A (Minimal setup)
- Testing framework: fast-check (property-based), relying heavily on static analysis and dependency-cruiser boundary tests.
- Key untested areas: Unknown unit test coverage.
- Test patterns used: Static architecture boundary tests.

## Entry Points

- Application Entry: `expo-router/entry` (via `app/_layout.tsx`)
- API Entry: `src/core/client.ts`

## Last Scanned

2026-07-12T17:21:43+09:00
