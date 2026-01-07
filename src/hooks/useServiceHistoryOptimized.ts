/**
 * Hook optimizado para historial de servicios
 * - Filtrado local en memoria (sin nuevas peticiones)
 * - Estado persistente entre navegaciones
 * - Debounce en búsquedas y filtros
 * - Rendimiento mejorado con virtual scrolling
 */

import { useCallback, useState, useRef, useEffect } from "react";
import {
  fetchServiceHistory,
  fetchServiceDetail,
  ServiceHistorySummary,
  ServiceHistoryDetail,
  ServiceHistoryFilters,
  HistoryStatistics,
} from "../services/serviceHistory";

interface CachedData {
  allServices: ServiceHistorySummary[];
  filteredServices: ServiceHistorySummary[];
  total: number;
  lastFetch: number;
}

interface ScrollPosition {
  offset: number;
  index: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const DEBOUNCE_DELAY = 300; // 300ms

export function useServiceHistoryOptimized(token: string | null) {
  // === STATE ===
  const [filteredServices, setFilteredServices] = useState<ServiceHistorySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceHistoryDetail | null>(null);
  const [serviceLoading, setServiceLoading] = useState(false);

  // === REFS para persistencia ===
  const cacheRef = useRef<CachedData>({
    allServices: [],
    filteredServices: [],
    total: 0,
    lastFetch: 0,
  });

  const scrollPositionRef = useRef<ScrollPosition>({
    offset: 0,
    index: 0,
  });

  const currentFiltersRef = useRef<ServiceHistoryFilters>({
    limit: 100, // Cargar más items a la vez
    offset: 0,
    sortBy: "created_at",
    sortOrder: "desc",
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeFiltersRef = useRef<Partial<ServiceHistoryFilters>>({});

  // === FUNCIONES DE FILTRADO LOCAL ===

  /**
   * Filtra los servicios cargados por los filtros actuales
   */
  const applyLocalFilters = useCallback(
    (services: ServiceHistorySummary[], filters: Partial<ServiceHistoryFilters>) => {
      let result = services;

      // Filtro por búsqueda
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        result = result.filter(
          (s) =>
            s.clientName?.toLowerCase().includes(searchLower) ||
            s.clientPhone?.toLowerCase().includes(searchLower) ||
            s.deliveryAddress?.toLowerCase().includes(searchLower) ||
            s.profileStore?.name?.toLowerCase().includes(searchLower) ||
            s.id.toLowerCase().includes(searchLower)
        );
      }

      // Filtro por estado
      if (filters.status) {
        result = result.filter((s) => s.status === filters.status);
      }

      // Filtro por tipo
      if (filters.type) {
        result = result.filter((s) => s.type?.name === filters.type);
      }

      // Filtro por pago
      if (typeof filters.isPaid === "boolean") {
        result = result.filter((s) => s.isPaid === filters.isPaid);
      }

      // Filtro por domiciliario
      if (filters.deliveryId) {
        result = result.filter((s) => s.delivery?.id === filters.deliveryId);
      }

      // Filtro por zona
      if (filters.zoneId) {
        result = result.filter((s) => s.zone?.id === filters.zoneId);
      }

      // Filtro por tienda
      if (filters.storeId) {
        result = result.filter((s) => s.store?.id === filters.storeId);
      }

      // Ordenamiento
      const sortBy = filters.sortBy || "created_at";
      const sortOrder = filters.sortOrder || "desc";

      result.sort((a, b) => {
        let aVal: any = a[sortBy as keyof ServiceHistorySummary];
        let bVal: any = b[sortBy as keyof ServiceHistorySummary];

        // Manejo de campos anidados
        if (sortBy === "created_at") {
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
        }

        if (aVal === bVal) return 0;
        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        return sortOrder === "asc" ? 1 : -1;
      });

      return result;
    },
    []
  );

  /**
   * Carga datos del backend y los cachea
   */
  const loadFromBackend = useCallback(
    async (filters: ServiceHistoryFilters) => {
      if (!token) {
        setError("No token disponible");
        return false;
      }

      // Verificar si tenemos cache válido
      const cacheValid =
        cacheRef.current.lastFetch &&
        Date.now() - cacheRef.current.lastFetch < CACHE_DURATION &&
        cacheRef.current.allServices.length > 0;

      if (cacheValid && !filters.search) {
        console.log("[CACHE] Usando datos en caché");
        return true;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchServiceHistory(token, {
          ...filters,
          limit: Math.min(filters.limit || 100, 100), // Max 100 para backend
        });

        // Actualizar caché
        cacheRef.current.allServices = data.items;
        cacheRef.current.total = data.total;
        cacheRef.current.lastFetch = Date.now();

        setTotal(data.total);
        console.log(`[LOAD] Cargados ${data.items.length} servicios del backend`);
        return true;
      } catch (err: any) {
        const message = err.response?.data?.message || err.message || "Error al obtener historial";
        setError(message);
        console.error("[ERROR] loadFromBackend:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  /**
   * Obtiene historial (primero del caché, luego filtra localmente)
   */
  const getServiceHistory = useCallback(
    async (filters: ServiceHistoryFilters, appendMode: boolean = false) => {
      currentFiltersRef.current = filters;

      const loaded = await loadFromBackend(filters);
      if (!loaded) return;

      // Aplicar filtros locales
      const filtered = applyLocalFilters(cacheRef.current.allServices, filters);

      if (appendMode) {
        setFilteredServices((prev) => [...prev, ...filtered]);
      } else {
        setFilteredServices(filtered);
      }

      cacheRef.current.filteredServices = filtered;
    },
    [loadFromBackend, applyLocalFilters]
  );

  /**
   * Buscar con debounce
   */
  const search = useCallback(
    (searchTerm: string, newFilters?: Partial<ServiceHistoryFilters>) => {
      activeFiltersRef.current = {
        ...activeFiltersRef.current,
        ...newFilters,
        search: searchTerm,
      };

      // Limpiar timer anterior
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      setLoading(true);

      debounceTimerRef.current = setTimeout(() => {
        getServiceHistory({
          ...currentFiltersRef.current,
          ...activeFiltersRef.current,
          offset: 0,
        });
      }, DEBOUNCE_DELAY);
    },
    [getServiceHistory]
  );

  /**
   * Cambiar filtros (sin búsqueda, local instantáneamente)
   */
  const applyFilters = useCallback(
    (newFilters: Partial<ServiceHistoryFilters>) => {
      activeFiltersRef.current = {
        ...activeFiltersRef.current,
        ...newFilters,
        offset: 0,
      };

      // Aplicar localmente sin esperar al backend
      const filtered = applyLocalFilters(cacheRef.current.allServices, {
        ...currentFiltersRef.current,
        ...activeFiltersRef.current,
      });

      setFilteredServices(filtered);
      cacheRef.current.filteredServices = filtered;

      console.log(`[FILTER] ${filtered.length} servicios después de filtros locales`);
    },
    [applyLocalFilters]
  );

  /**
   * Limpiar filtros
   */
  const clearFilters = useCallback(() => {
    activeFiltersRef.current = {};
    const filtered = applyLocalFilters(cacheRef.current.allServices, {
      sortBy: "created_at",
      sortOrder: "desc",
    });
    setFilteredServices(filtered);
    console.log(`[CLEAR] ${filtered.length} servicios (todos)`);
  }, [applyLocalFilters]);

  /**
   * Obtener detalle de un servicio
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
   * Refrescar (limpiar caché)
   */
  const refresh = useCallback(async () => {
    cacheRef.current.lastFetch = 0;
    await getServiceHistory({
      ...currentFiltersRef.current,
      offset: 0,
    });
    console.log("[REFRESH] Caché limpiado y datos actualizados");
  }, [getServiceHistory]);

  /**
   * Guardar posición de scroll
   */
  const saveScrollPosition = useCallback((offset: number, index: number) => {
    scrollPositionRef.current = { offset, index };
  }, []);

  /**
   * Obtener posición guardada
   */
  const getScrollPosition = useCallback(() => {
    return scrollPositionRef.current;
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    // State
    services: filteredServices,
    total,
    loading,
    error,
    selectedService,
    serviceLoading,

    // Methods
    getServiceHistory,
    getServiceDetail,
    search,
    applyFilters,
    clearFilters,
    refresh,

    // Scroll persistence
    saveScrollPosition,
    getScrollPosition,

    // Utilidades
    setSelectedService,
    setError,
  };
}
