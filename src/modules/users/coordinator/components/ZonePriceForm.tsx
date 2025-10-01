import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DropDownPicker from "react-native-dropdown-picker";
import { Colors } from "@/constans/colors";
import {
  createStoreZonePrice,
  updateStoreZonePrice,
  fetchStoreZonePrices,
} from "@/services/storeZonePrices";
import { fetchZones } from "@/services/zones";
import { Store } from "@/models/store";
import { StoreZonePrice } from "@/models/storeZonePrice";
import { Zone } from "@/models/zone";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  store: Store;
  token: string;
  editing?: StoreZonePrice;
  onClose: () => void;
}

export default function ZonePriceForm({
  store,
  token,
  editing,
  onClose,
}: Props) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneId, setZoneId] = useState(editing?.zoneId || "");
  const [price, setPrice] = useState(editing?.price.toString() || "");

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<{ label: string; value: string }[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [allZonesAdded, setAllZonesAdded] = useState(false);
  const [loading, setLoading] = useState(true); // 👈 estado de carga

  useEffect(() => {
    const loadData = async () => {
      try {
        const branchZones = (await fetchZones(token)).filter(
          (z) => z.branchId === store.branchId
        );
        const storePrices = await fetchStoreZonePrices(store.id, token);

        setZones(branchZones);

        const assignedZoneIds = storePrices.map((p) => p.zoneId);

        if (!editing && assignedZoneIds.length >= branchZones.length) {
          setAllZonesAdded(true);
        }

        const availableZones = editing
          ? branchZones
          : branchZones.filter((z) => !assignedZoneIds.includes(z.id));

        setItems(availableZones.map((z) => ({ label: z.name, value: z.id })));
      } catch (e) {
        setErrorMessage("Error al cargar datos. Intenta nuevamente.");
      } finally {
        setLoading(false); // 👈 termina el loading
      }
    };

    loadData();
  }, []);

  const handleSave = async () => {
    try {
      if (!zoneId || !price) {
        setErrorMessage("Debes seleccionar una zona y un precio válido.");
        return;
      }

      if (editing) {
        await updateStoreZonePrice(
          editing.id,
          { price: Number(price) },
          token
        );
      } else {
        await createStoreZonePrice(
          { store_id: store.id, zone_id: zoneId, price: Number(price) },
          token
        );
      }

      onClose();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setErrorMessage("⚠️ Ya existe un precio para esta zona en la tienda.");
      } else if (err.response?.status === 400) {
        setErrorMessage(
          "La zona y la tienda deben pertenecer a la misma sucursal."
        );
      } else {
        setErrorMessage("Ocurrió un error al guardar. Inténtalo nuevamente.");
      }
    }
  };

  return (
    <Modal visible animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {editing ? "Editar precio" : "Agregar precio"}
          </Text>

          {/* Loading */}
          {loading ? (
            <View style={{ alignItems: "center", marginVertical: 20 }}>
              <ActivityIndicator size="large" color={Colors.gradientStart} />
              <Text style={{ color: Colors.menuText, marginTop: 10 }}>
                Cargando...
              </Text>
              <TouchableOpacity style={styles.cancel} onPress={onClose}>
                <Text style={styles.cancelText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {errorMessage && (
                <Text style={styles.errorText}>{errorMessage}</Text>
              )}

              {allZonesAdded && !editing ? (
                <>
                  <Text style={styles.infoText}>
                    ✅ Todas las zonas de esta sucursal ya han sido integradas en
                    la tienda.
                  </Text>
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.cancel} onPress={onClose}>
                      <Text style={styles.cancelText}>Cerrar</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  {/* Dropdown */}
                  <Text style={styles.label}>Zona</Text>
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
                    listItemLabelStyle={styles.dropdownItem}
                    selectedItemLabelStyle={styles.selectedItem}
                    ArrowDownIconComponent={() => (
                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color={Colors.normalText}
                      />
                    )}
                    ArrowUpIconComponent={() => (
                      <Ionicons
                        name="chevron-up"
                        size={20}
                        color={Colors.normalText}
                      />
                    )}
                  />

                  {/* Precio */}
                  <Text style={styles.label}>Precio</Text>
                  <TextInput
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor={Colors.menuText}
                  />

                  {/* Botones */}
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.cancel} onPress={onClose}>
                      <Text style={styles.cancelText}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{ borderRadius: 12, overflow: "hidden" }}
                      onPress={handleSave}
                    >
                      <LinearGradient
                        colors={[Colors.gradientStart, Colors.gradientEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.save}
                      >
                        <Text style={styles.saveText}>Guardar</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </>
              )}
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
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.menuText,
    marginBottom: 6,
    marginTop: 10,
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
  placeholder: {
    color: Colors.menuText,
    fontSize: 14,
  },
  dropdownText: {
    color: Colors.normalText,
    fontSize: 14,
  },
  dropdownItem: {
    color: Colors.menuText,
  },
  selectedItem: {
    color: "#fff",
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#121212",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    color: Colors.normalText,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
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
  errorText: {
    color: "#ff4d4f",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "500",
  },
  infoText: {
    color: Colors.normalText,
    fontSize: 15,
    marginVertical: 20,
    textAlign: "center",
    fontWeight: "500",
  },
});
