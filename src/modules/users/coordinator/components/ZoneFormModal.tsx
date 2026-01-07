import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Switch,
} from "react-native";
import { Colors } from "@/constans/colors";
import { createZone, updateZone } from "@/services/zones";
import { Zone, toZonePayload } from "@/models/zone";
import { useAuth } from "@/providers/AuthProvider";

const { width } = Dimensions.get("window");
const isLargeScreen = width > 768;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (data: Zone) => void;
  zone?: Zone | null; // 👈 si existe, estamos editando
}

export default function ZoneFormModal({ visible, onClose, onSuccess, zone }: Props) {
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { session } = useAuth();

  // 🔄 Cargar datos si estamos editando
  useEffect(() => {
    if (zone) {
      setName(zone.name);
      setIsActive(zone.isActive);
    } else {
      setName("");
      setIsActive(true);
    }
  }, [zone]);

  const handleSubmit = async () => {
    if (!session) return alert("Debes estar autenticado");

    try {
      let data: Zone;

      if (zone) {
        // 👉 Editar existente
        data = await updateZone(
          zone.id,
          { name, is_active: isActive },
          session.access_token
        );
      } else {
        // 👉 Crear nuevo
        const newZone: Zone = {
          id: "",
          name,
          branchId: "",
          isActive,
          createdAt: new Date(),
        };
        data = await createZone(toZonePayload(newZone), session.access_token);
      }

      if (onSuccess) onSuccess(data);
      onClose();
    } catch (err) {
      alert("❌ Error guardando la zona");
      console.error(err);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.cardWrapper, isLargeScreen && styles.cardWrapperLarge]}>
          <View style={styles.card}>
            <Text style={styles.title}>{zone ? "Editar zona" : "Crear nueva zona"}</Text>
            <Text style={styles.subtitle}>
              {zone ? "Actualiza los datos de la zona" : "Define los parámetros de tu zona"}
            </Text>

            {/* Campo nombre */}
            <Text style={styles.label}>Nombre de la zona</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Zona Norte"
              placeholderTextColor={Colors.menuText}
              value={name}
              onChangeText={setName}
            />

            {/* Switch activo/inactivo */}
            <View style={styles.switchRow}>
              <Text style={styles.label}>Zona activa</Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                thumbColor={isActive ? Colors.normalText : "#666"}
              />
            </View>

            {/* Botones */}
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>{zone ? "Actualizar" : "Crear zona"}</Text>
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardWrapper: {
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    borderRadius: 20,
    width: "88%",
  },
  cardWrapperLarge: { width: 500, maxWidth: "90%" },
  card: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 18,
    padding: 22,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.normalText,
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: Colors.menuText,
    marginBottom: 18,
    textAlign: "center",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.menuText,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#121212",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    color: Colors.normalText,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 12,
  },
  button: {
    backgroundColor: Colors.normalText,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: { fontSize: 15, fontWeight: "700", color: "#000" },
  cancelButton: { marginTop: 14, alignItems: "center", paddingVertical: 12 },
  cancelText: { color: Colors.menuText, fontSize: 14, fontWeight: "500" },
});
