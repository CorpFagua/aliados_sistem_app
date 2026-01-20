// src/modules/users/delivery/screens/EnRutaScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, FlatList, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { useAuth } from "@/providers/AuthProvider";
import { fetchServices, updateServiceStatus } from "@/services/services";
import { Service } from "@/models/service";
import OrderRow from "../components/OrderRow";
import OrderDetailModal from "../components/ServiceDetailModal";

export default function EnRutaScreen() {
  const { session } = useAuth();
  const [pedidos, setPedidos] = useState<Service[]>([]);
  const [selectedPedido, setSelectedPedido] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔄 función para cargar pedidos (memoizada con useCallback)
  const loadPedidos = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await fetchServices(session.access_token);
      const enRuta = data.filter((s) => s.status === "en_ruta");
      setPedidos(enRuta);
    } catch (err) {
      console.error("❌ Error cargando servicios en ruta:", err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  // cargar al montar
  useEffect(() => {
    loadPedidos();
  }, [loadPedidos]);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.iconActive} />
          <Text style={styles.loadingText}>Cargando servicios...</Text>
        </View>
      ) : pedidos.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="car-outline" size={48} color={Colors.normalText} style={styles.emptyStateIcon} />
          <Text style={styles.emptyStateTitle}>No hay servicios en ruta</Text>
          <Text style={styles.emptyStateText}>
            Una vez asignes una zona, aparecerán aquí
          </Text>
        </View>
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

                // 🔄 recargar lista después de actualizar
                await loadPedidos();

                return true;
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
