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
        />
      )}

      <FormInputField
        label="Dirección de destino"
        iconName="location-outline"
        placeholder="Ej: Cra 10 #20-30"
        value={destination}
        onChange={onDestinationChange}
        fieldKey="destination"
      />

      <FormInputField
        label="Teléfono"
        iconName="call-outline"
        placeholder="3001234567"
        keyboardType="phone-pad"
        value={phone}
        onChange={onPhoneChange}
        fieldKey="phone"
      />

      <FormInputField
        label="Nombre del cliente"
        iconName="person-outline"
        placeholder="Juan Pérez"
        value={clientName}
        onChange={onClientNameChange}
        fieldKey="clientName"
      />

      <FormInputField
        label="Notas adicionales"
        iconName="chatbubble-ellipses-outline"
        placeholder="Escribe una nota..."
        value={notes}
        onChange={onNotesChange}
        fieldKey="notes"
        multiline
      />

      <PaymentSection
        payment={payment}
        onPaymentChange={onPaymentChange}
        amount={amount}
        onAmountChange={onAmountChange}
      />

      <FormInputField
        label="Tiempo de llegada (min)"
        iconName="timer-outline"
        placeholder="15"
        keyboardType="numeric"
        value={prepTime}
        onChange={onPrepTimeChange}
        fieldKey="prepTime"
      />
    </View>
  );
};
