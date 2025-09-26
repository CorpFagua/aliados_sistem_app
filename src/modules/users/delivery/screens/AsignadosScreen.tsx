// src/modules/users/delivery/screens/AsignadosScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, FlatList } from "react-native";
import { Colors } from "@/constans/colors";
import { useAuth } from "@/providers/AuthProvider";
import { fetchServices, updateServiceStatus } from "@/services/services";
import { Service } from "@/models/service";
import OrderRow from "../components/OrderRow";
import OrderDetailModal from "../components/ServiceDetailModal";

export default function AsignadosScreen() {
  const { session } = useAuth();
  const [pedidos, setPedidos] = useState<Service[]>([]);
  const [selectedPedido, setSelectedPedido] = useState<Service | null>(null);

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
            onLeftAction={async (p) => {
              console.log("✔️ Pedido en ruta:", p.id);
              await updateServiceStatus(p.id, "en_ruta", session.access_token);
              await loadPedidos(); // 🔄 refresca la lista después
              return true;
            }}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <OrderDetailModal
        visible={!!selectedPedido}
        pedido={selectedPedido}
        onClose={() => setSelectedPedido(null)}
        onTransfer={() => {
          console.log("Transferir pedido:", selectedPedido?.id);
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
