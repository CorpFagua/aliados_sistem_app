// ============================================================================
// EJEMPLOS DE REUTILIZACIÓN DE COMPONENTES
// ============================================================================

// ============================================================================
// 1. USAR FormInputField EN OTROS COMPONENTES
// ============================================================================

import { FormInputField } from "./components/FormInputField";
import { useState } from "react";

export function MiComponentePersonalizado() {
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  return (
    <FormInputField
      label="Correo electrónico"
      iconName="mail-outline"
      placeholder="tu@email.com"
      keyboardType="email-address"
      value={email}
      onChange={setEmail}
      fieldKey="email"
      focusedField={focusedField}
      onFocus={(fieldKey) => setFocusedField(fieldKey)}
      onBlur={() => setFocusedField(null)}
    />
  );
}

// ============================================================================
// 2. USAR PaymentSection EN OTROS MODALES
// ============================================================================

import { PaymentSection } from "./components/PaymentSection";

export function ModalDeCompra() {
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [payment, setPayment] = useState("efectivo");
  const [amount, setAmount] = useState("");

  return (
    <PaymentSection
      payment={payment}
      onPaymentChange={setPayment}
      amount={amount}
      onAmountChange={setAmount}
      focusedField={focusedField}
      onFocus={(fieldKey) => setFocusedField(fieldKey)}
      onBlur={() => setFocusedField(null)}
    />
  );
}

// ============================================================================
// 3. USAR useFormState EN OTROS COMPONENTES
// ============================================================================

import { useFormState } from "./hooks/useFormState";

export function MiFormulario() {
  const formState = useFormState();

  const handleSubmit = () => {
    console.log("Datos del formulario:", {
      destination: formState.destination,
      phone: formState.phone,
      notes: formState.notes,
    });
  };

  const handleCancel = () => {
    formState.reset(); // Limpia todos los campos
  };

  return (
    <View>
      <TextInput
        value={formState.destination}
        onChangeText={formState.setDestination}
        placeholder="Dirección"
      />
      <TextInput
        value={formState.phone}
        onChangeText={formState.setPhone}
        placeholder="Teléfono"
      />
      <Button title="Enviar" onPress={handleSubmit} />
      <Button title="Cancelar" onPress={handleCancel} />
    </View>
  );
}

// ============================================================================
// 4. USAR useStoreSearch EN OTROS MODALES
// ============================================================================

import { useStoreSearch } from "./hooks/useStoreSearch";

export function ModalAsignarTienda({ accessToken }: { accessToken: string }) {
  const storeSearch = useStoreSearch(accessToken);

  return (
    <View>
      <TextInput
        value={storeSearch.storeQuery}
        onChangeText={storeSearch.handleSearchStores}
        placeholder="Buscar tienda..."
      />

      {storeSearch.loadingStores && (
        <ActivityIndicator size="large" color="#0000ff" />
      )}

      <FlatList
        data={storeSearch.storeResults}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => storeSearch.setSelectedStore(item)}>
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      {storeSearch.selectedStore && (
        <Text>Tienda seleccionada: {storeSearch.selectedStore.name}</Text>
      )}
    </View>
  );
}

// ============================================================================
// 5. CREAR UN NUEVO FORMULARIO COMBINANDO COMPONENTES
// ============================================================================

import { StoreSelector } from "./components/StoreSelector";
import { TabsNavigation } from "./components/TabsNavigation";

export function FormularioPersonalizado() {
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tab1" | "tab2">("tab1");
  const storeSearch = useStoreSearch("token");
  const formState = useFormState();

  return (
    <View>
      {/* Usar tabs personalizados */}
      <TabsNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Usar selector de tiendas */}
      <StoreSelector
        storeQuery={storeSearch.storeQuery}
        selectedStore={storeSearch.selectedStore}
        storeResults={storeSearch.storeResults}
        loadingStores={storeSearch.loadingStores}
        onSearch={storeSearch.handleSearchStores}
        onSelectStore={storeSearch.setSelectedStore}
        onClearStore={() => storeSearch.setSelectedStore(null)}
        focusedField={focusedField}
        onFocus={(fieldKey) => setFocusedField(fieldKey)}
        onBlur={() => setFocusedField(null)}
      />

      {/* Múltiples FormInputField */}
      <FormInputField
        label="Campo 1"
        iconName="location-outline"
        value={formState.destination}
        onChange={formState.setDestination}
        fieldKey="field1"
        focusedField={focusedField}
        onFocus={(fieldKey) => setFocusedField(fieldKey)}
        onBlur={() => setFocusedField(null)}
      />

      <FormInputField
        label="Campo 2"
        iconName="call-outline"
        value={formState.phone}
        onChange={formState.setPhone}
        fieldKey="field2"
        focusedField={focusedField}
        onFocus={(fieldKey) => setFocusedField(fieldKey)}
        onBlur={() => setFocusedField(null)}
      />

      {/* Sección de pago */}
      <PaymentSection
        payment={formState.payment}
        onPaymentChange={formState.setPayment}
        amount={formState.amount}
        onAmountChange={formState.setAmount}
        focusedField={focusedField}
        onFocus={(fieldKey) => setFocusedField(fieldKey)}
        onBlur={() => setFocusedField(null)}
      />
    </View>
  );
}

// ============================================================================
// 6. CREAR NUEVO FORMULARIO ESPECÍFICO
// ============================================================================

// Archivo: components/forms/MiNuevoFormulario.tsx

import React from "react";
import { View } from "react-native";
import { FormInputField } from "../FormInputField";

interface MiNuevoFormularioProps {
  campo1: string;
  campo2: string;
  onCampo1Change: (value: string) => void;
  onCampo2Change: (value: string) => void;
  focusedField: string | null;
  onFocus: (fieldKey: string) => void;
  onBlur: () => void;
}

export const MiNuevoFormulario: React.FC<MiNuevoFormularioProps> = ({
  campo1,
  campo2,
  onCampo1Change,
  onCampo2Change,
  focusedField,
  onFocus,
  onBlur,
}) => {
  return (
    <View>
      <FormInputField
        label="Mi Campo 1"
        iconName="person-outline"
        placeholder="Ingresa valor"
        value={campo1}
        onChange={onCampo1Change}
        fieldKey="campo1"
        focusedField={focusedField}
        onFocus={onFocus}
        onBlur={onBlur}
      />

      <FormInputField
        label="Mi Campo 2"
        iconName="information-outline"
        placeholder="Ingresa otro valor"
        value={campo2}
        onChange={onCampo2Change}
        fieldKey="campo2"
        multiline
        focusedField={focusedField}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </View>
  );
};

// Luego usarlo en el modal principal:
// {activeTab === "miServicio" && (
//   <MiNuevoFormulario
//     campo1={formState.destination}
//     campo2={formState.notes}
//     onCampo1Change={formState.setDestination}
//     onCampo2Change={formState.setNotes}
//     focusedField={focusedField}
//     onFocus={(fieldKey) => setFocusedField(fieldKey)}
//     onBlur={() => setFocusedField(null)}
//   />
// )}

// ============================================================================
// 7. EXTENDER useFormState CON CAMPOS PERSONALIZADOS
// ============================================================================

// Si necesitas más campos, extender el hook es fácil:

export const useFormStateExtended = () => {
  const baseState = useFormState();
  const [customField1, setCustomField1] = useState("");
  const [customField2, setCustomField2] = useState("");

  const reset = () => {
    baseState.reset();
    setCustomField1("");
    setCustomField2("");
  };

  return {
    ...baseState,
    customField1,
    setCustomField1,
    customField2,
    setCustomField2,
    reset,
  };
};

// ============================================================================
// 8. PATRÓN COMPLETO: NUEVO MODAL CON TODOS LOS COMPONENTES
// ============================================================================

import { Modal, TouchableOpacity, Text, StyleSheet } from "react-native";

interface MiModalProps {
  visible: boolean;
  onClose: () => void;
}

export function MiModal({ visible, onClose }: MiModalProps) {
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const formState = useFormState();
  const storeSearch = useStoreSearch("token");

  const handleSubmit = async () => {
    try {
      // Validar datos
      if (!formState.destination || !formState.phone) {
        alert("Por favor completa todos los campos");
        return;
      }

      // Enviar datos
      console.log({
        destination: formState.destination,
        phone: formState.phone,
        store: storeSearch.selectedStore,
      });

      // Limpiar
      formState.reset();
      storeSearch.reset();
      onClose();
    } catch (error) {
      alert("Error al guardar");
    }
  };

  useEffect(() => {
    if (!visible) {
      formState.reset();
      storeSearch.reset();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Mi Modal</Text>

          <StoreSelector
            storeQuery={storeSearch.storeQuery}
            selectedStore={storeSearch.selectedStore}
            storeResults={storeSearch.storeResults}
            loadingStores={storeSearch.loadingStores}
            onSearch={storeSearch.handleSearchStores}
            onSelectStore={storeSearch.setSelectedStore}
            onClearStore={() => storeSearch.setSelectedStore(null)}
            focusedField={focusedField}
            onFocus={(fieldKey) => setFocusedField(fieldKey)}
            onBlur={() => setFocusedField(null)}
          />

          <FormInputField
            label="Dirección"
            iconName="location-outline"
            value={formState.destination}
            onChange={formState.setDestination}
            fieldKey="destination"
            focusedField={focusedField}
            onFocus={(fieldKey) => setFocusedField(fieldKey)}
            onBlur={() => setFocusedField(null)}
          />

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Guardar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelButton: {
    marginTop: 10,
    alignItems: "center",
  },
});
