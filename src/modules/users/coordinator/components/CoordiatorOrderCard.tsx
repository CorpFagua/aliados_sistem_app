import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constans/colors";
import { Service } from "@/models/service"; // 👈 importa tu modelo tipado

interface Props {
  pedido: Service;
  onPress: () => void;
  showCreatedAt?: boolean;
}

export default function CoordinatorOrderCard({ pedido, onPress, showCreatedAt = false }: Props) {
  const statusColors: Record<string, string> = {
    disponible: Colors.gradientStart,
    asignado: Colors.iconActive,
    en_ruta: Colors.activeMenuText,
    entregado: "#4CAF50",
    cancelado: "#FF3B30",
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ marginBottom: 16 }}>
      <View style={styles.card}>
        {/* ✨ Overlay con brillos */}
        <LinearGradient
          colors={["rgba(0,0,0,0.25)", "transparent", "rgba(255,255,255,0.08)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.highlightOverlay}
        />

        {/* Contenido */}
        <View>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Servicio #{pedido.id}</Text>
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
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.infoText} numberOfLines={2}>
              <Ionicons name="location-outline" size={14} color={Colors.menuText} />{" "}
              {pedido.destination || "Sin dirección"}
            </Text>

            {pedido.phone && (
              <Text style={styles.infoText}>
                <Ionicons name="call-outline" size={14} color={Colors.menuText} /> {pedido.phone}
              </Text>
            )}

            <Text style={styles.priceText}>
              <Ionicons name="cash-outline" size={14} color={Colors.menuText} /> $
              {pedido.amount && pedido.amount > 0
                ? pedido.amount.toLocaleString()
                : "sin monto"}
            </Text>

            {pedido.zoneId && (
              <View style={styles.zoneBadge}>
                <Ionicons name="map-outline" size={12} color={Colors.menuText} />
                <Text style={styles.zoneText}>{pedido.zoneId}</Text>
              </View>
            )}

            {showCreatedAt && (
              <Text style={styles.createdAt}>
                <Ionicons name="time-outline" size={12} color={Colors.menuText} />{" "}
                {pedido.createdAt.toLocaleString()}
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 16,
    padding: 16,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  highlightOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.normalText,
  },
  cardBody: {
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: Colors.normalText,
  },
  priceText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.gradientStart,
    marginTop: 4,
  },
  createdAt: {
    fontSize: 12,
    color: Colors.menuText,
    marginTop: 6,
  },
  zoneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: Colors.Border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 6,
  },
  zoneText: {
    fontSize: 12,
    color: Colors.menuText,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});
