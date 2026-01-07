export interface ServiceFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
  editing?: any | null;
}

export type TabType = "domicilios" | "aliados" | "coordinadora";

export interface Store {
  id: string;
  name: string;
}

export interface FormInputValue {
  destination: string;
  phone: string;
  notes: string;
  payment: string;
  amount: string;
  name: string;
  prepTime: string;
  pickupAddress: string;
  aliadosPrice: string;
  guideId: string;
}
