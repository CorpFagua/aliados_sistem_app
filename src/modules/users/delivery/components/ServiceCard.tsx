// src/modules/users/delivery/components/OrderRow.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { Service } from "@/models/service";

function calcularEstadoTiempo(pedido: Service) {
  const now = new Date();
  let minutosTranscurridos = 0;
  let estado: "ok" | "alerta" | "critico" = "ok";
  let label = "";

  // 🚦 Si el pedido está en ruta
  if (pedido.status === "en_ruta") {
    const inicio = pedido.trayectoAt
      ? new Date(pedido.trayectoAt)
      : new Date(pedido.createdAt);

    minutosTranscurridos = Math.floor((now.getTime() - inicio.getTime()) / 60000);

    if (minutosTranscurridos <= 20) estado = "ok";
    else if (minutosTranscurridos <= 30) estado = "alerta";
    else estado = "critico";

    label = `En trayecto · ${minutosTranscurridos} min`;
  } else {
    const creado = new Date(pedido.createdAt);

    // ⚡ `expectedAt` es la hora límite, no un delta.
    const esperado =
      pedido.expectedAt && new Date(pedido.expectedAt).getFullYear() > 1971
        ? new Date(pedido.expectedAt)
        : null;

    minutosTranscurridos = Math.floor(
      (now.getTime() - creado.getTime()) / 60000
    );

    if (esperado) {
      const minutosRestantes = Math.floor(
        (esperado.getTime() - now.getTime()) / 60000
      );

      if (minutosRestantes <= 0) {
        estado = "critico";
        label = `Vencido (+${Math.abs(minutosRestantes)} min)`;
      } else if (minutosRestantes <= 5) {
        estado = "alerta";
        label = `Hace ${minutosTranscurridos} min · Faltan ${minutosRestantes} min`;
      } else {
        estado = "ok";
        label = `Hace ${minutosTranscurridos} min · Faltan ${minutosRestantes} min`;
      }
    } else {
      // ✅ fallback si no hay expected_at válido
      label = `Hace ${minutosTranscurridos} min`;
    }
  }

  return { estado, label };
}



interface Props {
  pedido: Service;
  onPress?: () => void;
}

export default function OrderRow({ pedido, onPress }: Props) {
  const { estado, label } = calcularEstadoTiempo(pedido);

  const tiempoColors = {
    ok: "#00FF75",
    alerta: "#FFD60A",
    critico: "#FF3B30",
  };

  const statusColors = {
    disponible: Colors.gradientStart,
    asignado: Colors.iconActive,
    en_ruta: Colors.activeMenuText,
    entregado: "#4CAF50",
    cancelado: "#FF3B30",
  };

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      {/* Izquierda: Info */}
      <View style={styles.left}>
        {/* ⚡ Si quieres mostrar la tienda deberías añadir "store" en Service */}
        {pedido.storeName && <Text style={styles.store}>{pedido.storeName}</Text>}

        <Text style={styles.destination}>
          <Ionicons name="location-outline" size={14} color={Colors.menuText} />{" "}
          {pedido.destination}
        </Text>

        <View style={styles.detailLine}>
          <Text style={styles.zone}>
            <Ionicons name="map-outline" size={14} color={Colors.menuText} />{" "}
            {pedido.zoneId || "Sin zona"}
          </Text>
          <View style={styles.timeBox}>
            <Ionicons
              name="time-outline"
              size={14}
              color={tiempoColors[estado]}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.timeText, { color: tiempoColors[estado] }]}>
              {label}
            </Text>
          </View>
        </View>
      </View>

      {/* Derecha: Estado */}
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: (statusColors[pedido.status] || Colors.menuText) + "20" },
        ]}
      >
        <Text
          style={[
            styles.statusText,
            { color: statusColors[pedido.status] || Colors.normalText },
          ]}
        >
          {pedido.status}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
    backgroundColor: Colors.activeMenuBackground,
  },
  left: { flex: 1, marginRight: 8 },
  store: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.normalText,
    marginBottom: 2,
  },
  destination: { fontSize: 14, color: Colors.normalText, marginBottom: 4 },
  detailLine: { flexDirection: "row", alignItems: "center", gap: 12 },
  zone: { fontSize: 13, color: Colors.menuText },
  timeBox: { flexDirection: "row", alignItems: "center" },
  timeText: { fontSize: 13, fontWeight: "500" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 13, fontWeight: "600", textTransform: "capitalize" },
});
