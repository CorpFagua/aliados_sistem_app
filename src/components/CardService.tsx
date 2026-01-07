/**
 * CardService - Tarjeta minimalista para historial
 * Muestra: Tienda, ID, Estado, Fecha, Domiciliario, Tipo y Pago
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { Colors } from "../constans/colors";
import { ServiceHistorySummary } from "../hooks/useServiceHistory";

interface CardServiceProps {
  service: ServiceHistorySummary;
  onPress: () => void;
}

const { width: screenWidth } = Dimensions.get("window");
const isLargeScreen = screenWidth > 600;

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("es-CO", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case "entregado":
      return "#10B981";
    case "en_ruta":
      return "#3B82F6";
    case "asignado":
      return "#F59E0B";
    case "disponible":
      return "#6B7280";
    case "cancelado":
      return "#EF4444";
    default:
      return Colors.menuText;
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case "entregado":
      return "Entregado";
    case "en_ruta":
      return "En Ruta";
    case "asignado":
      return "Asignado";
    case "disponible":
      return "Disponible";
    case "cancelado":
      return "Cancelado";
    default:
      return status;
  }
};

export default function CardService({ service, onPress }: CardServiceProps) {
  const typeName = service.type?.name || "Domicilio";
  const profileStoreName = service.profileStore?.name || "Sucursal";
  const deliveryName = service.delivery?.name || "Sin asignar";

  return (
    <View style={styles.cardWrapper}>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
        {/* Header Minimalista */}
        <View style={styles.topRow}>
          <View style={styles.titleSection}>
            <Text style={styles.storeName}>{profileStoreName}</Text>
            <Text style={styles.serviceId}>#{service.id.slice(-6)}</Text>
          </View>

          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(service.status) },
              ]}
            />
            <Text style={styles.statusLabel}>{getStatusLabel(service.status)}</Text>
          </View>
        </View>

        {/* Info Esencial */}
        <View style={styles.essentialInfo}>
          <Text style={styles.dateText}>{formatDate(service.createdAt)}</Text>
          <Text style={styles.deliveryText}>Por: {deliveryName}</Text>
        </View>

        {/* Badges Footer */}
        <View style={styles.badgesRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{typeName}</Text>
          </View>

          {service.isPaid ? (
            <View style={[styles.paidBadge, { backgroundColor: "#D1FAE5" }]}>
              <Text style={[styles.paidBadgeText, { color: "#065F46" }]}>Pagada</Text>
            </View>
          ) : (
            <View style={[styles.paidBadge, { backgroundColor: "#FEE2E2" }]}>
              <Text style={[styles.paidBadgeText, { color: "#991B1B" }]}>Pendiente</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    alignItems: "center",
    width: "100%",
    paddingHorizontal: isLargeScreen ? 12 : 0,
  },

  card: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.activeMenuText,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
    width: isLargeScreen ? Math.min(screenWidth - 24, 550) : "100%",
    maxWidth: isLargeScreen ? 550 : "100%",
  },

  // Top Row - Nombre + ID | Estado
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  titleSection: {
    flex: 1,
  },

  storeName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.normalText,
    marginBottom: 2,
  },

  serviceId: {
    fontSize: 11,
    color: Colors.menuText,
    fontWeight: "500",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.Background,
    borderRadius: 6,
    marginLeft: 8,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },

  statusLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.normalText,
  },

  // Essential Info - Fecha y Domiciliario
  essentialInfo: {
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },

  dateText: {
    fontSize: 11,
    color: Colors.menuText,
    marginBottom: 4,
    fontStyle: "italic",
  },

  deliveryText: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.normalText,
  },

  // Badges Footer
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    width: "100%",
  },

  typeBadge: {
    backgroundColor: Colors.activeMenuText,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },

  typeBadgeText: {
    fontSize: 9,
    fontWeight: "600",
    color: Colors.Background,
  },

  paidBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },

  paidBadgeText: {
    fontSize: 9,
    fontWeight: "600",
  },

  deliveryBadge: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },

  deliveryBadgeText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#3730A3",
  },
});
