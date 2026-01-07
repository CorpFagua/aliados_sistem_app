/**
 * Hook Real-time para Pedidos de Tienda
 * Escucha cambios en servicios con estado: disponible, asignado, en_ruta, entregado
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRealtimeListener } from './useRealtimeListener';
import { Service } from '@/models/service';
import { fetchServices } from '@/services/services';

export function useStoreOrdersRealtime() {
  const { session } = useAuth();
  const [pedidos, setPedidos] = useState<Record<string, Service[]>>({
    Disponibles: [],
    Tomados: [],
    'En ruta': [],
    Entregados: [],
  });
  const [loading, setLoading] = useState(false);

  // 📡 Cargar inicial
  useEffect(() => {
    if (!session?.access_token) return;

    const loadInitial = async () => {
      try {
        setLoading(true);
        const data = await fetchServices(session.access_token);

        const grouped: Record<string, Service[]> = {
          Disponibles: data.filter((s) => s.status === 'disponible'),
          Tomados: data.filter((s) => s.status === 'asignado'),
          'En ruta': data.filter((s) => s.status === 'en_ruta'),
          Entregados: data.filter((s) => s.status === 'entregado'),
        };

        setPedidos(grouped);
      } catch (err) {
        console.error('[STORE] Error cargando pedidos:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitial();
  }, [session?.access_token]);

  // 🔵 Escuchar cambios de servicios en tiempo real
  useRealtimeListener({
    table: 'services',
    events: ['UPDATE', 'INSERT'],
    onData: (payload) => {
      const service = payload.new as Service;

      if (payload.eventType === 'INSERT') {
        // Nuevo servicio disponible
        setPedidos((prev) => ({
          ...prev,
          Disponibles: [service, ...prev.Disponibles],
        }));
        console.log('[STORE] 📨 Nuevo pedido disponible:', service.id);
      } else if (payload.eventType === 'UPDATE') {
        // Pedido cambió de estado
        console.log(
          '[STORE] 📨 Pedido actualizado:',
          service.id,
          '→',
          service.status
        );

        setPedidos((prev) => {
          const updated = { ...prev };

          // Remover de todas las listas
          Object.keys(updated).forEach((key) => {
            updated[key] = updated[key].filter((p) => p.id !== service.id);
          });

          // Agregar en la lista correcta según estado
          if (service.status === 'disponible') {
            updated.Disponibles = [service, ...updated.Disponibles];
          } else if (service.status === 'asignado') {
            updated.Tomados = [service, ...updated.Tomados];
          } else if (service.status === 'en_ruta') {
            updated['En ruta'] = [service, ...updated['En ruta']];
          } else if (service.status === 'entregado') {
            updated.Entregados = [service, ...updated.Entregados];
          }

          return updated;
        });
      }
    },
    enabled: !!session?.access_token,
    debug: true,
  });

  return { pedidos, loading };
}
