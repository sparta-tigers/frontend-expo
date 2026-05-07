# Context: Phase 04 - Type Safety and Hook/Component Optimization

## Domain Knowledge

- **Generics and unknown[]**: Using `unknown[]` instead of `any[]` for argument spreads ensures that we don't accidentally bypass type checking within the hook's implementation.
- **StyleProp<ViewStyle>**: React Native's standard way to handle combined styles (arrays, objects, or recursive arrays of styles). Using `any[]` is a bad practice.
- **Theme Resolution**: Currently, `resolveThemeColor` uses string manipulation and `Record<string, any>` casting to find colors in the theme. This should be made safer and more performant.
- **Strict Prop Types**: UI primitives like `Box` should ideally only accept valid theme keys for spacing and colors to prevent "Magic Numbers" and "Magic Strings" from leaking into the UI code.
- **FlatList Key Extraction**: Relying on index or guessed keys (`it.id`, `it.key`) inside a generic `List` component is fragile. Explicit `keyExtractor` should be provided by the caller who knows the data structure.

## Requirements

- **REQ-4.1**: Refactor `useAsyncAction.ts` to use `unknown[]` and fix `options` dependency cycle.
- **REQ-4.2**: Remove `any[]` from `Button` component styles.
- **REQ-4.3**: Remove `any` casting in `Typography` and `Box` color resolution.
- **REQ-4.4**: Restrict `Box` props (padding, margin, color) to theme keys or strictly defined types.
- **REQ-4.5**: Update `List` component to require an explicit `keyExtractor`.

## Technical Decisions

- **useRef for Options**: In `useAsyncAction`, store `options` in a ref to prevent unnecessary `useCallback` invalidations when a literal object is passed.
- **Strict Theme Types**: Define helper types to extract valid keys from `theme.colors` and `theme.spacing`.
- **Generic List**: Ensure `ListProps<T>` includes `keyExtractor: (item: T, index: number) => string`.
