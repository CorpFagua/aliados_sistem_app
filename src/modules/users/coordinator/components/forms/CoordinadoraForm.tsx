import React from "react";
import { View } from "react-native";
import { FormInputField } from "../FormInputField";
import { PaymentSection } from "../PaymentSection";

interface CoordinadoraFormProps {
  // Campos principales
  guideId: string;
  destination: string;
  phone: string;
  clientName: string;
  notes: string;

  // Métodos de actualización
  onGuideIdChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onClientNameChange: (value: string) => void;
  onNotesChange: (value: string) => void;

  // Pago
  payment: string;
  amount: string;
  onPaymentChange: (method: string) => void;
  onAmountChange: (amount: string) => void;

  // Estado de foco
  focusedField: string | null;
  onFocus: (fieldKey: string) => void;
  onBlur: () => void;
}

export const CoordinadoraForm: React.FC<CoordinadoraFormProps> = ({
  guideId,
  destination,
  phone,
  clientName,
  notes,
  onGuideIdChange,
  onDestinationChange,
  onPhoneChange,
  onClientNameChange,
  onNotesChange,
  payment,
  amount,
  onPaymentChange,
  onAmountChange,
  focusedField,
  onFocus,
  onBlur,
}) => {
  return (
    <View>
      <FormInputField
        label="Número de guía"
        iconName="barcode-outline"
        placeholder="123456789"
        value={guideId}
        onChange={onGuideIdChange}
        fieldKey="guideId"
        focusedField={focusedField}
        onFocus={onFocus}
        onBlur={onBlur}
      />

      <FormInputField
        label="Dirección de entrega"
        iconName="location-outline"
        placeholder="Cra 45 #20-55"
        value={destination}
        onChange={onDestinationChange}
        fieldKey="destinationCoord"
        focusedField={focusedField}
        onFocus={onFocus}
        onBlur={onBlur}
      />

      <FormInputField
        label="Nombre del cliente"
        iconName="person-outline"
        placeholder="María Gómez"
        value={clientName}
        onChange={onClientNameChange}
        fieldKey="clientNameCoord"
        focusedField={focusedField}
        onFocus={onFocus}
        onBlur={onBlur}
      />

      <FormInputField
        label="Teléfono"
        iconName="call-outline"
        placeholder="3009876543"
        value={phone}
        onChange={onPhoneChange}
        fieldKey="clientPhoneCoord"
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
    </View>
  );
};
