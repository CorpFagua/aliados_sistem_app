// src/services/servicesAdmin.ts

import { api, authHeaders } from "@/lib/api";
import {
  Service,
  ServiceAdminPayload,
  ServiceResponse,
  toService,
  toServicePayload,
} from "@/models/service";

// -------------------------------------------------------------
// 🟦 Crear servicio desde panel admin
// -------------------------------------------------------------
export async function adminCreateService(
  payload: ServiceAdminPayload,
  token: string
): Promise<Service> {
  try {
    const res = await api.post<{ ok: boolean; data: ServiceResponse }>(
      "/admin/services",
      payload,
      { headers: authHeaders(token) }
    );

    if (!res.data.ok) throw res.data;

    return toService(res.data.data);
  } catch (err: any) {
    console.error("❌ [Admin] Error creando servicio:", err.response?.data || err.message);
    throw err;
  }
}

