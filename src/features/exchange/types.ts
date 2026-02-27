export type ItemCategory = "TICKET" | "GOODS";

export interface ItemDto {
  category: ItemCategory;
  title: string;
  description: string;
}

export interface LocationDto {
  latitude: number;
  longitude: number;
  address: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface CreateItemRequest extends ItemDto {
  location: LocationDto;
}

export interface Item {
  id: number;
  category: ItemCategory;
  title: string;
  description: string;
  location: LocationDto;
  imageUrl?: string;
  status: "REGISTERED" | "EXCHANGE_COMPLETED" | "EXCHANGE_FAILED";
  createdAt: string;
  updatedAt: string;
  userId: number;
  user: {
    id: number;
    nickname: string;
  };
}

export interface ExchangeRequest {
  id: number;
  itemId: number;
  requesterId: number;
  providerId: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
}
