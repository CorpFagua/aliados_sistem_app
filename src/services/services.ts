// src/services/services.ts
import { api, authHeaders } from "../lib/api";
import { Service, ServicePayload, ServiceResponse, toService } from "@/models/service";

// Crear un servicio (envía DTO y devuelve modelo del front)
export async function createService(
  payload: ServicePayload,
  token: string
): Promise<Service> {
  try {
    const res = await api.post<ServiceResponse>("/services", payload, {
      headers: authHeaders(token),
    });
    return toService(res.data);
  } catch (err: any) {
    console.error("❌ Error creando servicio:", err.response?.data || err.message);
    throw err;
  }
}

// Obtener lista de servicios
export async function fetchServices(token: string): Promise<Service[]> {
  try {
    const res = await api.get<ServiceResponse[]>("/services", {
      headers: authHeaders(token),
    });

    // ⚡ Aseguramos que siempre sea un array
    const raw = Array.isArray(res.data) ? res.data : (res.data as any).data;

    // ⚡ Transformamos DTO -> Modelo interno
    return raw.map(toService);
  } catch (err: any) {
    console.error("❌ Error fetching services:", err.response?.data || err.message);
    throw err;
  }
}

// Actualizar estado de un servicio
export async function updateServiceStatus(
  serviceId: string,
  status: "disponible" | "asignado" | "en_ruta" | "entregado" | "cancelado" | "rechazado",
  token: string,
  deliveryId?: string
): Promise<Service> {
  try {
    const res = await api.patch<{ ok: boolean; data: ServiceResponse }>(
      `/services/${serviceId}/status`,
      { status, deliveryId },
      {
        headers: authHeaders(token),
      }
    );

    if (!res.data.ok) throw res.data;

    return toService(res.data.data); // ✅ usar el `data` interno
  } catch (err: any) {
    console.error("❌ Error updating service status:", err.response?.data || err.message);
    throw err;
  }
}

// --- Asignar zona a un servicio ---
export async function assignZoneToService(
  serviceId: string,
  zoneId: string,
  token: string
): Promise<Service> {
  try {
    const res = await api.patch<{ ok: boolean; data: ServiceResponse }>(
      `/services/${serviceId}/assign-zone`,
      { zoneId },
      {
        headers: authHeaders(token),
      }
    );

    if (!res.data.ok) throw res.data;

    return toService(res.data.data); // ✅ usar el `data` interno
  } catch (err: any) {
    console.error("❌ Error asignando zona al servicio:", err.response?.data || err.message);
    throw err;
  }
}
