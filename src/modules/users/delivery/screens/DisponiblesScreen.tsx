// src/modules/users/delivery/screens/DisponiblesScreen.tsx
import React, { useMemo, useState } from "react";
import { StyleSheet, FlatList, View, Text, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { useAuth } from "@/providers/AuthProvider";
import { updateServiceStatus } from "@/services/services";
import { useServices } from "@/providers/ServicesProvider";
import OrderRow from "../components/OrderRow";

export default function DisponiblesScreen() {
  const { session } = useAuth();
  const { services, loading, refetch } = useServices();
  const [refreshing, setRefreshing] = useState(false);

  // 🎯 Filtrar servicios disponibles
  const pedidos = useMemo(
    () => services.filter((s) => s.status === "disponible"),
    [services]
  );

  // 🔄 Pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
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
      ) : pedidos.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="baseball-outline" size={48} color={Colors.normalText} style={styles.emptyStateIcon} />
          <Text style={styles.emptyStateTitle}>No hay servicios disponibles</Text>
          <Text style={styles.emptyStateText}>
            Vuelve más tarde para ver nuevos servicios
          </Text>
        </View>
      ) : (
        <FlatList
          data={pedidos}
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
