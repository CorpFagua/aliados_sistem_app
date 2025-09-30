import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { createService } from "@/services/services";
import { Service, toServicePayload } from "@/models/service"; // 👈 importa tu modelo y mapper
import { useAuth } from "@/providers/AuthProvider";

const { width } = Dimensions.get("window");
const isLargeScreen = width > 768;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
}

export default function ServiceFormModal({ visible, onClose, onSuccess }: Props) {
  const [destination, setDestination] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<Service["payment"]>("efectivo");
  const [amount, setAmount] = useState("");
  const [prepTime, setPrepTime] = useState("");

  const { session } = useAuth(); // 🔑 token de Supabase Auth

  const handleSubmit = async () => {
  if (!session) return alert("Debes estar autenticado");

  const createdAt = new Date();

  const newService: Service = {
    id: "",
    destination,
    phone,
    notes,
    payment,
    amount: Number(amount),
    createdAt,
    prepTime: Number(prepTime),
  };

  const payload = toServicePayload(newService);

  try {
    const data = await createService(payload, session.access_token);
    console.log("✅ Servicio creado:", payload);
    if (onSuccess) onSuccess(data);
    onClose();

    // reset form
    setDestination("");
    setPhone("");
    setNotes("");
    setPayment("efectivo");
    setAmount("");
    setPrepTime("");
  } catch (err) {
    alert("❌ Error creando el servicio");
  }
};


  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.cardWrapper, isLargeScreen && styles.cardWrapperLarge]}>
          <View style={styles.card}>
            <Text style={styles.title}>Solicita un domicilio</Text>
            <Text style={styles.subtitle}>Aliados Express</Text>

            {/* Campos */}
            <Text style={styles.label}>Dirección de destino</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Cra 10 #20-30"
              placeholderTextColor={Colors.menuText}
              value={destination}
              onChangeText={setDestination}
            />

            <Text style={styles.label}>Teléfono del cliente</Text>
            <View style={styles.inputIcon}>
              <Ionicons name="call-outline" size={18} color={Colors.menuText} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.inputFlex}
                placeholder="Ej: 3001234567"
                placeholderTextColor={Colors.menuText}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <Text style={styles.label}>Notas adicionales</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: "top" }]}
              placeholder="Ej: Entregar en portería"
              placeholderTextColor={Colors.menuText}
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <Text style={styles.label}>Método de pago</Text>
            <View style={styles.paymentRow}>
              {["efectivo", "transferencia", "tarjeta"].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[styles.paymentOption, payment === method && styles.paymentOptionActive]}
                  onPress={() => setPayment(method as Service["payment"])}
                >
                  <Text style={[styles.paymentText, payment === method && styles.paymentTextActive]}>
                    {method}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Monto a recolectar</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 25000"
              placeholderTextColor={Colors.menuText}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={styles.label}>Tiempo de llegada a la tienda (min)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 15"
              placeholderTextColor={Colors.menuText}
              keyboardType="numeric"
              value={prepTime}
              onChangeText={setPrepTime}
            />

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Crear servicio</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}


const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center" },
  cardWrapper: { borderWidth: 1.5, borderColor: "#FFFFFF", borderRadius: 20, width: "88%" },
  cardWrapperLarge: { width: 500, maxWidth: "90%" },
  card: { backgroundColor: Colors.activeMenuBackground, borderRadius: 18, padding: 22 },
  title: { fontSize: 22, fontWeight: "700", color: Colors.normalText, marginBottom: 6, textAlign: "center" },
  subtitle: { fontSize: 14, color: Colors.menuText, marginBottom: 18, textAlign: "center" },
  label: { fontSize: 13, fontWeight: "600", color: Colors.menuText, marginBottom: 4, marginTop: 8 },
  input: { backgroundColor: "#121212", borderRadius: 12, padding: 12, marginBottom: 10, color: Colors.normalText, borderWidth: 1, borderColor: Colors.Border },
  inputIcon: { flexDirection: "row", alignItems: "center", backgroundColor: "#121212", borderRadius: 12, paddingHorizontal: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.Border },
  inputFlex: { flex: 1, color: Colors.normalText, paddingVertical: 10 },
  paymentRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  paymentOption: { flex: 1, padding: 10, marginHorizontal: 4, borderRadius: 10, borderWidth: 1, borderColor: Colors.Border, alignItems: "center" },
  paymentOptionActive: { backgroundColor: Colors.normalText },
  paymentText: { color: Colors.menuText, fontSize: 13, fontWeight: "500" },
  paymentTextActive: { color: "#000", fontWeight: "700" },
  button: { backgroundColor: Colors.normalText, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 12 },
  buttonText: { fontSize: 15, fontWeight: "700", color: "#000" },
  cancelButton: { marginTop: 14, alignItems: "center", paddingVertical: 12 },
  cancelText: { color: Colors.menuText, fontSize: 14, fontWeight: "500" },
});
