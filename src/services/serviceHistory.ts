/**
 * Service de Historial de Servicios
 * Maneja toda la lógica de API para el historial del coordinador
 */

import { api, authHeaders } from "../lib/api";
import {
  ServiceHistorySummary,
  ServiceHistoryDetail,
  ServiceHistoryFilters,
  ServiceHistoryResponse,
  HistoryStatistics,
} from "../hooks/useServiceHistory";

/**
 * Obtener historial de servicios con filtros y paginación
 */
export async function fetchServiceHistory(
  token: string,
  filters: ServiceHistoryFilters
): Promise<ServiceHistoryResponse> {
  try {
    const params = new URLSearchParams();

    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.offset) params.append("offset", filters.offset.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.storeId) params.append("storeId", filters.storeId);
    if (filters.deliveryId) params.append("deliveryId", filters.deliveryId);
    if (filters.zoneId) params.append("zoneId", filters.zoneId);
    if (filters.type) params.append("type", filters.type);
    if (filters.status) params.append("status", filters.status);
    if (typeof filters.isPaid === "boolean") params.append("isPaid", filters.isPaid.toString());
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

    const response = await api.get(
      `/coordinator/history?${params.toString()}`,
      {
        headers: authHeaders(token),
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || "Error al obtener historial");
    }

    return response.data.data as ServiceHistoryResponse;
  } catch (err: any) {
    console.error("[ERROR] fetchServiceHistory:", err);
    throw err;
  }
}

/**
 * Obtener detalle completo de un servicio con análisis de tiempos
 */
export async function fetchServiceDetail(
  token: string,
  serviceId: string
): Promise<ServiceHistoryDetail> {
  try {
    const response = await api.get(
      `/coordinator/history/${serviceId}`,
      {
        headers: authHeaders(token),
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || "Error al obtener detalle");
    }

    return response.data.data as ServiceHistoryDetail;
  } catch (err: any) {
    console.error("[ERROR] fetchServiceDetail:", err);
    throw err;
  }
}

/**
 * Obtener estadísticas del historial
 */
export async function fetchHistoryStatistics(
  token: string,
  filters?: Partial<ServiceHistoryFilters>
): Promise<HistoryStatistics> {
  try {
    const params = new URLSearchParams();

    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.storeId) params.append("storeId", filters.storeId);
    if (filters?.deliveryId) params.append("deliveryId", filters.deliveryId);
    if (filters?.zoneId) params.append("zoneId", filters.zoneId);

    const response = await api.get(
      `/coordinator/history/stats?${params.toString()}`,
      {
        headers: authHeaders(token),
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || "Error al obtener estadísticas");
    }

    return response.data.data as HistoryStatistics;
  } catch (err: any) {
    console.error("[ERROR] fetchHistoryStatistics:", err);
    throw err;
  }
}
