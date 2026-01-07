// src/modules/users/delivery/screens/AsignadosScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, FlatList } from "react-native";
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

  // 🔄 función para cargar servicios asignados
  const loadPedidos = useCallback(async () => {
    if (!session) return;
    try {
      const data = await fetchServices(session.access_token);
      const asignados = data.filter((s) => s.status === "asignado");
      setPedidos(asignados);
    } catch (err) {
      console.error("❌ Error cargando servicios asignados:", err);
    }
  }, [session]);

  // cargar al montar
  useEffect(() => {
    loadPedidos();
  }, [loadPedidos]);

  return (
    <View style={styles.container}>
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
});
