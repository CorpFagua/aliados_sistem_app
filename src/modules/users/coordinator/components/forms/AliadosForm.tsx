import React from "react";
import { View } from "react-native";
import { FormInputField } from "../FormInputField";
import { PaymentSection } from "../PaymentSection";

interface AliadosFormProps {
  // Campos principales
  pickupAddress: string;
  destination: string;
  phone: string;
  clientName: string;
  notes: string;
  aliadosPrice: string;
  aliadosPriceDeliverySrv: string;

  // Métodos de actualización
  onPickupAddressChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onClientNameChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onAliadosPriceChange: (value: string) => void;
  onAliadosPriceDeliverySrvChange: (value: string) => void;

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

export const AliadosForm: React.FC<AliadosFormProps> = ({
  pickupAddress,
  destination,
  phone,
  clientName,
  notes,
  aliadosPrice,
  aliadosPriceDeliverySrv,
  onPickupAddressChange,
  onDestinationChange,
  onPhoneChange,
  onClientNameChange,
  onNotesChange,
  onAliadosPriceChange,
  onAliadosPriceDeliverySrvChange,
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
        label="Dirección de recogida"
        iconName="location-outline"
        placeholder="Cra 10 #20-30"
        value={pickupAddress}
        onChange={onPickupAddressChange}
        fieldKey="pickupAddress"
        focusedField={focusedField}
        onFocus={onFocus}
        onBlur={onBlur}
      />

      <FormInputField
        label="Dirección de entrega"
        iconName="navigate-outline"
        placeholder="Cra 45 #10-20"
        value={destination}
        onChange={onDestinationChange}
        fieldKey="destinationAliado"
        focusedField={focusedField}
        onFocus={onFocus}
        onBlur={onBlur}
      />

      <FormInputField
        label="Teléfono del cliente"
        iconName="call-outline"
        placeholder="3009876543"
        value={phone}
        onChange={onPhoneChange}
        fieldKey="clientPhoneAliado"
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
        fieldKey="clientNameAliado"
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
        label="Precio del envío"
        iconName="pricetag-outline"
        placeholder="8000"
        keyboardType="numeric"
        value={aliadosPrice}
        onChange={onAliadosPriceChange}
        fieldKey="aliadosPrice"
        focusedField={focusedField}
        onFocus={onFocus}
        onBlur={onBlur}
      />

      <FormInputField
        label="Precio para domiciliario"
        iconName="cash-outline"
        placeholder="2000"
        keyboardType="numeric"
        value={aliadosPriceDeliverySrv}
        onChange={onAliadosPriceDeliverySrvChange}
        fieldKey="aliadosPriceDeliverySrv"
        focusedField={focusedField}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </View>
  );
};
