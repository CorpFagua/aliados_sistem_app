/**
 * Service de Historial de Servicios
 * Se comunica con el backend que gestiona toda la lógica de BD
 * El backend usa Supabase directamente y optimiza queries con índices
 */

import { api, authHeaders } from "../lib/api";

// ===== TIPOS (Sincronizados con backend) =====

export type ServiceStatus = 'disponible' | 'asignado' | 'en_ruta' | 'entregado' | 'cancelado' | 'eliminado'| 'pago' | 'pagado' | 'paid';
export type ServiceType = 'domicilio' | 'paqueteria_aliados' | 'paqueteria_coordinadora';
export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta';

export interface StoreInfo {
  id: string;
  name: string;
  type: 'credito' | 'efectivo';
}

export interface ProfileStoreInfo {
  id: string;
  name: string;
}

export interface DeliveryInfo {
  id: string;
  name: string;
  phone?: string;
}

export interface ZoneInfo {
  id: string;
  name: string;
}

export interface ServiceTypeInfo {
  id: string;
  name: ServiceType;
}

export interface DeliveryTimeAnalysis {
  timeToRoute: number | null;
  timeToDelivery: number | null;
  totalTime: number | null;
  averageTimeToRouteInZone: number;
  averageTimeToDeliveryInZone: number;
  comparisonToZoneAverage: {
    timeToRoutePercent: number;
    timeToDeliveryPercent: number;
  };
  deliveryAverageTimeToRoute: number;
  deliveryAverageTimeToDelivery: number;
  comparisonToDeliveryAverage: {
    timeToRoutePercent: number;
    timeToDeliveryPercent: number;
  };
  performanceScore: number;
}

export interface ServiceEvent {
  timestamp: string;
  status: ServiceStatus;
  actor?: string;
  actorRole: 'store' | 'delivery' | 'coordinator';
  notes?: string;
}

export interface ServiceHistorySummary {
  id: string;
  clientName: string;
  clientPhone: string;
  deliveryAddress: string;
  store: StoreInfo;
  profileStore?: ProfileStoreInfo;
  delivery?: DeliveryInfo;
  zone: ZoneInfo;
  type: ServiceTypeInfo;
  status: ServiceStatus;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  price: number;
  priceDelivery: number;
  totalToCollect: number;
  createdAt: string;
  completedAt?: string;
  assignedAt?: string;
  truyectoAt?: string;
  finalizedAt?: string;
  notes?: string;
  expectedAt?: string;
}

export interface ServiceHistoryDetail extends ServiceHistorySummary {
  timeline: ServiceEvent[];
  timeAnalysis: DeliveryTimeAnalysis;
  pickupAddress?: string;
  prepTime?: number;
}

export interface ServiceHistoryFilters {
  limit?: number;
  offset?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  storeId?: string;
  deliveryId?: string;
  zoneId?: string;
  type?: ServiceType;
  status?: ServiceStatus;
  isPaid?: boolean;
  sortBy?: 'created_at' | 'completed_at' | 'price';
  sortOrder?: 'asc' | 'desc';
}

export interface ServiceHistoryResponse {
  items: ServiceHistorySummary[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface HistoryStatistics {
  totalServices: number;
  totalEarnings: number;
  totalCollected: number;
  averageDeliveryTime: number;
  completionRate: number;
  paymentRate: number;
  byType: Record<string, {
    count: number;
    earnings: number;
  }>;
  byZone: Record<string, {
    count: number;
    averageDeliveryTime: number;
    earnings: number;
  }>;
  byDelivery: Record<string, {
    count: number;
    averageDeliveryTime: number;
    earnings: number;
    paymentRate: number;
  }>;
}

// ===== API CALLS =====

/**
 * Obtener historial de servicios con filtros y paginación
 * El backend interactúa directamente con Supabase
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
 * El backend calcula timeline y métricas en Supabase
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
 * El backend agrupa datos en Supabase y calcula porcentajes
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
