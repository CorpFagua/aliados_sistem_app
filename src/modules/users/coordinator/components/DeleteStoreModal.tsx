// src/modules/users/coordinator/components/DeleteStoreModal.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { Store } from "@/models/store";

interface DeleteStoreModalProps {
  visible: boolean;
  store: Store | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export default function DeleteStoreModal({
  visible,
  store,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteStoreModalProps) {
  const [confirmText, setConfirmText] = useState("");

  // Resetear el input cuando se abre/cierra el modal
  useEffect(() => {
    if (visible) {
      setConfirmText("");
    }
  }, [visible]);

  if (!store) return null;

  const isConfirmValid = confirmText.trim() === store.name.trim();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header con ícono de advertencia */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="warning" size={48} color="#FF6B6B" />
            </View>
            <Text style={styles.title}>¿Eliminar Tienda?</Text>
          </View>

          {/* Nombre de la tienda */}
          <View style={styles.storeNameContainer}>
            <Text style={styles.storeName}>{store.name}</Text>
          </View>

          {/* Advertencia */}
          <View style={styles.warningBox}>
            <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
            <Text style={styles.warningText}>
              Esta acción NO es reversible
            </Text>
          </View>

          {/* Lista de consecuencias */}
          <View style={styles.consequencesContainer}>
            <Text style={styles.consequencesTitle}>
              Al eliminar esta tienda:
            </Text>

            <View style={styles.consequenceItem}>
              <Ionicons name="close-circle" size={18} color="#FF6B6B" />
              <Text style={styles.consequenceText}>
                La tienda se marcará como eliminada y no aparecerá en listados
              </Text>
            </View>

            <View style={styles.consequenceItem}>
              <Ionicons name="person-remove" size={18} color="#FF6B6B" />
              <Text style={styles.consequenceText}>
                Todos los usuarios asociados a esta tienda serán desactivados
              </Text>
            </View>

            <View style={styles.consequenceItem}>
              <Ionicons name="trash" size={18} color="#FF6B6B" />
              <Text style={styles.consequenceText}>
                Las cuentas de autenticación de estos usuarios serán eliminadas permanentemente
              </Text>
            </View>

            <View style={styles.consequenceItem}>
              <Ionicons name="lock-closed" size={18} color="#FF6B6B" />
              <Text style={styles.consequenceText}>
                Los usuarios no podrán volver a iniciar sesión
              </Text>
            </View>
          </View>

          {/* Campo de confirmación */}
          <View style={styles.confirmationContainer}>
            <Text style={styles.confirmationLabel}>
              Escribe <Text style={styles.storeNameLabel}>"{store.name}"</Text> para confirmar:
            </Text>
            <TextInput
              style={[
                styles.confirmInput,
                isConfirmValid && styles.confirmInputValid,
              ]}
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder={`Escribe: ${store.name}`}
              placeholderTextColor={Colors.menuText}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isDeleting}
            />
          </View>

          {/* Botones de acción */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isDeleting}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.deleteButton,
                (!isConfirmValid || isDeleting) && styles.deleteButtonDisabled,
              ]}
              onPress={onConfirm}
              disabled={!isConfirmValid || isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="trash" size={18} color="#FFF" />
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </>
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
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 500,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 107, 107, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.normalText,
    textAlign: "center",
  },
  storeNameContainer: {
    backgroundColor: Colors.Background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  storeName: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.normalText,
    textAlign: "center",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
  },
  warningText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF6B6B",
    marginLeft: 8,
  },
  consequencesContainer: {
    marginBottom: 24,
  },
  consequencesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.normalText,
    marginBottom: 12,
  },
  consequenceItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  consequenceText: {
    flex: 1,
    fontSize: 14,
    color: Colors.menuText,
    marginLeft: 10,
    lineHeight: 20,
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  cancelButton: {
    backgroundColor: Colors.Background,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.normalText,
  },
  deleteButton: {
    backgroundColor: "#FF6B6B",
  },
  deleteButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  confirmationContainer: {
    marginBottom: 20,
  },
  confirmationLabel: {
    fontSize: 14,
    color: Colors.normalText,
    marginBottom: 10,
    lineHeight: 20,
  },
  storeNameLabel: {
    fontWeight: "700",
    color: "#FF6B6B",
  },
  confirmInput: {
    backgroundColor: Colors.Background,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: Colors.normalText,
    borderWidth: 2,
    borderColor: Colors.Border,
  },
  confirmInputValid: {
    borderColor: "#10B981",
    backgroundColor: "rgba(16, 185, 129, 0.05)",
  },
});
