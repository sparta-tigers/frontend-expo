export const exchangeKeys = {
  all: ['exchange'] as const,
  items: () => [...exchangeKeys.all, 'items'] as const,
  item: (id: string | number) => [...exchangeKeys.items(), id] as const,
  myItems: () => [...exchangeKeys.all, 'myItems'] as const,
  requests: (role: string) => [...exchangeKeys.all, 'requests', role] as const,
  activeCheck: () => [...exchangeKeys.all, 'activeItemCheck'] as const,
  list: (lat?: number, lng?: number, radiusKm?: number) =>
    [...exchangeKeys.items(), 'list', lat, lng, radiusKm] as const,
};
