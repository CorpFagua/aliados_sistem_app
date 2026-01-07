import  { api,authHeaders } from "../lib/api";
import { Zone, ZoneResponse, toZone, ZonePayload } from "@/models/zone";

// Listar zonas
export async function fetchZones(token: string): Promise<Zone[]> {
  const res = await api.get("/zones", { headers: authHeaders(token) });
  return (res.data.data as ZoneResponse[]).map(toZone);
}

// Crear zona
export async function createZone(
  payload: ZonePayload,
  token: string
): Promise<Zone> {
  const res = await api.post("/zones", payload, {
    headers: authHeaders(token),
  });
  return toZone(res.data.data as ZoneResponse);
}

// Actualizar zona
export async function updateZone(
  id: string,
  payload: Partial<ZonePayload>,
  token: string
): Promise<Zone> {
  const res = await api.patch(`/zones/${id}`, payload, {
    headers: authHeaders(token),
  });
  return toZone(res.data.data as ZoneResponse);
}

// Eliminar zona
export async function deleteZone(id: string, token: string): Promise<Zone> {
  const res = await api.delete(`/zones/${id}`, {
    headers: authHeaders(token),
  });
  return toZone(res.data.data as ZoneResponse);
}
