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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { createUser } from "@/services/users";
import { useAuth } from "@/providers/AuthProvider";
import { Role } from "@/models/user";
import Toast from "react-native-toast-message";

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
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


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

    if (form.password !== form.confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Contraseñas no coinciden",
        text2: "La contraseña y la confirmación deben ser iguales.",
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

      setForm({ name: "", phone: "", address: "", email: "", password: "", confirmPassword: "" });
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
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Ionicons 
                  name="person-add-outline" 
                  size={32} 
                  color={Colors.normalText} 
                />
              </View>
              <Text style={styles.title}>Nuevo Usuario de Tienda</Text>
            </View>

            {/* Campos de Texto */}
            <View style={styles.section}>
              <View style={styles.fieldContainer}>
                <View style={styles.fieldLabel}>
                  <Ionicons name="person" size={18} color={Colors.normalText} />
                  <Text style={styles.labelText}>Nombre Completo</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Juan Carlos Pérez"
                  placeholderTextColor={Colors.menuText}
                  value={form.name}
                  onChangeText={(text) => handleChange("name", text)}
                />
              </View>

              <View style={styles.fieldContainer}>
                <View style={styles.fieldLabel}>
                  <Ionicons name="mail" size={18} color={Colors.normalText} />
                  <Text style={styles.labelText}>Correo Electrónico</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor={Colors.menuText}
                  value={form.email}
                  onChangeText={(text) => handleChange("email", text)}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.fieldContainer}>
                <View style={styles.fieldLabel}>
                  <Ionicons name="lock-closed" size={18} color={Colors.normalText} />
                  <Text style={styles.labelText}>Contraseña</Text>
                </View>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Mínimo 8 caracteres"
                    placeholderTextColor={Colors.menuText}
                    secureTextEntry={!showPassword}
                    value={form.password}
                    onChangeText={(text) => handleChange("password", text)}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color={Colors.menuText}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <View style={styles.fieldLabel}>
                  <Ionicons name="lock-closed" size={18} color={Colors.normalText} />
                  <Text style={styles.labelText}>Confirmar Contraseña</Text>
                </View>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Repite la contraseña"
                    placeholderTextColor={Colors.menuText}
                    secureTextEntry={!showConfirmPassword}
                    value={form.confirmPassword}
                    onChangeText={(text) => handleChange("confirmPassword", text)}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={20}
                      color={Colors.menuText}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <View style={styles.fieldLabel}>
                  <Ionicons name="call" size={18} color={Colors.normalText} />
                  <Text style={styles.labelText}>Teléfono</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="+57 312 1234567"
                  placeholderTextColor={Colors.menuText}
                  value={form.phone}
                  onChangeText={(text) => handleChange("phone", text)}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.fieldContainer}>
                <View style={styles.fieldLabel}>
                  <Ionicons name="location" size={18} color={Colors.normalText} />
                  <Text style={styles.labelText}>Dirección</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  placeholder="Calle y número"
                  placeholderTextColor={Colors.menuText}
                  value={form.address}
                  onChangeText={(text) => handleChange("address", text)}
                  multiline
                />
              </View>
            </View>

            {/* Botones */}
            <View style={styles.footer}>
              <TouchableOpacity 
                onPress={onClose} 
                style={[styles.btn, styles.cancelBtn]}
              >
                <Ionicons name="close" size={18} color={Colors.normalText} />
                <Text style={[styles.btnText, { color: Colors.normalText }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleSubmit} 
                style={[styles.btn, styles.saveBtn, loading && styles.btnDisabled]}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                ) : (
                  <Ionicons name="checkmark" size={18} color="#fff" />
                )}
                <Text style={[styles.btnText, { color: "#fff" }]}>
                  {loading ? "Creando..." : "Guardar"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    width: "100%",
    backgroundColor: Colors.Background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 32,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.activeMenuBackground,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.Border,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.normalText,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  section: {
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  labelText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.normalText,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.normalText,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.Border,
    marginBottom: 16,
  },
  eyeIcon: {
    padding: 12,
  },
  inputMultiline: {
    textAlignVertical: "top",
    minHeight: 80,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontWeight: "600",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelBtn: {
    backgroundColor: Colors.activeMenuBackground,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  saveBtn: {
    backgroundColor: "#2196f3",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
