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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constans/colors";
import ChatModal from "@/components/ChatModal";
import CancelServiceModal from "../../../../components/CancelServiceModal";
import { useAuth } from "@/providers/AuthProvider";
export default function OrderDetailModal({ visible, onClose, pedido, onRefresh }) {
  if (!pedido) return null;

  const [chatVisible, setChatVisible] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const { session, profile } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modal, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Ionicons
                name="storefront-outline"
                size={22}
                color={Colors.gradientStart}
              />
              <Text style={styles.modalTitle}>{pedido.store}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.normalText} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.infoRow}>
              <Ionicons name="map-outline" size={18} color={Colors.menuText} />
              <Text style={styles.infoText}>
                <Text style={styles.label}>Zona: </Text>
                {pedido.zone}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons
                name="location-outline"
                size={18}
                color={Colors.menuText}
              />
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
                <Ionicons
                  name="business-outline"
                  size={18}
                  color={Colors.menuText}
                />
                <Text style={styles.infoText}>
                  <Text style={styles.label}>Dirección recogida: </Text>
                  {pedido.pickup}
                </Text>
              </View>
            )}

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
            <Text style={styles.price}>$ {pedido.price}</Text>
            <View style={styles.actionRow}>
              {pedido.status === "disponible" && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#FF3B30" }]}
                  onPress={() => setShowCancelModal(true)}
                >
                  <Ionicons name="close-circle-outline" size={18} color="#fff" />
                  <Text style={[styles.actionText, { color: "#fff" }]}>Cancelar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setChatVisible(true)}
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={18}
                  color="#000"
                />
                <Text style={styles.actionText}>Chatear</Text>
              </TouchableOpacity>
            </View>

            <ChatModal
              visible={chatVisible}
              onClose={() => setChatVisible(false)}
              serviceId={pedido.id}
              token={session.access_token}
              userId={profile.id}
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
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: Colors.Border,
    paddingTop: 12,
    marginTop: 10,
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.gradientStart,
  },
  actionRow: {
    flexDirection: "row",
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
    flex: 1,
    justifyContent: "center",
  },
  actionText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 14,
  },
});
