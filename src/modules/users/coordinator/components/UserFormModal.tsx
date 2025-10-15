import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { createUser } from "@/services/users";
import { useAuth } from "@/providers/AuthProvider";
import { Role } from "@/models/user";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

interface Props {
  visible: boolean;
  storeId: string;
  role:Role;
  onClose: () => void;
  onSave: () => void;
}

export default function UserFormModal({ visible, storeId,role, onClose, onSave }: Props) {
  const { session } = useAuth();
  const token = session?.access_token || "";

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);


  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      Toast.show({
        type: "error",
        text1: "Campos obligatorios",
        text2: "Nombre, correo y contraseña son requeridos.",
      });
      return;
    }

    try {
      setLoading(true);
      await createUser(
        {
          name: form.name,
          phone: form.phone,
          address: form.address,
          email: form.email,
          password: form.password,
          role,
          store_id: storeId,
        },
        token
      );

      Toast.show({
        type: "success",
        text1: "Usuario creado con éxito",
        text2: `${form.name} fue agregado a la tienda.`,
      });

      setForm({ name: "", phone: "", address: "", email: "", password: "" });
      onSave();
    } catch (err) {
      console.error(err);
      Toast.show({
        type: "error",
        text1: "Error al crear usuario",
        text2: "Verifica los datos o la conexión.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="person-add-outline" size={22} color={Colors.activeMenuText} />
              <Text style={styles.title}>Nuevo usuario</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.menuText} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 420 }}>
            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              placeholderTextColor={Colors.menuText}
              value={form.name}
              onChangeText={(text) => handleChange("name", text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Teléfono"
              placeholderTextColor={Colors.menuText}
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(text) => handleChange("phone", text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Dirección"
              placeholderTextColor={Colors.menuText}
              value={form.address}
              onChangeText={(text) => handleChange("address", text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor={Colors.menuText}
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(text) => handleChange("email", text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor={Colors.menuText}
              secureTextEntry
              value={form.password}
              onChangeText={(text) => handleChange("password", text)}
            />
          </ScrollView>

          <TouchableOpacity
            style={[styles.submit, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Crear usuario</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const MAX_CARD_WIDTH = 420;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  card: {
    width: width * 0.9,
    maxWidth: MAX_CARD_WIDTH,
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.Border,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    color: Colors.normalText,
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 6,
  },
  closeBtn: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 8,
    padding: 5,
  },
  input: {
    backgroundColor: Colors.Background,
    color: Colors.normalText,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(0,255,178,0.25)",
  },
  submit: {
    backgroundColor: "#00FFB2",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#00FFB2",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  submitText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 15,
  },
});
