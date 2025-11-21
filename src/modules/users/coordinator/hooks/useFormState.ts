import { useState } from "react";

export interface UseFormStateReturn {
  // Estados comunes
  destination: string;
  phone: string;
  clientName: string;
  notes: string;
  payment: string;
  amount: string;

  // Estados específicos domicilios
  prepTime: string;

  // Estados específicos aliados
  pickupAddress: string;
  aliadosPrice: string;
  aliadosPriceDeliverySrv: string;

  // Estados específicos coordinadora
  guideId: string;

  // Métodos actualizadores
  setDestination: (value: string) => void;
  setPhone: (value: string) => void;
  setClientName: (value: string) => void;
  setNotes: (value: string) => void;
  setPayment: (value: string) => void;
  setAmount: (value: string) => void;
  setPrepTime: (value: string) => void;
  setPickupAddress: (value: string) => void;
  setAliadosPrice: (value: string) => void;
  setAliadosPriceDeliverySrv: (value: string) => void;
  setGuideId: (value: string) => void;

  // Reset para limpiar formularios
  reset: () => void;
}

export const useFormState = (): UseFormStateReturn => {
  const [destination, setDestination] = useState("");
  const [phone, setPhone] = useState("");
  const [clientName, setClientName] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<string>("efectivo");
  const [amount, setAmount] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [aliadosPrice, setAliadosPrice] = useState("");
  const [aliadosPriceDeliverySrv, setAliadosPriceDeliverySrv] = useState("");
  const [guideId, setGuideId] = useState("");

  const reset = () => {
    setDestination("");
    setPhone("");
    setClientName("");
    setNotes("");
    setPayment("efectivo");
    setAmount("");
    setPrepTime("");
    setPickupAddress("");
    setAliadosPrice("");
    setAliadosPriceDeliverySrv("");
    setGuideId("");
  };

  return {
    destination,
    phone,
    clientName,
    notes,
    payment,
    amount,
    prepTime,
    pickupAddress,
    aliadosPrice,
    aliadosPriceDeliverySrv,
    guideId,
    setDestination,
    setPhone,
    setClientName,
    setNotes,
    setPayment,
    setAmount,
    setPrepTime,
    setPickupAddress,
    setAliadosPrice,
    setAliadosPriceDeliverySrv,
    setGuideId,
    reset,
  };
};
