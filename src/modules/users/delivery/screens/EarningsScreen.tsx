import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  RefreshControl,
  FlatList,
  Modal,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from "../../../../providers/AuthProvider";
import { usePayments } from "../../../../hooks/usePayments";
import {
  getNextCutDate,
  getCurrentCutType,
} from "../../../../models/payment";
import { Colors } from "../../../../constans/colors";

// Funciones auxiliares
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * DeliveryEarningsScreen - Pantalla de ganancias del domiciliario
 */
export default function DeliveryEarningsScreen() {
  const { session } = useAuth();
  const { getDeliveryEarnings, getPaymentHistory, createSnapshotFromServices, createPaymentRequest, loading, error } = usePayments(session?.access_token || null);

  const [earnings, setEarnings] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingServices, setPendingServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    loadEarnings();
    loadPendingServices();
  }, [session]);

  const loadEarnings = async () => {
    if (!session?.access_token) return;

    setRefreshing(true);
    try {
      const data = await getDeliveryEarnings();
      if (data) {
        setEarnings(data);
      }
    } catch (err) {
      Alert.alert("Error", "No se pudieron cargar las ganancias");
    } finally {
      setRefreshing(false);
    }
  };

  const loadPendingServices = async () => {
    if (!session?.access_token) return;
    try {
      const data = await getPaymentHistory({ type: "earnings", limit: 200 });
      const arr = Array.isArray(data) ? data : [];
      const unpaid = arr.filter((s) => {
        const delivered = s.status === "entregado" || s.status === "delivered" || s.status === "completed";
        const paid = s.is_paid === true || s.is_paid === 'true' || s.paid === true || s.paid === 'true';
        return delivered && !paid;
      });
      setPendingServices(unpaid);
    } catch (err) {
      console.warn("No se pudieron cargar servicios pendientes", err);
      setPendingServices([]);
    }
  };

  const handleRequestPayment = async () => {
    if (!selectedService) return;
    setRequesting(true);
    try {
      const snapshot = await createSnapshotFromServices([selectedService.serviceId || selectedService.id]);
      if (!snapshot || !snapshot.id) throw new Error('No se pudo crear snapshot');
      await createPaymentRequest({ snapshot_id: snapshot.id });
      Alert.alert('Éxito', 'Prefactura solicitada. Espera la aprobación del coordinador.');
      setShowConfirmModal(false);
      setSelectedService(null);
      loadPendingServices();
    } catch (err) {
      Alert.alert('Error', 'No se pudo solicitar la prefactura');
    } finally {
      setRequesting(false);
    }
  };

  const isCutoffOpen = () => {
    const now = new Date();
    const day = now.getDate();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const hour = now.getHours();
    return ( (day === 15 || day === lastDay) && hour >= 22 );
  };

  if (loading || !earnings) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.activeMenuText} />
        <Text style={styles.loadingText}>Cargando ganancias...</Text>
      </SafeAreaView>
    );
  }

  const cutType = getCurrentCutType();
  const nextCut = cutType === "quincena_1" ? "15" : "1";
  const canRequestCut = new Date().getDate() >= (cutType === "quincena_1" ? 15 : 1);

  return (
    <SafeAreaView style={styles.container}>
      {error ? (
        <View style={{ backgroundColor: '#ffe6e6', padding: 10 }}>
          <Text style={{ color: '#b30000' }}>Error: {String(error)}</Text>
        </View>
      ) : null}

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadEarnings} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Ganancias</Text>
        <Text style={styles.headerSubtitle}>
          Período: {cutType === "quincena_1" ? "1-15" : "16-31"}
        </Text>
      </View>

      {/* Tarjeta de período actual */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Ganancias Período Actual</Text>
          <Text style={styles.cardValue}>
            {formatCurrency(earnings.current_period_earnings)}
          </Text>
        </View>
        <Text style={styles.cardDescription}>
          Desde el {cutType === "quincena_1" ? "1" : "16"} hasta hoy
        </Text>
      </View>

      {/* Grid de estadísticas */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: Colors.activeMenuText }]}>
          <Text style={styles.statLabel}>Total Acumulado</Text>
          <Text style={styles.statValue}>{formatCurrency(earnings.total_earnings)}</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: Colors.success }]}>
          <Text style={styles.statLabel}>Total Pagado</Text>
          <Text style={styles.statValue}>{formatCurrency(earnings.total_paid)}</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: Colors.warning }]}>
          <Text style={styles.statLabel}>Pendiente</Text>
          <Text style={styles.statValue}>{formatCurrency(earnings.total_pending)}</Text>
        </View>
      </View>

      {/* Información de corte */}
      <View style={styles.cutInfo}>
        <Text style={styles.cutInfoTitle}>📅 Próximo Corte</Text>
        <View style={styles.cutInfoContent}>
          <Text style={styles.cutInfoText}>
            El próximo corte es el <Text style={styles.bold}>{nextCut} del mes</Text>
          </Text>
          <Text style={styles.cutInfoDescription}>
            {canRequestCut ? "Ya puedes solicitar tu corte" : `Espera hasta el ${nextCut} para solicitar`}
          </Text>
        </View>
      </View>

      {/* Botón solicitar corte */}
      <TouchableOpacity
        style={[styles.button, !canRequestCut && styles.buttonDisabled]}
        disabled={!canRequestCut}
        onPress={() => Alert.alert("Solicitar Corte", "Serás dirigido a solicitudes")}
      >
        <Text style={styles.buttonText}>
          {canRequestCut ? "Solicitar Corte" : "No disponible aún"}
        </Text>
      </TouchableOpacity>

      {/* Información adicional */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ Sobre tus ganancias</Text>
        <Text style={styles.infoText}>
          • Cada servicio completado suma a tus ganancias{"\n"}
          • Puedes solicitar corte los días 15 y 1{"\n"}
          • El coordinador tiene 7 días para aprobar{"\n"}
          • Una vez pagado, aparecerá en tu historial
        </Text>
      </View>

      {/* Servicios entregados sin pagar */}
      <View style={[styles.header, { marginTop: 6 }] }>
        <Text style={styles.headerTitle}>Servicios pendientes</Text>
        <Text style={styles.headerSubtitle}>{pendingServices.length} servicio{pendingServices.length !== 1 ? 's' : ''} sin pagar</Text>
      </View>

      {pendingServices.length === 0 ? (
        <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
          <Text style={{ color: Colors.menuText }}>No tienes servicios pendientes por cobrar.</Text>
        </View>
      ) : (
        <FlatList
          data={pendingServices}
          keyExtractor={(item) => (item.id ? String(item.id) : Math.random().toString())}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.orderCard} onPress={() => { setSelectedService(item); setShowConfirmModal(true); }}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderNumber}>Servicio #{String(item.id).slice(-6)}</Text>
                  <Text style={styles.orderDate}>{item.completedAt ? new Date(item.completedAt).toLocaleDateString('es-CO') : ''}</Text>
                </View>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusBadge, { backgroundColor: Colors.warning }]}>
                    <Text style={styles.statusText}>Sin Pagar</Text>
                  </View>
                </View>
              </View>

                  <View style={styles.orderBody}>
                    <View style={styles.amountRow}>
                      <Text style={styles.label}>Ganancia:</Text>
                      <Text style={styles.amount}>{formatCurrency(item.earnedByDelivery ?? item.price_delivery_srv ?? item.amount ?? 0)}</Text>
                    </View>
                    { (item.notes || item.description) && (
                      <View style={styles.descriptionRow}>
                        <Text style={styles.label}>Detalles:</Text>
                        <Text style={styles.description}>{item.notes || item.description}</Text>
                      </View>
                    )}
                  </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal de confirmación (similar a History) */}
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
            {selectedService && (
              <>
                <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 24 }}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderInfoLabel}>Pedido #</Text>
                    <Text style={styles.orderInfoValue}>{selectedService.id || selectedService.serviceId || 'N/D'}</Text>
                  </View>

                  <View style={styles.orderInfo}>
                    <Text style={styles.orderInfoLabel}>Ganancia:</Text>
                    <Text style={styles.orderInfoValue}>{formatCurrency(selectedService.earnedByDelivery ?? selectedService.price_delivery_srv ?? selectedService.price_delivery ?? selectedService.delivery_earning ?? 0)}</Text>
                  </View>

                  <View style={styles.orderInfo}>
                    <Text style={styles.orderInfoLabel}>Tienda:</Text>
                    <Text style={styles.orderInfoValue}>{selectedService.store_id || selectedService.storeId || selectedService.store || selectedService.store_name || 'N/A'}</Text>
                  </View>

                  <View style={styles.orderInfo}>
                    <Text style={styles.orderInfoLabel}>Dirección:</Text>
                    <Text style={styles.orderInfoValue}>{selectedService.deliveryAddress || selectedService.delivery_address || selectedService.delivery_address_text || 'N/D'}</Text>
                  </View>

                  <View style={styles.orderInfo}>
                    <Text style={styles.orderInfoLabel}>Fecha entrega:</Text>
                    <Text style={styles.orderInfoValue}>{selectedService.completedAt ? new Date(selectedService.completedAt).toLocaleString('es-CO') : ''}</Text>
                  </View>

                  <View style={styles.infoBox}>
                    <Text style={styles.infoTitle}>ℹ️ Información</Text>
                    <Text style={styles.infoText}>
                      Al solicitar esta prefactura, se enviará una notificación al coordinador
                      para que la revise y apruebe. Una vez aprobada, podrás recibir el pago.
                    </Text>
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setShowConfirmModal(false)} disabled={requesting}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.confirmButton, requesting && styles.disabledButton]} onPress={handleRequestPayment} disabled={requesting}>
                    {requesting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmButtonText}>Solicitar Prefactura</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.Background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.menuText,
  },
  header: {
    backgroundColor: Colors.gradientStart,
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingTop: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.Background,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.Background,
    marginTop: 4,
    opacity: 0.8,
  },
  card: {
    backgroundColor: Colors.activeMenuBackground,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    color: Colors.menuText,
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.activeMenuText,
  },
  cardDescription: {
    fontSize: 12,
    color: Colors.menuText,
  },
  statsGrid: {
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: Colors.activeMenuBackground,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.menuText,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.normalText,
  },
  cutInfo: {
    backgroundColor: Colors.activeMenuBackground,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  cutInfoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.normalText,
    marginBottom: 8,
  },
  cutInfoContent: {
    backgroundColor: "rgba(255, 214, 10, 0.1)",
    padding: 12,
    borderRadius: 8,
  },
  cutInfoText: {
    fontSize: 14,
    color: Colors.normalText,
    marginBottom: 4,
  },
  bold: {
    fontWeight: "bold",
    color: Colors.warning,
  },
  cutInfoDescription: {
    fontSize: 12,
    color: Colors.menuText,
  },
  button: {
    backgroundColor: Colors.activeMenuText,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.Background,
    fontSize: 16,
    fontWeight: "bold",
  },
  infoBox: {
    backgroundColor: "rgba(0, 255, 117, 0.1)",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    padding: 12,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.success,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 11,
    color: Colors.success,
    lineHeight: 18,
  },
  // Estilos para lista de servicios pendientes (reutilizados de History)
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
  // Modal styles (copied from History)
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
