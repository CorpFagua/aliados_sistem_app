// src/services/branches.ts
import { api, authHeaders } from "@/lib/api";

export interface BranchConfig {
  id: string;
  name: string;
  low_demand: boolean;
  low_demand_max_services: number;
}

export async function fetchMyBranchConfig(token: string): Promise<BranchConfig | null> {
  try {
    const res = await api.get<{ ok: boolean; data: BranchConfig | null }>(
      "/branches/current",
      {
        headers: authHeaders(token),
      }
    );

    if (!res.data.ok) throw res.data;
    return res.data.data;
  } catch (err: any) {
    console.error("❌ Error fetching branch config:", err.response?.data || err.message);
    throw err;
  }
}

export async function updateMyBranchConfig(
  token: string,
  payload: { low_demand?: boolean; low_demand_max_services?: number }
): Promise<BranchConfig> {
  try {
    const res = await api.patch<{ ok: boolean; data: BranchConfig }>(
      "/branches/current",
      payload,
      {
        headers: authHeaders(token),
      }
    );

    if (!res.data.ok) throw res.data;
    return res.data.data;
  } catch (err: any) {
    console.error("❌ Error updating branch config:", err.response?.data || err.message);
    const backendError = err?.response?.data?.error || err?.response?.data?.message;
    const message =
      backendError || err?.message || "Error al actualizar la configuración de la sucursal";
    throw new Error(message);
  }
}
