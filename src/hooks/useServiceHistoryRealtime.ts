/**
 * Hook optimizado con Real-time Subscriptions
 * - Carga más datos si no está todo
 * - Suscripción en tiempo real a cambios
 * - Nuevo servicio aparece instantáneamente
 * - Caché inteligente
 */

import { useCallback, useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  fetchServiceHistory,
  fetchServiceDetail,
  ServiceHistorySummary,
  ServiceHistoryDetail,
  ServiceHistoryFilters,
} from "../services/serviceHistory";

interface CachedData {
  allServices: ServiceHistorySummary[];
  filteredServices: ServiceHistorySummary[];
  total: number;
  lastFetch: number;
  hasLoadedAll: boolean; // Si hemos cargado TODOS los servicios
}

interface ScrollPosition {
  offset: number;
  index: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const DEBOUNCE_DELAY = 300; // 300ms
const BATCH_SIZE = 50; // Cargar de 50 en 50

export function useServiceHistoryRealtime(token: string | null) {
  // === STATE ===
  const [filteredServices, setFilteredServices] = useState<ServiceHistorySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceHistoryDetail | null>(null);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // === REFS ===
  const cacheRef = useRef<CachedData>({
    allServices: [],
    filteredServices: [],
    total: 0,
    lastFetch: 0,
    hasLoadedAll: false,
  });

  const scrollPositionRef = useRef<ScrollPosition>({
    offset: 0,
    index: 0,
  });

  const currentFiltersRef = useRef<ServiceHistoryFilters>({
    limit: 50, // Cargar de 50 en 50
    offset: 0,
    sortBy: "created_at",
    sortOrder: "desc",
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeFiltersRef = useRef<Partial<ServiceHistoryFilters>>({});
  const subscriptionRef = useRef<any>(null);

  // === FUNCIONES DE FILTRADO LOCAL ===

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
   * Carga datos del backend en batches
   */
  const loadFromBackend = useCallback(
    async (filters: ServiceHistoryFilters, loadMore: boolean = false) => {
      if (!token) {
        setError("No token disponible");
        return false;
      }

      // Si es load more y ya cargamos todo, no hacer nada
      if (loadMore && cacheRef.current.hasLoadedAll) {
        console.log("[LOAD] Ya cargamos todos los servicios");
        return true;
      }

      // Determinar offset
      const offset = loadMore ? cacheRef.current.allServices.length : 0;

      setLoading(true);
      setError(null);

      try {
        const data = await fetchServiceHistory(token, {
          ...filters,
          limit: BATCH_SIZE,
          offset,
        });

        // Agregar nuevos items al caché
        if (loadMore) {
          cacheRef.current.allServices = [
            ...cacheRef.current.allServices,
            ...data.items,
          ];
        } else {
          cacheRef.current.allServices = data.items;
        }

        cacheRef.current.total = data.total;
        cacheRef.current.lastFetch = Date.now();

        // Verificar si hemos cargado todo
        if (cacheRef.current.allServices.length >= data.total) {
          cacheRef.current.hasLoadedAll = true;
          console.log(`[LOAD] Cargados TODOS ${cacheRef.current.allServices.length} servicios`);
        } else {
          console.log(
            `[LOAD] Cargados ${cacheRef.current.allServices.length} de ${data.total} servicios`
          );
        }

        setTotal(data.total);
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

      // Verificar caché
      const cacheValid =
        cacheRef.current.lastFetch &&
        Date.now() - cacheRef.current.lastFetch < CACHE_DURATION &&
        cacheRef.current.allServices.length > 0;

      // Cargar del backend si:
      // 1. No hay caché válido, O
      // 2. Hay búsqueda (siempre actualizar)
      if (!cacheValid || filters.search) {
        const loaded = await loadFromBackend(filters, appendMode);
        if (!loaded) return;
      }

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
   * Cargar más servicios si no hemos cargado todo
   */
  const loadMore = useCallback(async () => {
    if (cacheRef.current.hasLoadedAll) {
      console.log("[LOAD] Ya tenemos todos los servicios");
      return;
    }

    if (cacheRef.current.allServices.length >= cacheRef.current.total) {
      cacheRef.current.hasLoadedAll = true;
      console.log("[LOAD] Todos los servicios cargados");
      return;
    }

    setIsLoadingMore(true);
    try {
      await loadFromBackend(currentFiltersRef.current, true);

      // Reaplicar filtros
      const filtered = applyLocalFilters(cacheRef.current.allServices, {
        ...currentFiltersRef.current,
        ...activeFiltersRef.current,
      });

      setFilteredServices(filtered);
    } finally {
      setIsLoadingMore(false);
    }
  }, [loadFromBackend, applyLocalFilters]);

  /**
   * Suscribirse a cambios en tiempo real
   */
  const subscribeToRealtimeChanges = useCallback(async () => {
    if (!token) return;

    console.log("[SUBSCRIBE] Iniciando suscripción a cambios en tiempo real");

    // Suscribirse a INSERT, UPDATE, DELETE en tabla services
    const channel = supabase
      .channel("realtime-services")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "services",
        },
        async (payload: any) => {
          console.log("[REALTIME] Cambio detectado:", payload.eventType);

          if (payload.eventType === "INSERT") {
            // Nuevo servicio
            // Invalidar caché y recargar
            cacheRef.current.lastFetch = 0;
            cacheRef.current.hasLoadedAll = false;
            await getServiceHistory({
              ...currentFiltersRef.current,
              offset: 0,
            });
            console.log("[REALTIME] Nuevo servicio agregado");
          } else if (payload.eventType === "UPDATE") {
            // Servicio actualizado
            const updated = payload.new;
            const index = cacheRef.current.allServices.findIndex(
              (s) => s.id === updated.id
            );

            if (index !== -1) {
              // Actualizar en caché
              cacheRef.current.allServices[index] = {
                ...cacheRef.current.allServices[index],
                status: updated.status,
                is_paid: updated.is_paid,
                // Otros campos...
              } as any;

              // Reaplicar filtros
              const filtered = applyLocalFilters(cacheRef.current.allServices, {
                ...currentFiltersRef.current,
                ...activeFiltersRef.current,
              });

              setFilteredServices(filtered);
              console.log("[REALTIME] Servicio actualizado en local");
            }
          } else if (payload.eventType === "DELETE") {
            // Servicio eliminado
            cacheRef.current.allServices = cacheRef.current.allServices.filter(
              (s) => s.id !== payload.old.id
            );

            const filtered = applyLocalFilters(cacheRef.current.allServices, {
              ...currentFiltersRef.current,
              ...activeFiltersRef.current,
            });

            setFilteredServices(filtered);
            console.log("[REALTIME] Servicio eliminado");
          }
        }
      )
      .subscribe((status: string) => {
        console.log("[SUBSCRIBE] Status:", status);
      });

    subscriptionRef.current = channel;
  }, [token, getServiceHistory, applyLocalFilters]);

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
   * Refrescar (limpiar caché e invalidar)
   */
  const refresh = useCallback(async () => {
    cacheRef.current.lastFetch = 0;
    cacheRef.current.hasLoadedAll = false;
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

  // === CICLO DE VIDA ===

  // Suscribirse a cambios en tiempo real cuando se monta
  useEffect(() => {
    if (token) {
      subscribeToRealtimeChanges();
    }

    return () => {
      // Desuscribirse cuando se desmonta
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        console.log("[UNSUBSCRIBE] Desuscribido de cambios en tiempo real");
      }
    };
  }, [token, subscribeToRealtimeChanges]);

  // Cleanup de debounce
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
    isLoadingMore,
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
    loadMore,

    // Scroll persistence
    saveScrollPosition,
    getScrollPosition,

    // Utilities
    setSelectedService,
    setError,
  };
}
