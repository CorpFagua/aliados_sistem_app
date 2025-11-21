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
  TextInput,
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
 * CoordinatorPaymentRequestsScreen - Pantalla de solicitudes de pago pendientes
 */
export default function CoordinatorPaymentRequestsScreen() {
  const { session } = useAuth();
  const {
    getPaymentRequests,
    approvePaymentRequest,
    rejectPaymentRequest,
    loading,
  } = usePayments(session?.access_token || null);

  const [requests, setRequests] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [modalNotes, setModalNotes] = useState("");
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [session]);

  const loadRequests = async () => {
    if (!session?.access_token) return;

    setRefreshing(true);
    try {
      const data = await getPaymentRequests({
        status: "pending",
        limit: 100,
      });
      setRequests(data);
    } catch (err) {
      Alert.alert("Error", "No se pudieron cargar las solicitudes");
    } finally {
      setRefreshing(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setApproving(true);
    try {
      await approvePaymentRequest(selectedRequest.id, modalNotes);
      Alert.alert("Éxito", "Solicitud aprobada");
      setShowApproveModal(false);
      setModalNotes("");
      setSelectedRequest(null);
      loadRequests();
    } catch (err) {
      Alert.alert("Error", "No se pudo aprobar la solicitud");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    setApproving(true);
    try {
      await rejectPaymentRequest(selectedRequest.id, modalNotes);
      Alert.alert("Éxito", "Solicitud rechazada");
      setShowRejectModal(false);
      setModalNotes("");
      setSelectedRequest(null);
      loadRequests();
    } catch (err) {
      Alert.alert("Error", "No se pudo rechazar la solicitud");
    } finally {
      setApproving(false);
    }
  };

  const renderRequestItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.requestCard}
      onPress={() => setSelectedRequest(item)}
    >
      <View style={styles.requestHeader}>
        <View>
          <Text style={styles.deliveryName}>Domiciliario</Text>
          <Text style={styles.deliveryId}>{item.delivery_id}</Text>
        </View>
        <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
      </View>

      <View style={styles.requestBody}>
        <View style={styles.statusRow}>
          <Text style={styles.label}>Estado:</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Pendiente</Text>
          </View>
        </View>

        <View style={styles.dateRow}>
          <Text style={styles.label}>Solicitado:</Text>
          <Text style={styles.date}>
            {new Date(item.requested_at).toLocaleDateString("es-CO")}
          </Text>
        </View>

        {item.notes && (
          <View style={styles.notesRow}>
            <Text style={styles.label}>Notas:</Text>
            <Text style={styles.notes}>{item.notes}</Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={() => {
            setSelectedRequest(item);
            setShowApproveModal(true);
          }}
        >
          <Text style={styles.buttonText}>✓ Aprobar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={() => {
            setSelectedRequest(item);
            setShowRejectModal(true);
          }}
        >
          <Text style={styles.buttonText}>✗ Rechazar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading && requests.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.activeMenuText} />
        <Text style={styles.loadingText}>Cargando solicitudes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Solicitudes de Corte</Text>
        <Text style={styles.headerSubtitle}>
          {requests.length} solicitud{requests.length !== 1 ? "es" : ""} pendiente{requests.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {requests.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>✓</Text>
          <Text style={styles.emptyStateTitle}>Nada pendiente</Text>
          <Text style={styles.emptyStateText}>
            No hay solicitudes de corte pendientes de aprobar
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadRequests} />}
        />
      )}

      {/* Modal de Aprobación */}
      <Modal visible={showApproveModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Aprobar Solicitud</Text>
            <Text style={styles.modalSubtitle}>
              ¿Aprobar solicitud por {formatCurrency(selectedRequest?.amount || 0)}?
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Notas (opcional)"
              placeholderTextColor={Colors.menuText}
              value={modalNotes}
              onChangeText={setModalNotes}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowApproveModal(false);
                  setModalNotes("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                disabled={approving}
                onPress={handleApprove}
              >
                {approving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.confirmButtonText}>Aprobar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Rechazo */}
      <Modal visible={showRejectModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Rechazar Solicitud</Text>
            <Text style={styles.modalSubtitle}>
              Escribe el motivo del rechazo
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Motivo del rechazo"
              placeholderTextColor={Colors.menuText}
              value={modalNotes}
              onChangeText={setModalNotes}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowRejectModal(false);
                  setModalNotes("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.rejectConfirmButton]}
                disabled={approving}
                onPress={handleReject}
              >
                {approving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.confirmButtonText}>Rechazar</Text>
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
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  requestCard: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  deliveryName: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.normalText,
  },
  deliveryId: {
    fontSize: 12,
    color: Colors.menuText,
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.activeMenuText,
  },
  requestBody: {
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: Colors.menuText,
    marginRight: 8,
  },
  statusBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: Colors.Background,
    fontSize: 11,
    fontWeight: "bold",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: Colors.normalText,
  },
  notesRow: {
    flexDirection: "row",
    marginBottom: 0,
  },
  notes: {
    fontSize: 12,
    color: Colors.normalText,
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.Border,
    paddingTop: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  approveButton: {
    backgroundColor: Colors.success,
  },
  rejectButton: {
    backgroundColor: Colors.error,
  },
  buttonText: {
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
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: Colors.activeMenuBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.normalText,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.menuText,
    marginBottom: 16,
  },
  input: {
    backgroundColor: Colors.Border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.normalText,
    fontSize: 13,
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: Colors.Border,
  },
  cancelButtonText: {
    color: Colors.menuText,
    fontSize: 13,
    fontWeight: "bold",
  },
  confirmButton: {
    backgroundColor: Colors.success,
  },
  rejectConfirmButton: {
    backgroundColor: Colors.error,
  },
  confirmButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "bold",
  },
});
