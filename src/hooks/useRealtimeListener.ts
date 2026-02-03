import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '@/lib/supabase';

/**
 * Tipos para el listener de real-time
 */
type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface RealtimeFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'like' | 'in';
  value: any;
}

interface UseRealtimeListenerConfig {
  /** Nombre de la tabla en Supabase */
  table: string;

  /** Eventos a escuchar */
  events?: RealtimeEvent[];

  /** String de filtro en formato Supabase: "field=eq.value,field2=gt.value2" */
  filter?: string;

  /** Callback cuando llega un cambio */
  onData: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: any;
    old?: any;
  }) => void;

  /** Callback cuando hay error en el canal */
  onChannelError?: (error: any) => void;

  /** Habilitar/deshabilitar el listener */
  enabled?: boolean;

  /** Debug logging */
  debug?: boolean;
}

/**
 * Hook universal para escuchar cambios en tiempo real desde Supabase
 *
 * @example
 * ```typescript
 * // Escuchar todos los cambios en servicios
 * useRealtimeListener({
 *   table: 'services',
 *   events: ['UPDATE', 'INSERT'],
 *   onData: (payload) => {
 *     console.log('Cambio:', payload);
 *     setServices(prev => updateService(prev, payload));
 *   }
 * });
 *
 * // Escuchar solo cambios de un usuario
 * useRealtimeListener({
 *   table: 'services',
 *   filter: 'coordinator_id=eq.user-123',
 *   onData: (payload) => {
 *     console.log('Mi servicio cambió:', payload);
 *   }
 * });
 *
 * // Escuchar solo inserciones en un rango de zona
 * useRealtimeListener({
 *   table: 'services',
 *   events: ['INSERT'],
 *   filter: 'zone_id=eq.zone-456',
 *   onData: (payload) => {
 *     console.log('Nueva orden en mi zona:', payload.new);
 *   },
 *   enabled: !!userId
 * });
 * ```
 */
export function useRealtimeListener(config: UseRealtimeListenerConfig) {
  const {
    table,
    events = ['*'],
    filter,
    onData,
    onChannelError,
    enabled = true,
    debug = false,
  } = config;

  const onDataRef = useRef(onData);
  const onChannelErrorRef = useRef(onChannelError);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [forceReconnect, setForceReconnect] = useState(0);

  // Actualizar las referencias sin causar re-creación del listener
  useEffect(() => {
    onDataRef.current = onData;
    onChannelErrorRef.current = onChannelError;
  }, [onData, onChannelError]);

  const log = (message: string, data?: any) => {
    if (debug || process.env.NODE_ENV === 'development') {
      console.log(`[REALTIME:${table}] ${message}`, data || '');
    }
  };

  // 📱 Detectar cuando la app vuelve del background y reconectar
  useEffect(() => {
    if (!enabled) return;

    let lastAppState: AppStateStatus = 'active';
    
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      // Solo reconectar cuando pasa de background a foreground
      if (lastAppState !== 'active' && state === 'active') {
        log('📱 App en foreground, verificando conexión realtime...');
        // Forzar reconexión
        setForceReconnect(prev => prev + 1);
      }
      lastAppState = state;
    });

    return () => subscription.remove();
  }, [enabled, table, log]);

  useEffect(() => {
    if (!enabled) {
      log('⏸️ Listener deshabilitado');
      return;
    }

    log('🔵 Iniciando listener');

    // Si ya existe un canal, eliminarlo primero
    if (channelRef.current) {
      log('🧹 Eliminando canal anterior');
      try {
        supabase.removeChannel(channelRef.current);
      } catch (err) {
        log('⚠️ Error al remover canal:', err);
      }
      channelRef.current = null;
    }

    // Crear canal único para esta instancia
    const channelName = `realtime-${table}-${Math.random().toString(36).substr(2, 9)}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true },
      },
    });

    // Configurar payload
    const postgresChangesConfig: any = {
      event: events.includes('*') ? '*' : events.length === 1 ? events[0] : '*',
      schema: 'public',
      table,
    };

    // Agregar filtro si existe
    if (filter) {
      postgresChangesConfig.filter = filter;
      log('🔍 Filtro aplicado:', filter);
    }

    log('📡 Suscribiendo a:', postgresChangesConfig);

    // Suscribirse a cambios
    channel
      .on('postgres_changes', postgresChangesConfig, (payload: any) => {
        log(`📨 ${payload.eventType}:`, payload);

        try {
          onDataRef.current({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new,
            old: payload.old,
          });
        } catch (error) {
          console.error(`[REALTIME:${table}] ❌ Error en callback:`, error);
        }
      })
      .subscribe((status: string, err?: any) => {
        if (status === 'SUBSCRIBED') {
          log('✅ Subscrito exitosamente');
        } else if (status === 'CLOSED') {
          log('⚠️ Conexión cerrada');
          // No reconectar automáticamente aquí, dejar que Supabase maneje la reconexión
          // La reconexión se disparará cuando la app vuelva del background
        } else if (status === 'CHANNEL_ERROR') {
          log('❌ Error del canal', err);
          
          // 🔑 Detectar errores de autenticación
          if (err?.message?.includes('invalid') || err?.message?.includes('expired') || err?.message?.includes('401')) {
            console.error(`[REALTIME:${table}] 🔑 Error de autenticación - Token probablemente expiró`);
          }
          
          // 🔄 Notificar al Provider para que haga un refetch completo
          if (onChannelErrorRef.current) {
            onChannelErrorRef.current(err);
          }
        } else if (status === 'TIMED_OUT') {
          log('⏱️ Timeout en conexión');
          // No reconectar automáticamente aquí, dejar que Supabase maneje la reconexión
        } else if (err) {
          log('❌ Error:', err?.message);
        }
      });

    channelRef.current = channel;

    // Cleanup al desmontar
    return () => {
      log('🧹 Limpiando listener');
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (err) {
          log('⚠️ Error al limpiar:', err);
        }
        channelRef.current = null;
      }
    };
  }, [
    table,
    JSON.stringify(events),
    filter,
    enabled,
    debug,
    forceReconnect, // Dependencia para reconexión
  ]);

  return {
    channel: channelRef.current,
    unsubscribe: () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    },
  };
}
