import { useState } from "react";

export interface UseFormStateReturn {
  // Estados comunes
  destination: string;
  phone: string;
  notes: string;
  payment: string;
  amount: string;
  name: string;

  // Estados específicos domicilios
  prepTime: string;

  // Estados específicos aliados
  pickupAddress: string;
  aliadosPrice: string;

  // Estados específicos coordinadora
  guideId: string;

  // Métodos actualizadores
  setDestination: (value: string) => void;
  setPhone: (value: string) => void;
  setNotes: (value: string) => void;
  setPayment: (value: string) => void;
  setAmount: (value: string) => void;
  setName: (value: string) => void;
  setPrepTime: (value: string) => void;
  setPickupAddress: (value: string) => void;
  setAliadosPrice: (value: string) => void;
  setGuideId: (value: string) => void;

  // Reset para limpiar formularios
  reset: () => void;
}

export const useFormState = (): UseFormStateReturn => {
  const [destination, setDestination] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<string>("efectivo");
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [aliadosPrice, setAliadosPrice] = useState("");
  const [guideId, setGuideId] = useState("");

  const reset = () => {
    setDestination("");
    setPhone("");
    setNotes("");
    setPayment("efectivo");
    setAmount("");
    setName("");
    setPrepTime("");
    setPickupAddress("");
    setAliadosPrice("");
    setGuideId("");
  };

  return {
    destination,
    phone,
    notes,
    payment,
    amount,
    name,
    prepTime,
    pickupAddress,
    aliadosPrice,
    guideId,
    setDestination,
    setPhone,
    setNotes,
    setPayment,
    setAmount,
    setName,
    setPrepTime,
    setPickupAddress,
    setAliadosPrice,
    setGuideId,
    reset,
  };
};
