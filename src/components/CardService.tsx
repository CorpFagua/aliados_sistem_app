/**
 * CardService - Card para mostrar resumen de un servicio en el historial
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "../constans/colors";
import { ServiceHistorySummary } from "../hooks/useServiceHistory";

interface CardServiceProps {
  service: ServiceHistorySummary;
  onPress: () => void;
}

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
  // Guard clauses para datos nulos
  const storeName = service.store?.name || "Tienda sin nombre";
  const zoneName = service.zone?.name || "Zona no asignada";
  const deliveryName = service.delivery?.name || "Domiciliario";
  const typeName = service.type?.name || "Domicilio";

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Header con tienda y estado */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.storeName}>{storeName}</Text>
          <Text style={styles.serviceId}>ID: {service.id.slice(-8)}</Text>
          <Text style={styles.date}>{formatDate(service.createdAt)}</Text>
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

      {/* Información del cliente y dirección */}
      <View style={styles.clientInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>👤 Cliente:</Text>
          <Text style={styles.value}>{service.clientName || "Cliente desconocido"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>📍 Entrega:</Text>
          <Text style={[styles.value, styles.address]} numberOfLines={1}>
            {service.deliveryAddress || "Dirección no disponible"}
          </Text>
        </View>
        {service.zone && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>🗺️ Zona:</Text>
            <Text style={styles.value}>{zoneName}</Text>
          </View>
        )}
      </View>

      {/* Información de precios y pago */}
      <View style={styles.priceSection}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Precio Servicio:</Text>
          <Text style={styles.priceValue}>{formatCurrency(service.price || 0)}</Text>
        </View>

        {service.delivery && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Ganancia Domiciliario:</Text>
            <Text style={[styles.priceValue, { color: "#10B981" }]}>
              {formatCurrency(service.priceDelivery || 0)}
            </Text>
          </View>
        )}

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Cobrado a Tienda:</Text>
          <Text style={[styles.priceValue, { color: "#3B82F6" }]}>
            {formatCurrency(service.storeCharge || 0)}
          </Text>
        </View>
      </View>

      {/* Footer con tipo de servicio y pago */}
      <View style={styles.footer}>
        <View style={styles.badgesRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{typeName}</Text>
          </View>

          {service.isPaid ? (
            <View style={[styles.paidBadge, { backgroundColor: "#D1FAE5" }]}>
              <Text style={[styles.paidBadgeText, { color: "#065F46" }]}>✓ Pagado</Text>
            </View>
          ) : (
            <View style={[styles.paidBadge, { backgroundColor: "#FEE2E2" }]}>
              <Text style={[styles.paidBadgeText, { color: "#991B1B" }]}>⏳ Pendiente</Text>
            </View>
          )}

          {service.delivery && (
            <View style={styles.deliveryBadge}>
              <Text style={styles.deliveryBadgeText}>{deliveryName}</Text>
            </View>
          )}
        </View>

        <Text style={styles.tapHint}>Toca para ver detalles</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.activeMenuText,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },

  headerLeft: {
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
    marginBottom: 2,
  },

  date: {
    fontSize: 10,
    color: Colors.menuText,
    fontStyle: "italic",
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
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },

  statusLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.normalText,
  },

  // Cliente info
  clientInfo: {
    marginBottom: 12,
    paddingHorizontal: 0,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  label: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.menuText,
    width: 90,
  },

  value: {
    fontSize: 12,
    color: Colors.normalText,
    fontWeight: "500",
    flex: 1,
  },

  address: {
    flex: 1,
  },

  // Precios
  priceSection: {
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: Colors.Background,
    borderRadius: 8,
  },

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  priceRow_last: {
    marginBottom: 0,
  },

  priceLabel: {
    fontSize: 11,
    color: Colors.menuText,
    fontWeight: "500",
  },

  priceValue: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.activeMenuText,
  },

  // Footer
  footer: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
  },

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
    borderRadius: 6,
  },

  typeBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.Background,
  },

  paidBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  paidBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },

  deliveryBadge: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  deliveryBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#3730A3",
  },

  tapHint: {
    fontSize: 9,
    color: Colors.menuText,
    fontStyle: "italic",
    alignSelf: "center",
    marginTop: 2,
  },
});
