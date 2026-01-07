import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "@/constans/colors";
import { FormInputField } from "./FormInputField";

interface PaymentSectionProps {
  payment: string;
  onPaymentChange: (method: string) => void;
  amount: string;
  onAmountChange: (amount: string) => void;
  focusedField: string | null;
  onFocus: (fieldKey: string) => void;
  onBlur: () => void;
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({
  payment,
  onPaymentChange,
  amount,
  onAmountChange,
  focusedField,
  onFocus,
  onBlur,
}) => {
  const paymentMethods = ["efectivo", "transferencia", "tarjeta"];

  return (
    <>
      <Text style={styles.label}>Método de pago</Text>
      <View style={styles.paymentRow}>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method}
            style={[
              styles.paymentOption,
              payment === method && styles.paymentOptionActive,
            ]}
            onPress={() => onPaymentChange(method)}
          >
            <Text
              style={[
                styles.paymentText,
                payment === method && styles.paymentTextActive,
              ]}
            >
              {method}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {payment === "efectivo" || payment === "tarjeta" ? (
        <FormInputField
          label="Monto a recolectar"
          iconName="cash-outline"
          placeholder="Ej: 25000"
          keyboardType="numeric"
          value={amount}
          onChange={onAmountChange}
          fieldKey="amount"
          focusedField={focusedField}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  label: {
    color: Colors.menuText,
    fontWeight: "600",
    fontSize: 13,
    marginBottom: 4,
    marginTop: 8,
  },

  paymentRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },

  paymentOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.Border,
    alignItems: "center",
  },

  paymentOptionActive: {
    backgroundColor: Colors.normalText,
  },

  paymentText: { color: Colors.menuText, fontWeight: "500" },
  paymentTextActive: { color: "#000", fontWeight: "700" },
});
