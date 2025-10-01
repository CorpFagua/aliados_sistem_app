import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { fetchZones } from "@/services/zones";
import { assignZoneToService } from "@/services/services";
import { Zone } from "@/models/zone";
import { Service } from "@/models/service";

interface Props {
  visible: boolean;
  service: Service | null;
  token: string;
  onClose: () => void;
  onAssigned: (updated: Service) => void;
}

export default function AssignZoneModal({
  visible,
  service,
  token,
  onClose,
  onAssigned,
}: Props) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !service) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchZones(token);
        const branchZones = data.filter((z) => z.branchId === service.branchId);
        setZones(branchZones);
        setItems(branchZones.map((z) => ({ label: z.name, value: z.id })));
      } catch (e) {
        setError("❌ Error cargando zonas.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [visible, service]);

  const handleSave = async () => {
    if (!service || !zoneId) {
      setError("Debes seleccionar una zona");
      return;
    }

    try {
      setSaving(true);
      const updated = await assignZoneToService(service.id, zoneId, token);
      onAssigned(updated);
      onClose();
    } catch (e: any) {
      setError("❌ No se pudo asignar la zona.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Asignar zona</Text>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.gradientStart} />
          ) : (
            <>
              {error && <Text style={styles.error}>{error}</Text>}

              <DropDownPicker
                open={open}
                value={zoneId}
                items={items}
                setOpen={setOpen}
                setValue={setZoneId}
                setItems={setItems}
                placeholder="Selecciona una zona..."
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                placeholderStyle={styles.placeholder}
                textStyle={styles.dropdownText}
                ArrowDownIconComponent={() => (
                  <Ionicons name="chevron-down" size={20} color="#fff" />
                )}
                ArrowUpIconComponent={() => (
                  <Ionicons name="chevron-up" size={20} color="#fff" />
                )}
              />

              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancel} onPress={onClose}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ borderRadius: 12, overflow: "hidden" }}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <LinearGradient
                    colors={[Colors.gradientStart, Colors.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.save}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveText}>Asignar</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}
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
  card: {
    width: "90%",
    maxWidth: 420,
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.normalText,
    marginBottom: 16,
    textAlign: "center",
  },
  error: {
    color: "#ff4d4f",
    textAlign: "center",
    marginBottom: 10,
  },
  dropdown: {
    backgroundColor: "#121212",
    borderColor: Colors.Border,
    borderRadius: 12,
    marginBottom: 14,
  },
  dropdownContainer: {
    backgroundColor: "#1c1c1e",
    borderColor: Colors.Border,
    borderRadius: 12,
  },
  placeholder: { color: Colors.menuText },
  dropdownText: { color: Colors.normalText },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  cancel: { padding: 12, marginRight: 8 },
  cancelText: { color: Colors.menuText, fontSize: 15, fontWeight: "500" },
  save: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
