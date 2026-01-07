/**
 * Hook Real-time para Pedidos de Delivery
 * Escucha cambios en servicios disponibles y asignados al usuario
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRealtimeListener } from './useRealtimeListener';
import { Service } from '@/models/service';
import { fetchServices } from '@/services/services';

export function useDeliveryOrdersRealtime() {
  const { session, profile } = useAuth();
  const [pedidos, setPedidos] = useState<Record<string, Service[]>>({
    Disponibles: [],
    Asignados: [],
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
          Asignados: data.filter(
            (s) => s.status === 'asignado' && s.assignedDelivery === session.user.id
          ),
          'En ruta': data.filter(
            (s) => s.status === 'en_ruta' && s.assignedDelivery === session.user.id
          ),
          Entregados: data.filter(
            (s) => s.status === 'entregado' && s.assignedDelivery === session.user.id
          ),
        };

        setPedidos(grouped);
      } catch (err) {
        console.error('[DELIVERY] Error cargando pedidos:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitial();
  }, [session?.access_token, session?.user?.id]);

  // 🔵 Escuchar órdenes disponibles (nuevas)
  useRealtimeListener({
    table: 'services',
    events: ['INSERT'],
    filter: `status=eq.disponible`,
    onData: (payload) => {
      const service = payload.new as Service;

      // Solo agregar si es nueva
      setPedidos((prev) => ({
        ...prev,
        Disponibles: [service, ...prev.Disponibles],
      }));

      console.log('[DELIVERY] 📨 Nueva orden disponible:', service.id);
    },
    enabled: !!session?.access_token,
    debug: true,
  });

  // 🔵 Escuchar cambios en mis órdenes asignadas
  useRealtimeListener({
    table: 'services',
    events: ['UPDATE'],
    filter: `assigned_delivery=eq.${session?.user?.id}`,
    onData: (payload) => {
      const service = payload.new as Service;

      console.log(
        '[DELIVERY] 📨 Mis pedidos actualizado:',
        service.id,
        '→',
        service.status
      );

      setPedidos((prev) => {
        const updated = { ...prev };

        // Remover de todas mis listas
        ['Asignados', 'En ruta', 'Entregados'].forEach((key) => {
          updated[key] = updated[key].filter((p) => p.id !== service.id);
        });

        // Agregar en la lista correcta
        if (service.status === 'asignado') {
          updated.Asignados = [service, ...updated.Asignados];
        } else if (service.status === 'en_ruta') {
          updated['En ruta'] = [service, ...updated['En ruta']];
        } else if (service.status === 'entregado') {
          updated.Entregados = [service, ...updated.Entregados];
        }

        return updated;
      });
    },
    enabled: !!session?.user?.id,
    debug: true,
  });

  // 🔵 Escuchar cuando otros toman órdenes (remover de disponibles)
  useRealtimeListener({
    table: 'services',
    events: ['UPDATE'],
    filter: `status=eq.asignado`,
    onData: (payload) => {
      const service = payload.new as Service;

      // Si alguien más tomó una orden disponible, remover de mi lista
      if (service.assignedDelivery !== session?.user?.id) {
        setPedidos((prev) => ({
          ...prev,
          Disponibles: prev.Disponibles.filter((p) => p.id !== service.id),
        }));

        console.log(
          '[DELIVERY] 🚫 Alguien tomó la orden:',
          service.id,
          '- removida de disponibles'
        );
      }
    },
    enabled: !!session?.access_token,
    debug: true,
  });

  return { pedidos, loading };
}
