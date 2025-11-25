/**
 * 🏠 EJEMPLO: Dashboard Coordinator con Real-time
 * 
 * Copia este patrón a tus pantallas principales
 */

import React, { useState, useCallback } from 'react';
import { View, FlatList, RefreshControl, Text } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useRealtimeListener } from '@/hooks/useRealtimeListener';
import { api, authHeaders } from '@/lib/api';

interface Service {
  id: string;
  status: 'disponible' | 'en_progreso' | 'completado' | 'cancelado';
  requested_by: string;
  coordinator_id: string;
  assigned_delivery?: string;
  title: string;
  updated_at: string;
}

/**
 * EJEMPLO 1: Coordinator Dashboard
 * Muestra servicios del coordinador en tiempo real
 */
export default function CoordinatorDashboardExample() {
  const { session, profile } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 📡 Cargar servicios iniciales
  const loadServices = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      setLoading(true);
      const response = await api.get('/services/coordinator', {
        headers: authHeaders(session.access_token),
      });
      setServices(response.data.data || []);
    } catch (error) {
      console.error('Error cargando servicios:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  // 🔵 Listener real-time para cambios
  useRealtimeListener({
    table: 'services',
    events: ['UPDATE', 'INSERT'],
    filter: `coordinator_id=eq.${session?.user?.id}`,
    onData: (payload) => {
      if (payload.eventType === 'INSERT') {
        // Nuevo servicio
        setServices((prev) => [payload.new as Service, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        // Servicio actualizado
        setServices((prev) =>
          prev.map((s) => (s.id === payload.new.id ? (payload.new as Service) : s))
        );
      }
    },
    enabled: !!session?.user?.id,
  });

  // En primera carga
  React.useEffect(() => {
    if (services.length === 0 && !loading) {
      loadServices();
    }
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
            <Text style={{ fontSize: 14, fontWeight: '600' }}>{item.title}</Text>
            <Text style={{ fontSize: 12, color: '#666' }}>
              Estado: {item.status}
            </Text>
            <Text style={{ fontSize: 10, color: '#999' }}>
              {new Date(item.updated_at).toLocaleString('es-ES')}
            </Text>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadServices();
              setRefreshing(false);
            }}
          />
        }
      />
    </View>
  );
}

/**
 * ═════════════════════════════════════════════════════════════
 * EJEMPLO 2: Delivery Dashboard - Órdenes Disponibles
 * ═════════════════════════════════════════════════════════════
 */

interface AvailableOrder extends Service {
  zone_id: string;
  pickup_address: string;
  delivery_address: string;
  estimated_time: number;
}

export function DeliveryDashboardExample() {
  const { session, profile } = useAuth();
  const userZoneId = profile?.branchId; // o zone_id si existe
  const [availableOrders, setAvailableOrders] = useState<AvailableOrder[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<Service[]>([]);

  // 🟠 Listener para órdenes disponibles en mi zona
  useRealtimeListener({
    table: 'services',
    events: ['UPDATE', 'INSERT'],
    filter: `status=eq.disponible,zone_id=eq.${userZoneId}`,
    onData: (payload) => {
      const order = payload.new as AvailableOrder;

      if (payload.eventType === 'INSERT' && order.status === 'disponible') {
        // Nueva orden disponible
        setAvailableOrders((prev) => [order, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        if (order.status === 'disponible') {
          // Actualizar orden que sigue disponible
          setAvailableOrders((prev) =>
            prev.map((o) => (o.id === order.id ? order : o))
          );
        } else {
          // Remover si cambió de estado
          setAvailableOrders((prev) => prev.filter((o) => o.id !== order.id));
        }
      }
    },
    enabled: !!userZoneId,
  });

  // 🟢 Listener para mis entregas en progreso
  useRealtimeListener({
    table: 'services',
    events: ['UPDATE'],
    filter: `assigned_delivery=eq.${session?.user?.id}`,
    onData: (payload) => {
      const delivery = payload.new as Service;

      setMyDeliveries((prev) =>
        prev.map((d) => (d.id === delivery.id ? delivery : d))
      );

      // Remover si se completó
      if (delivery.status === 'completado' || delivery.status === 'cancelado') {
        setMyDeliveries((prev) => prev.filter((d) => d.id !== delivery.id));
      }
    },
    enabled: !!session?.user?.id,
  });

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ padding: 12, fontSize: 14, fontWeight: '600' }}>
        Disponibles: {availableOrders.length}
      </Text>
      <FlatList
        data={availableOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ padding: 12, backgroundColor: '#FFF3CD' }}>
            <Text style={{ fontWeight: '600' }}>{item.title}</Text>
            <Text>📍 {item.pickup_address}</Text>
            <Text>🔴 {item.delivery_address}</Text>
          </View>
        )}
      />

      <Text style={{ padding: 12, fontSize: 14, fontWeight: '600' }}>
        Mis entregas: {myDeliveries.length}
      </Text>
      <FlatList
        data={myDeliveries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ padding: 12, backgroundColor: '#D4EDDA' }}>
            <Text style={{ fontWeight: '600' }}>{item.title}</Text>
            <Text>En progreso...</Text>
          </View>
        )}
      />
    </View>
  );
}

/**
 * ═════════════════════════════════════════════════════════════
 * EJEMPLO 3: Store Dashboard - Pedidos con Real-time
 * ═════════════════════════════════════════════════════════════
 */

interface Order {
  id: string;
  status: 'pendiente' | 'confirmado' | 'preparando' | 'listo' | 'entregado';
  store_id: string;
  created_at: string;
  items: any[];
  total: number;
}

export function StoreDashboardExample() {
  const { session, profile } = useAuth();
  const storeId = profile?.storeId;
  const [orders, setOrders] = useState<Order[]>([]);

  // 📦 Listener para pedidos del store
  useRealtimeListener({
    table: 'orders', // Ajusta si tu tabla se llama diferente
    events: ['INSERT', 'UPDATE'],
    filter: `store_id=eq.${storeId}`,
    onData: (payload) => {
      const order = payload.new as Order;

      if (payload.eventType === 'INSERT') {
        // Nuevo pedido
        setOrders((prev) => [order, ...prev]);
        // Aquí podrías mostrar notificación
        console.log('📲 Nuevo pedido recibido!');
      } else if (payload.eventType === 'UPDATE') {
        // Pedido actualizado
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? order : o))
        );
      }
    },
    enabled: !!storeId,
  });

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderBottomWidth: 1 }}>
            <Text style={{ fontWeight: '600' }}>Pedido #{item.id}</Text>
            <Text>{item.items.length} items</Text>
            <Text style={{ color: '#007AFF' }}>${item.total}</Text>
            <Text style={{ color: '#999' }}>Estado: {item.status}</Text>
          </View>
        )}
      />
    </View>
  );
}

/**
 * ═════════════════════════════════════════════════════════════
 * PATRÓN UNIVERSAL
 * ═════════════════════════════════════════════════════════════
 * 
 * useRealtimeListener({
 *   table: 'nombre_tabla',
 *   events: ['INSERT', 'UPDATE'],
 *   filter: 'campo=eq.valor',  // Opcional
 *   onData: (payload) => {
 *     // Actualizar estado local
 *     setState(prev => ...);
 *   },
 *   enabled: !!userId,
 * });
 * 
 * ✅ Cambios se reflejan al instante
 * ✅ No requiere refresh manual
 * ✅ Escalable a múltiples listeners
 * ✅ Auto cleanup al desmontar
 */
