// src/modules/users/delivery/components/OrderDetailModal.tsx
import React from "react";
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
import { Service } from "@/models/service";

// ⏱ función para calcular tiempos
function calcularEstadoTiempo(createdAt: Date, prepTime: number) {
  const now = new Date();
  const esperado = new Date(createdAt.getTime() + prepTime * 60000);

  const minutosTranscurridos = Math.floor((now.getTime() - createdAt.getTime()) / 60000);
  const minutosRestantes = Math.floor((esperado.getTime() - now.getTime()) / 60000);

  let estado: "ok" | "critico" | "vencido" = "ok";
  if (minutosRestantes <= 0) estado = "vencido";
  else if (minutosRestantes <= 5) estado = "critico";

  return { minutosTranscurridos, minutosRestantes, estado };
}

interface Props {
  visible: boolean;
  onClose: () => void;
  pedido: Service | null;
  onTransfer?: () => void;
}

export default function OrderDetailModal({ visible, onClose, pedido, onTransfer }: Props) {
  if (!pedido) return null;

  const { minutosTranscurridos, minutosRestantes, estado } = calcularEstadoTiempo(
    pedido.createdAt,
    pedido.prepTime
  );

  const tiempoColors = {
    ok: "#4CAF50",
    critico: "#FFC107",
    vencido: "#FF3B30",
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Ionicons
                name="storefront-outline"
                size={22}
                color={Colors.gradientStart}
              />
              <Text style={styles.modalTitle}>{pedido.storeId || "Sin tienda"}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.normalText} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.infoRow}>
              <Ionicons name="map-outline" size={18} color={Colors.menuText} />
              <Text style={styles.infoText}>
                <Text style={styles.label}>Zona: </Text>
                {pedido.zoneId || "Sin zona"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color={Colors.menuText} />
              <Text style={styles.infoText}>
                <Text style={styles.label}>Destino: </Text>
                {pedido.destination}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={18} color={Colors.menuText} />
              <Text style={styles.infoText}>
                <Text style={styles.label}>Teléfono cliente: </Text>
                {pedido.phone}
              </Text>
            </View>

            {pedido.pickup && (
              <View style={styles.infoRow}>
                <Ionicons name="business-outline" size={18} color={Colors.menuText} />
                <Text style={styles.infoText}>
                  <Text style={styles.label}>Dirección recogida: </Text>
                  {pedido.pickup}
                </Text>
              </View>
            )}

            {/* ⏱ Info de tiempo */}
            <View
              style={[
                styles.timeBox,
                { backgroundColor: tiempoColors[estado] + "20" },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={18}
                color={tiempoColors[estado]}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.timeText, { color: tiempoColors[estado] }]}>
                Solicitado hace {minutosTranscurridos} min ·{" "}
                {estado === "vencido"
                  ? `Vencido (+${Math.abs(minutosRestantes)} min)`
                  : `Faltan ${minutosRestantes} min`}
              </Text>
            </View>

            {/* 📝 Notas */}
            {pedido.notes ? (
              <View style={styles.notesBox}>
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color={Colors.gradientEnd}
                />
                <Text style={styles.notesText}>{pedido.notes}</Text>
              </View>
            ) : (
              <Text style={styles.infoText}>Sin notas</Text>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.price}>
              {pedido.amount ? `$ ${pedido.amount}` : "Sin monto"}
            </Text>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#000" />
                <Text style={styles.actionText}>Chatear</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.transferBtn} onPress={onTransfer}>
                <Ionicons name="swap-horizontal-outline" size={18} color="#fff" />
                <Text style={styles.transferText}>Transferir a</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.normalText,
  },
  modalBody: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  infoText: {
    color: Colors.normalText,
    fontSize: 14,
    flexShrink: 1,
  },
  label: {
    fontWeight: "600",
    color: Colors.menuText,
  },
  notesBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: Colors.Background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.Border,
    marginTop: 8,
  },
  notesText: {
    color: Colors.normalText,
    fontSize: 14,
    flex: 1,
  },
  timeBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 10,
    marginTop: 8,
  },
  timeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  footer: {
    borderTopWidth: 1,
    borderColor: Colors.Border,
    paddingTop: 12,
    marginTop: 10,
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.gradientStart,
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.gradientStart,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  actionText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 14,
  },
  transferBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FF3B30",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  transferText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
