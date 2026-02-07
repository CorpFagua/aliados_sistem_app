// src/providers/ServicesProvider.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthProvider';
import { fetchServices, Service, getServiceById } from '@/services/services';
import { useRealtimeListener } from '@/hooks/useRealtimeListener';
import { toService, ServiceResponse } from '@/models/service';

const DELAY_FOR_NON_VIP = 10000; // 10 segundos en ms

// Clave para storage de timestamps
const TIMESTAMPS_STORAGE_KEY = 'order_timestamps';
// (no persistimos initialOrderIds entre sesiones)

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
  
  // 🔐 Evitar recargas cuando vuelves a una pantalla con la misma sesión
  const [lastLoadedSessionId, setLastLoadedSessionId] = useState<string | null>(null);
  const [lastAccessToken, setLastAccessToken] = useState<string | null>(null);
  
  // 🔄 Forzar refetch cuando hay error en el canal realtime
  const [realtimeErrorCount, setRealtimeErrorCount] = useState(0);

  // ====================
  // FUNCIONES PARA PERSISTENCIA DE TIMESTAMPS
  // ====================
  const saveTimestampsToStorage = useCallback(async (timestamps: Map<string, number>) => {
    try {
      const serialized = JSON.stringify(Array.from(timestamps.entries()));
      await AsyncStorage.setItem(TIMESTAMPS_STORAGE_KEY, serialized);
    } catch (err) {
      console.error('[ServicesProvider] ❌ Error guardando timestamps:', err);
    }
  }, []);

  const loadTimestampsFromStorage = useCallback(async (): Promise<Map<string, number>> => {
    try {
      const data = await AsyncStorage.getItem(TIMESTAMPS_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return new Map(parsed);
      }
    } catch (err) {
      console.error('[ServicesProvider] ❌ Error cargando timestamps:', err);
    }
    return new Map();
  }, []);

  // initialOrderIds no se persisten entre sesiones para evitar mostrar inmediatamente items nuevos al recargar

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
      console.log('[ServicesProvider] 📦 Iniciando loadServices...');
      
      // 🎯 Cargar timestamps previos desde storage
      const prevTimestamps = await loadTimestampsFromStorage();
      console.log(`[ServicesProvider] 📦 Timestamps previos cargados: ${prevTimestamps.size}`);

      const data = await fetchServices(session.access_token);
      console.log(`[ServicesProvider] 📦 Datos recibidos: ${data.length} servicios`);
      setServices(data);
      
      // 🎯 Inicializar timestamps con los previos cargados
      setOrderTimestamps(prevTimestamps);
      // 🎯 En el primer load de la sesión: marcar como "iniciales" solo los pedidos que
      // ya cumplen el delay (age >= DELAY_FOR_NON_VIP). Los demás se consideran nuevos
      // y recibirán timestamp (basado en created_at) para respetar el delay incluso tras recarga.
      setInitialOrderIds((current) => {
        if (isFirstLoad) {
          const now = Date.now();
          const newInitialIds = new Set<string>();
          data.forEach((s) => {
            if (s.status === 'disponible') {
              const createdAtMs = new Date(s.createdAt).getTime();
              const age = now - createdAtMs;
              if (age >= DELAY_FOR_NON_VIP) {
                newInitialIds.add(s.id);
              }
            }
          });
          console.log(`[ServicesProvider] 🎯 PRIMERA CARGA DE SESIÓN: ${newInitialIds.size} servicios marcados como iniciales (age>=${DELAY_FOR_NON_VIP}ms)`);
          return newInitialIds;
        }

        // En refresh posterior dentro de la misma sesión, mantener solo los que sigan disponibles
        const availableIds = new Set(data.filter((s) => s.status === 'disponible').map((s) => s.id));
        const preserved = new Set<string>();
        for (const id of current) {
          if (availableIds.has(id)) preserved.add(id);
        }
        console.log(`[ServicesProvider] 🎯 REFRESH: preservados ${preserved.size} initialOrderIds`);
        return preserved;
      });
      
      // 🎯 Actualizar timestamps: 
      // - Mantener los existentes
      // - Para servicios sin timestamp: asignarles uno basado en created_at
      //   (Si hace >10s que se creó, el delay ya pasó)
      setOrderTimestamps((prevTimestamps) => {
        const availableIds = new Set(data.filter((s) => s.status === "disponible").map((s) => s.id));
        const newTimestamps = new Map(prevTimestamps);
        const now = Date.now();
        
        // 1. Limpiar timestamps de servicios que ya no están disponibles
        for (const [serviceId] of prevTimestamps.entries()) {
          if (!availableIds.has(serviceId)) {
            newTimestamps.delete(serviceId);
          }
        }
        
        // 2. Para servicios sin timestamp (ej: llegaron via realtime): asignarles uno basado en created_at
        data.forEach((service) => {
          if (service.status === "disponible" && !newTimestamps.has(service.id)) {
            const createdAtMs = new Date(service.createdAt).getTime();
            // Usar created_at como timestamp → si hace >10s, el delay ya pasó
            newTimestamps.set(service.id, createdAtMs);
            const ageMs = now - createdAtMs;
            console.log(`[ServicesProvider] ⏰ Asignando timestamp a ${service.id} (creado hace ${ageMs}ms)`);
          }
        });
        
        if (newTimestamps.size !== prevTimestamps.size) {
          console.log(`[ServicesProvider] 🧹 Timestamps actualizado: ${prevTimestamps.size} → ${newTimestamps.size}`);
        }
        
        return newTimestamps;
      });
      
      // 🎯 NO resetear visibleNewOrderIds aquí - solo cuando el servicio se oculta
      // Esto permite que los servicios que ya pasaron el delay sigan siendo visibles
      setIsFirstLoad(false);
      console.log('[ServicesProvider] ✅ loadServices completado exitosamente');
    } catch (err: any) {
      console.error('[ServicesProvider] ❌ Error cargando servicios:', err);
      setError(err.message || 'Error cargando servicios');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, loadTimestampsFromStorage]);

  useEffect(() => {
    // ✅ Solo cargar si la sesión cambió (login/logout real)
    // Esto evita recargas cuando vuelves a una pantalla con la misma sesión
    const currentSessionId = session?.user?.id ?? null;
    
    if (currentSessionId === lastLoadedSessionId) {
      setLoading(false);
      return;
    }
    
    if (currentSessionId) {
      setLastLoadedSessionId(currentSessionId);
      loadServices();
    }
  }, [session?.user?.id, lastLoadedSessionId, loadServices]);

  // 🔄 Detectar cuando el token se renueva y reconectar realtime
  useEffect(() => {
    const currentToken = session?.access_token ?? null;
    
    if (currentToken && lastAccessToken && currentToken !== lastAccessToken) {
      console.log('[ServicesProvider] 🔄 Token renovado, reconectando listeners...');
      setLastAccessToken(currentToken);
      // El realtime listener se reconectará automáticamente porque depende de session?.access_token
    } else if (currentToken && !lastAccessToken) {
      console.log('[ServicesProvider] 🔐 Token inicializado');
      setLastAccessToken(currentToken);
    }
  }, [session?.access_token]); // Solo depende del token, no de lastAccessToken

  // 📱 Recargar servicios cuando la app vuelve del background
  useEffect(() => {
    if (!session?.user?.id || !session?.access_token) return;

    const subscription = AppState.addEventListener('change', async (state: AppStateStatus) => {
      if (state === 'active') {
        console.log('[ServicesProvider] 📱 App vuelve a foreground, recargando servicios...');
        try {
          // Solo recargar, no resetear el token (eso causa loops)
          await loadServices();
          console.log('[ServicesProvider] ✅ Servicios recargados');
        } catch (err) {
          console.error('[ServicesProvider] ❌ Error recargando servicios:', err);
        }
      }
    });

    return () => subscription.remove();
  }, [session?.user?.id, session?.access_token]); // No incluir loadServices para evitar loops

  // ====================
  // LISTENER: ACTUALIZACIÓN FLUIDA EN REALTIME
  // CON GET para traer datos completos con relationships
  // ====================
  
  // ✅ Envolver el handler en useCallback para evitar redefinición en cada render
  const handleRealtimeData = useCallback((payload: any) => {
    const eventType = payload.eventType;
    const serviceId = payload.new?.id || payload.old?.id;

    console.log('[REALTIME] 📨 Evento:', eventType, serviceId);

    // DELETE siempre se procesa
    if (eventType === 'DELETE') {
      console.log('[REALTIME] 🗑️ Eliminando');
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
      return;
    }

    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      const payloadData = payload.new || payload.old;
      if (!payloadData) return;

      const userId = session?.user?.id;
      const userRole = profile?.role;
      const userBranch = profile?.branchId;

      // 🔐 VALIDACIÓN RÁPIDA en el payload: ¿Es mío?
      let shouldKeep = false;

      switch (userRole) {
        case 'super_admin':
          shouldKeep = true;
          break;
        case 'coordinator':
          shouldKeep = payloadData.branch_id === userBranch;
          break;
        case 'store':
          shouldKeep = payloadData.profile_store_id === userId;
          break;
        case 'delivery':
          const isAvailable = payloadData.status === 'disponible';
          const isAssignedToHim = payloadData.assigned_delivery === userId;
          shouldKeep = (isAvailable || isAssignedToHim) && profile?.isActive;
          break;
        case 'client':
          shouldKeep = payloadData.requested_by === userId;
          break;
      }

      console.log('[REALTIME] 🔐 shouldKeep:', shouldKeep, { role: userRole });

      // Si NO es suyo:
      // - En DELETE: eliminar
      // - En INSERT: ignorar (no agregar)
      // - En UPDATE: no modificar la lista (evitar fluctuaciones/no contar)
      if (!shouldKeep) {
        if (eventType === 'DELETE') {
          setServices((prev) => prev.filter((s) => s.id !== serviceId));
        }
        // Para INSERT/UPDATE no hacemos nada cuando no corresponde al usuario
        return;
      }

      // Si ES suyo, obtener datos completos
      if (session?.access_token) {
        (async () => {
          try {
            console.log('[REALTIME] 📥 GET:', serviceId);
            const updatedService = await getServiceById(serviceId, session.access_token);
            console.log('[REALTIME] ✅ Obtenido:', updatedService?.id);

            setServices((prev) => {
              const exists = prev.find((s) => s.id === serviceId);
              if (exists) {
                console.log('[REALTIME] 🔄 UPDATE');
                return prev.map((s) => (s.id === serviceId ? updatedService : s));
              } else {
                console.log('[REALTIME] ➕ INSERT - nuevo servicio');
                // 🎯 Asignar timestamp basado en created_at para el delay
                if (updatedService?.status === "disponible") {
                  const createdAtMs = new Date(updatedService.createdAt).getTime();
                  const ageMs = Date.now() - createdAtMs;
                  console.log(`[REALTIME] ⏰ Nuevo servicio ${serviceId}: edad=${ageMs}ms, asignando timestamp`);
                  setOrderTimestamps((prev) => new Map([...prev, [serviceId, createdAtMs]]));
                }
                return [updatedService, ...prev];
              }
            });
          } catch (err: any) {
            console.error('[REALTIME] ❌ Error:', err?.message || err);
            
            // 🔑 Detectar si el token expiró
            if (err?.message?.includes('invalid') || err?.message?.includes('expired') || err?.message?.includes('401')) {
              console.error('[REALTIME] 🔑 Token expirado o inválido - Se reconectará automáticamente');
              // El AuthProvider renovará el token y esto disparará una reconexión
            }
          }
        })();
      }
    }
  }, [session?.access_token, session?.user?.id, profile?.role, profile?.branchId, profile?.isActive]);

  const shouldUserHaveAccessToService = (payload: any): boolean => {
    const service = payload.new || payload.old;
    if (!service) {
      console.log('[CHECK_ACCESS] ❌ Sin servicio en payload');
      return false;
    }

    const userId = session?.user?.id;
    const userRole = profile?.role;
    const userBranch = profile?.branchId;

    console.log('[CHECK_ACCESS] User:', { userId, userRole, userBranch });
    console.log('[CHECK_ACCESS] Service:', { id: service.id, status: service.status, branch_id: service.branch_id, profile_store_id: service.profile_store_id, assigned_delivery: service.assigned_delivery });

    // VALIDACIÓN POR ROL
    switch (userRole) {
      case 'super_admin':
        console.log('[CHECK_ACCESS] ✅ super_admin = acceso total');
        return true;

      case 'coordinator':
        const coordAccess = service.branch_id === userBranch;
        console.log('[CHECK_ACCESS] coordinator:', { hasAccess: coordAccess, serviceBranch: service.branch_id, userBranch });
        return coordAccess;

      case 'store':
        const storeAccess = service.profile_store_id === userId;
        console.log('[CHECK_ACCESS] store:', { hasAccess: storeAccess, serviceStore: service.profile_store_id, userId });
        return storeAccess;

      case 'delivery':
        const isAvailable = service.status === 'disponible';
        const isAssignedToHim = service.assigned_delivery === userId;
        const userIsActive = profile?.isActive === true;
        const deliveryAccess = (isAvailable || isAssignedToHim) && userIsActive;
        console.log('[CHECK_ACCESS] delivery:', { hasAccess: deliveryAccess, isAvailable, isAssignedToHim, userIsActive });
        return deliveryAccess;

      case 'client':
        const clientAccess = service.requested_by === userId;
        console.log('[CHECK_ACCESS] client:', { hasAccess: clientAccess, serviceRequester: service.requested_by, userId });
        return clientAccess;

      default:
        console.log('[CHECK_ACCESS] ❌ Rol desconocido:', userRole);
        return false;
    }
  };

  // ✅ Usar el handler en el listener
  useRealtimeListener({
    table: 'services',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    onData: handleRealtimeData,
    onChannelError: async (error) => {
      console.log('[ServicesProvider] 🔄 Error en canal realtime detectado, haciendo refetch...');
      // Incrementar contador para forzar refetch
      setRealtimeErrorCount((prev) => prev + 1);
      // También recargar servicios inmediatamente
      try {
        await loadServices();
        console.log('[ServicesProvider] ✅ Refetch completado después de error del canal');
      } catch (err) {
        console.error('[ServicesProvider] ❌ Error en refetch:', err);
      }
    },
    enabled: !!session?.access_token,
    debug: true,
  });

  // 🔐 VIP state - recalcular cuando el profile cambia
  const [isUserVIP, setIsUserVIP] = useState(false);
  
  useEffect(() => {
    const newVIPStatus = profile?.isVIP ?? false;
    if (newVIPStatus !== isUserVIP) {
      console.log(`[ServicesProvider] 👑 Estado VIP actualizado: ${isUserVIP} → ${newVIPStatus}`);
      setIsUserVIP(newVIPStatus);
      
      // 🔄 Si cambió a VIP: limpiar timestamps para mostrar todos inmediatamente
      if (newVIPStatus) {
        console.log(`[ServicesProvider] 👑 VIP activado - limpiando timestamps`);
        setOrderTimestamps(new Map());
        // Limpiar initial ids porque VIP ve todo
        setInitialOrderIds(new Set());
      }
    }
  }, [profile?.isVIP]);

  // 🎯 Guardar timestamps en storage cuando cambien
  useEffect(() => {
    saveTimestampsToStorage(orderTimestamps);
  }, [orderTimestamps, saveTimestampsToStorage]);

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
