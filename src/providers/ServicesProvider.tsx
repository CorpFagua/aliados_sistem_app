// src/providers/ServicesProvider.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { fetchServices, Service, getServiceById } from '@/services/services';
import { useRealtimeListener } from '@/hooks/useRealtimeListener';
import { toService, ServiceResponse } from '@/models/service';

const DELAY_FOR_NON_VIP = 10000; // 10 segundos en ms

interface ServicesContextType {
  services: Service[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  initialOrderIds: Set<string>;
  visibleNewOrderIds: Set<string>;
  orderTimestamps: Map<string, number>;
  isUserVIP: boolean;
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

export function ServicesProvider({ children }: { children: React.ReactNode }) {
  const { session, profile } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialOrderIds, setInitialOrderIds] = useState<Set<string>>(new Set());
  const [visibleNewOrderIds, setVisibleNewOrderIds] = useState<Set<string>>(new Set());
  const [orderTimestamps, setOrderTimestamps] = useState<Map<string, number>>(new Map());
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // ====================
  // CARGA INICIAL
  // ====================
  const loadServices = useCallback(async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchServices(session.access_token);
      console.log('[ServicesProvider] Servicios cargados:', data.length);
      setServices(data);
      
      // 🎯 En el primer load (sin timestamps): marcar todos como iniciales
      // En refreshes posteriores: mantener iniciales y timestamps tal como están
      setInitialOrderIds((prevInitialIds) => {
        // Si es el primer load (no hay iniciales previas), marcar todos
        if (prevInitialIds.size === 0) {
          return new Set(
            data.filter((s) => s.status === "disponible").map((s) => s.id)
          );
        }
        // Si ya hay iniciales, mantener solo los que siguen disponibles
        const availableIds = new Set(data.filter((s) => s.status === "disponible").map((s) => s.id));
        const preserved = new Set<string>();
        for (const id of prevInitialIds) {
          if (availableIds.has(id)) {
            preserved.add(id);
          }
        }
        return preserved;
      });
      
      // 🎯 Limpiar timestamps de órdenes que ya no están disponibles
      setOrderTimestamps((prevTimestamps) => {
        const availableIds = new Set(data.filter((s) => s.status === "disponible").map((s) => s.id));
        const newTimestamps = new Map(prevTimestamps);
        
        for (const [serviceId] of prevTimestamps.entries()) {
          if (!availableIds.has(serviceId)) {
            newTimestamps.delete(serviceId);
          }
        }
        
        return newTimestamps;
      });
      
      setVisibleNewOrderIds(new Set());
      setIsFirstLoad(false);
    } catch (err: any) {
      console.error('[ServicesProvider] Error cargando servicios:', err);
      setError(err.message || 'Error cargando servicios');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // ====================
  // LISTENER: ACTUALIZACIÓN FLUIDA EN REALTIME
  // CON GET para traer datos completos con relationships
  // ====================
  useRealtimeListener({
    table: 'services',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    onData: async (payload) => {
      const eventType = payload.eventType;
      const serviceId = payload.new?.id || payload.old?.id;

      console.log('[ServicesProvider] Evento:', eventType, 'Id:', serviceId);

      if (eventType === 'DELETE') {
        // Remover del estado
        setServices((prev) => prev.filter((s) => s.id !== serviceId));
      } else if (eventType === 'INSERT' || eventType === 'UPDATE') {
        // 🔄 GET el servicio completo con todas las relaciones
        if (session?.access_token) {
          try {
            console.log(`\n📡 [REALTIME] Evento: ${eventType} - ID: ${serviceId}`);
            const updatedService = await getServiceById(serviceId, session.access_token);

            setServices((prev) => {
              const exists = prev.find((s) => s.id === serviceId);
              if (exists) {
                // Actualizar existente
                console.log(`🔄 [STATE] Actualizando servicio existente`);
                return prev.map((s) => (s.id === serviceId ? updatedService : s));
              } else {
                // Agregar nuevo (INSERT) - No es inicial
                console.log(`➕ [STATE] Agregando nuevo servicio (será mostrado con delay)`);
                
                // Registrar como nuevo (no inicial)
                if (updatedService.status === "disponible") {
                  setOrderTimestamps((prev) => new Map([...prev, [serviceId, Date.now()]]));
                }
                
                return [updatedService, ...prev];
              }
            });

            console.log(`✅ [PROVIDER] Actualizado: ${serviceId}`);
          } catch (err: any) {
            // Si es error 401, log pero no crash - el usuario puede reautenticarse
            if (err.response?.status === 401) {
              console.warn('[ServicesProvider] Token expirado al actualizar realtime:', serviceId);
            } else {
              console.error('[ServicesProvider] Error al obtener servicio completo:', err);
            }
            // No relanzar el error para que no crash el provider
          }
        }
      }
    },
    enabled: !!session?.access_token,
    debug: false,
  });

  const isUserVIP = profile?.isVIP ?? false;

  const value: ServicesContextType = {
    services,
    loading,
    error,
    refetch: loadServices,
    initialOrderIds,
    visibleNewOrderIds,
    orderTimestamps,
    isUserVIP,
  };

  return (
    <ServicesContext.Provider value={value}>
      {children}
    </ServicesContext.Provider>
  );
}

// Hook para usar en cualquier pantalla
export function useServices() {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices debe ser usado dentro de ServicesProvider');
  }
  return context;
}
