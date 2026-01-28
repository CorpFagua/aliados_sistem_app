import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Contador de mensajes sin leer por servicio
 */
export interface UnreadMessagesCount {
  [serviceId: string]: number;
}

/**
 * Hook para rastrear mensajes sin leer en tiempo real
 * Se suscribe a los canales de chat según los servicios que el usuario puede ver
 */
export function useUnreadMessages(serviceIds: string[]) {
  const { session, profile } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState<UnreadMessagesCount>({});
  const [lastReadTimestamps, setLastReadTimestamps] = useState<{ [serviceId: string]: string }>({});

  /**
   * Marca un servicio como leído (actualiza el timestamp de última lectura)
   */
  const markAsRead = useCallback((serviceId: string) => {
    setLastReadTimestamps((prev) => ({
      ...prev,
      [serviceId]: new Date().toISOString(),
    }));
    setUnreadCounts((prev) => ({
      ...prev,
      [serviceId]: 0,
    }));
  }, []);

  /**
   * Obtener el conteo de mensajes sin leer para un servicio
   */
  const getUnreadCount = useCallback(
    (serviceId: string): number => {
      return unreadCounts[serviceId] || 0;
    },
    [unreadCounts]
  );

  /**
   * Inicializar contadores y suscripciones
   */
  useEffect(() => {
    if (!session?.user?.id || !profile || serviceIds.length === 0) {
      return;
    }

    const userId = session.user.id;
    const channels: ReturnType<typeof supabase.channel>[] = [];

    console.log(`📬 [UNREAD] Inicializando para ${serviceIds.length} servicios`);

    // Para cada servicio, cargar mensajes no leídos y suscribirse
    serviceIds.forEach((serviceId) => {
      // Obtener timestamp de última lectura (o usar uno antiguo por defecto)
      const lastRead = lastReadTimestamps[serviceId] || '2020-01-01T00:00:00.000Z';

      // Cargar mensajes no leídos existentes
      supabase
        .from('service_messages')
        .select('id, created_at, sender_id')
        .eq('service_id', serviceId)
        .neq('sender_id', userId) // Excluir mensajes propios
        .gt('created_at', lastRead)
        .then(({ data, error }) => {
          if (error) {
            console.error(`❌ [UNREAD] Error cargando mensajes para ${serviceId}:`, error);
            return;
          }

          const count = data?.length || 0;
          if (count > 0) {
            console.log(`📬 [UNREAD] ${serviceId}: ${count} mensaje(s) sin leer`);
            setUnreadCounts((prev) => ({
              ...prev,
              [serviceId]: count,
            }));
          }
        });

      // Suscribirse a nuevos mensajes en tiempo real
      const channelName = `unread-messages-${serviceId}-${Math.random().toString(36).substr(2, 9)}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'service_messages',
            filter: `service_id=eq.${serviceId}`,
          },
          (payload: any) => {
            const newMessage = payload.new;

            // Ignorar mensajes propios
            if (newMessage.sender_id === userId) {
              console.log(`📬 [UNREAD] Ignorando mensaje propio en ${serviceId}`);
              return;
            }

            // Verificar si el mensaje es más reciente que la última lectura
            const lastRead = lastReadTimestamps[serviceId] || '2020-01-01T00:00:00.000Z';
            if (newMessage.created_at > lastRead) {
              console.log(`📬 [UNREAD] Nuevo mensaje sin leer en ${serviceId}`);
              setUnreadCounts((prev) => ({
                ...prev,
                [serviceId]: (prev[serviceId] || 0) + 1,
              }));
            }
          }
        )
        .subscribe((status: string, err?: any) => {
          if (status === 'SUBSCRIBED') {
            console.log(`✅ [UNREAD] Subscrito a ${channelName}`);
          } else if (err) {
            console.error(`❌ [UNREAD] Error en ${channelName}:`, err);
          }
        });

      channels.push(channel);
    });

    // Cleanup: desuscribir de todos los canales
    return () => {
      console.log(`🧹 [UNREAD] Limpiando ${channels.length} suscripciones`);
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [session, profile, serviceIds, lastReadTimestamps]);

  return {
    unreadCounts,
    getUnreadCount,
    markAsRead,
  };
}
