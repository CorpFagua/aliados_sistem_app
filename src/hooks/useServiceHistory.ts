/**
 * Hook para obtener y gestionar historial de servicios del coordinador
 */

import { useCallback, useState, useRef } from "react";
import {
  fetchServiceHistory,
  fetchServiceDetail,
  fetchHistoryStatistics,
} from "../services/serviceHistory";

export interface StoreInfo {
  id: string;
  name: string;
  type: "credito" | "efectivo";
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
  name: string;
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
  status: string;
  actor?: string;
  actorRole: "store" | "delivery" | "coordinator";
  notes?: string;
}

export interface ServiceHistorySummary {
  id: string;
  clientName: string;
  clientPhone: string;
  deliveryAddress: string;
  store: StoreInfo;
  delivery?: DeliveryInfo;
  zone: ZoneInfo;
  type: ServiceTypeInfo;
  status: string;
  paymentMethod: string;
  isPaid: boolean;
  price: number;
  priceDelivery: number;
  storeCharge: number;
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
  pickupAddress?: string;
  prepTime?: number;
  timeline: ServiceEvent[];
  timeAnalysis: DeliveryTimeAnalysis;
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
  type?: string;
  status?: string;
  isPaid?: boolean;
  sortBy?: "created_at" | "completed_at" | "price";
  sortOrder?: "asc" | "desc";
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
  byType: Record<string, { count: number; earnings: number }>;
  byZone: Record<string, { count: number; averageDeliveryTime: number; earnings: number }>;
  byDelivery: Record<string, { count: number; averageDeliveryTime: number; earnings: number; paymentRate: number }>;
}

export function useServiceHistory(token: string | null) {
  const [services, setServices] = useState<ServiceHistorySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceHistoryDetail | null>(null);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [stats, setStats] = useState<HistoryStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const filtersRef = useRef<ServiceHistoryFilters>({
    limit: 20,
    offset: 0,
    sortBy: "created_at",
    sortOrder: "desc",
  });

  /**
   * 📊 Obtener historial de servicios
   */
  const getServiceHistory = useCallback(
    async (filters: ServiceHistoryFilters, append: boolean = false) => {
      if (!token) {
        setError("No token disponible");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchServiceHistory(token, filters);

        if (append) {
          setServices((prev) => [...prev, ...data.items]);
        } else {
          setServices(data.items);
        }

        setTotal(data.total);
        filtersRef.current = filters;
      } catch (err: any) {
        const message = err.response?.data?.message || err.message || "Error al obtener historial";
        setError(message);
        console.error("[ERROR] getServiceHistory:", err);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  /**
   * 📋 Obtener detalle de un servicio
   */
  const getServiceDetail = useCallback(
    async (serviceId: string) => {
      if (!token) {
        setError("No token disponible");
        return;
      }

      setServiceLoading(true);
      setError(null);

      try {
        const data = await fetchServiceDetail(token, serviceId);
        setSelectedService(data);
      } catch (err: any) {
        const message = err.response?.data?.message || err.message || "Error al obtener detalle";
        setError(message);
        console.error("[ERROR] getServiceDetail:", err);
      } finally {
        setServiceLoading(false);
      }
    },
    [token]
  );

  /**
   * 📈 Obtener estadísticas
   */
  const getStatistics = useCallback(
    async (filters?: Partial<ServiceHistoryFilters>) => {
      if (!token) {
        setError("No token disponible");
        return;
      }

      setStatsLoading(true);
      setError(null);

      try {
        const data = await fetchHistoryStatistics(token, filters);
        setStats(data);
      } catch (err: any) {
        const message = err.response?.data?.message || err.message || "Error al obtener estadísticas";
        setError(message);
        console.error("[ERROR] getStatistics:", err);
      } finally {
        setStatsLoading(false);
      }
    },
    [token]
  );

  /**
   * 🔄 Cargar más servicios (infinite scroll)
   */
  const loadMore = useCallback(() => {
    const nextOffset = (filtersRef.current.offset || 0) + (filtersRef.current.limit || 20);
    getServiceHistory(
      {
        ...filtersRef.current,
        offset: nextOffset,
      },
      true
    );
  }, [getServiceHistory]);

  /**
   * 🔍 Buscar servicios (reset offset)
   */
  const search = useCallback(
    (searchTerm: string, newFilters?: Partial<ServiceHistoryFilters>) => {
      getServiceHistory({
        ...filtersRef.current,
        ...newFilters,
        search: searchTerm,
        offset: 0,
      });
    },
    [getServiceHistory]
  );

  /**
   * 🔄 Refrescar
   */
  const refresh = useCallback(() => {
    getServiceHistory({
      ...filtersRef.current,
      offset: 0,
    });
  }, [getServiceHistory]);

  return {
    // State
    services,
    total,
    loading,
    error,
    selectedService,
    serviceLoading,
    stats,
    statsLoading,

    // Methods
    getServiceHistory,
    getServiceDetail,
    getStatistics,
    loadMore,
    search,
    refresh,
    setSelectedService,
    setError,
  };
}
