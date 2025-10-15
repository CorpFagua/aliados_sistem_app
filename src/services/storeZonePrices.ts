// src/services/storeZonePrices.ts
import { api, authHeaders } from "../lib/api";
import {
  StoreZonePrice,
  StoreZonePriceResponse,
  StoreZonePricePayload,
  toStoreZonePrice,
} from "@/models/storeZonePrice";

// Listar precios por tienda
export async function fetchStoreZonePrices(
  storeId: string,
  token: string
): Promise<StoreZonePrice[]> {
  const res = await api.get(`/store-zone-prices/store/${storeId}`, {
    headers: authHeaders(token),
  });
  return (res.data.data as StoreZonePriceResponse[]).map(toStoreZonePrice);
}

// Crear precio
export async function createStoreZonePrice(
  payload: StoreZonePricePayload,
  token: string
): Promise<StoreZonePrice> {
  const res = await api.post("/store-zone-prices", payload, {
    headers: authHeaders(token),
  });
  
  return toStoreZonePrice(res.data.data as StoreZonePriceResponse);
}

// Actualizar precio
export async function updateStoreZonePrice(
  id: string,
  payload: Partial<StoreZonePricePayload>,
  token: string
): Promise<StoreZonePrice> {
  const res = await api.patch(`/store-zone-prices/${id}`, payload, {
    headers: authHeaders(token),
  });
  return toStoreZonePrice(res.data.data as StoreZonePriceResponse);
}

// Eliminar precio
export async function deleteStoreZonePrice(
  id: string,
  token: string
): Promise<StoreZonePrice> {
  const res = await api.delete(`/store-zone-prices/${id}`, {
    headers: authHeaders(token),
  });
  return toStoreZonePrice(res.data.data as StoreZonePriceResponse);
}
