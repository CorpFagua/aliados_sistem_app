import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Colors } from "@/constans/colors";

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
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // 🔹 Función para limpiar el formulario
  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setAddress("");
  };

  // 🔹 Cargar datos iniciales o limpiar si no hay
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setEmail(initialData.email || "");
      setPhone(initialData.phone || "");
      setAddress(initialData.address || "");
      setPassword("");
    } else {
      resetForm();
    }
  }, [initialData, visible]);

  const handleSubmit = () => {
    if (!name || (!initialData && (!email || !password))) return;
    onSave({ name, email, password, phone, address });
    resetForm(); // 🔹 Limpiar después de guardar
    onClose();   // 🔹 Cerrar modal después de guardar
  };

  const handleCancel = () => {
    resetForm(); // 🔹 Limpiar campos al cancelar
    onClose();   // 🔹 Cerrar modal
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>
            {initialData ? "Editar domiciliario" : "Nuevo domiciliario"}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Nombre completo"
            placeholderTextColor={Colors.menuText}
            value={name}
            onChangeText={setName}
          />

          {!initialData && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor={Colors.menuText}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor={Colors.menuText}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="Teléfono"
            placeholderTextColor={Colors.menuText}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Dirección"
            placeholderTextColor={Colors.menuText}
            value={address}
            onChangeText={setAddress}
          />

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleCancel} style={[styles.btn, styles.cancel]}>
              <Text style={styles.btnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} style={[styles.btn, styles.save]}>
              <Text style={[styles.btnText, { color: "#000" }]}>Guardar</Text>
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
    backgroundColor: "#0008",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "90%",
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 16,
    padding: 20,
  },
  title: { fontSize: 18, fontWeight: "700", color: Colors.normalText, marginBottom: 14 },
  input: {
    backgroundColor: Colors.Background,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    color: Colors.normalText,
  },
  footer: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginLeft: 10,
  },
  cancel: { backgroundColor: Colors.Border },
  save: { backgroundColor: Colors.normalText },
  btnText: { color: Colors.normalText, fontWeight: "600" },
});
