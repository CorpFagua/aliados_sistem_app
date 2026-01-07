/**
 * Modelos de Pagos - Frontend
 * 
 * Interfases TypeScript para el sistema de pagos
 */

// ================================================================
//  RESUMEN DE GANANCIAS
// ================================================================
export interface DeliveryPaymentSummary {
  currentPeriodEarnings: number;     // Ganancias del período actual
  totalEarnings: number;              // Ganancias acumuladas
  totalPaid: number;                  // Total pagado
  totalPending: number;               // Total pendiente
  nextCutDate: Date;                  // Próxima fecha de corte
  lastPaymentDate?: Date;             // Última fecha de pago
}

// ================================================================
//  SOLICITUD DE CORTE
// ================================================================
export interface PaymentCutRequest {
  id: string;
  deliveryId: string;
  snapshotId: string;                 // Factura asociada
  branchId?: string;
  status: "pending" | "approved" | "rejected" | "paid";
  amount: number;
  requestedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  paidAt?: Date;
  paidBy?: string;
  notes?: string;
  coordinatorNotes?: string;          // Notas del coordinador si fue rechazado
}

// ================================================================
//  FACTURA / SNAPSHOT
// ================================================================
export interface PaymentInvoice {
  id: string;
  userId: string;
  cutType: "quincena_1" | "quincena_2";  // 1-15 o 16-31
  period: string;                    // "2024-11" o similar
  serviceIds: string[];              // IDs de servicios incluidos
  totalEarned: number;
  status: "pending" | "approved" | "paid" | "rejected";
  createdAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  paidAt?: Date;
  paidBy?: string;
  breakdown?: {
    totalServices: number;
    completedServices: number;
    totalDistance?: number;
  };
}

// ================================================================
//  DEUDA DE TIENDA
// ================================================================
export interface StoreDebtRecord {
  id: string;
  storeId: string;
  period: string;
  totalCharged: number;              // Total cobrado a la tienda
  totalPaid: number;                 // Total pagado
  totalPending: number;              // Total pendiente
  status: "pending" | "partial" | "paid";
  createdAt: Date;
  paymentDeadline: Date;
  details?: {
    serviceCount: number;
    avgServicePrice: number;
  };
}

// ================================================================
//  ELEMENTO DEL HISTORIAL
// ================================================================
export interface PaymentHistoryEntry {
  id: string;
  type: "earnings" | "cut_request" | "payment" | "store_debt" | "store_payment";
  description: string;
  amount: number;
  status: "pending" | "approved" | "paid" | "rejected";
  date: Date;
  relatedId?: string;
  metadata?: Record<string, any>;
}

// ================================================================
//  FORMAS DE PAGO
// ================================================================
export type PaymentMethod = "efectivo" | "transferencia" | "cheque" | "otro";

export const PAYMENT_METHODS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia Bancaria",
  cheque: "Cheque",
  otro: "Otro",
};

// ================================================================
//  ESTADOS DE PAGO
// ================================================================
export type PaymentStatus = "pending" | "approved" | "paid" | "rejected" | "partial";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  paid: "Pagado",
  rejected: "Rechazado",
  partial: "Parcial",
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: "#FFA500",    // Naranja
  approved: "#4CAF50",   // Verde
  paid: "#2196F3",       // Azul
  rejected: "#F44336",   // Rojo
  partial: "#FF9800",    // Naranja oscuro
};

// ================================================================
//  TIPOS DE CORTE
// ================================================================
export type CutType = "quincena_1" | "quincena_2";

export const CUT_TYPE_LABELS: Record<CutType, string> = {
  quincena_1: "Corte 1-15",
  quincena_2: "Corte 16-31",
};

export const CUT_TYPE_DATES = {
  quincena_1: { start: 1, end: 15 },
  quincena_2: { start: 16, end: 31 },
};

// ================================================================
//  UTILIDADES
// ================================================================

/**
 * Determine cut type based on current date
 */
export function getCurrentCutType(): CutType {
  const day = new Date().getDate();
  return day <= 15 ? "quincena_1" : "quincena_2";
}

/**
 * Get next cut date (when can request next cut)
 */
export function getNextCutDate(): Date {
  const now = new Date();
  const day = now.getDate();

  if (day < 15) {
    // Next cut on 15th
    return new Date(now.getFullYear(), now.getMonth(), 15);
  } else if (day === 15) {
    // Can request now
    return new Date(now);
  } else if (day < 31 && now.getMonth() === 1 && now.getFullYear() % 4 === 0) {
    // February
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  } else if (day < getDaysInMonth(now)) {
    // Next cut on last day or 1st of next month
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  } else {
    // Next cut on 1st
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }
}

/**
 * Get days in current month
 */
function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Format period string "2024-11" to "Noviembre 2024"
 */
export function formatPeriod(period: string): string {
  const [year, month] = period.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleString("es-CO", { month: "long", year: "numeric" });
}

/**
 * Check if cut request is overdue (was not paid within 7 days)
 */
export function isCutRequestOverdue(request: PaymentCutRequest): boolean {
  if (request.status === "paid") return false;

  const now = new Date();
  const requestDate = new Date(request.requestedAt);
  const daysSinceRequest = (now.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24);

  return daysSinceRequest > 7;
}
