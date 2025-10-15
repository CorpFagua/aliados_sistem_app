// src/models/storeZonePrice.ts

export interface StoreZonePrice {
  id: string;
  storeId: string;
  zoneId: string;
  price: number;
  price_delivery: number;
  createdAt: string;
  zone?: {
    id: string;
    name: string;
    isActive: boolean;
    branchId: string;
  };
}

// Lo que viene del backend (snake_case)
export interface StoreZonePriceResponse {
  id: string;
  store_id: string;
  zone_id: string;
  price: number;
  price_delivery: number;
  created_at: string;
  zone?: {
    id: string;
    name: string;
    is_active: boolean;
    branch_id: string;
  };
}

// Payload para crear/editar
export interface StoreZonePricePayload {
  store_id: string;
  zone_id: string;
  price: number;
  price_delivery: number; 
}

// Mapper para transformar snake_case → camelCase
export function toStoreZonePrice(r: StoreZonePriceResponse): StoreZonePrice {
  return {
    id: r.id,
    storeId: r.store_id,
    zoneId: r.zone_id,
    price: r.price,
    price_delivery: r.price_delivery,
    createdAt: r.created_at,
    zone: r.zone
      ? {
          id: r.zone.id,
          name: r.zone.name,
          isActive: r.zone.is_active,
          branchId: r.zone.branch_id,
        }
      : undefined,
  };
}
