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
import { usePayments } from "../../../../hooks/usePayments";
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
  const { session } = useAuth();
  const { getPaymentHistory, createPaymentRequest, createSnapshotFromServices, loading, error } = usePayments(
    session?.access_token || null
  );

  const [unpaidOrders, setUnpaidOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    loadUnpaidOrders();
  }, [session]);

  const loadUnpaidOrders = async () => {
    if (!session?.access_token) return;

    setRefreshing(true);
    try {
      // Obtener historial de pagos (el backend determina si es delivery o store según el usuario)
      const data = await getPaymentHistory({ limit: 200 });
      // Filtrar solo servicios/pedidos entregados y no pagados
      const arr = Array.isArray(data) ? data : [];
      const unpaid = arr.filter((order) => {
        const delivered = order.status === "Entregado" || order.status === "entregado" || order.status === "delivered" || order.status === "completed";
        const paid = order.is_paid === true || order.is_paid === 'true' || order.paid === true || order.paid === 'true';
        return delivered && !paid;
      });
      setUnpaidOrders(unpaid);
    } catch (err) {
      Alert.alert("Error", "No se pudieron cargar los pedidos");
      setUnpaidOrders([]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRequestPayment = async () => {
    if (!selectedOrder) return;

    setRequesting(true);
    try {
      // Crear snapshot en backend a partir del servicio seleccionado
      const snapshot = await createSnapshotFromServices([selectedOrder.serviceId || selectedOrder.id]);
      if (!snapshot || !snapshot.id) throw new Error('No se pudo crear snapshot');

      await createPaymentRequest({ snapshot_id: snapshot.id });
      Alert.alert("Éxito", "Prefactura solicitada. Espera la aprobación del coordinador.");
      setShowConfirmModal(false);
      setSelectedOrder(null);
      loadUnpaidOrders();
    } catch (err) {
      Alert.alert("Error", "No se pudo solicitar la prefactura");
    } finally {
      setRequesting(false);
    }
  };

  const isCutoffOpen = () => {
    const now = new Date();
    const day = now.getDate();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const hour = now.getHours();
    // Habilitar solo si es 15 o último día del mes y son las 22:00 o más
    return ( (day === 15 || day === lastDay) && hour >= 22 );
  };

  const renderOrderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => {
        setSelectedOrder(item);
        setShowConfirmModal(true);
      }}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>Servicio #{(item.serviceId || item.id)?.toString().slice(-6)}</Text>
          <Text style={styles.orderDate}>
            {item.completedAt ? new Date(item.completedAt).toLocaleDateString("es-CO") : ""}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: Colors.warning }]}>
            <Text style={styles.statusText}>Sin Pagar</Text>
          </View>
        </View>
      </View>

      <View style={styles.orderBody}>
        <View style={styles.amountRow}>
          <Text style={styles.label}>Tu Ganancia:</Text>
          <Text style={styles.amount}>{formatCurrency(item.earnedByDelivery ?? item.price_delivery_srv ?? item.amount ?? 0)}</Text>
        </View>

        {item.notes && (
          <View style={styles.descriptionRow}>
            <Text style={styles.label}>Notas:</Text>
            <Text style={styles.description}>{item.notes}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => {
          setSelectedOrder(item);
          setShowConfirmModal(true);
        }}
      >
        <Text style={styles.actionButtonText}>📋 Solicitar Prefactura</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading && unpaidOrders.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.activeMenuText} />
        <Text style={styles.loadingText}>Cargando pedidos...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {error ? (
        <View style={{ backgroundColor: '#ffe6e6', padding: 10 }}>
          <Text style={{ color: '#b30000' }}>Error: {String(error)}</Text>
        </View>
      ) : null}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historial de Cobro</Text>
        <Text style={styles.headerSubtitle}>
          {unpaidOrders.length} pedido{unpaidOrders.length !== 1 ? "s" : ""} sin pagar
        </Text>
      </View>

      {unpaidOrders.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadUnpaidOrders} />}
        >
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>✓</Text>
            <Text style={styles.emptyStateTitle}>Todos los pedidos pagados</Text>
            <Text style={styles.emptyStateText}>
              No tienes pedidos sin pagar en este momento
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

      {/* Modal de confirmación */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Solicitar Prefactura</Text>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <>
                <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 24 }}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderInfoLabel}>Pedido #</Text>
                    <Text style={styles.orderInfoValue}>{selectedOrder.id ? String(selectedOrder.id).slice(-6) : 'N/D'}</Text>
                  </View>

                  <View style={styles.orderInfo}>
                    <Text style={styles.orderInfoLabel}>Tienda:</Text>
                    <Text style={styles.orderInfoValue}>{selectedOrder.store_id || selectedOrder.storeId || selectedOrder.store || selectedOrder.store_name || 'N/A'}</Text>
                  </View>

                  <View style={styles.orderInfo}>
                    <Text style={styles.orderInfoLabel}>Cliente:</Text>
                    <Text style={styles.orderInfoValue}>{selectedOrder.clientName || selectedOrder.client_name || selectedOrder.client || 'N/D'}</Text>
                  </View>

                  <View style={styles.orderInfo}>
                    <Text style={styles.orderInfoLabel}>Dirección:</Text>
                    <Text style={styles.orderInfoValue}>{selectedOrder.deliveryAddress || selectedOrder.delivery_address || selectedOrder.delivery_address_text || 'N/D'}</Text>
                  </View>

                  <View style={styles.orderInfo}>
                    <Text style={styles.orderInfoLabel}>Fecha entrega:</Text>
                    <Text style={styles.orderInfoValue}>{selectedOrder.completedAt ? new Date(selectedOrder.completedAt).toLocaleString('es-CO') : ''}</Text>
                  </View>

                  <View style={styles.orderInfo}>
                    <Text style={styles.orderInfoLabel}>Tiempos (asignado / trayecto / finalizado):</Text>
                    <Text style={styles.orderInfoValue}>
                      {selectedOrder.assignedAt ? new Date(selectedOrder.assignedAt).toLocaleTimeString('es-CO') : '-'} / {selectedOrder.trayectoAt ? new Date(selectedOrder.trayectoAt).toLocaleTimeString('es-CO') : '-'} / {selectedOrder.finalizedAt ? new Date(selectedOrder.finalizedAt).toLocaleTimeString('es-CO') : '-'}
                    </Text>
                  </View>

                  {selectedOrder.notes && (
                    <View style={{ marginTop: 12 }}>
                      <Text style={styles.infoTitle}>Notas</Text>
                      <Text style={styles.infoText}>{selectedOrder.notes}</Text>
                    </View>
                  )}

                  <View style={styles.infoBox}>
                    <Text style={styles.infoTitle}>ℹ️ Información</Text>
                    <Text style={styles.infoText}>
                      Al solicitar esta prefactura, se enviará una notificación al coordinador
                      para que la revise y apruebe. Una vez aprobada, podrás recibir el pago.
                    </Text>
                    <Text style={{ marginTop: 8, color: Colors.menuText }}>
                      Botón activo solo el día 15 o el último día del mes después de las 22:00.
                    </Text>
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowConfirmModal(false)}
                    disabled={requesting}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.confirmButton, (!isCutoffOpen() || requesting) && styles.disabledButton]}
                    onPress={handleRequestPayment}
                    disabled={!isCutoffOpen() || requesting}
                  >
                    {requesting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.confirmButtonText}>Solicitar Prefactura</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  orderCard: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.normalText,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.menuText,
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  orderBody: {
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: Colors.menuText,
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.activeMenuText,
  },
  descriptionRow: {
    marginTop: 8,
  },
  description: {
    fontSize: 13,
    color: Colors.normalText,
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: Colors.activeMenuText,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    color: Colors.Background,
    fontSize: 13,
    fontWeight: "600",
  },

  // Modal
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
    paddingVertical: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.normalText,
  },
  closeButton: {
    fontSize: 24,
    color: Colors.menuText,
  },
  modalBody: {
    marginBottom: 20,
  },
  orderInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },
  orderInfoLabel: {
    fontSize: 14,
    color: Colors.menuText,
    flex: 1,
    flexBasis: '45%'
  },
  orderInfoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.normalText,
    flex: 1,
    flexBasis: '55%',
    textAlign: 'right',
    flexShrink: 1,
    maxWidth: '70%'
  },
  infoBox: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.normalText,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: Colors.menuText,
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.Border,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.menuText,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.activeMenuText,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.Background,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
