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
      />

      <FormInputField
        label="Dirección de entrega"
        iconName="navigate-outline"
        placeholder="Cra 45 #10-20"
        value={destination}
        onChange={onDestinationChange}
        fieldKey="destinationAliado"
      />

      <FormInputField
        label="Teléfono del cliente"
        iconName="call-outline"
        placeholder="3009876543"
        value={phone}
        onChange={onPhoneChange}
        fieldKey="clientPhoneAliado"
      />

      <FormInputField
        label="Nombre del cliente"
        iconName="person-outline"
        placeholder="Juan Pérez"
        value={clientName}
        onChange={onClientNameChange}
        fieldKey="clientNameAliado"
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
        label="Precio del envío"
        iconName="pricetag-outline"
        placeholder="8000"
        keyboardType="numeric"
        value={aliadosPrice}
        onChange={onAliadosPriceChange}
        fieldKey="aliadosPrice"
      />

      <FormInputField
        label="Precio para domiciliario"
        iconName="cash-outline"
        placeholder="2000"
        keyboardType="numeric"
        value={aliadosPriceDeliverySrv}
        onChange={onAliadosPriceDeliverySrvChange}
        fieldKey="aliadosPriceDeliverySrv"
      />
    </View>
  );
};
