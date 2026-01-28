import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  FlatList,
  RefreshControl,
  Modal,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from "../../../../providers/AuthProvider";
import { fetchDeliveryServices } from "../../../../services/services";
import { Colors } from "../../../../constans/colors";

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * DeliveryHistoryScreen - Historial de pedidos sin pagar
 */
export default function DeliveryHistoryScreen() {
  const { session, profile } = useAuth();

  const [unpaidOrders, setUnpaidOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (session?.access_token) {
      console.log("👤 [HistoryScreen] User profile:", {
        id: profile?.id,
        email: profile?.email,
        role: profile?.role,
        hasToken: !!session.access_token,
      });
      loadUnpaidOrders();
    }
  }, [session?.access_token]);

  const loadUnpaidOrders = async () => {
    if (!session?.access_token) {
      setError("No hay sesión activa");
      setLoading(false);
      return;
    }

    setRefreshing(true);
    setError(null);
    try {
      // Obtener servicios del delivery actual (sin parámetro deliveryId)
      console.log("📦 [HistoryScreen] Iniciando carga de servicios sin pagar...");
      console.log("🔐 [HistoryScreen] Token disponible:", !!session.access_token);
      
      const services = await fetchDeliveryServices(session.access_token);
      
      console.log(`✅ [HistoryScreen] Servicios obtenidos: ${services.length}`);
      
      // Filtrar solo servicios entregados y no pagados
      const unpaid = services.filter((service: any) => {
        const isDelivered = service.status === "entregado";
        const isUnpaid = !service.isPaid; // isPaid puede ser false, null o undefined
        return isDelivered && isUnpaid;
      });
      
      console.log(`✅ Servicios entregados sin pagar: ${unpaid.length} de ${services.length}`);
      setUnpaidOrders(unpaid);
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.error || err.message || "Error al cargar pedidos";
      console.error("❌ Error en loadUnpaidOrders:", err);
      console.error("📋 Full error response:", err.response?.data);
      setError(message);
      setUnpaidOrders([]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };
  const calculateDeliveryTime = (assignedAt?: string, completedAt?: string): string => {
    if (!assignedAt || !completedAt) return "N/A";
    const assigned = new Date(assignedAt).getTime();
    const completed = new Date(completedAt).getTime();
    const diffMs = completed - assigned;
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const renderOrderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => {
        setSelectedOrder(item);
        setShowConfirmModal(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderNumber}>Pedido {item.id || 'N/A'}</Text>
          <Text style={styles.orderDate}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString("es-CO") : "Pendiente"}
          </Text>
        </View>
        <View style={styles.amountColumn}>
          <Text style={styles.amountLabel}>Tu Ganancia</Text>
          <Text style={styles.amountValue}>{formatCurrency(parseFloat(item.priceDeliverySrv) || 0)}</Text>
        </View>
      </View>

      <View style={styles.orderBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tienda:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{item.storeName || "N/A"}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Dirección:</Text>
          <Text style={styles.infoValue} numberOfLines={2}>{item.destination || "N/A"}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Pago:</Text>
          <Text style={styles.infoValue}>{item.payment || "N/A"}</Text>
        </View>
      </View>

      <View style={styles.tapIndicator}>
        <Text style={styles.tapText}>Ver detalles  ›</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && unpaidOrders.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.activeMenuText} />
        <Text style={styles.loadingText}>Cargando pedidos sin pagar...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {error ? (
        <View style={{ backgroundColor: '#fee2e2', padding: 12, marginBottom: 10, marginHorizontal: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#dc2626' }}>
          <Text style={{ color: '#7f1d1d', fontWeight: '700', marginBottom: 4, fontSize: 13 }}>Error al cargar pedidos</Text>
          <Text style={{ color: '#991b1b', fontSize: 12, marginBottom: 8 }}>{String(error)}</Text>
          <TouchableOpacity 
            style={{ paddingVertical: 6 }}
            onPress={loadUnpaidOrders}
          >
            <Text style={{ color: Colors.activeMenuText, fontWeight: '600', fontSize: 12 }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historial de Entregas</Text>
        <Text style={styles.headerSubtitle}>
          {unpaidOrders.length} entrega{unpaidOrders.length !== 1 ? "s" : ""} pendiente{unpaidOrders.length !== 1 ? "s" : ""} de pago
        </Text>
      </View>

      {unpaidOrders.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadUnpaidOrders} />}
        >
          <View style={styles.emptyState}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#e8f5e9', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 2, borderColor: '#4caf50' }}>
              <Text style={{ fontSize: 44, fontWeight: '300', color: '#4caf50' }}>✓</Text>
            </View>
            <Text style={styles.emptyStateTitle}>Todos pagados</Text>
            <Text style={styles.emptyStateText}>
              Excelente, no tienes entregas pendientes de pago en este momento.
            </Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={unpaidOrders}
          keyExtractor={(item) => (item.id ? String(item.id) : Math.random().toString())}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadUnpaidOrders} />}
        />
      )}

      {/* Modal de detalles */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles del Pedido</Text>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)} style={{ padding: 8 }}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 24 }}>
                {/* Sección de resumen */}
                <View style={styles.summarySection}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Pedido</Text>
                    <Text style={styles.summaryValue}>{selectedOrder.id || 'N/D'}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tu Ganancia</Text>
                    <Text style={[styles.summaryValue, { color: Colors.activeMenuText, fontSize: 18, fontWeight: '700' }]}>
                      {formatCurrency(parseFloat(selectedOrder.priceDeliverySrv) || 0)}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Información del Cliente */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Cliente</Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Nombre</Text>
                    <Text style={styles.detailValue}>{selectedOrder.clientName || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Teléfono</Text>
                    <Text style={styles.detailValue}>{selectedOrder.phone || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Información de la entrega */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Detalles de Entrega</Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Dirección</Text>
                    <Text style={styles.detailValue}>{selectedOrder.destination || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Método de Pago</Text>
                    <Text style={styles.detailValue}>{selectedOrder.payment || 'N/A'}</Text>
                  </View>
                  {selectedOrder.notes && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Notas</Text>
                      <Text style={styles.detailValue}>{selectedOrder.notes}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.divider} />

                {/* Timeline de la entrega */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Cronología</Text>
                  
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineLabel}>Asignado</Text>
                      <Text style={styles.timelineTime}>
                        {selectedOrder.assignedAt 
                          ? new Date(selectedOrder.assignedAt).toLocaleString('es-CO') 
                          : 'N/A'}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.timelineItem, { opacity: 0.5 }]}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineLabel}>En Ruta</Text>
                      <Text style={styles.timelineTime}>Pendiente</Text>
                    </View>
                  </View>

                  <View style={[styles.timelineItem, { opacity: selectedOrder.completedAt ? 1 : 0.5 }]}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineLabel}>Entregado</Text>
                      <Text style={styles.timelineTime}>
                        {selectedOrder.completedAt 
                          ? new Date(selectedOrder.completedAt).toLocaleString('es-CO')
                          : 'Pendiente'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Información de pagos y totales */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Información Económica</Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Tu Ganancia</Text>
                    <Text style={[styles.detailValue, { color: Colors.activeMenuText, fontWeight: '700', fontSize: 15 }]}>
                      {formatCurrency(parseFloat(selectedOrder.priceDeliverySrv) || 0)}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Total a Cobrar</Text>
                    <Text style={styles.detailValue}>{formatCurrency(parseFloat(selectedOrder.amount) || 0)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Estado de Pago</Text>
                    <Text style={[styles.detailValue, { color: selectedOrder.isPaid ? '#4caf50' : '#ff9800' }]}>
                      {selectedOrder.isPaid ? 'Pagado' : 'Pendiente'}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowConfirmModal(false)}
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
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 12,
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
  orderCard: {
    backgroundColor: Colors.activeMenuBackground,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.activeMenuText,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
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
  orderBody: {
    marginVertical: 8,
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
  tapIndicator: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#3A3A3C",
  },
  tapText: {
    fontSize: 11,
    color: "#FFD700",
    fontWeight: "700",
    textAlign: "right",
  },
  summarySection: {
    backgroundColor: "#252527",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.activeMenuText,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#A8A8A8",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
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
  detailLabel: {
    fontSize: 13,
    color: "#A8A8A8",
    fontWeight: "500",
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.Border,
    marginVertical: 16,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 20,
    paddingLeft: 12,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.activeMenuText,
    marginRight: 16,
    marginTop: 3,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 12,
    color: "#A0A0A0",
    lineHeight: 18,
  },
  notesText: {
    fontSize: 13,
    color: "#E8E8E8",
    lineHeight: 20,
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
