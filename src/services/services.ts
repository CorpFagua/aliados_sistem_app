// src/services/services.ts
import { clearChatMessages } from "@/lib/chatStorage";
import { api, authHeaders } from "../lib/api";
import { Service, ServicePayload, ServiceResponse, toService ,toServicePayload} from "@/models/service";

// ✅ Exportar Service para que otras importaciones funcionen
export type { Service, ServicePayload, ServiceResponse };

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

// 📦 Obtener un servicio por ID
export async function getServiceById(
  serviceId: string,
  token: string
): Promise<Service> {
  try {
    console.log(`📦 [GET_SERVICE] Obteniendo: ${serviceId}`);
    const res = await api.get<{ ok: boolean; data: ServiceResponse }>(
      `/services/${serviceId}`,
      {
        headers: authHeaders(token),
      }
    );

    if (!res.data.ok) throw res.data;
    const service = toService(res.data.data);
    console.log(`✅ [GET_SERVICE] Obtenido: ${service.id}`);
    return service;
  } catch (err: any) {
    console.error("❌ Error fetching service:", err.response?.data || err.message);
    throw err;
  }
}

/**
 * 📦 Obtener servicios optimizados para DELIVERY
 * Solo trae: servicios disponibles + servicios asignados al delivery
 * Incluye: price_delivery_srv (ganancia del delivery)
 * 
 * @param token - Token de autenticación
 * @param deliveryId - ID del delivery. Si no se proporciona, usa el del usuario actual
 */
export async function fetchDeliveryServices(token: string, deliveryId?: string): Promise<Service[]> {
  try {
    const endpoint = deliveryId 
      ? `/services/delivery/${deliveryId}` 
      : `/services/delivery/current`;
    
    console.log("📦 [DELIVERY] Obteniendo servicios optimizados...");
    const res = await api.get<ServiceResponse[]>(endpoint, {
      headers: authHeaders(token),
    });

    // ⚡ Aseguramos que siempre sea un array
    const raw = Array.isArray(res.data) ? res.data : (res.data as any).data;

    console.log(`✅ [DELIVERY] Servicios obtenidos: ${raw.length}`);

    // ⚡ Transformamos DTO -> Modelo interno
    return raw.map(toService);
  } catch (err: any) {
    console.error("❌ Error fetching delivery services:", err.response?.data || err.message);
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
    if (res.data.ok && status === "entregado") {
      clearChatMessages(serviceId);
    }
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

// --- Editar datos básicos de un servicio ---
export async function updateServiceData(
  serviceId: string,
  service: Partial<Service>, // el objeto editable del front
  token: string
): Promise<Service> {
  try {
    // 🧩 Convertir de Service → ServicePayload
    const payload = toServicePayload(service as Service);

    // 🧹 Quitar undefined (solo dejar campos modificados)
    const cleanedPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v !== undefined)
    );

    const res = await api.patch<{ ok: boolean; data: ServiceResponse }>(
      `/services/${serviceId}`,
      cleanedPayload,
      {
        headers: authHeaders(token),
      }
    );

    if (!res.data.ok) throw res.data;

    return toService(res.data.data);
  } catch (err: any) {
    console.error("❌ Error actualizando servicio:", err.response?.data || err.message);
    throw err;
  }
}

// --- Cancelar un servicio ---
export async function cancelService(
  serviceId: string,
  reason: string,
  token: string
): Promise<Service> {
  try {
    const res = await api.post<{ ok: boolean; data: ServiceResponse }>(
      `/services/${serviceId}/cancel`,
      { reason },
      {
        headers: authHeaders(token),
      }
    );

    if (!res.data.ok) throw res.data;

    return toService(res.data.data);
  } catch (err: any) {
    console.error("❌ Error cancelando servicio:", err.response?.data || err.message);
    throw err;
  }
}