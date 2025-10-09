// src/services/stores.ts
import { api, authHeaders } from "../lib/api";
import {
  Store,
  StorePayload,
  StoreResponse,
  toStore,
} from "@/models/store";

// Listar todas las tiendas (según permisos del usuario)
export async function fetchStores(token: string): Promise<Store[]> {
  const res = await api.get("/stores", { headers: authHeaders(token) });
  return (res.data.data as StoreResponse[]).map(toStore);
}

// Buscar una tienda por ID
export async function fetchStoreById(id: string, token: string): Promise<Store> {
  const res = await api.get(`/stores/${id}`, { headers: authHeaders(token) });
  return toStore(res.data.data as StoreResponse);
}

// Crear una tienda
export async function createStore(
  payload: StorePayload,
  token: string
): Promise<Store> {
  const res = await api.post("/stores", payload, {
    headers: authHeaders(token),
  });
  return toStore(res.data.data as StoreResponse);
}

// Actualizar una tienda
export async function updateStore(
  id: string,
  payload: Partial<StorePayload>,
  token: string
): Promise<Store> {
  const res = await api.patch(`/stores/${id}`, payload, {
    headers: authHeaders(token),
  });
  return toStore(res.data.data as StoreResponse);
}

// Eliminar una tienda
export async function deleteStore(id: string, token: string): Promise<Store> {
  const res = await api.delete(`/stores/${id}`, {
    headers: authHeaders(token),
  });
  return toStore(res.data.data as StoreResponse);
}

// Obtener una tienda con sus perfiles (admin y coordinador)

export async function fetchStoreWithProfiles(id: string, token: string): Promise<Store> {
  const res = await api.get(`/stores/${id}/details`, { headers: authHeaders(token) });
  return toStore(res.data.data as StoreResponse);
}
