// src/modules/users/delivery/components/TransferNotificationCard.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";

interface TransferNotification {
  id: string;
  service_id: string;
  from_delivery_id: string;
  to_delivery_id: string;
  from_delivery_name: string;
  to_delivery_name: string;
  service_destination: string;
  store_name: string;
  status: "pending" | "accepted" | "rejected";
  type: "request_received" | "request_sent" | "accepted" | "rejected";
  created_at: string;
  viewed: boolean;
}

interface Props {
  notification: TransferNotification;
  currentDeliveryId: string;
  onAccept?: () => void;
  onReject?: () => void;
}

export default function TransferNotificationCard({
  notification,
  currentDeliveryId,
  onAccept,
  onReject,
}: Props) {
  const isReceived = notification.to_delivery_id === currentDeliveryId;
  const isSent = notification.from_delivery_id === currentDeliveryId;
  const isPending = notification.status === "pending";

  // Colores según estado
  const getStatusColor = () => {
    if (notification.status === "pending") return "#FFC107";
    if (notification.status === "accepted") return "#4CAF50";
    return "#FF3B30";
  };

  // Ícono según tipo
  const getIcon = () => {
    if (isReceived) return "arrow-down-circle-outline";
    if (isSent) return "arrow-up-circle-outline";
    return "swap-horizontal-outline";
  };

  // Título según contexto
  const getTitle = () => {
    if (isReceived && isPending) {
      return `${notification.from_delivery_name} te solicita transferencia`;
    }
    if (isSent && isPending) {
      return `Tu solicitud a ${notification.to_delivery_name}`;
    }
    if (notification.status === "accepted") {
      return `✓ Aceptado - Pedido #${notification.service_id.slice(-4)}`;
    }
    if (notification.status === "rejected") {
      return `✗ Rechazado - Pedido #${notification.service_id.slice(-4)}`;
    }
    return "Transferencia de pedido";
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Ionicons
            name={getIcon() as any}
            size={20}
            color={Colors.gradientStart}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.cardTitle}>{getTitle()}</Text>
            <Text style={styles.cardSubtitle}>
              Pedido #{notification.service_id.slice(-4)}
            </Text>
          </View>
        </View>

        {/* Badge de estado */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor() + "30" },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {notification.status === "pending"
              ? "Pendiente"
              : notification.status === "accepted"
              ? "Aceptado"
              : "Rechazado"}
          </Text>
        </View>
      </View>

      {/* Detalles - Tienda y Dirección (con iconos Unicode) */}
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>►</Text>
          <Text style={styles.detailLabel}>Tienda:</Text>
          <Text style={styles.detailValue}>{notification.store_name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>►</Text>
          <Text style={styles.detailLabel}>Dirección:</Text>
          <Text style={styles.detailValue}>{notification.service_destination}</Text>
        </View>
      </View>

      {/* Acciones (solo si es recibida y pendiente) */}
      {isReceived && isPending && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={onReject}
          >
            <Ionicons name="close-circle-outline" size={18} color="#FF3B30" />
            <Text style={styles.rejectText}>Rechazar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={onAccept}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color="#4CAF50"
            />
            <Text style={styles.acceptText}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Timestamp */}
      <Text style={styles.timestamp}>
        {new Date(notification.created_at).toLocaleString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.normalText,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.menuText,
    marginTop: 2,
  },
  details: {
    marginBottom: 12,
    paddingHorizontal: 4,
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailIcon: {
    fontSize: 14,
    color: Colors.gradientStart,
    fontWeight: "600",
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.menuText,
  },
  detailValue: {
    fontSize: 12,
    color: Colors.normalText,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  rejectText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF3B30",
  },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#4CAF50",
  },
  acceptText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  timestamp: {
    fontSize: 11,
    color: Colors.menuText,
  },
});
