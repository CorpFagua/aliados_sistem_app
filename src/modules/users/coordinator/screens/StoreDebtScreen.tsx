import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  FlatList,
  RefreshControl,
  Modal,
} from "react-native";
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
 * CoordinatorStoreDebtScreen - Pantalla de deuda de tiendas
 */
export default function CoordinatorStoreDebtScreen() {
  const { session } = useAuth();
  const {
    getStorePaymentRecords,
    markStorePaymentRecordAsPaid,
    loading,
  } = usePayments(session?.access_token || null);

  const [records, setRecords] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    loadRecords();
  }, [session]);

  const loadRecords = async () => {
    if (!session?.access_token) return;

    setRefreshing(true);
    try {
      const data = await getStorePaymentRecords({ limit: 100 });
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      Alert.alert("Error", "No se pudieron cargar los registros");
      setRecords([]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedRecord) return;

    setMarking(true);
    try {
      await markStorePaymentRecordAsPaid(selectedRecord.id);
      Alert.alert("Éxito", "Deuda marcada como pagada");
      setShowConfirmModal(false);
      setSelectedRecord(null);
      loadRecords();
    } catch (err) {
      Alert.alert("Error", "No se pudo marcar como pagada");
    } finally {
      setMarking(false);
    }
  };

  const renderRecordItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.recordCard}
      onPress={() => setSelectedRecord(item)}
    >
      <View style={styles.recordHeader}>
        <View>
          <Text style={styles.storeName}>Tienda</Text>
          <Text style={styles.storeId}>{item.store_id}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === "paid"
                    ? Colors.success
                    : item.status === "partial"
                    ? Colors.warning
                    : Colors.error,
              },
            ]}
          >
            <Text style={styles.statusText}>
              {item.status === "paid"
                ? "Pagado"
                : item.status === "partial"
                ? "Parcial"
                : "Pendiente"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.recordBody}>
        <View style={styles.amountRow}>
          <Text style={styles.label}>Período:</Text>
          <Text style={styles.period}>{item.period}</Text>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.label}>Cobrado:</Text>
          <Text style={styles.amount}>{formatCurrency(item.total_charged)}</Text>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.label}>Pagado:</Text>
          <Text style={styles.amount}>{formatCurrency(item.total_paid)}</Text>
        </View>

        <View style={styles.pendingRow}>
          <Text style={styles.label}>Pendiente:</Text>
          <Text style={styles.pendingAmount}>
            {formatCurrency(item.total_pending)}
          </Text>
        </View>
      </View>

      {item.status !== "paid" && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedRecord(item);
              setShowConfirmModal(true);
            }}
          >
            <Text style={styles.actionButtonText}>
              ✓ Marcar como pagado
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading && records.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.activeMenuText} />
        <Text style={styles.loadingText}>Cargando registros...</Text>
      </View>
    );
  }

  // Calular totales
  const totalCharged = (records || []).reduce((sum, r) => sum + (r?.total_charged || 0), 0);
  const totalPaid = (records || []).reduce((sum, r) => sum + (r?.total_paid || 0), 0);
  const totalPending = (records || []).reduce((sum, r) => sum + (r?.total_pending || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Deuda de Tiendas</Text>
        <Text style={styles.headerSubtitle}>
          {records.length} registro{records.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Resumen */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { borderLeftColor: Colors.error }]}>
          <Text style={styles.summaryLabel}>Total Cobrado</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalCharged)}</Text>
        </View>

        <View style={[styles.summaryCard, { borderLeftColor: Colors.success }]}>
          <Text style={styles.summaryLabel}>Total Pagado</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalPaid)}</Text>
        </View>

        <View style={[styles.summaryCard, { borderLeftColor: Colors.warning }]}>
          <Text style={styles.summaryLabel}>Pendiente</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalPending)}</Text>
        </View>
      </View>

      {records.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📊</Text>
          <Text style={styles.emptyStateTitle}>Sin registros</Text>
          <Text style={styles.emptyStateText}>
            No hay deudas de tiendas registradas
          </Text>
        </View>
      ) : (
        <FlatList
          data={records}
          renderItem={renderRecordItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadRecords} />}
        />
      )}

      {/* Modal de confirmación */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Confirmar Pago</Text>
            <Text style={styles.modalText}>
              ¿Marcar como pagada la deuda de {formatCurrency(selectedRecord?.total_pending || 0)}?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowConfirmModal(false);
                  setSelectedRecord(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                disabled={marking}
                onPress={handleMarkAsPaid}
              >
                {marking ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  summaryContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 10,
  },
  summaryCard: {
    backgroundColor: Colors.activeMenuBackground,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.menuText,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.activeMenuText,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  recordCard: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  storeName: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.normalText,
  },
  storeId: {
    fontSize: 12,
    color: Colors.menuText,
    marginTop: 2,
  },
  statusContainer: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },
  recordBody: {
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  pendingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.Border,
  },
  label: {
    fontSize: 12,
    color: Colors.menuText,
  },
  period: {
    fontSize: 12,
    color: Colors.normalText,
  },
  amount: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.normalText,
  },
  pendingAmount: {
    fontSize: 13,
    fontWeight: "bold",
    color: Colors.error,
  },
  actionContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.Border,
    paddingTop: 12,
  },
  actionButton: {
    backgroundColor: Colors.success,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.normalText,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 13,
    color: Colors.menuText,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 12,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.normalText,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 13,
    color: Colors.menuText,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: Colors.Border,
  },
  cancelButtonText: {
    color: Colors.menuText,
    fontSize: 12,
    fontWeight: "bold",
  },
  confirmButton: {
    backgroundColor: Colors.success,
  },
  confirmButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});
