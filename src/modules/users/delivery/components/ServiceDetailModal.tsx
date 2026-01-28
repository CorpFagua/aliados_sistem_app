// src/modules/users/delivery/components/OrderDetailModal.tsx
import React, { useState, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { Service } from "@/models/service";
import { useAuth } from "@/providers/AuthProvider";
import ChatModal from "@/components/ChatModal";
import RequestTransferModal from "./RequestTransferModal";

// ⏱ función para calcular tiempos
function calcularEstadoTiempo(createdAt: Date, prepTime: number) {
  const now = new Date();
  const esperado = new Date(createdAt.getTime() + prepTime * 60000);

  const minutosTranscurridos = Math.floor(
    (now.getTime() - createdAt.getTime()) / 60000
  );
  const minutosRestantes = Math.floor(
    (esperado.getTime() - now.getTime()) / 60000
  );

  let estado: "ok" | "critico" | "vencido" = "ok";
  if (minutosRestantes <= 0) estado = "vencido";
  else if (minutosRestantes <= 5) estado = "critico";

  return { minutosTranscurridos, minutosRestantes, estado };
}

// 📞 Función para hacer llamada
const handleCall = async (phoneNumber: string) => {
  try {
    await Linking.openURL(`tel:${phoneNumber}`);
  } catch (error) {
    console.error("Error al intentar llamar:", error);
  }
};

// 💬 Función para abrir WhatsApp
const handleWhatsApp = async (phoneNumber: string) => {
  try {
    // Limpiar el número de caracteres no numéricos
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    // Agregar código de país si es necesario (aquí usamos +57 para Colombia)
    const whatsappNumber = cleanNumber.startsWith("57")
      ? cleanNumber
      : `57${cleanNumber}`;

    const whatsappUrl = `whatsapp://send?phone=${whatsappNumber}`;
    const fallbackUrl = `https://wa.me/${whatsappNumber}`;

    try {
      await Linking.openURL(whatsappUrl);
    } catch {
      // Si WhatsApp no está instalado, usar el navegador
      await Linking.openURL(fallbackUrl);
    }
  } catch (error) {
    console.error("Error al intentar abrir WhatsApp:", error);
  }
};

interface Props {
  visible: boolean;
  onClose: () => void;
  pedido: Service | null;
  onTransfer?: () => void;
}

interface ContactModalProps {
  visible: boolean;
  onClose: () => void;
  phoneNumber: string;
  onCall: (phone: string) => void;
  onWhatsApp: (phone: string) => void;
}

// 📞 Modal personalizado para contactar
function ContactModal({
  visible,
  onClose,
  phoneNumber,
  onCall,
  onWhatsApp,
}: ContactModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.contactOverlay}>
        <View style={styles.contactModal}>
          {/* Header */}
          <View style={styles.contactHeader}>
            <Text style={styles.contactTitle}>Contactar cliente</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.normalText} />
            </TouchableOpacity>
          </View>

          {/* Phone display */}
          <View style={styles.phoneDisplay}>
            <Ionicons
              name="call-outline"
              size={28}
              color={Colors.gradientStart}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.phoneNumber}>{phoneNumber}</Text>
          </View>

          {/* Opciones */}
          <View style={styles.optionsContainer}>
            {/* Opción Llamar */}
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                onCall(phoneNumber);
                onClose();
              }}
            >
              <View style={[styles.iconContainer, { backgroundColor: "#4CAF50" }]}>
                <Ionicons name="call" size={24} color="#fff" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Llamar</Text>
                <Text style={styles.optionSubtitle}>
                  Abrir aplicación de teléfono
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.menuText}
              />
            </TouchableOpacity>

            {/* Opción WhatsApp */}
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                onWhatsApp(phoneNumber);
                onClose();
              }}
            >
              <View style={[styles.iconContainer, { backgroundColor: "#25D366" }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#fff" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>WhatsApp</Text>
                <Text style={styles.optionSubtitle}>
                  Enviar mensaje por WhatsApp
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.menuText}
              />
            </TouchableOpacity>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function OrderDetailModal({
  visible,
  onClose,
  pedido,
  onTransfer,
}: Props) {
  if (!pedido) return null;

  const { minutosTranscurridos, minutosRestantes, estado } =
    calcularEstadoTiempo(pedido.createdAt, pedido.prepTime);

  const tiempoColors = {
    ok: "#4CAF50",
    critico: "#FFC107",
    vencido: "#FF3B30",
  };

  const { session, profile } = useAuth();
  const [chatVisible, setChatVisible] = useState(false);
  const [transferVisible, setTransferVisible] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);

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
              <View>
                <Text style={styles.modalTitle}>
                  {pedido.profileStoreName || "Sin tienda"}
                </Text>
                <Text style={styles.serviceId}>#{pedido.id.slice(-4)}</Text>
              </View>
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
                {pedido.zoneName || pedido.zoneId || "Sin zona"}
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
              <TouchableOpacity onPress={() => setContactVisible(true)}>
                <Text style={styles.infoText}>
                  <Text style={styles.label}>Teléfono cliente: </Text>
                  <Text style={styles.phoneLink}>{pedido.phone}</Text>
                </Text>
              </TouchableOpacity>
            </View>

            <ContactModal
              visible={contactVisible}
              onClose={() => setContactVisible(false)}
              phoneNumber={pedido.phone}
              onCall={handleCall}
              onWhatsApp={handleWhatsApp}
            />

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

              <ChatModal
                visible={chatVisible}
                onClose={() => setChatVisible(false)}
                serviceId={pedido.id}
                token={session.access_token}
                userId={profile.id}
              />

              {/* Mostrar botón de transferencia solo para delivery */}
              {profile.role === "delivery" && (
                <>
                  <TouchableOpacity
                    style={styles.transferBtn}
                    onPress={() => setTransferVisible(true)}
                  >
                    <Ionicons
                      name="swap-horizontal-outline"
                      size={18}
                      color="#fff"
                    />
                    <Text style={styles.transferText}>Solicitar</Text>
                  </TouchableOpacity>

                  <RequestTransferModal
                    visible={transferVisible}
                    onClose={() => setTransferVisible(false)}
                    serviceId={pedido.id}
                    currentDeliveryId={profile.id}
                    onSuccess={() => onTransfer?.()}
                  />
                </>
              )}

              {/* Mostrar botón de transferencia para coordinador */}
              {profile.role !== "delivery" && onTransfer && (
                <TouchableOpacity style={styles.transferBtn} onPress={onTransfer}>
                  <Ionicons
                    name="swap-horizontal-outline"
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.transferText}>Transferir a</Text>
                </TouchableOpacity>
              )}
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
  serviceId: {
    fontSize: 12,
    color: Colors.menuText,
    fontWeight: "500",
    marginTop: 2,
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
  phoneLink: {
    color: Colors.gradientStart,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  contactOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  contactModal: {
    backgroundColor: Colors.activeMenuBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  contactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.normalText,
  },
  phoneDisplay: {
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: Colors.Background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  phoneNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.gradientStart,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.Background,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.normalText,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
    color: Colors.menuText,
    fontWeight: "500",
  },
  cancelButton: {
    backgroundColor: Colors.Background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.Border,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.normalText,
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
