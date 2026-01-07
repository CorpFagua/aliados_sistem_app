/**
 * ServiceDetailModal - Modal mejorado con diseño profesional
 * Responsive para móvil y pantallas grandes
 * Estructura clara por secciones con UX mejorado
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
  Dimensions,
  Platform,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Colors } from "../constans/colors";
import { ServiceHistoryDetail } from "../hooks/useServiceHistory";

interface ServiceDetailModalProps {
  visible: boolean;
  service: ServiceHistoryDetail | null;
  loading?: boolean;
  onClose: () => void;
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
      return Colors.success;
    case "en_ruta":
      return Colors.warning;
    case "asignado":
      return "#3B82F6";
    case "disponible":
      return Colors.menuText;
    case "cancelado":
      return Colors.error;
    default:
      return Colors.menuText;
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
    if (score >= 85) return Colors.success;
    if (score >= 70) return "#3B82F6";
    if (score >= 50) return Colors.warning;
    return Colors.error;
  }, [service]);

  // Calcular color del score card border
  const scoreCardBorderColor = useMemo(() => {
    if (!service?.timeAnalysis.performanceScore) return Colors.menuText;
    const score = service.timeAnalysis.performanceScore;
    if (score >= 85) return Colors.success;
    if (score >= 70) return "#3B82F6";
    if (score >= 50) return Colors.warning;
    return Colors.error;
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
          {/* Header Premium */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(service?.status || 'disponible') + '30' }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(service?.status || 'disponible') }]} />
                <Text style={[styles.statusBadgeText, { color: getStatusColor(service?.status || 'disponible') }]}>
                  {service?.status.charAt(0).toUpperCase() + service?.status.slice(1) || "Estado"}
                </Text>
              </View>
            </View>
            <Text style={styles.headerTitle}>Detalle del Servicio</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
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
              {/* ===== SECCIÓN: TIPO Y ESTADO ===== */}
              <View style={styles.quickInfoSection}>
                <View style={styles.quickInfoRow}>
                  <View style={styles.quickInfoItem}>
                    <Text style={styles.quickLabel}>Tipo de Servicio</Text>
                    <Text style={styles.quickValue}>{service.type?.name || "Domicilio"}</Text>
                  </View>
                  <View style={styles.quickInfoDivider} />
                  <View style={styles.quickInfoItem}>
                    <Text style={styles.quickLabel}>Zona</Text>
                    <Text style={styles.quickValue}>{service.zone?.name || "N/A"}</Text>
                  </View>
                </View>
              </View>

              {/* ===== SECCIÓN: SUCURSAL SOLICITANTE ===== */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialIcons name="location-on" size={16} color={Colors.activeMenuText} />
                  <Text style={styles.sectionTitle}>Sucursal Solicitante</Text>
                </View>
                <View style={styles.sectionCard}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Sucursal</Text>
                    <Text style={styles.infoValue} numberOfLines={2}>
                      {service.profileStore?.name || "Sucursal sin nombre"}
                    </Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Franquicia</Text>
                    <Text style={styles.infoValue} numberOfLines={2}>
                      {service.store?.name || "Tienda sin nombre"}
                    </Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tipo de Cuenta</Text>
                    <View style={styles.accountTypeBadge}>
                      <Text style={styles.accountTypeText}>
                        {service.store?.type === "credito" ? "CRÉDITO" : "EFECTIVO"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* ===== SECCIÓN: CLIENTE ===== */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialIcons name="person" size={16} color={Colors.activeMenuText} />
                  <Text style={styles.sectionTitle}>Cliente</Text>
                </View>
                <View style={styles.sectionCard}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Nombre</Text>
                    <Text style={styles.infoValue} numberOfLines={2}>
                      {service.clientName || "Cliente desconocido"}
                    </Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Teléfono</Text>
                    <Text style={styles.infoValue}>{service.clientPhone || "N/A"}</Text>
                  </View>
                </View>
              </View>

              {/* ===== SECCIÓN: DIRECCIONES ===== */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialIcons name="place" size={16} color={Colors.activeMenuText} />
                  <Text style={styles.sectionTitle}>Direcciones</Text>
                </View>
                <View style={styles.sectionCard}>
                  <View style={styles.addressContainer}>
                    <Text style={styles.addressType}>Entrega</Text>
                    <Text style={styles.addressValue}>{service.deliveryAddress || "No disponible"}</Text>
                  </View>
                  {service.pickupAddress && (
                    <>
                      <View style={styles.divider} />
                      <View style={styles.addressContainer}>
                        <Text style={styles.addressType}>Recogida</Text>
                        <Text style={styles.addressValue}>{service.pickupAddress}</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>

              {/* ===== SECCIÓN: DETALLES FINANCIEROS ===== */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialIcons name="attach-money" size={16} color={Colors.activeMenuText} />
                  <Text style={styles.sectionTitle}>Detalles Financieros</Text>
                </View>
                
                {/* Precio del Servicio */}
                <View style={styles.financeCard}>
                  <View style={styles.financeRowTop}>
                    <View style={styles.financeRowContent}>
                      <Text style={styles.financeRowTitle}>Precio del Servicio</Text>
                      <Text style={styles.financeRowDesc}>Costo de la entrega</Text>
                    </View>
                    <Text style={styles.financeRowAmount}>{formatCurrency(service.price || 0)}</Text>
                  </View>

                  <View style={styles.financeDivider} />

                  {/* Ganancia Domiciliario */}
                  <View style={styles.financeRowMiddle}>
                    <View style={styles.financeRowContent}>
                      <Text style={styles.financeRowTitle}>Ganancia Domiciliario</Text>
                      <Text style={styles.financeRowDesc}>Lo que gana por la entrega</Text>
                    </View>
                    <Text style={[styles.financeRowAmount, { color: Colors.success }]}>
                      {formatCurrency(service.priceDelivery || 0)}
                    </Text>
                  </View>

                  <View style={styles.financeDivider} />

                  {/* Método de Pago del Cliente */}
                  <View style={styles.financeRowMiddle}>
                    <View style={styles.financeRowContent}>
                      <Text style={styles.financeRowTitle}>Método de Pago del Cliente</Text>
                      <Text style={styles.financeRowDesc}>Cómo pagó el cliente</Text>
                    </View>
                    <Text style={styles.financeRowAmount}>
                      {service.paymentMethod === "efectivo"
                        ? "Efectivo"
                        : service.paymentMethod === "transferencia"
                        ? "Transferencia"
                        : "Tarjeta"}
                    </Text>
                  </View>

                  <View style={styles.financeDivider} />

                  {/* Pago Recibido por Tienda */}
                  <View style={styles.financeRowBottom}>
                    <View style={styles.financeRowContent}>
                      <Text style={styles.financeRowTitle}>Pago Recibido</Text>
                      <Text style={styles.financeRowDesc}>¿La tienda ya te pagó?</Text>
                    </View>
                    <View style={styles.paymentStatusContainer}>
                      <View style={[styles.paymentStatusBadge, { backgroundColor: service.isPaid ? Colors.success + '20' : Colors.warning + '20' }]}>
                        <View style={[styles.paymentStatusDot, { backgroundColor: service.isPaid ? Colors.success : Colors.warning }]} />
                        <Text style={[styles.paymentStatusText, { color: service.isPaid ? Colors.success : Colors.warning }]}>
                          {service.isPaid ? "Sí" : "No"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Efectivo a Recoger - Solo si aplica */}
                  {service.paymentMethod === "efectivo" && service.totalToCollect > 0 && (
                    <>
                      <View style={styles.financeDivider} />
                      <View style={styles.financeRowHighlight}>
                        <View style={styles.financeRowContent}>
                          <Text style={styles.financeRowTitleHighlight}>Efectivo a Recoger</Text>
                          <Text style={styles.financeRowDescHighlight}>
                            Dinero del cliente a recoger y llevar a tienda
                          </Text>
                        </View>
                        <Text style={styles.financeRowAmountHighlight}>
                          {formatCurrency(service.totalToCollect || 0)}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </View>

              {/* ===== SECCIÓN: DOMICILIARIO ===== */}
              {service.delivery && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <MaterialIcons name="two-wheeler" size={16} color={Colors.activeMenuText} />
                    <Text style={styles.sectionTitle}>Domiciliario</Text>
                  </View>
                  <View style={styles.sectionCard}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Nombre</Text>
                      <Text style={styles.infoValue}>{service.delivery.name || "Domiciliario"}</Text>
                    </View>
                    {service.delivery.phone && (
                      <>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Teléfono</Text>
                          <Text style={styles.infoValue}>{service.delivery.phone}</Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              )}

              {/* ===== SECCIÓN: TIMELINE ===== */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialIcons name="schedule" size={16} color={Colors.activeMenuText} />
                  <Text style={styles.sectionTitle}>Timeline</Text>
                </View>
                <View style={styles.timelineContainer}>
                  {service.timeline.map((event, idx) => (
                    <View key={idx} style={styles.timelineItem}>
                      <View style={styles.timelineLeft}>
                        <View style={[styles.timelineDot, { backgroundColor: getStatusColor(event.status) }]} />
                        {idx !== service.timeline.length - 1 && <View style={styles.timelineLine} />}
                      </View>
                      <View style={styles.timelineRight}>
                        <View style={styles.timelineContentBox}>
                          <Text style={styles.timelineStatus}>
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          </Text>
                          <Text style={styles.timelineDateTime}>
                            {formatDate(event.timestamp)} · {formatTime(event.timestamp)}
                          </Text>
                          {event.actor && (
                            <Text style={styles.timelineActor}>por {event.actor}</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* ===== SECCIÓN: ANÁLISIS DE RENDIMIENTO ===== */}
              {service.timeAnalysis && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <MaterialIcons name="trending-up" size={16} color={Colors.activeMenuText} />
                    <Text style={styles.sectionTitle}>Análisis de Rendimiento</Text>
                  </View>
                  
                  {/* Score Card */}
                  <View style={[styles.performanceCard, { borderLeftColor: scoreCardBorderColor }]}>
                    <Text style={styles.performanceLabel}>Score de Rendimiento</Text>
                    <Text style={[styles.performanceScore, { color: performanceColor }]}>
                      {service.timeAnalysis.performanceScore}/100
                    </Text>
                  </View>

                  {/* Tiempos */}
                  <View style={styles.timingGrid}>
                    {service.timeAnalysis.timeToRoute && (
                      <View style={styles.timingCard}>
                        <Text style={styles.timingLabel}>Tiempo a Ruta</Text>
                        <Text style={styles.timingValue}>{service.timeAnalysis.timeToRoute}m</Text>
                        <Text style={styles.timingComparison}>
                          Promedio: {service.timeAnalysis.averageTimeToRouteInZone}m
                        </Text>
                        <Text style={[styles.timingPercent, { color: service.timeAnalysis.comparisonToZoneAverage.timeToRoutePercent <= 0 ? Colors.success : Colors.error }]}>
                          {service.timeAnalysis.comparisonToZoneAverage.timeToRoutePercent > 0 ? "+" : ""}
                          {service.timeAnalysis.comparisonToZoneAverage.timeToRoutePercent}%
                        </Text>
                      </View>
                    )}

                    {service.timeAnalysis.timeToDelivery && (
                      <View style={styles.timingCard}>
                        <Text style={styles.timingLabel}>Tiempo Entrega</Text>
                        <Text style={styles.timingValue}>{service.timeAnalysis.timeToDelivery}m</Text>
                        <Text style={styles.timingComparison}>
                          Promedio: {service.timeAnalysis.averageTimeToDeliveryInZone}m
                        </Text>
                        <Text style={[styles.timingPercent, { color: service.timeAnalysis.comparisonToZoneAverage.timeToDeliveryPercent <= 0 ? Colors.success : Colors.error }]}>
                          {service.timeAnalysis.comparisonToZoneAverage.timeToDeliveryPercent > 0 ? "+" : ""}
                          {service.timeAnalysis.comparisonToZoneAverage.timeToDeliveryPercent}%
                        </Text>
                      </View>
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
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    flex: 1,
    maxWidth: 600,
    width: "100%",
    backgroundColor: Colors.Background,
    borderRadius: 16,
    marginHorizontal: 12,
    marginVertical: 40,
    overflow: "hidden",
    maxHeight: "90%",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
    backgroundColor: Colors.activeMenuBackground,
  },

  headerLeft: {
    flex: 1,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.normalText,
    textAlign: "center",
  },

  closeButtonContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },

  closeButton: {
    fontSize: 24,
    color: Colors.menuText,
    fontWeight: "600",
  },

  content: {
    flex: 1,
    paddingHorizontal: 14,
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
    color: Colors.error,
  },

  // ===== SECCIONES =====
  section: {
    marginBottom: 10,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 2,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.normalText,
    marginLeft: 8,
  },

  sectionCard: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.Border,
    overflow: "hidden",
  },

  // ===== INFO QUICK (Tipo y Zona) =====
  quickInfoSection: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.Border,
    marginBottom: 10,
  },

  quickInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  quickInfoItem: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  quickLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.menuText,
    marginBottom: 3,
  },

  quickValue: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.normalText,
  },

  quickInfoDivider: {
    width: 1,
    height: 35,
    backgroundColor: Colors.Border,
  },

  // ===== INFO ROWS =====
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.menuText,
  },

  infoValue: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.normalText,
    flex: 1,
    textAlign: "right",
    marginLeft: 10,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.Border,
  },

  // ===== ACCOUNT TYPE BADGE =====
  accountTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    backgroundColor: "#3B82F6" + "20",
  },

  accountTypeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#3B82F6",
  },

  // ===== DIRECCIONES =====
  addressContainer: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  addressType: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.menuText,
    marginBottom: 4,
  },

  addressValue: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.normalText,
    lineHeight: 16,
  },

  // ===== FINANZAS =====
  financeCard: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.Border,
    overflow: "hidden",
  },

  financeRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  financeRowMiddle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  financeRowBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  financeRowHighlight: {
    backgroundColor: "#FFF5F5",
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  financeDivider: {
    height: 1,
    backgroundColor: Colors.Border,
  },

  financeRowContent: {
    flex: 1,
  },

  financeRowTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.normalText,
    marginBottom: 3,
  },

  financeRowTitleHighlight: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.error,
    marginBottom: 3,
  },

  financeRowDesc: {
    fontSize: 10,
    color: Colors.menuText,
    fontStyle: "italic",
  },

  financeRowDescHighlight: {
    fontSize: 10,
    color: Colors.error,
    fontStyle: "italic",
  },

  financeRowAmount: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.activeMenuText,
    textAlign: "right",
    marginLeft: 10,
  },

  financeRowAmountHighlight: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.error,
    textAlign: "right",
    marginLeft: 10,
  },

  // ===== PAYMENT STATUS =====
  paymentStatusContainer: {
    marginTop: 3,
  },

  paymentStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    alignSelf: "flex-start",
  },

  paymentStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },

  paymentStatusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  // ===== TIMELINE =====
  timelineContainer: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.Border,
    padding: 10,
  },

  timelineItem: {
    flexDirection: "row",
    marginBottom: 10,
  },

  timelineLeft: {
    alignItems: "center",
    marginRight: 10,
  },

  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.activeMenuText,
  },

  timelineLine: {
    width: 2,
    height: 35,
    backgroundColor: Colors.Border,
    marginTop: 6,
  },

  timelineRight: {
    flex: 1,
  },

  timelineContentBox: {
    backgroundColor: Colors.Background,
    borderRadius: 4,
    padding: 8,
    borderLeftWidth: 2,
    borderLeftColor: Colors.activeMenuText,
  },

  timelineStatus: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.normalText,
    marginBottom: 1,
  },

  timelineDateTime: {
    fontSize: 9,
    color: Colors.menuText,
    marginBottom: 2,
  },

  timelineActor: {
    fontSize: 9,
    color: Colors.activeMenuText,
    fontStyle: "italic",
  },

  // ===== PERFORMANCE =====
  performanceCard: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.Border,
    borderLeftWidth: 3,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },

  performanceLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.menuText,
    marginBottom: 4,
  },

  performanceScore: {
    fontSize: 20,
    fontWeight: "700",
  },

  timingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  timingCard: {
    flex: 1,
    minWidth: isLargeScreen ? "45%" : "100%",
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.Border,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },

  timingLabel: {
    fontSize: 10,
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

  timingComparison: {
    fontSize: 9,
    color: Colors.menuText,
    marginBottom: 3,
  },

  timingPercent: {
    fontSize: 11,
    fontWeight: "700",
  },
});
