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
import { Ionicons } from "@expo/vector-icons";
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

const { width, height } = Dimensions.get("window");
const isLargeScreen = width > 768;
const isMobile = width < 768;
const isSmallDevice = width < 375;

export default function ServiceFormModal({
  visible,
  onClose,
  onSuccess,
  editing = null,
}: ServiceFormModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("domicilios");
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
    // Solo pedir monto si el pago NO es transferencia
    if (formState.payment !== "transferencia" && !formState.amount) return "Monto requerido";
    if (!profileStoreSearch.selectedProfileStore?.id) return "Tienda requerida";
    if (!formState.prepTime) return "Tiempo de preparación requerido";
    return null;
  };

  const validateAliados = (): string | null => {
    if (!formState.pickupAddress?.trim()) return "Dirección de recogida requerida";
    if (!formState.destination?.trim()) return "Dirección de entrega requerida";
    if (!formState.phone?.trim()) return "Teléfono requerido";
    if (!formState.payment) return "Método de pago requerido";
    // Solo pedir precio si el pago NO es transferencia
    if (formState.payment !== "transferencia" && !formState.aliadosPrice) return "Precio requerido";
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
          client_name: formState.clientName || null,
          payment_method: formState.payment as any,
          total_to_collect: formState.payment === "transferencia" ? null : (parseInt(formState.amount) || 0),
          prep_time: parseInt(formState.prepTime) || 0,
          notes: formState.notes || null,
        };
      } else if (activeTab === "aliados") {
        payload = {
          type_id: "paqueteria_aliados",
          delivery_address: formState.destination,
          pickup_address: formState.pickupAddress,
          client_phone: formState.phone,
          client_name: formState.clientName || null,
          payment_method: formState.payment as any,
          price: formState.payment === "transferencia" ? null : (parseInt(formState.aliadosPrice) || 0),
          price_delivery_srv: formState.aliadosPriceDeliverySrv ? parseInt(formState.aliadosPriceDeliverySrv) : undefined,
          notes: formState.notes || null,
        };
      } else {
        // coordinadora
        payload = {
          type_id: "paqueteria_coordinadora",
          delivery_address: formState.destination,
          client_phone: formState.phone,
          client_name: formState.clientName || null,
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
          {/* HEADER FIJO */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {editing ? "Editar Servicio" : "Crear Servicio"}
              </Text>
              <Text style={styles.subtitle}>Aliados Express</Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={isLoading}>
              <Ionicons name="close" size={24} color={Colors.normalText} />
            </TouchableOpacity>
          </View>

          {/* TABS NAVIGATION */}
          <View style={styles.tabsContainer}>
            <TabsNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          </View>

          {/* -------- SCROLL INTERNO -------- */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={true}
            scrollIndicatorInsets={{ right: 1 }}
          >
            {/* DOMICILIOS */}
            {activeTab === "domicilios" && (
              <DomiciliosForm
                destination={formState.destination}
                phone={formState.phone}
                clientName={formState.clientName}
                notes={formState.notes}
                prepTime={formState.prepTime}
                onDestinationChange={formState.setDestination}
                onPhoneChange={formState.setPhone}
                onClientNameChange={formState.setClientName}
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
              />
            )}

            {/* ALIADOS */}
            {activeTab === "aliados" && (
              <AliadosForm
                pickupAddress={formState.pickupAddress}
                destination={formState.destination}
                phone={formState.phone}
                clientName={formState.clientName}
                notes={formState.notes}
                aliadosPrice={formState.aliadosPrice}
                aliadosPriceDeliverySrv={formState.aliadosPriceDeliverySrv}
                onPickupAddressChange={formState.setPickupAddress}
                onDestinationChange={formState.setDestination}
                onPhoneChange={formState.setPhone}
                onClientNameChange={formState.setClientName}
                onNotesChange={formState.setNotes}
                onAliadosPriceChange={formState.setAliadosPrice}
                onAliadosPriceDeliverySrvChange={formState.setAliadosPriceDeliverySrv}
                payment={formState.payment}
                amount={formState.amount}
                onPaymentChange={formState.setPayment}
                onAmountChange={formState.setAmount}
              />
            )}

            {/* COORDINADORA */}
            {activeTab === "coordinadora" && (
              <CoordinadoraForm
                guideId={formState.guideId}
                destination={formState.destination}
                phone={formState.phone}
                clientName={formState.clientName}
                notes={formState.notes}
                onGuideIdChange={formState.setGuideId}
                onDestinationChange={formState.setDestination}
                onPhoneChange={formState.setPhone}
                onClientNameChange={formState.setClientName}
                onNotesChange={formState.setNotes}
                payment={formState.payment}
                amount={formState.amount}
                onPaymentChange={formState.setPayment}
                onAmountChange={formState.setAmount}
              />
            )}
          </ScrollView>

          {/* FOOTER FIJO */}
          <View style={styles.footer}>
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
                <ActivityIndicator color="#000" size="small" />
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
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: isMobile ? 12 : 20,
  },

  cardWrapper: {
    width: "100%",
    maxWidth: isLargeScreen ? 550 : isMobile ? "100%" : 480,
    maxHeight: isMobile ? Math.min(height * 0.9, 750) : Math.min(height * 0.85, 800),
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ffffff22",
    overflow: "hidden",
    backgroundColor: Colors.activeMenuBackground,
  },

  cardWrapperLarge: {
    width: 550,
    maxWidth: "100%",
    maxHeight: Math.min(height * 0.85, 800),
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: Colors.activeMenuBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
    paddingHorizontal: isSmallDevice ? 14 : 18,
    paddingVertical: isSmallDevice ? 12 : 16,
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

  tabsContainer: {
    backgroundColor: Colors.activeMenuBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
    paddingHorizontal: isSmallDevice ? 8 : 12,
    paddingVertical: isSmallDevice ? 8 : 10,
  },

  scrollArea: {
    flex: 1,
  },

  scrollContentContainer: {
    paddingHorizontal: isSmallDevice ? 14 : 18,
    paddingVertical: isSmallDevice ? 12 : 16,
    paddingBottom: 16,
  },

  footer: {
    backgroundColor: Colors.activeMenuBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.Border,
    paddingHorizontal: isSmallDevice ? 14 : 18,
    paddingVertical: isSmallDevice ? 10 : 14,
  },

  button: {
    backgroundColor: Colors.normalText,
    paddingVertical: isSmallDevice ? 12 : 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#000",
    fontWeight: "700",
    fontSize: isSmallDevice ? 13 : 14,
  },

  errorContainer: {
    backgroundColor: "rgba(255, 0, 0, 0.2)",
    borderLeftWidth: 4,
    borderLeftColor: "#ff3333",
    paddingHorizontal: isSmallDevice ? 10 : 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },

  errorText: {
    color: "#ff3333",
    fontSize: isSmallDevice ? 11 : 12,
    fontWeight: "600",
  },

  cancelButton: {
    paddingVertical: isSmallDevice ? 10 : 12,
    alignItems: "center",
  },

  cancelText: {
    color: Colors.menuText,
    fontSize: isSmallDevice ? 12 : 13,
  },
});
