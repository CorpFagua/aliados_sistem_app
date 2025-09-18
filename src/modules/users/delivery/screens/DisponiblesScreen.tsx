// src/modules/users/delivery/screens/DisponiblesScreen.tsx
import React, { useEffect, useState } from "react";
import { StyleSheet, FlatList, View } from "react-native";
import { Colors } from "@/constans/colors";
import ServiceCard from "../components/ServiceCard";
import { useAuth } from "@/providers/AuthProvider";
import { fetchServices } from "@/services/services";
import { Service } from "@/models/service";

export default function DisponiblesScreen() {
  const { session } = useAuth();
  const [pedidos, setPedidos] = useState<Service[]>([]);

  useEffect(() => {
    if (!session) return;

    const load = async () => {
      try {
        const data = await fetchServices(session.access_token);
        // ⚡ Filtrar solo los "disponibles"
        const disponibles = data.filter((s) => s.status === "disponible");
        console.log("Servicios disponibles:", disponibles);
        setPedidos(disponibles);
      } catch (err) {
        console.error("❌ Error cargando servicios disponibles:", err);
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
          <ServiceCard
            pedido={item}
            onPress={() => console.log("Card seleccionada:", item.id)}
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
