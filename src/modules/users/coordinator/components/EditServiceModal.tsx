/**
 * EditServiceModal - Modal para editar servicios desde el historial
 * 
 * CAMPOS EDITABLES:
 * - Domiciliario (con búsqueda)
 * - Zona (dropdown)
 * - Notas
 * - Teléfono del cliente
 * - Nombre del cliente
 * - Dirección de destino
 * - Estado (disponible, asignado, en_ruta, entregado, cancelado)
 * 
 * REGLA ESPECIAL:
 * - Si el estado cambia a "disponible", se borra automáticamente el delivery_id
 * 
 * CAMPOS NO EDITABLES (solo lectura):
 * - Información de la tienda
 * - Tiempos (creado, asignado, tomado, entregado)
 * - Precio
 * - Método de pago
 * - Tipo de servicio
 */

import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DropDownPicker from "react-native-dropdown-picker";
import { Colors } from "@/constans/colors";
import { useAuth } from "@/providers/AuthProvider";
import { fetchDeliveries } from "@/services/users";
import { fetchZones } from "@/services/zones";
import { updateServiceData, updateServiceStatus } from "@/services/services";
import { Service } from "@/models/service";

interface EditServiceModalProps {
  visible: boolean;
  service: Service | null;
  onClose: () => void;
  onSuccess: () => void;
}

const { width: screenWidth } = Dimensions.get("window");
const isLargeScreen = screenWidth > 600;

const STATUS_OPTIONS = [
  { label: "Disponible", value: "disponible" },
  { label: "Asignado", value: "asignado" },
  { label: "En Ruta", value: "en_ruta" },
  { label: "Entregado", value: "entregado" },
  { label: "Cancelado", value: "cancelado" },
];

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: string | Date | null): string => {
  if (!date) return "N/A";
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleString("es-CO", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
};

export default function EditServiceModal({
  visible,
  service,
  onClose,
  onSuccess,
}: EditServiceModalProps) {
  const { session } = useAuth();

  // Estados para campos editables
  const [deliverySearch, setDeliverySearch] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deliveryResults, setDeliveryResults] = useState<
    Array<{ id: string; name: string; phone?: string }>
  >([]);
  const [showDeliveryDropdown, setShowDeliveryDropdown] = useState(false);

  const [zoneId, setZoneId] = useState<string | null>(null);
  const [openZone, setOpenZone] = useState(false);
  const [zoneItems, setZoneItems] = useState<{ label: string; value: string }[]>(
    []
  );

  const [notes, setNotes] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientName, setClientName] = useState("");
  const [destination, setDestination] = useState("");
  const [status, setStatus] = useState<string>("disponible");

  const [openStatus, setOpenStatus] = useState(false);

  // Estados UI
  const [loading, setLoading] = useState(false);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cargar datos iniciales cuando se abre el modal
  useEffect(() => {
    if (visible && service) {
      loadInitialData();
    } else {
      resetForm();
    }
  }, [visible, service]);

  const loadInitialData = async () => {
    if (!service || !session?.access_token) return;

    setLoading(true);
    try {
      // Cargar zonas
      const zones = await fetchZones(session.access_token);
      const branchZones = zones.filter((z) => z.branchId === service.branchId);
      setZoneItems(branchZones.map((z) => ({ label: z.name, value: z.id })));

      // Setear valores iniciales
      setNotes(service.notes || "");
      setClientPhone(service.phone || "");
      setClientName(service.clientName || "");
      setDestination(service.destination || "");
      setStatus(service.status || "disponible");
      setZoneId(service.zoneId || null);

      // Si hay delivery asignado, cargarlo
      if (service.assignedDelivery && service.assignedDeliveryName) {
        setSelectedDelivery({
          id: service.assignedDelivery,
          name: service.assignedDeliveryName,
        });
        setDeliverySearch(service.assignedDeliveryName);
      } else {
        setSelectedDelivery(null);
        setDeliverySearch("");
      }
    } catch (err) {
      console.error("❌ Error cargando datos iniciales:", err);
      Alert.alert("Error", "No se pudieron cargar los datos del servicio");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDeliverySearch("");
    setSelectedDelivery(null);
    setDeliveryResults([]);
    setShowDeliveryDropdown(false);
    setZoneId(null);
    setZoneItems([]);
    setNotes("");
    setClientPhone("");
    setClientName("");
    setDestination("");
    setStatus("disponible");
  };

  // Búsqueda de deliveries
  const handleDeliverySearch = async (text: string) => {
    setDeliverySearch(text);

    if (text.length < 2) {
      setDeliveryResults([]);
      setShowDeliveryDropdown(false);
      return;
    }

    try {
      setLoadingDeliveries(true);
      const deliveries = await fetchDeliveries(session?.access_token || "", text);
      setDeliveryResults(
        deliveries.map((d) => ({
          id: d.id,
          name: d.name,
          phone: d.phone,
        }))
      );
      setShowDeliveryDropdown(deliveries.length > 0);
    } catch (err) {
      console.error("❌ Error buscando deliveries:", err);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  const handleSelectDelivery = (delivery: { id: string; name: string }) => {
    setSelectedDelivery(delivery);
    setDeliverySearch(delivery.name);
    setShowDeliveryDropdown(false);
    setDeliveryResults([]);
  };

  const handleClearDelivery = () => {
    setSelectedDelivery(null);
    setDeliverySearch("");
    setDeliveryResults([]);
    setShowDeliveryDropdown(false);
  };

  // Guardar cambios
  const handleSave = async () => {
    if (!service || !session?.access_token) return;

    // Validaciones básicas
    if (!destination.trim()) {
      Alert.alert("Error", "La dirección de destino es obligatoria");
      return;
    }

    if (!clientPhone.trim()) {
      Alert.alert("Error", "El teléfono del cliente es obligatorio");
      return;
    }

    setSaving(true);

    try {
      const token = session.access_token;

      // 1️⃣ Actualizar datos básicos del servicio
      const updatePayload: Partial<Service> = {
        notes: notes.trim(),
        phone: clientPhone.trim(),
        clientName: clientName.trim(),
        destination: destination.trim(),
      };

      // Incluir zone_id si cambió
      if (zoneId !== service.zoneId) {
        updatePayload.zoneId = zoneId || undefined;
      }

      await updateServiceData(service.id, updatePayload, token);

      // 2️⃣ Si el estado cambió, actualizar el estado
      if (status !== service.status) {
        // 🔴 REGLA ESPECIAL: Si cambia a "disponible", borrar delivery_id
        const newDeliveryId = status === "disponible" ? null : selectedDelivery?.id || service.assignedDelivery;
        
        await updateServiceStatus(
          service.id,
          status as "disponible" | "asignado" | "en_ruta" | "entregado" | "cancelado",
          token,
          newDeliveryId || undefined
        );
      } else {
        // Si el estado no cambió pero el delivery sí, actualizar el delivery
        if (selectedDelivery?.id !== service.assignedDelivery) {
          await updateServiceStatus(
            service.id,
            status as "disponible" | "asignado" | "en_ruta" | "entregado" | "cancelado",
            token,
            selectedDelivery?.id || undefined
          );
        }
      }

      Alert.alert("Éxito", "Servicio actualizado correctamente");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("❌ Error guardando cambios:", err);
      Alert.alert(
        "Error",
        err.response?.data?.error || "No se pudo actualizar el servicio"
      );
    } finally {
      setSaving(false);
    }
  };

  if (!service) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Editar Servicio</Text>
              <Text style={styles.headerSubtitle}>ID: {service.id.slice(0, 8)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.normalText} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.activeMenuText} />
              <Text style={styles.loadingText}>Cargando datos...</Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* SECCIÓN: Información no editable */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📋 Información General</Text>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tienda:</Text>
                  <Text style={styles.infoValue}>
                    {service.profileStoreName || "N/A"}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tipo:</Text>
                  <Text style={styles.infoValue}>
                    {service.typeId === "paqueteria_aliados" ? "Paquetería Aliados" : service.typeId === "paqueteria_coordinadora" ? "Paquetería Coordinadora" : "Domicilio"}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Precio:</Text>
                  <Text style={styles.infoValue}>
                    {formatCurrency(service.price || 0)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Método de pago:</Text>
                  <Text style={styles.infoValue}>
                    {service.payment || "N/A"}
                  </Text>
                </View>

                {service.amount && service.amount > 0 && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Total a recaudar:</Text>
                    <Text style={styles.infoValue}>
                      {formatCurrency(service.amount)}
                    </Text>
                  </View>
                )}
              </View>

              {/* SECCIÓN: Tiempos */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⏰ Tiempos</Text>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Creado:</Text>
                  <Text style={styles.infoValue}>{formatDate(service.createdAt)}</Text>
                </View>

                {service.assignedAt && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Asignado:</Text>
                    <Text style={styles.infoValue}>{formatDate(service.assignedAt)}</Text>
                  </View>
                )}

                {service.completedAt && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Entregado:</Text>
                    <Text style={styles.infoValue}>{formatDate(service.completedAt)}</Text>
                  </View>
                )}
              </View>

              {/* SECCIÓN: Campos editables */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✏️ Datos Editables</Text>

                {/* Estado */}
                <Text style={styles.fieldLabel}>Estado del servicio</Text>
                <DropDownPicker
                  open={openStatus}
                  value={status}
                  items={STATUS_OPTIONS}
                  setOpen={setOpenStatus}
                  setValue={setStatus}
                  placeholder="Seleccionar estado"
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  textStyle={styles.dropdownText}
                  placeholderStyle={styles.dropdownPlaceholder}
                  zIndex={3000}
                  zIndexInverse={1000}
                />

                {/* Domiciliario */}
                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
                  Domiciliario {status === "disponible" && "(se borrará automáticamente)"}
                </Text>
                <View style={styles.searchContainer}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={Colors.menuText}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por nombre..."
                    placeholderTextColor={Colors.menuText}
                    value={deliverySearch}
                    onChangeText={handleDeliverySearch}
                    editable={status !== "disponible"}
                  />
                  {selectedDelivery && status !== "disponible" && (
                    <TouchableOpacity onPress={handleClearDelivery} style={styles.clearButton}>
                      <Ionicons name="close-circle" size={20} color={Colors.menuText} />
                    </TouchableOpacity>
                  )}
                  {loadingDeliveries && (
                    <ActivityIndicator size="small" color={Colors.activeMenuText} />
                  )}
                </View>

                {/* Dropdown de resultados */}
                {showDeliveryDropdown && deliveryResults.length > 0 && (
                  <View style={styles.resultsContainer}>
                    {deliveryResults.map((delivery) => (
                      <TouchableOpacity
                        key={delivery.id}
                        style={styles.resultItem}
                        onPress={() => handleSelectDelivery(delivery)}
                      >
                        <Ionicons name="person" size={18} color={Colors.activeMenuText} />
                        <View style={{ marginLeft: 8, flex: 1 }}>
                          <Text style={styles.resultName}>{delivery.name}</Text>
                          {delivery.phone && (
                            <Text style={styles.resultPhone}>{delivery.phone}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Zona */}
                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Zona</Text>
                <DropDownPicker
                  open={openZone}
                  value={zoneId}
                  items={zoneItems}
                  setOpen={setOpenZone}
                  setValue={setZoneId}
                  placeholder="Seleccionar zona"
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  textStyle={styles.dropdownText}
                  placeholderStyle={styles.dropdownPlaceholder}
                  zIndex={2000}
                  zIndexInverse={2000}
                />

                {/* Dirección */}
                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
                  Dirección de destino *
                </Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={Colors.menuText}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Cra 10 #20-30"
                    placeholderTextColor={Colors.menuText}
                    value={destination}
                    onChangeText={setDestination}
                  />
                </View>

                {/* Teléfono */}
                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
                  Teléfono del cliente *
                </Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color={Colors.menuText}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="3001234567"
                    placeholderTextColor={Colors.menuText}
                    value={clientPhone}
                    onChangeText={setClientPhone}
                    keyboardType="phone-pad"
                  />
                </View>

                {/* Nombre del cliente */}
                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
                  Nombre del cliente
                </Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={Colors.menuText}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Juan Pérez"
                    placeholderTextColor={Colors.menuText}
                    value={clientName}
                    onChangeText={setClientName}
                  />
                </View>

                {/* Notas */}
                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
                  Notas adicionales
                </Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={20}
                    color={Colors.menuText}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Escribe una nota..."
                    placeholderTextColor={Colors.menuText}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>

              {/* Botones de acción */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={styles.saveButtonText}>Guardar cambios</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: isLargeScreen ? 600 : "92%",
    maxHeight: "90%",
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.Border,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
    backgroundColor: Colors.Background,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.normalText,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.menuText,
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 60,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.menuText,
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.activeMenuText,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.menuText,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.normalText,
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.normalText,
    marginBottom: 8,
  },
  dropdown: {
    backgroundColor: Colors.Background,
    borderColor: Colors.Border,
    borderRadius: 12,
    minHeight: 48,
  },
  dropdownContainer: {
    backgroundColor: Colors.Background,
    borderColor: Colors.Border,
    borderRadius: 12,
  },
  dropdownText: {
    color: Colors.normalText,
    fontSize: 14,
  },
  dropdownPlaceholder: {
    color: Colors.menuText,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.Background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.Border,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    color: Colors.normalText,
    fontSize: 14,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  clearButton: {
    padding: 4,
  },
  resultsContainer: {
    marginTop: 8,
    backgroundColor: Colors.Background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.Border,
    maxHeight: 200,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },
  resultName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.normalText,
  },
  resultPhone: {
    fontSize: 12,
    color: Colors.menuText,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.Background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.Border,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  input: {
    flex: 1,
    color: Colors.normalText,
    fontSize: 14,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: Colors.Background,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.normalText,
  },
  saveButton: {
    backgroundColor: Colors.activeMenuText,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
  },
});
