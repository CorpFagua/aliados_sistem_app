// src/modules/users/delivery/screens/AsignadosScreen.tsx
import React, { useEffect, useState } from "react";
import { StyleSheet, View, FlatList } from "react-native";
import { Colors } from "@/constans/colors";
import { useAuth } from "@/providers/AuthProvider";
import { fetchServices } from "@/services/services";
import { Service } from "@/models/service";
import ServiceCard from "../components/ServiceCard";
import OrderDetailModal from "../components/ServiceDetailModal";

export default function AsignadosScreen() {
  const { session } = useAuth();
  const [pedidos, setPedidos] = useState<Service[]>([]);
  const [selectedPedido, setSelectedPedido] = useState<Service | null>(null);

  useEffect(() => {
    if (!session) return;

    const load = async () => {
      try {
        const data = await fetchServices(session.access_token);
        // ⚡ Filtrar solo los "asignados"
        const asignados = data.filter((s) => s.status === "asignado");
        setPedidos(asignados);
      } catch (err) {
        console.error("❌ Error cargando servicios asignados:", err);
      }
    };

    load();
  }, [session]);

  return (
    <View style={styles.container}>
      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ServiceCard pedido={item} onPress={() => setSelectedPedido(item)} />
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
