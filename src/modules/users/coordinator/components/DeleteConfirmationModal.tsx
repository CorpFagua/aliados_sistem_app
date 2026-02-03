import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";

interface DeleteConfirmationModalProps {
  visible: boolean;
  userName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function DeleteConfirmationModal({
  visible,
  userName,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  const [inputValue, setInputValue] = useState("");
  const confirmText = "eliminar usuario";
  const isConfirmed = inputValue.toLowerCase().trim() === confirmText;

  const handleConfirm = () => {
    if (isConfirmed && !isLoading) {
      onConfirm();
      setInputValue("");
    }
  };

  const handleCancel = () => {
    setInputValue("");
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="warning" size={32} color="#f44336" />
              </View>
              <Text style={styles.title}>Eliminar domiciliario</Text>
            </View>

            {/* Body */}
            <View style={styles.body}>
              <Text style={styles.message}>
                ¿Estás seguro de que deseas eliminar a{" "}
                <Text style={styles.userName}>"{userName}"</Text>?
              </Text>
              <Text style={styles.warning}>
                Esta acción no se puede deshacer.
              </Text>

              {/* Input para confirmación */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>
                  Escribe <Text style={styles.inputLabelBold}>"eliminar usuario"</Text> para confirmar:
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    isConfirmed && styles.inputConfirmed,
                  ]}
                  placeholder="Escribe aquí..."
                  placeholderTextColor={Colors.menuText}
                  value={inputValue}
                  onChangeText={setInputValue}
                  editable={!isLoading}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Footer - Botones */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.deleteButton,
                  !isConfirmed && styles.deleteButtonDisabled,
                ]}
                onPress={handleConfirm}
                disabled={!isConfirmed || isLoading}
              >
                {isLoading ? (
                  <Ionicons
                    name="hourglass-outline"
                    size={16}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                ) : (
                  <Ionicons
                    name="trash"
                    size={16}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text style={styles.deleteButtonText}>
                  {isLoading ? "Eliminando..." : "Eliminar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  card: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 16,
    width: "85%",
    maxWidth: 400,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.normalText,
    textAlign: "center",
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  message: {
    fontSize: 14,
    color: Colors.normalText,
    lineHeight: 20,
    marginBottom: 8,
  },
  userName: {
    fontWeight: "700",
    color: "#f44336",
  },
  warning: {
    fontSize: 12,
    color: "#f44336",
    fontWeight: "600",
    marginBottom: 16,
  },
  inputSection: {
    marginTop: 12,
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.menuText,
    marginBottom: 8,
    lineHeight: 16,
  },
  inputLabelBold: {
    fontWeight: "700",
    color: Colors.normalText,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.Border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.normalText,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
  },
  inputConfirmed: {
    borderColor: "#4caf50",
    backgroundColor: "rgba(76, 175, 80, 0.05)",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.Border,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.normalText,
  },
  deleteButton: {
    backgroundColor: "#f44336",
  },
  deleteButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
