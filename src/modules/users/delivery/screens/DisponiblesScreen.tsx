// src/modules/users/delivery/screens/DisponiblesScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, FlatList, View } from "react-native";
import { Colors } from "@/constans/colors";
import { useAuth } from "@/providers/AuthProvider";
import { fetchServices, updateServiceStatus } from "@/services/services";
import { Service } from "@/models/service";
import OrderRow from "../components/OrderRow";

export default function DisponiblesScreen() {
  const { session } = useAuth();
  const [pedidos, setPedidos] = useState<Service[]>([]);

  // 🔄 función de carga reutilizable
  const loadPedidos = useCallback(async () => {
    if (!session) return;
    try {
      const data = await fetchServices(session.access_token);
      const disponibles = data.filter((s) => s.status === "disponible");
      console.log("Servicios disponibles:", disponibles);
      setPedidos(disponibles);
    } catch (err) {
      console.error("❌ Error cargando servicios disponibles:", err);
    }
  }, [session]);

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
            onPress={() => console.log("Ver detalles", item.id)}
            leftEnabled
            leftLabel="Tomar"
            leftColor="#2563EB"
            onLeftAction={async (p) => {
              console.log("✔️ Pedido asignado:", p.id);
              await updateServiceStatus(
                p.id,
                "asignado",
                session.access_token,
                session.user.id
              );
              await loadPedidos(); // 🔄 refresca después de asignar
              return true;
            }}
            rightEnabled
            rightLabel="Cancelar"
            rightColor="#FF3B30"
            onRightAction={async (p) => {
              console.log("❌ Pedido cancelado:", p.id);
              await updateServiceStatus(
                p.id,
                "cancelado",
                session.access_token
              );
              await loadPedidos(); // 🔄 refresca después de cancelar
              return true;
            }}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.Background },
  listContent: { paddingBottom: 80 },
});
