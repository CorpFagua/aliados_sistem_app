// src/modules/users/delivery/screens/EnRutaScreen.tsx
import React, { useMemo, useState } from "react";
import { StyleSheet, View, FlatList, Text, ActivityIndicator, RefreshControl, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { useAuth } from "@/providers/AuthProvider";
import { updateServiceStatus } from "@/services/services";
import { useServices } from "@/providers/ServicesProvider";
import { useUnreadMessagesContext } from "@/providers/UnreadMessagesProvider";
import OrderRow from "../components/OrderRow";
import OrderDetailModal from "../components/ServiceDetailModal";

export default function EnRutaScreen() {
  const { session } = useAuth();
  const { services, loading, refetch } = useServices();
  const { registerServices } = useUnreadMessagesContext();
  const [selectedPedido, setSelectedPedido] = useState<Service | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Registrar servicios en ruta para tracking de mensajes
  React.useEffect(() => {
    const enRutaIds = services
      .filter((s) => s.status === "en_ruta")
      .map((s) => s.id);
    registerServices(enRutaIds);
  }, [services, registerServices]);

  // 🎯 Filtrar servicios en ruta
  const pedidos = useMemo(
    () => services.filter((s) => s.status === "en_ruta"),
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
        <ScrollView
          contentContainerStyle={styles.emptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.activeMenuText, Colors.gradientEnd]}
              progressBackgroundColor={Colors.activeMenuBackground}
            />
          }
        >
          <Ionicons name="car-outline" size={48} color={Colors.normalText} style={styles.emptyStateIcon} />
          <Text style={styles.emptyStateTitle}>No hay servicios en ruta</Text>
          <Text style={styles.emptyStateText}>
            Una vez asignes una zona, aparecerán aquí
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderRow
              pedido={item}
              onPress={() => setSelectedPedido(item)}
              leftEnabled
              leftLabel="Entregado"
              leftColor={Colors.success}
              onLeftAction={async (p) => {
                console.log("✔️ Pedido entregado:", p.id);
                await updateServiceStatus(p.id, "entregado", session.access_token);
                return true;
              }}
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

      <OrderDetailModal
        visible={!!selectedPedido}
        pedido={selectedPedido}
        onClose={() => setSelectedPedido(null)}
        onTransfer={() => {
          console.log("Transferir pedido en ruta:", selectedPedido?.id);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  listContent: {
    paddingBottom: 80,
  },
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
