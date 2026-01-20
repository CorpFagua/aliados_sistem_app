import { api, authHeaders } from "../lib/api";

/**
 * Servicio de Pagos - Capa de comunicación con el backend
 * 
 * Todas las funciones de este servicio hacen llamadas a la API
 * y manejan los errores de manera uniforme.
 */

// ================================================================
//  TIPOS
// ================================================================
export interface DeliveryEarningsDTO {
  delivery_id: string;
  current_period_earnings: number;
  total_unpaid_earnings: number;
  total_earnings: number;
  total_paid: number;
  total_pending: number;
  last_updated: string;
}

export interface PaymentSnapshotDTO {
  id: string;
  user_id: string;
  type: "cut_15" | "cut_31";
  period: string;
  services_ids: string[];
  total_earned: number;
  status: "pending" | "approved" | "paid" | "rejected";
  created_at: string;
  approved_at?: string;
  approved_by?: string;
  paid_at?: string;
  paid_by?: string;
}

export interface PaymentRequestDTO {
  id: string;
  delivery_id: string;
  snapshot_id: string;
  branch_id?: string;
  status: "pending" | "approved" | "rejected" | "paid";
  amount: number;
  requested_at: string;
  approved_at?: string;
  approved_by?: string;
  paid_at?: string;
  paid_by?: string;
  notes?: string;
}

export interface StorePaymentRecordDTO {
  id: string;
  store_id: string;
  period: string;
  total_charged: number;
  total_paid: number;
  total_pending: number;
  status: "pending" | "partial" | "paid";
  created_at: string;
}

export interface PaymentHistoryItemDTO {
  id: string;
  type: "delivery_payout" | "store_charge" | "delivery_payment" | "store_payment";
  user_id?: string;
  store_id?: string;
  amount: number;
  status: string;
  created_at: string;
  [key: string]: any;
}

// ================================================================
//  GANANCIAS DEL DOMICILIARIO
// ================================================================

/**
 * Obtener ganancias actuales del domiciliario logueado
 */
export async function getDeliveryEarnings(token: string): Promise<DeliveryEarningsDTO> {
  try {
    const response = await api.get<DeliveryEarningsDTO>(
      "/payments/delivery-earnings",
      { headers: authHeaders(token) }
    );
    return response.data;
  } catch (error: any) {
    console.error("❌ Error getDeliveryEarnings:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Obtener deuda total del domiciliario
 */
export async function getDeliveryDebt(token: string): Promise<number> {
  try {
    const response = await api.get<{ total_debt: number }>(
      "/payments/debt/delivery",
      { headers: authHeaders(token) }
    );
    return response.data.total_debt;
  } catch (error: any) {
    console.error("❌ Error getDeliveryDebt:", error.response?.data || error.message);
    throw error;
  }
}

// ================================================================
//  SOLICITUDES DE CORTE
// ================================================================

/**
 * Crear solicitud de pago (corte de 15 o 31 días)
 */
export async function createPaymentRequest(
  token: string,
  snapshotId: string
): Promise<PaymentRequestDTO> {
  try {
    const response = await api.post<PaymentRequestDTO>(
      "/payments/requests",
      { snapshot_id: snapshotId },
      { headers: authHeaders(token) }
    );
    return response.data;
  } catch (error: any) {
    console.error("❌ Error createPaymentRequest:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Obtener mis solicitudes de pago
 */
export async function getMyPaymentRequests(
  token: string,
  status?: string,
  limit = 50
): Promise<PaymentRequestDTO[]> {
  try {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("limit", limit.toString());

    const response = await api.get<PaymentRequestDTO[]>(
      `/payments/requests?${params.toString()}`,
      { headers: authHeaders(token) }
    );
    return response.data;
  } catch (error: any) {
    console.error("❌ Error getMyPaymentRequests:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Obtener todas las solicitudes pendientes (coordinador)
 */
export async function getPendingPaymentRequests(
  token: string,
  limit = 50
): Promise<PaymentRequestDTO[]> {
  try {
    const params = new URLSearchParams();
    params.append("status", "pending");
    params.append("limit", limit.toString());

    const response = await api.get<PaymentRequestDTO[]>(
      `/payments/requests?${params.toString()}`,
      { headers: authHeaders(token) }
    );
    return response.data;
  } catch (error: any) {
    console.error("❌ Error getPendingPaymentRequests:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Aprobar solicitud de pago (coordinador)
 */
export async function approvePaymentRequest(
  token: string,
  requestId: string,
  notes?: string
): Promise<PaymentRequestDTO> {
  try {
    const response = await api.patch<PaymentRequestDTO>(
      `/payments/requests/${requestId}/approve`,
      { notes },
      { headers: authHeaders(token) }
    );
    return response.data;
  } catch (error: any) {
    console.error("❌ Error approvePaymentRequest:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Rechazar solicitud de pago (coordinador)
 */
export async function rejectPaymentRequest(
  token: string,
  requestId: string,
  reason?: string
): Promise<PaymentRequestDTO> {
  try {
    const response = await api.patch<PaymentRequestDTO>(
      `/payments/requests/${requestId}/reject`,
      { reason },
      { headers: authHeaders(token) }
    );
    return response.data;
  } catch (error: any) {
    console.error("❌ Error rejectPaymentRequest:", error.response?.data || error.message);
    throw error;
  }
}

// ================================================================
//  FACTURAS / SNAPSHOTS
// ================================================================

/**
 * Obtener mis snapshots (facturas)
 */
export async function getMyPaymentSnapshots(
  token: string,
  filters?: {
    type?: "cut_15" | "cut_31";
    status?: string;
    limit?: number;
  }
): Promise<PaymentSnapshotDTO[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.type) params.append("type", filters.type);
    if (filters?.status) params.append("status", filters.status);
    params.append("limit", (filters?.limit || 50).toString());

    const response = await api.get<PaymentSnapshotDTO[]>(
      `/payments/snapshots?${params.toString()}`,
      { headers: authHeaders(token) }
    );
    return response.data;
  } catch (error: any) {
    console.error("❌ Error getMyPaymentSnapshots:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Obtener detalles de un snapshot
 */
export async function getPaymentSnapshot(
  token: string,
  snapshotId: string
): Promise<PaymentSnapshotDTO> {
  try {
    const response = await api.get<PaymentSnapshotDTO>(
      `/payments/snapshots/${snapshotId}`,
      { headers: authHeaders(token) }
    );
    return response.data;
  } catch (error: any) {
    console.error("❌ Error getPaymentSnapshot:", error.response?.data || error.message);
    throw error;
  }
}

// ================================================================
//  DEUDA DE TIENDAS
// ================================================================

/**
 * Obtener registros de deuda de mi tienda
 */
export async function getMyStorePaymentRecords(
  token: string,
  status?: string,
  limit = 50
): Promise<StorePaymentRecordDTO[]> {
  try {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("limit", limit.toString());

    const response = await api.get<StorePaymentRecordDTO[]>(
      `/payments/store-records?${params.toString()}`,
      { headers: authHeaders(token) }
    );
    return response.data;
  } catch (error: any) {
    console.error("❌ Error getMyStorePaymentRecords:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Marcar deuda de tienda como pagada (coordinador)
 */
export async function markStorePaymentAsPaid(
  token: string,
  recordId: string
): Promise<StorePaymentRecordDTO> {
  try {
    const response = await api.patch<StorePaymentRecordDTO>(
      `/payments/store-records/${recordId}/pay`,
      {},
      { headers: authHeaders(token) }
    );
    return response.data;
  } catch (error: any) {
    console.error("❌ Error markStorePaymentAsPaid:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Obtener deuda total de tienda
 */
export async function getStoreDebt(token: string): Promise<number> {
  try {
    const response = await api.get<{ total_debt: number }>(
      "/payments/debt/store",
      { headers: authHeaders(token) }
    );
    return response.data.total_debt;
  } catch (error: any) {
    console.error("❌ Error getStoreDebt:", error.response?.data || error.message);
    throw error;
  }
}

// ================================================================
//  PAGOS
// ================================================================

/**
 * Registrar pago a domiciliario (coordinador)
 */
export async function registerDeliveryPayment(
  token: string,
  snapshotId: string,
  paymentMethod: "efectivo" | "transferencia" | "cheque" | "otro",
  reference?: string
): Promise<any> {
  try {
    const response = await api.post(
      "/payments/delivery-payments",
      {
        snapshot_id: snapshotId,
        payment_method: paymentMethod,
        reference,
      },
      { headers: authHeaders(token) }
    );
    return response.data;
  } catch (error: any) {
    console.error("❌ Error registerDeliveryPayment:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Obtener historial de pagos
 */
export async function getPaymentHistory(
  token: string,
  filters?: {
    type?: string;
    limit?: number;
    offset?: number;
  }
): Promise<PaymentHistoryItemDTO[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.type) params.append("type", filters.type);
    params.append("limit", (filters?.limit || 100).toString());
    params.append("offset", (filters?.offset || 0).toString());

    const response = await api.get<PaymentHistoryItemDTO[]>(
      `/payments/history?${params.toString()}`,
      { headers: authHeaders(token) }
    );
    return response.data;
  } catch (error: any) {
    console.error("❌ Error getPaymentHistory:", error.response?.data || error.message);
    throw error;
  }
}

// ================================================================
//  UTILIDADES
// ================================================================

/**
 * Formatear monto a moneda local
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
  }).format(amount);
}

/**
 * Obtener descripción del estado
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pendiente",
    approved: "Aprobado",
    paid: "Pagado",
    rejected: "Rechazado",
    partial: "Parcial",
  };
  return labels[status] || status;
}

/**
 * Obtener color del estado
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "#FFA500", // naranja
    approved: "#4CAF50", // verde
    paid: "#2196F3", // azul
    rejected: "#F44336", // rojo
    partial: "#FF9800", // naranja oscuro
  };
  return colors[status] || "#999";
}

/**
 * Obtener tipo de corte en texto
 */
export function getCutTypeLabel(type: "cut_15" | "cut_31"): string {
  return type === "cut_15" ? "Corte 15 días" : "Corte 31 días";
}
