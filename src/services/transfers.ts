// src/services/transfers.ts
import { api, authHeaders } from "../lib/api";

/**
 * 🔄 TRANSFERENCIA INMEDIATA (Admin/Coordinador)
 * Transfiere un servicio a otro delivery de forma inmediata
 * El nuevo delivery recibe el servicio automáticamente
 * 
 * @param serviceId - ID del servicio a transferir
 * @param toDeliveryId - ID del nuevo delivery
 * @param token - Token de autenticación
 * @param reason - Razón de la transferencia (opcional)
 * @returns Respuesta con detalles de la transferencia
 */
export async function transferServiceImmediate(
  serviceId: string,
  toDeliveryId: string,
  token: string,
  reason?: string
): Promise<any> {
  try {
    const payload = {
      service_id: serviceId,
      to_delivery_id: toDeliveryId,
      reason: reason || undefined,
    };

    const res = await api.post(
      "/transfers/immediate",
      payload,
      {
        headers: authHeaders(token),
      }
    );

    if (!res.data.ok) {
      throw new Error(res.data.error || "Error en la transferencia");
    }

    console.log("✅ Servicio transferido exitosamente:", res.data);
    return res.data;
  } catch (err: any) {
    console.error("❌ Error transferiendo servicio:", err.response?.data || err.message);
    throw err;
  }
}

/**
 * 📨 SOLICITUD DE TRANSFERENCIA (Delivery)
 * Un delivery solicita transferir un servicio a otro delivery
 * Requiere aceptación del delivery receptor
 * 
 * @param serviceId - ID del servicio
 * @param toDeliveryId - ID del delivery receptor
 * @param token - Token de autenticación
 * @param reason - Razón de la solicitud
 * @returns Respuesta con detalles de la solicitud
 */
export async function requestTransfer(
  serviceId: string,
  toDeliveryId: string,
  token: string,
  reason?: string
): Promise<any> {
  try {
    const payload = {
      service_id: serviceId,
      to_delivery_id: toDeliveryId,
      reason: reason || undefined,
    };

    const res = await api.post(
      "/transfers/request",
      payload,
      {
        headers: authHeaders(token),
      }
    );

    if (!res.data.ok) {
      throw new Error(res.data.error || "Error en la solicitud");
    }

    console.log("✅ Solicitud de transferencia enviada:", res.data);
    return res.data;
  } catch (err: any) {
    console.error("❌ Error solicitando transferencia:", err.response?.data || err.message);
    throw err;
  }
}

/**
 * 🔄 RESPONDER SOLICITUD DE TRANSFERENCIA
 * El delivery receptor acepta o rechaza una solicitud de transferencia
 * 
 * @param transferRequestId - ID de la solicitud
 * @param action - "accept" o "reject"
 * @param token - Token de autenticación
 * @param reason - Razón del rechazo (opcional, solo si action = "reject")
 * @returns Respuesta con detalles de la respuesta
 */
export async function respondToTransfer(
  transferRequestId: string,
  action: "accept" | "reject",
  token: string,
  reason?: string
): Promise<any> {
  try {
    const payload = {
      action,
      reason: action === "reject" ? reason || "No especificada" : undefined,
    };

    const res = await api.post(
      `/transfers/${transferRequestId}/respond`,
      payload,
      {
        headers: authHeaders(token),
      }
    );

    if (!res.data.ok) {
      throw new Error(res.data.error || "Error respondiendo solicitud");
    }

    console.log(`✅ Solicitud ${action} exitosamente:`, res.data);
    return res.data;
  } catch (err: any) {
    console.error(`❌ Error respondiendo solicitud:`, err.response?.data || err.message);
    throw err;
  }
}

/**
 * 📋 OBTENER SOLICITUDES PENDIENTES
 * El delivery ve sus solicitudes de transferencia pendientes
 * 
 * @param token - Token de autenticación
 * @returns Array de solicitudes pendientes
 */
export async function getPendingTransfers(token: string): Promise<any[]> {
  try {
    const res = await api.get(
      "/transfers/pending",
      {
        headers: authHeaders(token),
      }
    );

    const data = Array.isArray(res.data) ? res.data : res.data.data || [];
    console.log("📨 Solicitudes pendientes:", data);
    return data;
  } catch (err: any) {
    console.error("❌ Error obteniendo solicitudes:", err.response?.data || err.message);
    throw err;
  }
}

/**
 * 📜 HISTORIAL DE TRANSFERENCIAS
 * Obtiene el historial de transferencias completadas
 * 
 * @param token - Token de autenticación
 * @param limit - Número de registros a obtener (defecto: 50)
 * @returns Array de transferencias
 */
export async function getTransferHistory(
  token: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const res = await api.get(
      `/transfers/history?limit=${limit}`,
      {
        headers: authHeaders(token),
      }
    );

    const data = Array.isArray(res.data) ? res.data : res.data.data || [];
    console.log("📜 Historial de transferencias:", data);
    return data;
  } catch (err: any) {
    console.error("❌ Error obteniendo historial:", err.response?.data || err.message);
    throw err;
  }
}
