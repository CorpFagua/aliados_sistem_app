import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  RefreshControl,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../../providers/AuthProvider";
import { fetchDeliveryServices } from "../../../../services/services";
import { usePayments } from "../../../../hooks/usePayments";
import { Colors } from "../../../../constans/colors";

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
};

type TabType = "delivered" | "invoices";

export default function DeliveryHistoryScreen() {
  const { session, profile } = useAuth();
  const { getDeliveryPaymentSnapshots } = usePayments(session?.access_token || null);

  const [activeTab, setActiveTab] = useState<TabType>("delivered");
  const [unpaidOrders, setUnpaidOrders] = useState<any[]>([]);
  const [paymentSnapshots, setPaymentSnapshots] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (session?.access_token) {
      console.log("👤 [HistoryScreen] User profile:", {
        id: profile?.id,
        email: profile?.email,
        role: profile?.role,
      });
      loadData();
    }
  }, [session?.access_token]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadUnpaidOrders(), loadPaymentSnapshots()]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const loadUnpaidOrders = async () => {
    if (!session?.access_token) {
      setError("No hay sesión activa");
      return;
    }

    try {
      console.log("📦 [HistoryScreen] Cargando servicios sin pagar...");
      const services = await fetchDeliveryServices(session.access_token);
      console.log(`✅ Servicios obtenidos: ${services.length}`);

      const unpaid = services.filter((service: any) => {
        const isDelivered =
          service.status === "entregado" ||
          service.status === "pago" ||
          service.completedAt;
        const isUnpaid = !service.isPaid;
        return isDelivered && isUnpaid;
      });

      console.log(`✅ Servicios entregados sin pagar: ${unpaid.length}`);
      setUnpaidOrders(unpaid);
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Error al cargar pedidos";
      console.error("❌ Error en loadUnpaidOrders:", err);
      setError(message);
      setUnpaidOrders([]);
    }
  };

  const loadPaymentSnapshots = async () => {
    if (!session?.access_token || !profile?.id) return;

    try {
      console.log("📄 [HistoryScreen] Cargando facturas (snapshots)...");
      const data = await getDeliveryPaymentSnapshots(profile.id);
      const arr = Array.isArray(data) ? data : [];
      console.log(`✅ Facturas obtenidas: ${arr.length}`);
      if (arr.length > 0) {
        console.log("📋 Primera factura:", JSON.stringify(arr[0], null, 2));
      }
      setPaymentSnapshots(arr);
    } catch (err) {
      console.warn("⚠️ No se pudieron cargar facturas", err);
      setPaymentSnapshots([]);
    }
  };

  const renderDeliveredOrderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setSelectedOrder(item);
        setShowDetailModal(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderNumber}>Pedido {item.id || "N/A"}</Text>
          <Text style={styles.orderDate}>
            {item.completedAt
              ? new Date(item.completedAt).toLocaleDateString("es-CO")
              : item.createdAt
              ? new Date(item.createdAt).toLocaleDateString("es-CO")
              : "Pendiente"}
          </Text>
        </View>
        <View style={styles.amountColumn}>
          <Text style={styles.amountLabel}>Tu Ganancia</Text>
          <Text style={styles.amountValue}>
            {formatCurrency(
              parseFloat(item.priceDeliverySrv || item.price_delivery_srv || 0)
            )}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tienda:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {item.storeName || "N/A"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Dirección:</Text>
          <Text style={styles.infoValue} numberOfLines={2}>
            {item.destination || "N/A"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Estado:</Text>
          <Text style={[styles.infoValue, { color: Colors.warning }]}>
            Sin Pagar
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderInvoiceItem = ({ item }: { item: any }) => {
    console.log("🎨 [renderInvoiceItem]", item);
    return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setSelectedOrder(item);
        setShowDetailModal(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderNumber}>Factura {item.id?.slice(-8) || "N/A"}</Text>
          <Text style={styles.orderDate}>
            {item.created_at
              ? new Date(item.created_at).toLocaleDateString("es-CO")
              : "N/A"}
          </Text>
        </View>
        <View style={styles.amountColumn}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === "paid"
                    ? Colors.success
                    : item.status === "approved"
                    ? Colors.activeMenuText
                    : item.status === "cancelled"
                    ? "#ef4444"
                    : Colors.warning,
              },
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {item.status === "paid"
                ? "Pagada"
                : item.status === "approved"
                ? "Aprobada"
                : item.status === "cancelled"
                ? "Cancelada"
                : "Pendiente"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Período:</Text>
          <Text style={styles.infoValue}>
            {item.period_start && item.period_end
              ? `${new Date(item.period_start).toLocaleDateString("es-CO")} - ${new Date(item.period_end).toLocaleDateString("es-CO")}`
              : item.period || "N/A"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Servicios:</Text>
          <Text style={styles.infoValue}>
            {item.services_count || item.services?.length || 0}
          </Text>
        </View>
      </View>

      <View style={styles.invoiceTotalContainer}>
        <Text style={styles.invoiceTotalLabel}>Total:</Text>
        <Text style={styles.invoiceTotalAmount}>
          {formatCurrency(item.total_amount || item.total_earned || 0)}
        </Text>
      </View>
    </TouchableOpacity>
    );
  };

  if (loading && unpaidOrders.length === 0 && paymentSnapshots.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.activeMenuText} />
        <Text style={styles.loadingText}>Cargando historial...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {error ? (
        <View
          style={{
            backgroundColor: "#fee2e2",
            padding: 12,
            marginBottom: 10,
            marginHorizontal: 12,
            borderRadius: 8,
            borderLeftWidth: 4,
            borderLeftColor: "#dc2626",
          }}
        >
          <Text
            style={{
              color: "#7f1d1d",
              fontWeight: "700",
              marginBottom: 4,
              fontSize: 13,
            }}
          >
            Error al cargar
          </Text>
          <Text style={{ color: "#991b1b", fontSize: 12, marginBottom: 8 }}>
            {String(error)}
          </Text>
          <TouchableOpacity style={{ paddingVertical: 6 }} onPress={loadData}>
            <Text
              style={{
                color: Colors.activeMenuText,
                fontWeight: "600",
                fontSize: 12,
              }}
            >
              Reintentar
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historial</Text>
        <Text style={styles.headerSubtitle}>
          {activeTab === "delivered" ? unpaidOrders.length : paymentSnapshots.length}{" "}
          registro{activeTab === "delivered" ? "s" : "s"}
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "delivered" && styles.activeTab]}
          onPress={() => setActiveTab("delivered")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "delivered" && styles.activeTabText,
            ]}
          >
            Pedidos Entregados
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "invoices" && styles.activeTab]}
          onPress={() => setActiveTab("invoices")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "invoices" && styles.activeTabText,
            ]}
          >
            Mis Facturas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === "delivered" ? (
        unpaidOrders.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.emptyContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={loadData} />
            }
          >
            <View style={styles.emptyState}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: "#e8f5e9",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 16,
                  borderWidth: 2,
                  borderColor: "#4caf50",
                }}
              >
                <Text style={{ fontSize: 44, fontWeight: "300", color: "#4caf50" }}>
                  ✓
                </Text>
              </View>
              <Text style={styles.emptyStateTitle}>Todo pagado</Text>
              <Text style={styles.emptyStateText}>
                No tienes entregas pendientes de pago en este momento.
              </Text>
            </View>
          </ScrollView>
        ) : (
          <FlatList
            data={unpaidOrders}
            keyExtractor={(item) =>
              item.id ? String(item.id) : Math.random().toString()
            }
            renderItem={renderDeliveredOrderItem}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={loadData} />
            }
          />
        )
      ) : paymentSnapshots.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadData} />
          }
        >
          <View style={styles.emptyState}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "rgba(100, 200, 255, 0.1)",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 16,
                borderWidth: 2,
                borderColor: Colors.activeMenuText,
              }}
            >
              <Text style={{ fontSize: 44, fontWeight: "300", color: Colors.activeMenuText }}>
                📄
              </Text>
            </View>
            <Text style={styles.emptyStateTitle}>Sin facturas</Text>
            <Text style={styles.emptyStateText}>
              No tienes facturas generadas aún.
            </Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={paymentSnapshots}
          keyExtractor={(item) =>
            item.id ? String(item.id) : Math.random().toString()
          }
          renderItem={renderInvoiceItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadData} />
          }
        />
      )}

      {/* Modal de detalles */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeTab === "delivered" ? "Detalles del Pedido" : "Detalles de la Factura"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowDetailModal(false)}
                style={{ padding: 8 }}
              >
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView
                style={styles.modalBody}
                contentContainerStyle={{ paddingBottom: 24 }}
              >
                {activeTab === "delivered" ? (
                  <>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>ID Pedido</Text>
                      <Text style={styles.detailValue}>{selectedOrder.id || "N/A"}</Text>
                    </View>

                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Tu Ganancia</Text>
                      <Text
                        style={[
                          styles.detailValue,
                          {
                            color: Colors.activeMenuText,
                            fontSize: 20,
                            fontWeight: "700",
                          },
                        ]}
                      >
                        {formatCurrency(
                          parseFloat(selectedOrder.priceDeliverySrv || selectedOrder.price_delivery_srv || 0)
                        )}
                      </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Información de Entrega</Text>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Tienda</Text>
                        <Text style={styles.detailValue}>
                          {selectedOrder.storeName || "N/A"}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Dirección</Text>
                        <Text style={styles.detailValue}>
                          {selectedOrder.destination || "N/A"}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Cliente</Text>
                        <Text style={styles.detailValue}>
                          {selectedOrder.clientName || "N/A"}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Teléfono</Text>
                        <Text style={styles.detailValue}>
                          {selectedOrder.phone || "N/A"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Detalles</Text>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Fecha Entrega</Text>
                        <Text style={styles.detailValue}>
                          {selectedOrder.completedAt
                            ? new Date(selectedOrder.completedAt).toLocaleString("es-CO")
                            : "N/A"}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Método de Pago</Text>
                        <Text style={styles.detailValue}>
                          {selectedOrder.payment || "N/A"}
                        </Text>
                      </View>
                      {selectedOrder.notes && (
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Notas</Text>
                          <Text style={styles.detailValue}>{selectedOrder.notes}</Text>
                        </View>
                      )}
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>ID Factura</Text>
                      <Text style={styles.detailValue}>
                        {selectedOrder.id?.slice(-12) || "N/A"}
                      </Text>
                    </View>

                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Estado</Text>
                      <View
                        style={[
                          styles.statusBadgeLarge,
                          {
                            backgroundColor:
                              selectedOrder.status === "paid"
                                ? Colors.success
                                : selectedOrder.status === "approved"
                                ? Colors.activeMenuText
                                : selectedOrder.status === "cancelled"
                                ? "#ef4444"
                                : Colors.warning,
                          },
                        ]}
                      >
                        <Text style={styles.statusBadgeTextLarge}>
                          {selectedOrder.status === "paid"
                            ? "Pagada"
                            : selectedOrder.status === "approved"
                            ? "Aprobada"
                            : selectedOrder.status === "cancelled"
                            ? "Cancelada"
                            : "Pendiente"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Total</Text>
                      <Text
                        style={[
                          styles.detailValue,
                          {
                            color: Colors.activeMenuText,
                            fontSize: 20,
                            fontWeight: "700",
                          },
                        ]}
                      >
                        {formatCurrency(selectedOrder.total_amount || selectedOrder.total_earned || 0)}
                      </Text>
                    </View>

                    {selectedOrder.status === "cancelled" && selectedOrder.notes && (
                      <View style={[styles.detailSection, { backgroundColor: "#fee2e2", borderRadius: 8, padding: 12, borderBottomWidth: 0, marginBottom: 16 }]}>
                        <Text style={[styles.detailLabel, { color: "#991b1b" }]}>Motivo de Cancelación</Text>
                        <Text style={[styles.detailValue, { color: "#7f1d1d", marginTop: 8 }]}>
                          {selectedOrder.notes}
                        </Text>
                      </View>
                    )}

                    {selectedOrder.notes && selectedOrder.status !== "cancelled" && (
                      <View style={[styles.detailSection, { backgroundColor: "rgba(100, 200, 255, 0.1)", borderRadius: 8, padding: 12, borderBottomWidth: 0, marginBottom: 16 }]}>
                        <Text style={[styles.detailLabel, { color: Colors.activeMenuText }]}>Notas</Text>
                        <Text style={[styles.detailValue, { color: Colors.activeMenuText, marginTop: 8 }]}>
                          {selectedOrder.notes}
                        </Text>
                      </View>
                    )}

                    <View style={styles.divider} />

                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Información</Text>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Período</Text>
                        <Text style={styles.detailValue}>
                          {selectedOrder.period_start && selectedOrder.period_end
                            ? `${new Date(selectedOrder.period_start).toLocaleDateString("es-CO")} - ${new Date(selectedOrder.period_end).toLocaleDateString("es-CO")}`
                            : selectedOrder.period || "N/A"}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Servicios Incluidos</Text>
                        <Text style={styles.detailValue}>
                          {selectedOrder.services_count || selectedOrder.services?.length || selectedOrder.services_ids?.length || 0}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Fecha de Creación</Text>
                        <Text style={styles.detailValue}>
                          {selectedOrder.created_at
                            ? new Date(selectedOrder.created_at).toLocaleString("es-CO")
                            : "N/A"}
                        </Text>
                      </View>
                      {selectedOrder.approved_at && (
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Aprobada</Text>
                          <Text style={styles.detailValue}>
                            {new Date(selectedOrder.approved_at).toLocaleString("es-CO")}
                          </Text>
                        </View>
                      )}
                      {selectedOrder.paid_at && (
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Pagada</Text>
                          <Text style={styles.detailValue}>
                            {new Date(selectedOrder.paid_at).toLocaleString("es-CO")}
                          </Text>
                        </View>
                      )}
                    </View>
                  </>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowDetailModal(false)}
            >
              <Text style={styles.closeModalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.normalText,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.menuText,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: Colors.activeMenuBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.menuText + "15",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: Colors.activeMenuText,
  },
  tabText: {
    fontSize: 13,
    color: Colors.menuText,
    fontWeight: "600",
    textAlign: "center",
  },
  activeTabText: {
    color: Colors.activeMenuText,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: Colors.menuText,
    fontSize: 14,
  },
  emptyContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 60,
  },
  emptyState: {
    alignItems: "center",
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.normalText,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.menuText,
    textAlign: "center",
    maxWidth: 300,
  },
  listContainer: {
    paddingHorizontal: 4,
    paddingTop: 10,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: Colors.activeMenuBackground,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.activeMenuText,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardBody: {
    marginVertical: 8,
  },
  amountColumn: {
    alignItems: "flex-end",
  },
  amountLabel: {
    fontSize: 11,
    color: "#B0B0B0",
    fontWeight: "500",
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.activeMenuText,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  orderDate: {
    fontSize: 12,
    color: "#A0A0A0",
    marginTop: 4,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "flex-start",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B0B0B0",
    marginRight: 12,
    minWidth: 70,
  },
  infoValue: {
    fontSize: 13,
    color: "#E8E8E8",
    fontWeight: "500",
    flex: 1,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  statusBadgeLarge: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  statusBadgeTextLarge: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  invoiceTotalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#3A3A3C",
  },
  invoiceTotalLabel: {
    fontSize: 12,
    color: "#A0A0A0",
    fontWeight: "600",
  },
  invoiceTotalAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.activeMenuText,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.Background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.normalText,
  },
  closeButton: {
    fontSize: 28,
    color: Colors.menuText,
    fontWeight: "300",
    lineHeight: 28,
  },
  modalBody: {
    marginBottom: 20,
  },
  detailSection: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#3A3A3C",
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.menuText,
    fontWeight: "600",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.normalText,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.Border,
    marginVertical: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.normalText,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: Colors.activeMenuText,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#3A3A3C",
    alignItems: "center",
  },
  closeModalButton: {
    marginHorizontal: 0,
    marginBottom: 0,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.activeMenuText,
    alignItems: "center",
  },
  closeModalButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
