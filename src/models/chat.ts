export interface ChatMessage {
  id: string;
  service_id: string;
  sender_id: string; // 👈 antes "sender", ahora es el ID directo
  sender_role: "store" | "delivery" | "super_admin" | "coordinator";
  message: string;
  created_at: string;
  is_read?: boolean; // opcional por si lo usas después
}

export interface ChatLocalCache {
  [serviceId: string]: ChatMessage[];
}
