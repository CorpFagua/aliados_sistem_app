import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { useAuth } from "@/providers/AuthProvider";
import { updateServiceStatus } from "@/services/services";
import AssignDeliveryModal from "./AssignDeliveryModal";
import AssignZoneModal from "./AssignZoneModal";
import ServiceFormModal from "./ServiceFormModalCoordinator";
import TransferDeliveryModal from "./TransferDeliveryModal";
import CancelServiceModal from "../../../../components/CancelServiceModal";
import { Service } from "@/models/service";
import ChatModal from "@/components/ChatModal";
import { getServiceType } from "@/utils/serviceTypeUtils";

interface Props {
  visible: boolean;
  onClose: () => void;
  pedido: Service | null;
  onRefresh?: () => void;
}

export default function OrderDetailModal({
  visible,
  onClose,
  pedido,
  onRefresh,
}: Props) {
  const { session } = useAuth();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  if (!pedido) return null;

  // Obtener tipo de servicio
  const serviceType = getServiceType(pedido);

  // --- Maneja rechazo del pedido ---
  const handleReject = async () => {
    try {
      await updateServiceStatus(pedido.id, "cancelado", session.access_token);
      alert("Pedido cancelado");
      onClose();
      onRefresh?.();
    } catch (err) {
      console.error(err);
      alert("Error al cancelar el pedido");
    }
  };

  // --- Marca como entregado ---
  const handleMarkDelivered = async () => {
    try {
      await updateServiceStatus(pedido.id, "entregado", session.access_token);
      alert("Pedido entregado ✅");
      onClose();
      onRefresh?.();
    } catch (err) {
      console.error(err);
      alert("Error al marcar como entregado");
    }
  };

  // --- Abre modal para asignar zona antes de poner en ruta ---
  const handleMarkInRoute = () => {
    setShowZoneModal(true);
  };

  // --- Cuando se asigna la zona correctamente ---
  const handleZoneAssigned = async () => {
    try {
      await updateServiceStatus(pedido.id, "en_ruta", session.access_token);
      alert("Pedido en ruta 🚴‍♂️");
      onClose();
      onRefresh?.();
    } catch (err) {
      console.error(err);
      alert("Error al poner en ruta");
    }
  };

  // --- Renderiza el botón principal según estado ---
  const renderActionButton = () => {
    if (serviceType === "paqueteria") {
      // Paquetería tiene flujo diferente
      if (pedido.status === "disponible") {
        return (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.gradientStart }]}
            onPress={() => setShowZoneModal(true)}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#000" />
            <Text style={styles.actionText}>Confirmar recogida</Text>
          </TouchableOpacity>
        );
      }

      if (pedido.status === "asignado") {
        return (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#4CAF50" }]}
            onPress={handleMarkDelivered}
          >
            <Ionicons name="checkmark-done-outline" size={18} color="#000" />
            <Text style={styles.actionText}>Entregado</Text>
          </TouchableOpacity>
        );
      }
      return null;
    }

    // Domicilio tiene flujo original
    if (pedido.status === "disponible") {
      return (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: Colors.gradientStart }]}
          onPress={() => setShowAssignModal(true)}
        >
          <Ionicons name="person-add-outline" size={18} color="#000" />
          <Text style={styles.actionText}>Asignar</Text>
        </TouchableOpacity>
      );
    }

    if (pedido.status === "asignado") {
      return (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: Colors.gradientStart }]}
          onPress={handleMarkInRoute}
        >
          <Ionicons name="bicycle-outline" size={18} color="#000" />
          <Text style={styles.actionText}>Marcar como recogido</Text>
        </TouchableOpacity>
      );
    }

    if (pedido.status === "en_ruta") {
      return (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#4CAF50" }]}
          onPress={handleMarkDelivered}
        >
          <Ionicons name="checkmark-done-outline" size={18} color="#000" />
          <Text style={styles.actionText}>Marcar como entregado</Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  // 🟢 Mostrar botón de transferencia si está asignado o en ruta
  const renderTransferButton = () => {
    if (
      serviceType !== "paqueteria" &&
      (pedido.status === "asignado" || pedido.status === "en_ruta")
    ) {
      return (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#FF9800" }]}
          onPress={() => setShowTransferModal(true)}
        >
          <Ionicons name="swap-horizontal-outline" size={18} color="#000" />
          <Text style={styles.actionText}>Transferir</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* HEADER */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Ionicons
                name={serviceType === "paqueteria" ? "cube-outline" : "storefront-outline"}
                size={22}
                color={Colors.gradientStart}
              />
              <View style={styles.headerContent}>
                <Text style={styles.modalTitle}>
                  {serviceType === "paqueteria" ? pedido.pickup || "Recogida" : pedido.profileStoreName || "Tienda desconocida"}
                </Text>
                <Text style={styles.modalSubtitle}>ID: {pedido.id}</Text>
              </View>
            </View>

            {/* 🟢 Botón Editar */}
            <TouchableOpacity onPress={() => setShowEditModal(true)}>
              <Ionicons
                name="create-outline"
                size={22}
                color={Colors.gradientStart}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.normalText} />
            </TouchableOpacity>
          </View>

          {/* BODY */}
          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.infoRow}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={Colors.menuText}
              />
              <Text style={styles.infoText}>
                <Text style={styles.label}>Estado: </Text>
                {pedido.status?.toUpperCase()}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons
                name="location-outline"
                size={18}
                color={Colors.menuText}
              />
              <Text style={styles.infoText}>
                <Text style={styles.label}>Entrega: </Text>
                {pedido.destination || "Sin dirección"}
              </Text>
            </View>

            {serviceType === "paqueteria" && pedido.pickup && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="cube-outline"
                  size={18}
                  color={Colors.menuText}
                />
                <Text style={styles.infoText}>
                  <Text style={styles.label}>Recogida: </Text>
                  {pedido.pickup}
                </Text>
              </View>
            )}

            {serviceType !== "paqueteria" && (
              <>
                <View style={styles.infoRow}>
                  <Ionicons
                    name="bicycle-outline"
                    size={18}
                    color={Colors.menuText}
                  />
                  <Text style={styles.infoText}>
                    <Text style={styles.label}>Domiciliario: </Text>
                    {pedido.assignedDeliveryName || "Sin asignar"}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="map-outline" size={18} color={Colors.menuText} />
                  <Text style={styles.infoText}>
                    <Text style={styles.label}>Zona: </Text>
                    {pedido.zoneName || "No asignada"}
                  </Text>
                </View>
              </>
            )}

            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={18} color={Colors.menuText} />
              <Text style={styles.infoText}>
                <Text style={styles.label}>Teléfono: </Text>
                {pedido.phone}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="cash-outline" size={18} color={Colors.menuText} />
              <Text style={styles.infoText}>
                <Text style={styles.label}>Pago: </Text>
                {pedido.payment} {pedido.isPaid ? "(Pagado)" : "(Pendiente)"}
              </Text>
            </View>

            {pedido.notes && (
              <>
                <View style={styles.separator} />
                <Text style={styles.sectionTitle}>Notas</Text>
                <View style={styles.notesBox}>
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color={Colors.menuText}
                  />
                  <Text style={styles.notesText}>{pedido.notes}</Text>
                </View>
              </>
            )}
          </ScrollView>

          {/* FOOTER */}
          <View style={styles.footer}>
            <View style={styles.footerContent}>
              <Text style={styles.price}>${pedido.amount.toLocaleString()}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.actionRowScroll}
              >
                <View style={styles.actionRow}>
                  {renderActionButton()}
                  {renderTransferButton()}

                  {/* � BOTÓN CHAT */}
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#FFD54F" }]}
                    onPress={() => setShowChatModal(true)}
                  >
                    <Ionicons name="chatbubbles-outline" size={18} color="#000" />
                    <Text style={styles.actionText}>Ver chat</Text>
                  </TouchableOpacity>

                  {/* 🔴 BOTÓN CANCELAR SERVICIO - Coordinator siempre puede (excepto entregado, pago, cancelado) */}
                  {pedido.status !== "entregado" && pedido.status !== "pago" && pedido.status !== "cancelado" && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#FF3B30" }]}
                      onPress={() => setShowCancelModal(true)}
                    >
                      <Ionicons name="close-circle-outline" size={18} color="#fff" />
                      <Text style={[styles.actionText, { color: "#fff" }]}>Cancelar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>

          {/* MODAL DE ASIGNAR DOMICILIARIO */}
          <AssignDeliveryModal
            visible={showAssignModal}
            service={pedido}
            onClose={(refresh) => {
              setShowAssignModal(false);
              if (refresh) {
                onClose();
                onRefresh?.();
              }
            }}
          />

          {/* MODAL DE ASIGNAR ZONA */}
          <AssignZoneModal
            visible={showZoneModal}
            service={pedido}
            token={session.access_token}
            onClose={() => setShowZoneModal(false)}
            onAssigned={handleZoneAssigned}
          />

          {/* 🟢 MODAL DE EDICIÓN */}
          <ServiceFormModal
            visible={showEditModal}
            onClose={() => setShowEditModal(false)}
            editing={pedido}
            onSuccess={() => {
              setShowEditModal(false);
              onClose();
              onRefresh?.();
            }}
          />

          {/* 🟢 MODAL DE TRANSFERENCIA */}
          <TransferDeliveryModal
            visible={showTransferModal}
            onClose={() => setShowTransferModal(false)}
            service={pedido}
            currentDeliveryId={pedido.assignedDelivery }
            onSuccess={() => {
              onClose();
              onRefresh?.();
            }}
          />

          <ChatModal
            visible={showChatModal}
            serviceId={pedido.id}
            token={session.access_token}
            userId={session.user.id}
            onClose={() => setShowChatModal(false)}
          />

          <CancelServiceModal
            visible={showCancelModal}
            pedido={pedido}
            onClose={() => setShowCancelModal(false)}
            onSuccess={() => {
              setShowCancelModal(false);
              onClose();
              onRefresh?.();
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: Colors.activeMenuBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    gap: 8,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  headerContent: { flex: 1, justifyContent: "center" },
  modalTitle: { fontSize: 16, fontWeight: "700", color: Colors.normalText },
  modalSubtitle: { fontSize: 11, color: Colors.menuText, marginTop: 2 },
  modalBody: { marginBottom: 16 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  infoText: { color: Colors.normalText, fontSize: 14, flexShrink: 1 },
  label: { fontWeight: "600", color: Colors.menuText },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.normalText,
    marginBottom: 8,
  },
  separator: { height: 1, backgroundColor: Colors.Border, marginVertical: 10 },
  notesBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: Colors.Background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  notesText: { color: Colors.normalText, fontSize: 14, flex: 1 },
  footer: {
    borderTopWidth: 1,
    borderColor: Colors.Border,
    paddingTop: 12,
    marginTop: 10,
  },
  footerContent: {
    flexDirection: "column",
    gap: 12,
  },
  price: { fontSize: 18, fontWeight: "700", color: Colors.gradientStart },
  actionRowScroll: {
    flexGrow: 0,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    minHeight: 40,
    justifyContent: "center",
  },
  actionText: { color: "#000", fontWeight: "600", fontSize: 14 },
});
