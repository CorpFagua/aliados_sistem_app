import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import Toast from "react-native-toast-message";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (values: any) => void;
  initialData?: any | null;
}

export default function DeliveryFormModal({ visible, onClose, onSave, initialData }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isVIP, setIsVIP] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setPhone("");
    setAddress("");
    setIsVIP(false);
  };

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setEmail(initialData.email || "");
      setPhone(initialData.phone || "");
      setAddress(initialData.address || "");
      setIsVIP(initialData.is_VIP || initialData.isVIP || false);
      setPassword("");
    } else {
      resetForm();
    }
  }, [initialData, visible]);

  const handleSubmit = () => {
    if (!name.trim()) {
      Toast.show({
        type: "error",
        text1: "Campo obligatorio",
        text2: "El nombre es requerido.",
      });
      return;
    }
    if (!initialData && (!email.trim() || !password.trim())) {
      Toast.show({
        type: "error",
        text1: "Campos obligatorios",
        text2: "Correo y contraseña son requeridos.",
      });
      return;
    }
    if (!initialData && password !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Contraseñas no coinciden",
        text2: "La contraseña y la confirmación deben ser iguales.",
      });
      return;
    }
    onSave({ name, email, password, phone, address, is_VIP: isVIP });
    resetForm();
    onClose();
  };

  const handleCancel = () => {
    resetForm();
    onClose();
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
                  name={initialData ? "person-outline" : "person-add-outline"} 
                  size={32} 
                  color={Colors.normalText} 
                />
              </View>
              <Text style={styles.title}>
                {initialData ? "Editar Domiciliario" : "Nuevo Domiciliario"}
              </Text>
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
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {!initialData && (
                <>
                  <View style={styles.fieldContainer}>
                    <View style={styles.fieldLabel}>
                      <Ionicons name="mail" size={18} color={Colors.normalText} />
                      <Text style={styles.labelText}>Correo Electrónico</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="ejemplo@correo.com"
                      placeholderTextColor={Colors.menuText}
                      value={email}
                      onChangeText={setEmail}
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
                        value={password}
                        onChangeText={setPassword}
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
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
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
                </>
              )}

              <View style={styles.fieldContainer}>
                <View style={styles.fieldLabel}>
                  <Ionicons name="call" size={18} color={Colors.normalText} />
                  <Text style={styles.labelText}>Teléfono</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="+57 312 1234567"
                  placeholderTextColor={Colors.menuText}
                  value={phone}
                  onChangeText={setPhone}
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
                  value={address}
                  onChangeText={setAddress}
                  multiline
                />
              </View>
            </View>

            {/* VIP Status */}
            <View style={styles.vipSection}>
              <View style={styles.vipHeader}>
                <View style={styles.vipIconContainer}>
                  <Ionicons name="star" size={20} color="#d4af37" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vipTitle}>Estado VIP</Text>
                  <Text style={styles.vipDescription}>
                    Los VIP ven pedidos inmediatamente sin delay
                  </Text>
                </View>
                <Switch
                  value={isVIP}
                  onValueChange={setIsVIP}
                  trackColor={{ false: Colors.Border, true: "#4caf50" }}
                  thumbColor={isVIP ? "#2e7d32" : "#f4f3f4"}
                  style={{ transform: [{ scale: 1.1 }] }}
                />
              </View>
            </View>

            {/* Botones */}
            <View style={styles.footer}>
              <TouchableOpacity 
                onPress={handleCancel} 
                style={[styles.btn, styles.cancelBtn]}
              >
                <Ionicons name="close" size={18} color={Colors.normalText} />
                <Text style={[styles.btnText, { color: Colors.normalText }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleSubmit} 
                style={[styles.btn, styles.saveBtn]}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={[styles.btnText, { color: "#fff" }]}>Guardar</Text>
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
    backgroundColor: "#0009",
    justifyContent: "flex-end",
  },
  modal: {
    width: "100%",
    backgroundColor: Colors.activeMenuBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: "90%",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.Background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { 
    fontSize: 20, 
    fontWeight: "800", 
    color: Colors.normalText, 
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
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
    fontSize: 13,
    fontWeight: "600",
    color: Colors.normalText,
  },
  input: {
    backgroundColor: Colors.Background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.normalText,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.Background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  eyeIcon: {
    padding: 12,
  },
  inputMultiline: {
    textAlignVertical: "top",
    minHeight: 60,
  },
  vipSection: {
    backgroundColor: Colors.Background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#d4af37",
    marginBottom: 20,
  },
  vipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  vipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  vipTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.normalText,
    marginBottom: 2,
  },
  vipDescription: {
    fontSize: 12,
    color: Colors.menuText,
    fontWeight: "500",
  },
  footer: { 
    flexDirection: "row", 
    gap: 12,
    justifyContent: "space-between",
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontWeight: "600",
  },
  cancelBtn: { 
    backgroundColor: Colors.Background,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  saveBtn: { 
    backgroundColor: "#2196f3",
  },
  btnText: { 
    fontWeight: "700",
    fontSize: 14,
  },
});
