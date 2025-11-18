import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Colors } from "@/constans/colors";
import { useAuth } from "@/providers/AuthProvider";
import { TabsNavigation, TabType } from "./TabsNavigation";
import { DomiciliosForm } from "./forms/DomiciliosForm";
import { AliadosForm } from "./forms/AliadosForm";
import { CoordinadoraForm } from "./forms/CoordinadoraForm";
import { useProfileStoreSearch } from "../hooks/useProfileStoreSearch";
import { useFormState } from "../hooks/useFormState";
import { adminCreateService } from "@/services/services.admin";
import type { ServiceFormModalProps } from "./types";
import type { ServiceAdminPayload } from "@/models/service";

const { width } = Dimensions.get("window");
const isLargeScreen = width > 768;

export default function ServiceFormModal({
  visible,
  onClose,
  onSuccess,
  editing = null,
}: ServiceFormModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("domicilios");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { session, role, profile } = useAuth();

  // Custom hooks para manejar estado
  const formState = useFormState();
  const profileStoreSearch = useProfileStoreSearch(session?.access_token || "");

  // Limpiar formulario cuando el modal se cierre
  useEffect(() => {
    if (!visible) {
      formState.reset();
      profileStoreSearch.reset();
      setError(null);
      setIsLoading(false);
    }
  }, [visible]);

  // ================================================================
  // VALIDACIÓN POR TIPO
  // ================================================================

  const validateDomicilios = (): string | null => {
    if (!formState.destination?.trim()) return "Dirección de entrega requerida";
    if (!formState.phone?.trim()) return "Teléfono requerido";
    if (!formState.payment) return "Método de pago requerido";
    if (!formState.amount) return "Monto requerido";
    if (!profileStoreSearch.selectedProfileStore?.id) return "Tienda requerida";
    if (!formState.prepTime) return "Tiempo de preparación requerido";
    return null;
  };

  const validateAliados = (): string | null => {
    if (!formState.pickupAddress?.trim()) return "Dirección de recogida requerida";
    if (!formState.destination?.trim()) return "Dirección de entrega requerida";
    if (!formState.phone?.trim()) return "Teléfono requerido";
    if (!formState.payment) return "Método de pago requerido";
    if (!formState.aliadosPrice) return "Precio requerido";
    return null;
  };

  const validateCoordinadora = (): string | null => {
    if (!formState.destination?.trim()) return "Dirección de entrega requerida";
    if (!formState.phone?.trim()) return "Teléfono requerido";
    if (!formState.payment) return "Método de pago requerido";
    return null;
  };

  // ================================================================
  // SUBMIT
  // ================================================================

  const handleSubmit = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Validar según tipo
      let validationError: string | null = null;

      if (activeTab === "domicilios") {
        validationError = validateDomicilios();
      } else if (activeTab === "aliados") {
        validationError = validateAliados();
      } else if (activeTab === "coordinadora") {
        validationError = validateCoordinadora();
      }

      if (validationError) {
        setError(validationError);
        Alert.alert("❌ Validación", validationError);
        setIsLoading(false);
        return;
      }

      const token = session?.access_token || "";

      if (!token) {
        throw new Error("Usuario no autenticado");
      }

      // CREAR PAYLOAD SEGÚN TIPO
      let payload: ServiceAdminPayload;

      if (activeTab === "domicilios") {
        payload = {
          type_id: "domicilio",
          profile_store_id: profileStoreSearch.selectedProfileStore!.id,
          delivery_address: formState.destination,
          client_phone: formState.phone,
          payment_method: formState.payment as any,
          total_to_collect: parseInt(formState.amount) || 0,
          prep_time: parseInt(formState.prepTime) || 0,
          notes: formState.notes || null,
        };
      } else if (activeTab === "aliados") {
        payload = {
          type_id: "paqueteria_aliados",
          delivery_address: formState.destination,
          pickup_address: formState.pickupAddress,
          client_phone: formState.phone,
          payment_method: formState.payment as any,
          price: parseInt(formState.aliadosPrice) || 0,
          notes: formState.notes || null,
        };
      } else {
        // coordinadora
        payload = {
          type_id: "paqueteria_coordinadora",
          delivery_address: formState.destination,
          client_phone: formState.phone,
          payment_method: formState.payment as any,
          guide_number: formState.guideId || null,
          notes: formState.notes || null,
        };
      }

      console.log(`📤 Enviando ${activeTab}:`, payload);

      // Llamar al API
      const result = await adminCreateService(payload, token);

      // SUCCESS
      Alert.alert(
        "✅ Éxito",
        `Servicio ${activeTab} creado correctamente\nID: ${result.id}`
      );
      console.log("✅ Servicio creado:", result);

      if (onSuccess) onSuccess(result);

      // Limpiar y cerrar
      formState.reset();
      profileStoreSearch.reset();
      onClose();
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.message ||
        "Error al crear el servicio";

      console.error("❌ Error:", errorMsg);
      setError(errorMsg);
      Alert.alert("❌ Error", errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileStoreSelect = (profileStore: { id: string; name: string; store_id: string }) => {
    profileStoreSearch.setSelectedProfileStore(profileStore);
    profileStoreSearch.setProfileQuery("");
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View
          style={[styles.cardWrapper, isLargeScreen && styles.cardWrapperLarge]}
        >
          <View style={styles.card}>
            <Text style={styles.title}>
              {editing ? "Editar Servicio" : "Crear Servicio"}
            </Text>
            <Text style={styles.subtitle}>Aliados Express</Text>

            {/* TABS NAVIGATION */}
            <TabsNavigation activeTab={activeTab} onTabChange={setActiveTab} />

            {/* -------- SCROLL INTERNO -------- */}
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={{ paddingBottom: 30 }}
              showsVerticalScrollIndicator={false}
            >
              {/* DOMICILIOS */}
              {activeTab === "domicilios" && (
                <DomiciliosForm
                  destination={formState.destination}
                  phone={formState.phone}
                  notes={formState.notes}
                  prepTime={formState.prepTime}
                  onDestinationChange={formState.setDestination}
                  onPhoneChange={formState.setPhone}
                  onNotesChange={formState.setNotes}
                  onPrepTimeChange={formState.setPrepTime}
                  payment={formState.payment}
                  amount={formState.amount}
                  onPaymentChange={formState.setPayment}
                  onAmountChange={formState.setAmount}
                  storeQuery={profileStoreSearch.profileQuery}
                  selectedStore={profileStoreSearch.selectedProfileStore}
                  storeResults={profileStoreSearch.profileResults}
                  loadingStores={profileStoreSearch.loadingProfiles}
                  onStoreSearch={profileStoreSearch.handleSearchProfileStores}
                  onStoreSelect={handleProfileStoreSelect}
                  onStoreClear={() => profileStoreSearch.setSelectedProfileStore(null)}
                  showStoreSelector={role === "coordinator" || role === "super_admin"}
                  focusedField={focusedField}
                  onFocus={(fieldKey) => setFocusedField(fieldKey)}
                  onBlur={() => setFocusedField(null)}
                />
              )}

              {/* ALIADOS */}
              {activeTab === "aliados" && (
                <AliadosForm
                  pickupAddress={formState.pickupAddress}
                  destination={formState.destination}
                  name={formState.name}
                  phone={formState.phone}
                  notes={formState.notes}
                  aliadosPrice={formState.aliadosPrice}
                  onPickupAddressChange={formState.setPickupAddress}
                  onDestinationChange={formState.setDestination}
                  onNameChange={formState.setName}
                  onPhoneChange={formState.setPhone}
                  onNotesChange={formState.setNotes}
                  onAliadosPriceChange={formState.setAliadosPrice}
                  payment={formState.payment}
                  amount={formState.amount}
                  onPaymentChange={formState.setPayment}
                  onAmountChange={formState.setAmount}
                  focusedField={focusedField}
                  onFocus={(fieldKey) => setFocusedField(fieldKey)}
                  onBlur={() => setFocusedField(null)}
                />
              )}

              {/* COORDINADORA */}
              {activeTab === "coordinadora" && (
                <CoordinadoraForm
                  guideId={formState.guideId}
                  destination={formState.destination}
                  name={formState.name}
                  phone={formState.phone}
                  notes={formState.notes}
                  onGuideIdChange={formState.setGuideId}
                  onDestinationChange={formState.setDestination}
                  onNameChange={formState.setName}
                  onPhoneChange={formState.setPhone}
                  onNotesChange={formState.setNotes}
                  payment={formState.payment}
                  amount={formState.amount}
                  onPaymentChange={formState.setPayment}
                  onAmountChange={formState.setAmount}
                  focusedField={focusedField}
                  onFocus={(fieldKey) => setFocusedField(fieldKey)}
                  onBlur={() => setFocusedField(null)}
                />
              )}
            </ScrollView>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>Guardar servicio</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isLoading}
            >
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
    width: "90%",
    maxHeight: "88%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ffffff22",
  },

  cardWrapperLarge: {
    width: 550,
    maxHeight: "88%",
  },

  card: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 18,
    padding: 20,
    height: "100%",
  },

  scrollArea: {
    flex: 1,
    marginBottom: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.normalText,
    textAlign: "center",
  },

  subtitle: {
    color: Colors.menuText,
    textAlign: "center",
    marginBottom: 15,
  },

  button: {
    backgroundColor: Colors.normalText,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: { color: "#000", fontWeight: "700", fontSize: 15 },

  errorContainer: {
    backgroundColor: "rgba(255, 0, 0, 0.2)",
    borderLeftWidth: 4,
    borderLeftColor: "#ff3333",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  errorText: {
    color: "#ff3333",
    fontSize: 12,
    fontWeight: "600",
  },

  cancelButton: { paddingVertical: 12, alignItems: "center" },

  cancelText: { color: Colors.menuText, fontSize: 14 },
});
