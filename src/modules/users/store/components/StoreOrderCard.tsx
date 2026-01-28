import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constans/colors";
import { Service } from "@/models/service";
import { useUnreadMessagesContextOptional } from "@/providers/UnreadMessagesProvider";

const { width: screenWidth } = Dimensions.get("window");
const isLargeScreen = screenWidth > 600;

interface Props {
  pedido: Service;
  onPress: () => void;
  showCreatedAt?: boolean;
}

export default function StoreOrderCard({ pedido, onPress, showCreatedAt = false }: Props) {
  // 📬 Obtener contador de mensajes no leídos
  const unreadContext = useUnreadMessagesContextOptional();
  const unreadCount = unreadContext?.getUnreadCount(pedido.id) || 0;

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
            <View style={styles.titleRow}>
              <Text style={styles.cardTitle}>#{pedido.id.slice(-4)}</Text>
              {/* Badge de mensajes no leídos */}
              {unreadCount > 0 && (
                <LinearGradient
                  colors={["#00D9FF", "#00B8A9"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.unreadBadge}
                >
                  <Ionicons name="chatbubble" size={10} color="#FFFFFF" />
                  <Text style={styles.unreadText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </LinearGradient>
              )}
            </View>
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
                <Text style={styles.zoneText}>{pedido.zoneName || pedido.zoneId}</Text>
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
    borderRadius: isLargeScreen ? 12 : 14,
    padding: isLargeScreen ? 12 : 14,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    maxWidth: isLargeScreen ? 500 : "100%",
    alignSelf: "center",
    width: "100%",
  },
  highlightOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: isLargeScreen ? 12 : 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
    gap: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  cardTitle: {
    fontSize: isLargeScreen ? 14 : 15,
    fontWeight: "700",
    color: Colors.normalText,
    letterSpacing: 0.5,
  },
  unreadBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 3,
    minWidth: 20,
  },
  unreadText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cardBody: {
    gap: 5,
  },
  infoText: {
    fontSize: isLargeScreen ? 12 : 13,
    color: Colors.normalText,
    flexWrap: "wrap",
  },
  priceText: {
    fontSize: isLargeScreen ? 13 : 14,
    fontWeight: "600",
    color: Colors.gradientStart,
    marginTop: 2,
  },
  createdAt: {
    fontSize: 11,
    color: Colors.menuText,
    marginTop: 4,
  },
  zoneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: Colors.Border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  zoneText: {
    fontSize: 11,
    color: Colors.menuText,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: isLargeScreen ? 8 : 10,
    paddingVertical: isLargeScreen ? 3 : 4,
    borderRadius: 8,
    flexShrink: 0,
  },
  statusText: {
    fontSize: isLargeScreen ? 11 : 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});
