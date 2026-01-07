/**
 * Hook para obtener y gestionar historial de servicios del coordinador
 * Los tipos se importan del service (sincronizados con backend)
 */

import { useCallback, useState, useRef } from "react";
import {
  fetchServiceHistory,
  fetchServiceDetail,
  fetchHistoryStatistics,
  ServiceHistorySummary,
  ServiceHistoryDetail,
  ServiceHistoryFilters,
  ServiceHistoryResponse,
  HistoryStatistics,
  ServiceStatus,
  ServiceType,
  PaymentMethod,
  StoreInfo,
  ProfileStoreInfo,
  DeliveryInfo,
  ZoneInfo,
  ServiceTypeInfo,
  DeliveryTimeAnalysis,
  ServiceEvent,
} from "../services/serviceHistory";

// Exportar tipos para que otros componentes los usen
export type {
  ServiceHistorySummary,
  ServiceHistoryDetail,
  ServiceHistoryFilters,
  ServiceHistoryResponse,
  HistoryStatistics,
  ServiceStatus,
  ServiceType,
  PaymentMethod,
  StoreInfo,
  ProfileStoreInfo,
  DeliveryInfo,
  ZoneInfo,
  ServiceTypeInfo,
  DeliveryTimeAnalysis,
  ServiceEvent,
};

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
   * El backend obtiene datos de Supabase con joins optimizados
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
   * 📋 Obtener detalle de un servicio con timeline y análisis
   * El backend calcula tiempos y crea timeline en Supabase
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
   * 📈 Obtener estadísticas agrupadas por tipo, zona y domiciliario
   * El backend agrupa y calcula porcentajes en Supabase
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
   * 🔄 Refrescar listado
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
