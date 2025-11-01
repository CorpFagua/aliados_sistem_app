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
import ServiceFormModal from "./ServiceFormModalCoordinator"; // 🟢 Import agregado
import { Service } from "@/models/service";

interface Props {
  visible: boolean;
  onClose: () => void;
  pedido: Service | null;
  onRefresh?: () => void;
}

export default function OrderDetailModal({ visible, onClose, pedido, onRefresh }: Props) {
  const { session } = useAuth();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // 🟢 Modal de edición

  if (!pedido) return null;

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

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* HEADER */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Ionicons
                name="storefront-outline"
                size={22}
                color={Colors.gradientStart}
              />
              <Text style={styles.modalTitle}>
                {pedido.storeName || "Tienda desconocida"}
              </Text>
            </View>

            {/* 🟢 Botón Editar */}
            <TouchableOpacity onPress={() => setShowEditModal(true)}>
              <Ionicons name="create-outline" size={22} color={Colors.gradientStart} />
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.normalText} />
            </TouchableOpacity>
          </View>

          {/* BODY */}
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.infoRow}>
              <Ionicons name="alert-circle-outline" size={18} color={Colors.menuText} />
              <Text style={styles.infoText}>
                <Text style={styles.label}>Estado: </Text>
                {pedido.status?.toUpperCase()}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color={Colors.menuText} />
              <Text style={styles.infoText}>
                <Text style={styles.label}>Entrega: </Text>
                {pedido.destination || "Sin dirección"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="bicycle-outline" size={18} color={Colors.menuText} />
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
                  <Ionicons name="document-text-outline" size={18} color={Colors.menuText} />
                  <Text style={styles.notesText}>{pedido.notes}</Text>
                </View>
              </>
            )}
          </ScrollView>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.price}>${pedido.amount.toLocaleString()}</Text>
            <View style={styles.actionRow}>
              {renderActionButton()}

              {pedido.status === "disponible" && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#ff4444" }]}
                  onPress={handleReject}
                >
                  <Ionicons name="close-circle-outline" size={18} color="#000" />
                  <Text style={styles.actionText}>Cancelar</Text>
                </TouchableOpacity>
              )}
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
    maxHeight: "80%",
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: Colors.normalText },
  modalBody: { marginBottom: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  infoText: { color: Colors.normalText, fontSize: 14, flexShrink: 1 },
  label: { fontWeight: "600", color: Colors.menuText },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.normalText, marginBottom: 8 },
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: Colors.Border,
    paddingTop: 12,
    marginTop: 10,
  },
  price: { fontSize: 18, fontWeight: "700", color: Colors.gradientStart },
  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  actionText: { color: "#000", fontWeight: "600", fontSize: 14 },
});
