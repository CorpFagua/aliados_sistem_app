// src/modules/users/delivery/screens/EnRutaScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, FlatList } from "react-native";
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

  // 🔄 función para cargar pedidos (memoizada con useCallback)
  const loadPedidos = useCallback(async () => {
    if (!session) return;
    try {
      const data = await fetchServices(session.access_token);
      const enRuta = data.filter((s) => s.status === "en_ruta");
      setPedidos(enRuta);
    } catch (err) {
      console.error("❌ Error cargando servicios en ruta:", err);
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
});
