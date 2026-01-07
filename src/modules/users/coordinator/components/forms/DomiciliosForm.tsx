import React from "react";
import { View } from "react-native";
import { FormInputField } from "../FormInputField";
import { PaymentSection } from "../PaymentSection";
import { StoreSelector } from "../StoreSelector";

interface DomiciliosFormProps {
  // Campos principales
  destination: string;
  phone: string;
  clientName: string;
  notes: string;
  prepTime: string;

  // Métodos de actualización
  onDestinationChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onClientNameChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onPrepTimeChange: (value: string) => void;

  // Pago
  payment: string;
  amount: string;
  onPaymentChange: (method: string) => void;
  onAmountChange: (amount: string) => void;

  // Store selector
  storeQuery: string;
  selectedStore: { id: string; name: string } | null;
  storeResults: { id: string; name: string }[];
  loadingStores: boolean;
  onStoreSearch: (query: string) => void;
  onStoreSelect: (store: { id: string; name: string }) => void;
  onStoreClear: () => void;
  showStoreSelector?: boolean;

  // Estado de foco
  focusedField: string | null;
  onFocus: (fieldKey: string) => void;
  onBlur: () => void;
}

export const DomiciliosForm: React.FC<DomiciliosFormProps> = ({
  destination,
  phone,
  clientName,
  notes,
  prepTime,
  onDestinationChange,
  onPhoneChange,
  onClientNameChange,
  onNotesChange,
  onPrepTimeChange,
  payment,
  amount,
  onPaymentChange,
  onAmountChange,
  storeQuery,
  selectedStore,
  storeResults,
  loadingStores,
  onStoreSearch,
  onStoreSelect,
  onStoreClear,
  showStoreSelector = true,
  focusedField,
  onFocus,
  onBlur,
}) => {
  return (
    <View>
      {/* SELECTOR DE TIENDA — SOLO PARA COORDINADOR Y SUPER ADMIN */}
      {showStoreSelector && (
        <StoreSelector
          storeQuery={storeQuery}
          selectedStore={selectedStore}
          storeResults={storeResults}
          loadingStores={loadingStores}
          onSearch={onStoreSearch}
          onSelectStore={onStoreSelect}
          onClearStore={onStoreClear}
          focusedField={focusedField}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      )}

      <FormInputField
        label="Dirección de destino"
        iconName="location-outline"
        placeholder="Ej: Cra 10 #20-30"
        value={destination}
        onChange={onDestinationChange}
        fieldKey="destination"
        focusedField={focusedField}
        onFocus={onFocus}
        onBlur={onBlur}
      />

      <FormInputField
        label="Teléfono"
        iconName="call-outline"
        placeholder="3001234567"
        keyboardType="phone-pad"
        value={phone}
        onChange={onPhoneChange}
        fieldKey="phone"
        focusedField={focusedField}
        onFocus={onFocus}
        onBlur={onBlur}
      />

      <FormInputField
        label="Nombre del cliente"
        iconName="person-outline"
        placeholder="Juan Pérez"
        value={clientName}
        onChange={onClientNameChange}
        fieldKey="clientName"
        focusedField={focusedField}
        onFocus={onFocus}
        onBlur={onBlur}
      />

      <FormInputField
        label="Notas adicionales"
        iconName="chatbubble-ellipses-outline"
        placeholder="Escribe una nota..."
        value={notes}
        onChange={onNotesChange}
        fieldKey="notes"
        multiline
        focusedField={focusedField}
        onFocus={onFocus}
        onBlur={onBlur}
      />

      <PaymentSection
        payment={payment}
        onPaymentChange={onPaymentChange}
        amount={amount}
        onAmountChange={onAmountChange}
        focusedField={focusedField}
        onFocus={onFocus}
        onBlur={onBlur}
      />

      <FormInputField
        label="Tiempo de llegada (min)"
        iconName="timer-outline"
        placeholder="15"
        keyboardType="numeric"
        value={prepTime}
        onChange={onPrepTimeChange}
        fieldKey="prepTime"
        focusedField={focusedField}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </View>
  );
};
