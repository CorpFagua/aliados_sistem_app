import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constans/colors";
import { Service } from "@/models/service";
import { cancelService } from "@/services/services";
import { useAuth } from "@/providers/AuthProvider";

interface Props {
  visible: boolean;
  pedido: Service | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CancelServiceModal({
  visible,
  pedido,
  onClose,
  onSuccess,
}: Props) {
  const { session } = useAuth();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!reason.trim()) {
      Alert.alert("Error", "Por favor ingresa una razón para cancelar");
      return;
    }

    if (!pedido || !session) return;

    try {
      setLoading(true);
      await cancelService(pedido.id, reason, session.access_token);

      Alert.alert("Éxito", "Servicio cancelado correctamente");
      setReason("");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("❌ Error cancelando servicio:", err);
      Alert.alert(
        "Error",
        err?.response?.data?.error || "No se pudo cancelar el servicio"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="close-circle-outline" size={32} color="#FF3B30" />
            <Text style={styles.title}>Cancelar Servicio</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.menuText} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.subtitle}>
              ¿Estás seguro de que deseas cancelar este servicio?
            </Text>

            {pedido && (
              <View style={styles.serviceInfo}>
                <Text style={styles.infoLabel}>Servicio:</Text>
                <Text style={styles.infoValue}>#{pedido.id}</Text>

                <Text style={styles.infoLabel}>Dirección de entrega:</Text>
                <Text style={styles.infoValue} numberOfLines={2}>
                  {pedido.destination}
                </Text>

                {pedido.clientName && (
                  <>
                    <Text style={styles.infoLabel}>Cliente:</Text>
                    <Text style={styles.infoValue}>{pedido.clientName}</Text>
                  </>
                )}
              </View>
            )}

            <Text style={styles.reasonLabel}>
              Razón de cancelación: <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Describe por qué cancelas este servicio..."
              placeholderTextColor={Colors.menuText}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              editable={!loading}
            />

            <Text style={styles.characterCount}>
              {reason.length} caracteres
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Atrás</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
              onPress={handleCancel}
              disabled={loading || !reason.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <LinearGradient
                  colors={[Colors.gradientStart, Colors.gradientEnd]}
                  style={styles.gradientButton}
                >
                  <Ionicons name="trash-outline" size={18} color="#000" />
                  <Text style={styles.confirmButtonText}>Cancelar</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    maxWidth: 400,
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ffffff06",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF3B30",
    flex: 1,
    marginLeft: 12,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.menuText,
    marginBottom: 16,
    fontWeight: "500",
  },
  serviceInfo: {
    backgroundColor: "#ffffff06",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.menuText,
    fontWeight: "600",
    marginTop: 8,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.activeMenuText,
    marginTop: 4,
    marginBottom: 8,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.activeMenuText,
    marginBottom: 8,
  },
  required: {
    color: "#FF3B30",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ffffff12",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.activeMenuText,
    fontSize: 14,
    backgroundColor: "#ffffff04",
    minHeight: 100,
    textAlignVertical: "top",
  },
  characterCount: {
    fontSize: 12,
    color: Colors.menuText,
    marginTop: 6,
    textAlign: "right",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#ffffff06",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffffff12",
    alignItems: "center",
  },
  cancelButtonText: {
    color: Colors.menuText,
    fontSize: 14,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  confirmButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "700",
  },
});
