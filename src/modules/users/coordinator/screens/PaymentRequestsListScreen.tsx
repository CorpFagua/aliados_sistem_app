import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../../constans/colors";
import { usePayments, PendingPaymentRequest } from "../../../../hooks/usePayments";
import { useAuth } from "../../../../providers/AuthProvider";



export default function PaymentRequestsListScreen() {
  const { session } = useAuth();
  const { getPendingPaymentRequests, approvePaymentRequest, rejectPaymentRequest } = usePayments(session?.access_token || null);
  const [requests, setRequests] = useState<PendingPaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PendingPaymentRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await getPendingPaymentRequests();
      setRequests(data || []);
    } catch (err) {
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      await approvePaymentRequest(selectedRequest.id);
      Alert.alert("Éxito", "Solicitud aprobada correctamente");
      setShowDetailModal(false);
      setSelectedRequest(null);
      await loadRequests();
    } catch (err) {
      Alert.alert("Error", "No se pudo aprobar la solicitud");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    Alert.prompt(
      "Rechazar solicitud",
      "Ingresa un motivo (opcional)",
      [
        { text: "Cancelar", onPress: () => {}, style: "cancel" },
        {
          text: "Rechazar",
          onPress: async (reason) => {
            setActionLoading(true);
            try {
              await rejectPaymentRequest(selectedRequest.id, reason);
              Alert.alert("Éxito", "Solicitud rechazada");
              setShowDetailModal(false);
              setSelectedRequest(null);
              await loadRequests();
            } catch (err) {
              Alert.alert("Error", "No se pudo rechazar la solicitud");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const renderRequestCard = ({ item }: { item: PendingPaymentRequest }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => {
        setSelectedRequest(item);
        setShowDetailModal(true);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.deliveryInfo}>
            <Text style={styles.deliveryName}>{item.delivery?.name || "Domiciliario"}</Text>
            <Text style={styles.deliveryPhone}>{item.delivery?.phone || "Sin teléfono"}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: Colors.warning }]}>
          <Text style={styles.statusText}>Pendiente</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Servicios:</Text>
          <Text style={styles.value}>{item.services_count || 0}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Período:</Text>
          <Text style={styles.value}>{item.period_start && item.period_end ? `${item.period_start} a ${item.period_end}` : "N/A"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Solicitud:</Text>
          <Text style={styles.value}>{item.requested_at ? new Date(item.requested_at).toLocaleDateString("es-CO") : "N/A"}</Text>
        </View>
      </View>

      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Monto a pagar:</Text>
        <Text style={styles.amount}>${item.total_to_pay?.toLocaleString("es-CO") || "0"}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading && requests.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.activeMenuText} />
          <Text style={styles.loadingText}>Cargando solicitudes...</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequestCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRequests(); }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color={Colors.success} />
              <Text style={styles.emptyStateTitle}>No hay solicitudes pendientes</Text>
              <Text style={styles.emptyStateText}>No hay solicitudes de pago en este momento.</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              onPress={() => setShowDetailModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={Colors.normalText} />
            </TouchableOpacity>

            {selectedRequest && (
              <>
                <Text style={styles.modalTitle}>Detalle de la solicitud</Text>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Domiciliario</Text>
                  <Text style={styles.detailValue}>{selectedRequest.delivery?.name || "N/A"}</Text>
                  <Text style={styles.detailSubValue}>{selectedRequest.delivery?.phone || "Sin teléfono"}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Servicios incluidos</Text>
                  <Text style={styles.detailValue}>{selectedRequest.services_count || 0}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Período</Text>
                  <Text style={styles.detailValue}>{selectedRequest.period_start && selectedRequest.period_end ? `${selectedRequest.period_start} a ${selectedRequest.period_end}` : "N/A"}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Fecha de solicitud</Text>
                  <Text style={styles.detailValue}>
                    {selectedRequest.requested_at
                      ? new Date(selectedRequest.requested_at).toLocaleDateString("es-CO", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A"}
                  </Text>
                </View>

                <View style={styles.amountDetailContainer}>
                  <Text style={styles.detailLabel}>Total a pagar</Text>
                  <Text style={styles.amountDetail}>${selectedRequest.total_to_pay?.toLocaleString("es-CO") || "0"}</Text>
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.rejectButton]}
                    onPress={handleReject}
                    disabled={actionLoading}
                  >
                    <Text style={styles.rejectButtonText}>
                      {actionLoading ? "Procesando..." : "Rechazar"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.approveButton]}
                    onPress={handleApprove}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color={Colors.Background} size="small" />
                    ) : (
                      <Text style={styles.approveButtonText}>Aprobar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  deliveryInfo: {
    marginRight: 8,
  },
  deliveryName: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.normalText,
  },
  deliveryPhone: {
    fontSize: 13,
    color: Colors.menuText,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    color: Colors.Background,
    fontSize: 12,
    fontWeight: "bold",
  },
  cardBody: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.menuText + "20",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    color: Colors.menuText,
    fontWeight: "500",
  },
  value: {
    fontSize: 12,
    color: Colors.normalText,
    fontWeight: "600",
  },
  amountContainer: {
    backgroundColor: Colors.gradientStart + "15",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 13,
    color: Colors.normalText,
    fontWeight: "600",
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.activeMenuText,
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
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.normalText,
    marginTop: 8,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 13,
    color: Colors.menuText,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.Background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "90%",
  },
  closeButton: {
    alignSelf: "flex-end",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.normalText,
    marginBottom: 20,
  },
  detailSection: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.menuText + "15",
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
  detailSubValue: {
    fontSize: 13,
    color: Colors.menuText,
    marginTop: 2,
  },
  amountDetailContainer: {
    backgroundColor: Colors.gradientStart + "15",
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  amountDetail: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.activeMenuText,
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  rejectButton: {
    borderWidth: 2,
    borderColor: Colors.error,
    backgroundColor: "transparent",
  },
  rejectButtonText: {
    color: Colors.error,
    fontWeight: "bold",
    fontSize: 14,
  },
  approveButton: {
    backgroundColor: Colors.activeMenuText,
  },
  approveButtonText: {
    color: Colors.Background,
    fontWeight: "bold",
    fontSize: 14,
  },
});
