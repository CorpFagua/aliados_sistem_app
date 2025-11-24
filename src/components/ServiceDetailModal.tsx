/**
 * ServiceDetailModal - Modal compacto con detalle del servicio
 * Diseño adaptado verticalmente sin emojis
 */

import React, { useMemo } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Colors } from "../constans/colors";
import { ServiceHistoryDetail } from "../hooks/useServiceHistory";

interface ServiceDetailModalProps {
  visible: boolean;
  service: ServiceHistoryDetail | null;
  loading?: boolean;
  onClose: () => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CO", {
      month: "short",
      day: "numeric",
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
      return "#F59E0B";
    case "asignado":
      return "#3B82F6";
    case "disponible":
      return "#9CA3AF";
    case "cancelado":
      return "#EF4444";
    default:
      return "#9CA3AF";
  }
};

export default function ServiceDetailModal({
  visible,
  service,
  loading = false,
  onClose,
}: ServiceDetailModalProps) {
  // Calcular duración total legible
  const formattedDuration = useMemo(() => {
    if (!service?.timeAnalysis.totalTime) return "N/A";

    const minutes = service.timeAnalysis.totalTime;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  }, [service]);

  // Determinar color de performance
  const performanceColor = useMemo(() => {
    if (!service?.timeAnalysis.performanceScore) return Colors.menuText;
    const score = service.timeAnalysis.performanceScore;

    if (score >= 85) return "#10B981"; // Verde - Excelente
    if (score >= 70) return "#3B82F6"; // Azul - Bueno
    if (score >= 50) return "#F59E0B"; // Naranja - Regular
    return "#EF4444"; // Rojo - Pobre
  }, [service]);

  // Calcular color del score card border
  const scoreCardBorderColor = useMemo(() => {
    if (!service?.timeAnalysis.performanceScore) return Colors.menuText;
    const score = service.timeAnalysis.performanceScore;
    if (score >= 85) return "#10B981";
    if (score >= 70) return "#3B82F6";
    if (score >= 50) return "#F59E0B";
    return "#EF4444";
  }, [service?.timeAnalysis.performanceScore]);

  // Retornar null si no es visible, PERO después de definir los hooks
  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Detalle del Servicio</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.activeMenuText} />
              <Text style={styles.loadingText}>Cargando detalles...</Text>
            </View>
          ) : !service ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>No se pudo cargar el servicio</Text>
            </View>
          ) : (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Info compacta en grid */}
              <View style={styles.infoGrid}>
                {/* Tienda */}
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Tienda</Text>
                  <Text style={styles.gridValue}>{service.store?.name || "Tienda sin nombre"}</Text>
                </View>

                {/* Cliente */}
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Cliente</Text>
                  <Text style={styles.gridValue}>{service.clientName || "Cliente desconocido"}</Text>
                </View>

                {/* Teléfono */}
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Teléfono</Text>
                  <Text style={styles.gridValue}>{service.clientPhone || "N/A"}</Text>
                </View>

                {/* Zona */}
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Zona</Text>
                  <Text style={styles.gridValue}>{service.zone?.name || "Zona no asignada"}</Text>
                </View>

                {/* Tipo */}
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Tipo</Text>
                  <Text style={styles.gridValue}>{service.type?.name || "Domicilio"}</Text>
                </View>

                {/* Estado */}
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Estado</Text>
                  <Text style={[styles.gridValue, { color: getStatusColor(service.status) }]}>
                    {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                  </Text>
                </View>
              </View>

              {/* Direcciones */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Direcciones</Text>
                <View style={styles.addressBox}>
                  <Text style={styles.addressLabel}>Entrega:</Text>
                  <Text style={styles.addressText}>{service.deliveryAddress || "No disponible"}</Text>
                </View>
                {service.pickupAddress && (
                  <View style={styles.addressBox}>
                    <Text style={styles.addressLabel}>Recogida:</Text>
                    <Text style={styles.addressText}>{service.pickupAddress}</Text>
                  </View>
                )}
              </View>

              {/* Finanzas */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Finanzas</Text>
                <View style={styles.financesGrid}>
                  <View style={styles.financeItem}>
                    <Text style={styles.financeLabel}>Precio</Text>
                    <Text style={styles.financeValue}>{formatCurrency(service.price || 0)}</Text>
                  </View>
                  <View style={styles.financeItem}>
                    <Text style={styles.financeLabel}>Domiciliario</Text>
                    <Text style={[styles.financeValue, { color: "#10B981" }]}>
                      {formatCurrency(service.priceDelivery || 0)}
                    </Text>
                  </View>
                  <View style={styles.financeItem}>
                    <Text style={styles.financeLabel}>Tienda</Text>
                    <Text style={[styles.financeValue, { color: "#3B82F6" }]}>
                      {formatCurrency(service.storeCharge || 0)}
                    </Text>
                  </View>
                  <View style={styles.financeItem}>
                    <Text style={styles.financeLabel}>Pago</Text>
                    <Text
                      style={[
                        styles.financeValue,
                        { color: service.isPaid ? "#10B981" : "#EF4444" },
                      ]}
                    >
                      {service.isPaid ? "Pagado" : "Pendiente"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Timeline compacto */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Timeline</Text>
                {service.timeline.map((event, idx) => (
                  <View key={idx} style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineHeader}>
                        <Text style={styles.timelineStatus}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </Text>
                        <Text style={styles.timelineTime}>
                          {formatDate(event.timestamp)} {formatTime(event.timestamp)}
                        </Text>
                      </View>
                      {event.actor && (
                        <Text style={styles.timelineActor}>por {event.actor}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {/* Análisis de tiempos */}
              {service.timeAnalysis && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Análisis</Text>

                  {/* Score */}
                  <View
                    style={[
                      styles.scoreCard,
                      {
                        borderLeftColor: scoreCardBorderColor,
                      },
                    ]}
                  >
                    <Text style={styles.scoreLabel}>Score de Rendimiento</Text>
                    <Text style={styles.scoreValue}>
                      {service.timeAnalysis.performanceScore}/100
                    </Text>
                  </View>

                  {/* Tiempos */}
                  <View style={styles.timingsRow}>
                    {service.timeAnalysis.timeToRoute && (
                      <View style={styles.timingBox}>
                        <Text style={styles.timingLabel}>A Ruta</Text>
                        <Text style={styles.timingValue}>
                          {service.timeAnalysis.timeToRoute}m
                        </Text>
                        <Text style={styles.timingAvg}>
                          Prom: {service.timeAnalysis.averageTimeToRouteInZone}m
                        </Text>
                        <Text
                          style={[
                            styles.timingPercent,
                            {
                              color:
                                service.timeAnalysis.comparisonToZoneAverage.timeToRoutePercent <=
                                0
                                  ? "#10B981"
                                  : "#EF4444",
                            },
                          ]}
                        >
                          {service.timeAnalysis.comparisonToZoneAverage.timeToRoutePercent > 0
                            ? "+"
                            : ""}
                          {service.timeAnalysis.comparisonToZoneAverage.timeToRoutePercent}%
                        </Text>
                      </View>
                    )}

                    {service.timeAnalysis.timeToDelivery && (
                      <View style={styles.timingBox}>
                        <Text style={styles.timingLabel}>Entrega</Text>
                        <Text style={styles.timingValue}>
                          {service.timeAnalysis.timeToDelivery}m
                        </Text>
                        <Text style={styles.timingAvg}>
                          Prom: {service.timeAnalysis.averageTimeToDeliveryInZone}m
                        </Text>
                        <Text
                          style={[
                            styles.timingPercent,
                            {
                              color:
                                service.timeAnalysis.comparisonToZoneAverage
                                  .timeToDeliveryPercent <= 0
                                  ? "#10B981"
                                  : "#EF4444",
                            },
                          ]}
                        >
                          {service.timeAnalysis.comparisonToZoneAverage.timeToDeliveryPercent > 0
                            ? "+"
                            : ""}
                          {service.timeAnalysis.comparisonToZoneAverage.timeToDeliveryPercent}%
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Domiciliario */}
              {service.delivery && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Domiciliario</Text>
                  <View style={styles.deliveryBox}>
                    <Text style={styles.deliveryName}>{service.delivery.name || "Domiciliario"}</Text>
                    {service.delivery.phone && (
                      <Text style={styles.deliveryPhone}>{service.delivery.phone}</Text>
                    )}
                  </View>
                </View>
              )}

              <View style={{ height: 20 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },

  modalContent: {
    flex: 1,
    backgroundColor: Colors.Background,
    marginTop: "10%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
    backgroundColor: Colors.activeMenuBackground,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.normalText,
  },

  closeButton: {
    fontSize: 20,
    color: Colors.menuText,
    fontWeight: "600",
  },

  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.menuText,
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  errorText: {
    fontSize: 14,
    color: "#EF4444",
  },

  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },

  gridItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.Border,
  },

  gridLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.menuText,
    marginBottom: 2,
  },

  gridValue: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.normalText,
  },

  section: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.normalText,
    marginBottom: 10,
  },

  addressBox: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.activeMenuText,
    marginBottom: 8,
  },

  addressLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.menuText,
    marginBottom: 4,
  },

  addressText: {
    fontSize: 12,
    color: Colors.normalText,
    lineHeight: 16,
  },

  financesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  financeItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 8,
    padding: 10,
  },

  financeLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.menuText,
    marginBottom: 4,
  },

  financeValue: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.activeMenuText,
  },

  timelineItem: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "flex-start",
  },

  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.activeMenuText,
    marginRight: 10,
    marginTop: 6,
  },

  timelineContent: {
    flex: 1,
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 8,
    padding: 10,
  },

  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },

  timelineStatus: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.normalText,
  },

  timelineTime: {
    fontSize: 10,
    color: Colors.menuText,
  },

  timelineActor: {
    fontSize: 10,
    color: Colors.menuText,
    fontStyle: "italic",
    marginTop: 2,
  },

  scoreCard: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.activeMenuText,
    marginBottom: 10,
  },

  scoreLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.menuText,
    marginBottom: 6,
  },

  scoreValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.activeMenuText,
  },

  timingsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  timingBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 8,
    padding: 10,
  },

  timingLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.menuText,
    marginBottom: 4,
  },

  timingValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.activeMenuText,
    marginBottom: 4,
  },

  timingAvg: {
    fontSize: 9,
    color: Colors.menuText,
    marginBottom: 4,
  },

  timingPercent: {
    fontSize: 11,
    fontWeight: "700",
  },

  deliveryBox: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 8,
    padding: 12,
  },

  deliveryName: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.normalText,
    marginBottom: 4,
  },

  deliveryPhone: {
    fontSize: 12,
    color: Colors.menuText,
  },
});
