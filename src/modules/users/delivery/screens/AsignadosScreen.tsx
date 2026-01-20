// src/modules/users/delivery/screens/AsignadosScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, FlatList, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { useAuth } from "@/providers/AuthProvider";
import { fetchServices, updateServiceStatus } from "@/services/services";
import { Service } from "@/models/service";
import OrderRow from "../components/OrderRow";
import OrderDetailModal from "../components/ServiceDetailModal";
import AssignZoneModal from "../components/AssignZoneModal";

export default function AsignadosScreen() {
  const { session } = useAuth();
  const [pedidos, setPedidos] = useState<Service[]>([]);
  const [selectedPedido, setSelectedPedido] = useState<Service | null>(null);
  const [assigning, setAssigning] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔄 función para cargar servicios asignados
  const loadPedidos = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await fetchServices(session.access_token);
      const asignados = data.filter((s) => s.status === "asignado");
      setPedidos(asignados);
    } catch (err) {
      console.error("❌ Error cargando servicios asignados:", err);
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
          <Ionicons name="checkbox-outline" size={48} color={Colors.normalText} style={styles.emptyStateIcon} />
          <Text style={styles.emptyStateTitle}>No hay servicios asignados</Text>
          <Text style={styles.emptyStateText}>
            Toma un servicio disponible para comenzar
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
              leftLabel="Recogiendo"
              leftColor="#2563EB"
              // 📌 Ahora solo abre el modal
              onLeftAction={() => {
                setAssigning(item);
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* 📌 Modal detalle pedido */}
      <OrderDetailModal
        visible={!!selectedPedido}
        pedido={selectedPedido}
        onClose={() => setSelectedPedido(null)}
        onTransfer={() => {
          console.log("Transferir pedido:", selectedPedido?.id);
        }}
      />

      {/* 📌 Modal asignar zona */}
      <AssignZoneModal
        visible={!!assigning}
        service={assigning}
        token={session?.access_token || ""}
        onClose={() => setAssigning(null)}
        onAssigned={async (updated) => {
          console.log("✅ Zona asignada:", updated);

          // ✅ una vez asignada la zona, cambiamos el estado del pedido
          await updateServiceStatus(
            updated.id,
            "en_ruta",
            session?.access_token || ""
          );

          await loadPedidos();
          setAssigning(null);
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
