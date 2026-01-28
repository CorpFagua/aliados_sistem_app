// src/modules/users/delivery/screens/DisponiblesScreen.tsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { StyleSheet, FlatList, View, Text, ActivityIndicator, RefreshControl, ToastAndroid } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { useAuth } from "@/providers/AuthProvider";
import { updateServiceStatus } from "@/services/services";
import { useServices } from "@/providers/ServicesProvider";
import { useUnreadMessagesContext } from "@/providers/UnreadMessagesProvider";
import OrderRow from "../components/OrderRow";

const DELAY_FOR_NON_VIP = 10000; // 10 segundos en ms

export default function DisponiblesScreen() {
  const { session } = useAuth();
  const { services, loading, refetch, initialOrderIds, visibleNewOrderIds, orderTimestamps, isUserVIP } = useServices();
  const { registerServices } = useUnreadMessagesContext();
  const [refreshing, setRefreshing] = useState(false);
  const refetchedServiceIds = useRef<Set<string>>(new Set()); // Evitar refetch múltiple por mismo servicio

  // Registrar servicios disponibles para tracking de mensajes
  useEffect(() => {
    const disponiblesIds = services
      .filter((s) => s.status === "disponible")
      .map((s) => s.id);
    registerServices(disponiblesIds);
  }, [services, registerServices]);

  // ⏱️ Contador regresivo: actualizar cada 1s solo para verificar si pasó el delay
  useEffect(() => {
    if (isUserVIP) return;

    const interval = setInterval(() => {
      const available = services.filter((s) => s.status === "disponible");
      let shouldRefetch = false;

      available.forEach((service) => {
        // Solo para pedidos nuevos que aún no son visibles
        if (!initialOrderIds.has(service.id) && !visibleNewOrderIds.has(service.id)) {
          const timestamp = orderTimestamps.get(service.id);
          if (timestamp && !refetchedServiceIds.current.has(service.id)) {
            const elapsed = Date.now() - timestamp;
            const remaining = Math.max(0, DELAY_FOR_NON_VIP - elapsed);

            // Si pasó el delay, marcar para refetch (solo una vez por servicio)
            if (remaining === 0) {
              refetchedServiceIds.current.add(service.id);
              shouldRefetch = true;
            }
          }
        }
      });

      // Hacer refetch una sola vez si algo cumplió el delay
      if (shouldRefetch) {
        refetch();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [services, isUserVIP, initialOrderIds, visibleNewOrderIds, orderTimestamps, refetch]);

  // 🎯 Filtrar servicios disponibles con lógica de delay
  const pedidosVisibles = useMemo(() => {
    const available = services.filter((s) => s.status === "disponible");

    // Limpiar ref de servicios que ya pasaron el delay o desaparecieron
    const visibleIds = new Set(available.map((s) => s.id));
    for (const id of refetchedServiceIds.current) {
      if (!visibleIds.has(id)) {
        refetchedServiceIds.current.delete(id);
      }
    }

    if (isUserVIP) {
      // VIP: ver todos los pedidos inmediatamente
      return available;
    }

    // No-VIP: solo mostrar iniciales + nuevos que pasaron el delay
    const now = Date.now();
    return available.filter((service) => {
      // Mostrar si fue uno de los iniciales
      if (initialOrderIds.has(service.id)) {
        return true;
      }

      // Si es nuevo y ya lo tenemos visible
      if (visibleNewOrderIds.has(service.id)) {
        return true;
      }

      // Si es nuevo pero aún no pasó el delay
      const timestamp = orderTimestamps.get(service.id);
      if (timestamp && (now - timestamp) >= DELAY_FOR_NON_VIP) {
        return true;
      }

      return false;
    });
  }, [services, isUserVIP, initialOrderIds, visibleNewOrderIds, orderTimestamps]);

  // 🎯 Calcular servicios en espera para el toast
  const pedidosEnEspera = useMemo(() => {
    if (isUserVIP) return [];
    
    const available = services.filter((s) => s.status === "disponible");
    const now = Date.now();
    
    return available.filter((service) => {
      // No incluir iniciales
      if (initialOrderIds.has(service.id)) return false;
      // No incluir los que ya son visibles
      if (visibleNewOrderIds.has(service.id)) return false;
      
      const timestamp = orderTimestamps.get(service.id);
      return timestamp && (now - timestamp) < DELAY_FOR_NON_VIP;
    });
  }, [services, isUserVIP, initialOrderIds, visibleNewOrderIds, orderTimestamps]);

  // 🔄 Pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      
      // 📢 Mostrar toast si hay servicios en espera
      if (!isUserVIP && pedidosEnEspera.length > 0) {
        // Calcular el tiempo faltante del servicio más próximo
        const now = Date.now();
        let tiempoMinimo = DELAY_FOR_NON_VIP;
        
        pedidosEnEspera.forEach((service) => {
          const timestamp = orderTimestamps.get(service.id);
          if (timestamp) {
            const elapsed = Date.now() - timestamp;
            const remaining = Math.max(0, DELAY_FOR_NON_VIP - elapsed);
            tiempoMinimo = Math.min(tiempoMinimo, remaining);
          }
        });
        
        const segundos = Math.ceil(tiempoMinimo / 1000);
        const mensaje = `Cargando... ${segundos}s restantes`;
        
        ToastAndroid.show(mensaje, ToastAndroid.LONG);
      }
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.iconActive} />
          <Text style={styles.loadingText}>Cargando servicios...</Text>
        </View>
      ) : pedidosVisibles.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="baseball-outline" size={48} color={Colors.normalText} style={styles.emptyStateIcon} />
          <Text style={styles.emptyStateTitle}>No hay servicios disponibles</Text>
          <Text style={styles.emptyStateText}>
            {isUserVIP 
              ? "Vuelve más tarde para ver nuevos servicios"
              : "Los nuevos servicios aparecerán con 10s de delay"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={pedidosVisibles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderRow
              pedido={item}
              onPress={() => console.log("Ver detalles", item.id)}
              leftEnabled
              leftLabel="Tomar"
              leftColor="#2563EB"
              onLeftAction={async (p) => {
                try {
                  console.log("✔️ Intentando asignar pedido:", p.id);
                  await updateServiceStatus(
                    p.id,
                    "asignado",
                    session.access_token,
                    session.user.id
                  );
                  return true; // cierra la tarjeta al éxito
                } catch (err: any) {
                  console.error("❌ Error al tomar servicio:", err);
                  const message = err?.message ||
                    "No se pudo tomar el servicio. Intenta de nuevo.";
                  alert(message);
                  return false; // mantiene la tarjeta abierta
                }
              }}
              rightEnabled={false}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.activeMenuText, Colors.gradientEnd]}
              progressBackgroundColor={Colors.activeMenuBackground}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.Background },
  listContent: { paddingBottom: 80 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.menuText,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  emptyStateIcon: {
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.normalText,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 13,
    color: Colors.menuText,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
