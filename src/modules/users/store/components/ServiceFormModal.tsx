import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { createService } from "@/services/services";
import { Service, toServicePayload } from "@/models/service"; // 👈 importa tu modelo y mapper
import { useAuth } from "@/providers/AuthProvider";
import Toast from "react-native-toast-message";

const { width, height } = Dimensions.get("window");
const isLargeScreen = width > 768;
const isMobile = width < 768;
const isSmallDevice = width < 375;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
}

export default function ServiceFormModal({ visible, onClose, onSuccess }: Props) {
  const [destination, setDestination] = useState("");
  const [phone, setPhone] = useState("");
  const [clientName, setClientName] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<Service["payment"]>("efectivo");
  const [amount, setAmount] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [loading, setLoading] = useState(false);

  const { session, logout } = useAuth(); // 🔑 token de Supabase Auth + función logout

  const handleSubmit = async () => {
  if (!session) return alert("Debes estar autenticado");
  if (loading) return; // Prevenir doble envío

  setLoading(true);
  const createdAt = new Date();

  const newService: Service = {
    id: "",
    destination,
    phone,
    clientName,
    notes,
    payment,
    amount: payment === "transferencia" ? 0 : Number(amount),
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
    setClientName("");
    setNotes("");
    setPayment("efectivo");
    setAmount("");
    setPrepTime("");
  } catch (err: any) {
    console.error("❌ Error creando servicio:", err);
    
    // Si es error de cuenta inactiva
    if (err.response?.status === 403 && err.response?.data?.error === 'inactive_account') {
      Toast.show({
        type: 'error',
        text1: 'Cuenta desactivada',
        text2: err.response?.data?.message || 'Tu cuenta ha sido desactivada. Contacta al administrador.',
        position: 'top',
        visibilityTime: 4000,
      });
      
      // Cerrar modal primero
      onClose();
      
      // Forzar logout después de un pequeño delay
      setTimeout(async () => {
        await logout();
      }, 1000);
      
      return;
    }
    
    // Para otros errores, mostrar alerta
    Alert.alert(
      "Error",
      "No se pudo crear el servicio. Intenta nuevamente.",
      [{ text: "OK" }]
    );
  } finally {
    setLoading(false);
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
          {/* HEADER FIJO */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Solicita un domicilio</Text>
              <Text style={styles.subtitle}>Aliados Express</Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={24} color={Colors.normalText} />
            </TouchableOpacity>
          </View>

          {/* SCROLL CONTENT */}
          <ScrollView 
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={true}
            scrollIndicatorInsets={{ right: 1 }}
          >
            {/* Campos */}
            <Text style={styles.label}>Dirección de destino</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Cra 10 #20-30"
              placeholderTextColor={Colors.menuText}
              value={destination}
              onChangeText={setDestination}
              editable={!loading}
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
                editable={!loading}
              />
            </View>

            <Text style={styles.label}>Nombre del cliente</Text>
            <View style={styles.inputIcon}>
              <Ionicons name="person-outline" size={18} color={Colors.menuText} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.inputFlex}
                placeholder="Ej: Juan Pérez"
                placeholderTextColor={Colors.menuText}
                value={clientName}
                onChangeText={setClientName}
                editable={!loading}
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
              editable={!loading}
            />

            <Text style={styles.label}>Método de pago</Text>
            <View style={styles.paymentRow}>
              {["efectivo", "transferencia"].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[styles.paymentOption, payment === method && styles.paymentOptionActive]}
                  onPress={() => setPayment(method as Service["payment"])}
                  disabled={loading}
                >
                  <Text style={[styles.paymentText, payment === method && styles.paymentTextActive]}>
                    {method}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {payment === "efectivo" && (
              <>
                <Text style={styles.label}>Monto a recolectar</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 25000"
                  placeholderTextColor={Colors.menuText}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  editable={!loading}
                />
              </>
            )}

            <Text style={styles.label}>Tiempo de llegada a la tienda (min)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 15"
              placeholderTextColor={Colors.menuText}
              keyboardType="numeric"
              value={prepTime}
              onChangeText={setPrepTime}
              editable={!loading}
            />
          </ScrollView>

          {/* FOOTER FIJO */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.buttonText}>Crear servicio</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Cancelar</Text>
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
    backgroundColor: "rgba(0,0,0,0.95)", 
    justifyContent: "center", 
    alignItems: "center",
    paddingHorizontal: isMobile ? 12 : 20,
  },
  
  cardWrapper: { 
    borderWidth: 1.5, 
    borderColor: "#FFFFFF22", 
    borderRadius: 20, 
    width: "100%",
    maxWidth: isLargeScreen ? 550 : isMobile ? "100%" : 480,
    maxHeight: isMobile ? Math.min(height * 0.9, 700) : Math.min(height * 0.85, 750),
    overflow: "hidden",
    backgroundColor: Colors.activeMenuBackground,
  },
  
  cardWrapperLarge: { 
    width: 550, 
    maxWidth: "100%",
    maxHeight: Math.min(height * 0.85, 750),
  },
  
  header: { 
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: Colors.activeMenuBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
    padding: isSmallDevice ? 14 : 18,
    paddingVertical: isSmallDevice ? 12 : 16,
  },
  
  scrollContent: {
    flex: 1,
  },
  
  scrollContentContainer: {
    padding: isSmallDevice ? 14 : 18,
    paddingTop: isSmallDevice ? 12 : 16,
    paddingBottom: 16,
  },
  
  footer: {
    backgroundColor: Colors.activeMenuBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.Border,
    paddingHorizontal: isSmallDevice ? 14 : 18,
    paddingVertical: isSmallDevice ? 10 : 14,
    paddingBottom: isSmallDevice ? 10 : 14,
  },

  title: { 
    fontSize: isSmallDevice ? 18 : 20, 
    fontWeight: "700", 
    color: Colors.normalText,
    marginBottom: 4,
  },
  
  subtitle: { 
    fontSize: isSmallDevice ? 12 : 13, 
    color: Colors.menuText,
  },
  
  label: { 
    fontSize: isSmallDevice ? 12 : 13, 
    fontWeight: "600", 
    color: Colors.menuText, 
    marginBottom: isSmallDevice ? 6 : 8,
    marginTop: isSmallDevice ? 10 : 12,
  },
  
  input: { 
    backgroundColor: "#121212", 
    borderRadius: 10, 
    padding: isSmallDevice ? 10 : 12, 
    marginBottom: isSmallDevice ? 8 : 10, 
    color: Colors.normalText, 
    borderWidth: 1, 
    borderColor: Colors.Border,
    fontSize: isSmallDevice ? 12 : 13,
  },
  
  inputIcon: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#121212", 
    borderRadius: 10, 
    paddingHorizontal: isSmallDevice ? 10 : 12, 
    marginBottom: isSmallDevice ? 8 : 10, 
    borderWidth: 1, 
    borderColor: Colors.Border,
  },
  
  inputFlex: { 
    flex: 1, 
    color: Colors.normalText, 
    paddingVertical: isSmallDevice ? 8 : 10,
    fontSize: isSmallDevice ? 12 : 13,
  },
  
  paymentRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: isSmallDevice ? 10 : 12,
    gap: isSmallDevice ? 6 : 8,
  },
  
  paymentOption: { 
    flex: 1, 
    padding: isSmallDevice ? 8 : 10, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: Colors.Border, 
    alignItems: "center",
  },
  
  paymentOptionActive: { 
    backgroundColor: Colors.normalText 
  },
  
  paymentText: { 
    color: Colors.menuText, 
    fontSize: isSmallDevice ? 11 : 12, 
    fontWeight: "500" 
  },
  
  paymentTextActive: { 
    color: "#000", 
    fontWeight: "700" 
  },
  
  button: { 
    backgroundColor: Colors.normalText, 
    borderRadius: 10, 
    paddingVertical: isSmallDevice ? 12 : 14, 
    alignItems: "center",
    marginBottom: 10,
  },
  
  buttonDisabled: { 
    opacity: 0.6 
  },
  
  buttonText: { 
    fontSize: isSmallDevice ? 13 : 14, 
    fontWeight: "700", 
    color: "#000" 
  },
  
  cancelButton: { 
    alignItems: "center", 
    paddingVertical: isSmallDevice ? 10 : 12,
  },
  
  cancelText: { 
    color: Colors.menuText, 
    fontSize: isSmallDevice ? 12 : 13, 
    fontWeight: "500" 
  },
});
