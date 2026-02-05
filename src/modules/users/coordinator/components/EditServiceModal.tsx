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

import React, { useEffect, useState, useMemo, useRef } from "react";
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
import { updateServiceData, updateServiceStatus, getServiceById } from "@/services/services";
import { Service, toServicePayload } from "@/models/service";
import { FormInputField } from "./FormInputField";

interface EditServiceModalProps {
  visible: boolean;
  // El modal puede recibir un `Service` (desde Home) o un detalle de historial
  // (`ServiceHistoryDetail`) desde Historial; aceptar `any` permite compatibilidad.
  service: Service | any | null;
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
  { label: "Pago", value: "pago" },
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

  // Normalizar diferentes shapes (`Service` desde Home vs `ServiceHistoryDetail` desde Historial)
  const svc = useMemo(() => {
    if (!service) return null;

    const get = (obj: any, keys: string[], fallback: any = null) => {
      for (const k of keys) {
        if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
      }
      return fallback;
    };

    const created = get(service, ["createdAt", "created_at"]);
    const assignedAt = get(service, ["assignedAt", "assigned_at"]);
    const completedAt = get(service, ["completedAt", "completed_at"]);

    // 🔴 Extraer typeId correctamente: puede ser string (Card) o objeto (Historial)
    let typeIdVal = service.typeId;
    if (!typeIdVal && service.type && typeof service.type === 'object') {
      typeIdVal = service.type.id || service.type.type_id;
    }
    if (!typeIdVal) {
      typeIdVal = service.type_id;
    }

    return {
      id: service.id,
      profileStoreName: get(service, ["profileStoreName", "profile_store", "store"], null)?.name ?? get(service, ["profileStoreName", "storeName", "store"] , null),
      typeId: typeIdVal,
      price: get(service, ["price"]),
      priceDeliverySrv: get(service, ["priceDeliverySrv", "priceDelivery", "price_delivery"], 0),
      payment: get(service, ["payment", "paymentMethod", "payment_method"]),
      amount: get(service, ["amount", "totalToCollect", "total_to_collect"] , 0),
      createdAt: created ? (created instanceof Date ? created : new Date(created)) : null,
      assignedAt: assignedAt ? (assignedAt instanceof Date ? assignedAt : new Date(assignedAt)) : null,
      completedAt: completedAt ? (completedAt instanceof Date ? completedAt : new Date(completedAt)) : null,
      status: get(service, ["status", "status"]),
      zoneId: get(service, ["zoneId", "zone", "zone_id"], null) && (service.zoneId ?? (service.zone && service.zone.id) ?? service.zone_id) || null,
      assignedDelivery: get(service, ["assignedDelivery", "assigned_delivery"]) ?? (service.delivery && service.delivery.id) ?? null,
      assignedDeliveryName: get(service, ["assignedDeliveryName", "assigned_delivery_name"]) ?? (service.delivery && service.delivery.name) ?? null,
      branchId: get(service, ["branchId", "branch_id"], null),
      // Mantener referencia al objeto original por si hace falta
      raw: service,
    };
  }, [service]);

  const originalAssignedDeliveryRef = useRef<string | null>(null);

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
  const [zoneError, setZoneError] = useState<string | null>(null); // 🔴 Error de zona

  // 💰 PRECIOS Y PAGO (editables)
  const [payment, setPayment] = useState<string>("");           // Método de pago
  const [price, setPrice] = useState<string>("");               // Precio del servicio (paquetería)
  const [priceDeliverySrv, setPriceDeliverySrv] = useState<string>(""); // Ganancia del delivery
  const [amount, setAmount] = useState<string>("");             // Total a recaudar (domicilios)

  const [notes, setNotes] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientName, setClientName] = useState("");
  const [destination, setDestination] = useState("");
  const [status, setStatus] = useState<string>("disponible");

  const [openStatus, setOpenStatus] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);

  // Estados UI
  const [loading, setLoading] = useState(false);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirmAvailable, setShowConfirmAvailable] = useState(false);
  const [confirmedAvailable, setConfirmedAvailable] = useState(false);

  // Cargar datos iniciales cuando se abre el modal
  useEffect(() => {
    if (visible && service) {
      loadInitialData();
    } else {
      resetForm();
    }
  }, [visible, service]);

  // Ejecutar performSave cuando se confirma disponible
  useEffect(() => {
    if (confirmedAvailable) {
      performSave(true);
      setConfirmedAvailable(false);
    }
  }, [confirmedAvailable]);

  const loadInitialData = async () => {
    if (!service || !session?.access_token) return;

    setLoading(true);
    try {
      // 🔴 PRIMERO: Obtener el servicio completo del API
      // Esto asegura que tenemos TODOS los campos (tipo, zona, etc)
      const completeService = await getServiceById(service.id, session.access_token);
      
      // Usar el servicio completo para normalizar
      const serviceToUse = completeService || service;

      // Cargar zonas
      const zones = await fetchZones(session.access_token);

      // Obtener branchId desde el servicio completo
      const branchId = serviceToUse.branchId ?? (serviceToUse as any).branch_id ?? null;

      const branchZones = branchId
        ? zones.filter((z) => z.branchId === branchId)
        : zones;

      setZoneItems(branchZones.map((z) => ({ label: z.name, value: z.id })));

      // Setear valores iniciales desde el servicio completo
      const destinationVal = serviceToUse.destination ?? "";
      const phoneVal = serviceToUse.phone ?? "";
      const clientNameVal = serviceToUse.clientName ?? "";
      const notesVal = serviceToUse.notes ?? "";
      const statusVal = serviceToUse.status ?? "disponible";
      const zoneIdVal = serviceToUse.zoneId ?? null;

      // 💰 Cargar precios y pago
      const paymentVal = serviceToUse.payment ?? "";
      const priceVal = serviceToUse.price ?? "";
      const priceDeliverySrvVal = serviceToUse.priceDeliverySrv ?? "";
      const amountVal = serviceToUse.amount ?? "";

      setNotes(notesVal);
      setClientPhone(phoneVal);
      setClientName(clientNameVal);
      setDestination(destinationVal);
      setStatus(statusVal);
      setZoneId(zoneIdVal);
      setPayment(paymentVal);
      setPrice(priceVal ? String(priceVal) : "");
      setPriceDeliverySrv(priceDeliverySrvVal ? String(priceDeliverySrvVal) : "");
      setAmount(amountVal ? String(amountVal) : "");


      // Si hay delivery asignado, cargarlo
      const assignedId = serviceToUse.assignedDelivery ?? null;
      const assignedName = serviceToUse.assignedDeliveryName ?? null;

      if (assignedId && assignedName) {
        setSelectedDelivery({ id: assignedId, name: assignedName });
        setDeliverySearch(assignedName);
        originalAssignedDeliveryRef.current = assignedId;
      } else {
        setSelectedDelivery(null);
        setDeliverySearch("");
        originalAssignedDeliveryRef.current = null;
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
    setZoneError(null);
    setPayment("");
    setPrice("");
    setPriceDeliverySrv("");
    setAmount("");
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
    // No forzamos cambio de estado aquí; la regla de 'disponible' se aplica al guardar
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

    // 🔴 Si status es "disponible", mostrar confirmación
    if (status === "disponible") {
      setShowConfirmAvailable(true);
      return;
    }

    await performSave(false);
  };

  const performSave = async (isAvailable: boolean) => {
    if (!service || !session?.access_token) return;

    setSaving(true);
    setZoneError(null);

    try {
      const token = session.access_token;

      // 1️⃣ Actualizar datos básicos del servicio
      const updatePayload: Partial<Service> = {
        notes: notes.trim(),
        phone: clientPhone.trim(),
        clientName: clientName.trim(),
        destination: destination.trim(),
      };

      // 💰 Incluir precios y pago
      if (payment) {
        (updatePayload as any).payment = payment;
      }
      
      // Detectar si la zona cambió
      const zoneChanged = zoneId !== (svc?.zoneId ?? svc?.raw?.zone_id ?? null);

      // 🔴 Si es disponible, forzar valores null/0 para zona y precios
      if (isAvailable) {
        (updatePayload as any).price = null;
        (updatePayload as any).priceDeliverySrv = 0;
        (updatePayload as any).zoneId = null;
      } else {
        // 🟢 Si la zona cambió, NO enviar precios - dejar que el backend los calcule
        if (zoneChanged) {
          updatePayload.zoneId = zoneId || undefined;
          // NO incluimos price ni priceDeliverySrv - el backend los calculará
          console.log("🔄 Zona cambió - backend calculará precios automáticamente");
        } else {
          // Si la zona NO cambió, permitir editar precios manualmente
          if (price !== "" && price !== undefined) {
            (updatePayload as any).price = parseInt(price) || 0;
          }
          if (priceDeliverySrv !== "" && priceDeliverySrv !== undefined) {
            (updatePayload as any).priceDeliverySrv = parseInt(priceDeliverySrv) || 0;
          }
        }
      }
      
      // 💰 Total a recaudar (amount) - siempre incluir si cambió
      if (amount !== "" && amount !== undefined) {
        (updatePayload as any).total_to_collect = parseInt(amount) || 0;
      }

      // Incluir domiciliario en el payload de actualización
      if (isAvailable) {
        // Si es disponible, forzar assignedDeliveryId a null
        (updatePayload as any).assignedDeliveryId = null;
      } else if (selectedDelivery) {
        // Si no es disponible y hay delivery seleccionado, incluirlo
        (updatePayload as any).assignedDeliveryId = selectedDelivery.id;
      }
      
      console.log(updatePayload)

      await updateServiceData(svc?.id ?? service.id, updatePayload, token);

      // 2️⃣ Actualizar estado/domiciliario cuando haya cambios
      const currentAssignedId =
        originalAssignedDeliveryRef.current ??
        svc?.assignedDelivery ??
        svc?.raw?.assigned_delivery ??
        (svc?.raw?.delivery && svc.raw.delivery.id) ??
        null;

      // Si es disponible, delivery debe ser null
      const newDeliveryId = isAvailable ? null : (selectedDelivery?.id ?? currentAssignedId);

      const deliveryChanged = (selectedDelivery?.id ?? null) !== currentAssignedId;
      const statusChanged = status !== (svc?.status ?? svc?.raw?.status ?? null);

      if (statusChanged || deliveryChanged) {
        const deliveryParam = newDeliveryId === null ? null : (newDeliveryId as string | undefined);

        await updateServiceStatus(
          svc?.id ?? service.id,
          status as "disponible" | "asignado" | "en_ruta" | "entregado" | "cancelado",
          token,
          deliveryParam as any
        );
      }

      Alert.alert("Éxito", "Servicio actualizado correctamente");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("❌ Error guardando cambios:", err);
      
      const errorMessage = err.response?.data?.error || err.message || "No se pudo actualizar el servicio";
      
      if (errorMessage.includes("precio configurado") || errorMessage.includes("No price")) {
        setZoneError(errorMessage);
      } else {
        Alert.alert("Error", errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!service) return null;

  return (
    <>
      {/* Modal principal de edición */}
      <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
              <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Editar Servicio</Text>
              <Text style={styles.headerSubtitle}>ID: {svc?.id ?? service?.id}</Text>
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
                    {svc?.profileStoreName || "N/A"}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tipo:</Text>
                  <Text style={styles.infoValue}>
                    {svc?.typeId === "paqueteria_aliados" ? "Paquetería Aliados" : svc?.typeId === "paqueteria_coordinadora" ? "Paquetería Coordinadora" : "Domicilio"}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Precio:</Text>
                  <Text style={styles.infoValue}>
                    {formatCurrency(svc?.price || 0)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Método de pago:</Text>
                  <Text style={styles.infoValue}>
                    {svc?.payment || "N/A"}
                  </Text>
                </View>

                {svc?.amount && svc.amount > 0 && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Total a recaudar:</Text>
                    <Text style={styles.infoValue}>
                      {formatCurrency(svc?.amount || 0)}
                    </Text>
                  </View>
                )}
              </View>

              {/* SECCIÓN: Tiempos */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⏰ Tiempos</Text>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Creado:</Text>
                  <Text style={styles.infoValue}>{formatDate(svc?.createdAt ?? svc?.raw?.created_at ?? null)}</Text>
                </View>

                {svc?.assignedAt && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Asignado:</Text>
                    <Text style={styles.infoValue}>{formatDate(svc?.assignedAt ?? svc?.raw?.assigned_at ?? null)}</Text>
                  </View>
                )}

                {svc?.completedAt && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Entregado:</Text>
                    <Text style={styles.infoValue}>{formatDate(svc?.completedAt ?? svc?.raw?.completed_at ?? null)}</Text>
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

                {/* Método de Pago - EDITABLE */}
                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Método de pago</Text>
                <DropDownPicker
                  open={openPayment}
                  value={payment}
                  items={[
                    { label: "Efectivo", value: "efectivo" },
                    { label: "Transferencia", value: "transferencia" },
                    { label: "Datafonó", value: "datafono" },
                  ]}
                  setOpen={setOpenPayment}
                  setValue={setPayment}
                  placeholder="Seleccionar método"
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  textStyle={styles.dropdownText}
                  placeholderStyle={styles.dropdownPlaceholder}
                  zIndex={2900}
                  zIndexInverse={900}
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
                      editable={true}
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

                {/* Zona - SOLO PARA DOMICILIOS */}
                {svc?.typeId === "domicilio" && (
                  <>
                    <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Zona</Text>
                    <DropDownPicker
                      open={openZone}
                      value={zoneId}
                      items={zoneItems}
                      setOpen={setOpenZone}
                      setValue={setZoneId}
                      placeholder="Seleccionar zona"
                      style={[
                        styles.dropdown,
                        zoneError && { borderColor: "#FF4444", borderWidth: 2 },
                      ]}
                      dropDownContainerStyle={styles.dropdownContainer}
                      textStyle={styles.dropdownText}
                      placeholderStyle={styles.dropdownPlaceholder}
                      zIndex={2000}
                      zIndexInverse={2000}
                    />
                    {zoneError && (
                      <Text style={styles.errorText}>
                        {zoneError}
                      </Text>
                    )}
                  </>
                )}

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

                {/* 💰 PRECIOS - PAQUETERÍA ALIADOS */}
                {svc?.typeId === "paqueteria_aliados" && (
                  <>
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>💰 Precios</Text>
                      
                      {/* Total a recaudar - Solo si el pago es efectivo o datafono */}
                      {(payment === "efectivo" || payment === "datafono") && (
                        <FormInputField
                          label="💰 Total a recaudar (Cliente)"
                          iconName="cash-outline"
                          placeholder="10000"
                          keyboardType="numeric"
                          value={amount}
                          onChange={setAmount}
                          fieldKey="amountAliados"
                        />
                      )}

                      {/* Precio del servicio (Tienda) - EDITABLE */}
                      <FormInputField
                        label="💰 Precio del servicio (Tienda)"
                        iconName="cash-outline"
                        placeholder="5000"
                        keyboardType="numeric"
                        value={price}
                        onChange={setPrice}
                        fieldKey="priceAliados"
                      />

                      {/* Precio para domiciliario - EDITABLE */}
                      <FormInputField
                        label="💰 Precio para el domiciliario (Ganancia)"
                        iconName="cash-outline"
                        placeholder="2000"
                        keyboardType="numeric"
                        value={priceDeliverySrv}
                        onChange={setPriceDeliverySrv}
                        fieldKey="priceDeliverySrvAliados"
                      />
                    </View>
                  </>
                )}

                {/* 💰 PRECIOS - DOMICILIOS */}
                {svc?.typeId === "domicilio" && (
                  <>
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>💰 Precios</Text>
                      
                      {/* Total a recaudar - Solo si el pago es efectivo o datafono */}
                      {(payment === "efectivo" || payment === "datafono") && (
                        <FormInputField
                          label="💰 Total a recaudar (Cliente)"
                          iconName="cash-outline"
                          placeholder="5000"
                          keyboardType="numeric"
                          value={amount}
                          onChange={setAmount}
                          fieldKey="amountDomicilio"
                        />
                      )}

                      {/* Precio para domiciliario - EDITABLE */}
                      <FormInputField
                        label="💰 Precio para el domiciliario (Ganancia)"
                        iconName="cash-outline"
                        placeholder="1000"
                        keyboardType="numeric"
                        value={priceDeliverySrv}
                        onChange={setPriceDeliverySrv}
                        fieldKey="priceDeliverySrvDomicilio"
                      />
                    </View>
                  </>
                )}
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

      {/* Modal de confirmación para disponible - RENDERIZADO DESPUÉS */}
      <Modal visible={showConfirmAvailable} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={[styles.modalContainer, { maxHeight: "auto", width: isLargeScreen ? 400 : "80%" }]}>
            <View style={styles.confirmHeader}>
              <Text style={styles.confirmTitle}>⚠️ Confirmar Acción</Text>
            </View>
            
            <View style={styles.confirmBody}>
              <Text style={styles.confirmText}>
                Servicio será marcado como <Text style={{ fontWeight: "700" }}>Disponible</Text>
              </Text>
              <Text style={[styles.confirmText, { marginTop: 12, fontWeight: "600" }]}>
                Se eliminará:
              </Text>
              <Text style={styles.confirmList}>
                • Domiciliario asignado{"\n"}
                • Zona{"\n"}
                • Precio del servicio{"\n"}
                • Precio para el domiciliario
              </Text>
              <Text style={[styles.confirmText, { marginTop: 16, color: Colors.menuText }]}>
                ¿Deseas continuar?
              </Text>
            </View>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelConfirm]}
                onPress={() => setShowConfirmAvailable(false)}
                disabled={saving}
              >
                <Text style={styles.cancelConfirmText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, styles.continueConfirm]}
                onPress={() => {
                  setShowConfirmAvailable(false);
                  setConfirmedAvailable(true);
                }}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.continueConfirmText}>Continuar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  errorText: {
    fontSize: 12,
    color: "#FF4444",
    marginTop: 6,
    fontWeight: "600",
    marginLeft: 4,
  },
  // Estilos para modal de confirmación
  confirmHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
    backgroundColor: Colors.Background,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.normalText,
  },
  confirmBody: {
    padding: 20,
  },
  confirmText: {
    fontSize: 14,
    color: Colors.normalText,
  },
  confirmList: {
    fontSize: 13,
    color: Colors.menuText,
    marginTop: 8,
    lineHeight: 20,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.Border,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelConfirm: {
    backgroundColor: Colors.Background,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  cancelConfirmText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.normalText,
  },
  continueConfirm: {
    backgroundColor: "#FF6B6B",
  },
  continueConfirmText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
});
