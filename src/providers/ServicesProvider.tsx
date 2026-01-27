// src/providers/ServicesProvider.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { fetchServices, Service } from '@/services/services';
import { useRealtimeListener } from '@/hooks/useRealtimeListener';
import { toService, ServiceResponse } from '@/models/service';

interface ServicesContextType {
  services: Service[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

export function ServicesProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            const res = await fetch(
              `${process.env.EXPO_PUBLIC_API_URL_LOCAL}/services/${serviceId}`,
              {
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (!res.ok) {
              console.error('[ServicesProvider] Error fetching service:', res.status);
              return;
            }

            const fullData = (await res.json()) as ServiceResponse;
            const updatedService = toService(fullData);

            setServices((prev) => {
              const exists = prev.find((s) => s.id === serviceId);
              if (exists) {
                // Actualizar existente
                return prev.map((s) => (s.id === serviceId ? updatedService : s));
              } else {
                // Agregar nuevo (INSERT)
                return [updatedService, ...prev];
              }
            });

            console.log('[ServicesProvider] ✅ Actualizado con datos completos:', serviceId);
          } catch (err) {
            console.error('[ServicesProvider] Error al obtener servicio completo:', err);
          }
        }
      }
    },
    enabled: !!session?.access_token,
    debug: false,
  });

  const value: ServicesContextType = {
    services,
    loading,
    error,
    refetch: loadServices,
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
