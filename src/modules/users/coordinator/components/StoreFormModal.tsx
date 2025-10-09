import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from "react-native";
import { Colors } from "@/constans/colors";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/providers/AuthProvider";
import { createStore, updateStore } from "@/services/stores";
import { Store } from "@/models/store";
import Toast from "react-native-toast-message";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (data?: any) => void;
  store?: Store | null; // opcional, si hay tienda = edición
}

export default function StoreFormModal({
  visible,
  onClose,
  onSave,
  store,
}: Props) {
  const isEditing = !!store;

  const [name, setName] = useState(store?.name || "");
  const [type, setType] = useState<"credito" | "efectivo">(
    store?.type || "efectivo"
  );
  const [loading, setLoading] = useState(false);

  const { session } = useAuth();
  const token = session?.access_token || "";

  useEffect(() => {
    if (store) {
      setName(store.name);
      setType(store.type);
    } else {
      setName("");
      setType("efectivo");
    }
  }, [store, visible]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Toast.show({
        type: "error",
        text1: "Campo requerido",
        text2: "El nombre de la tienda es obligatorio.",
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: name.trim(),
        type,
      };

      if (isEditing && store) {
        const updated = await updateStore(store.id, payload, token);
        Toast.show({
          type: "success",
          text1: "Tienda actualizada",
          text2: `"${updated.name}" fue actualizada correctamente.`,
        });
        onSave(updated);
      } else {
        const created = await createStore(payload, token);
        Toast.show({
          type: "success",
          text1: "Tienda creada",
          text2: `"${created.name}" fue creada correctamente.`,
        });
        onSave(created);
      }

      onClose();
    } catch (err) {
      console.error("❌ Error guardando tienda:", err);
      Toast.show({
        type: "error",
        text1: isEditing ? "Error al actualizar" : "Error al crear",
        text2: "No se pudo guardar la tienda.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.modal}>
              <Text style={styles.title}>
                {isEditing ? "Editar Tienda" : "Nueva Tienda"}
              </Text>

              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre de la tienda"
                placeholderTextColor={Colors.menuText}
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Tipo</Text>
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === "efectivo" && styles.typeButtonActive,
                  ]}
                  onPress={() => setType("efectivo")}
                >
                  <Text
                    style={[
                      styles.typeText,
                      type === "efectivo" && styles.typeTextActive,
                    ]}
                  >
                    Efectivo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === "credito" && styles.typeButtonActive,
                  ]}
                  onPress={() => setType("credito")}
                >
                  <Text
                    style={[
                      styles.typeText,
                      type === "credito" && styles.typeTextActive,
                    ]}
                  >
                    Crédito
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                  <Ionicons name="close" size={20} color={Colors.menuText} />
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmit}
                  style={[styles.saveBtn, loading && { opacity: 0.6 }]}
                  disabled={loading}
                >
                  <Ionicons name="checkmark" size={20} color="#000" />
                  <Text style={styles.saveText}>
                    {loading ? "Guardando..." : "Guardar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// --- estilos ---
// Cambia los estilos de los botones y textos
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#0009",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modal: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.Border,
    width: "100%",
  },
  title: {
    color: Colors.normalText,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  label: { color: Colors.menuText, marginBottom: 4, fontSize: 13 },
  input: {
    backgroundColor: Colors.Background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.Border,
    color: Colors.normalText,
    padding: 10,
    marginBottom: 12,
  },
  typeContainer: { flexDirection: "row", marginBottom: 16 },
  typeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.Border,
    alignItems: "center",
    marginHorizontal: 4,
  },
  typeButtonActive: { backgroundColor: Colors.activeMenuText },
  typeText: { color: Colors.menuText },
  typeTextActive: { color: "#000", fontWeight: "600" },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.Border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelText: { color: Colors.menuText, marginLeft: 4 },
  saveBtn: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#FFF",
  borderRadius: 8,
  paddingHorizontal: 14,
  paddingVertical: 8,
},
saveText: { color: "#000", fontWeight: "600", marginLeft: 4 },

});
