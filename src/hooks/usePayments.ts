import { useState, useCallback } from "react";
import { api, authHeaders } from "../lib/api";

// ================================================================
//  MODELOS DE PAGOS
// ================================================================
export interface DeliveryEarnings {
  delivery_id: string;
  current_period_earnings: number;
  total_earnings: number;
  total_paid: number;
  total_pending: number;
  last_updated: string;
}

export interface PaymentSnapshot {
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

export interface DeliveryPaymentRequest {
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

export interface PendingPaymentRequest {
  id: string;
  delivery_id: string;
  snapshot_id: string;
  status: string;
  requested_at: string;
  delivery: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  snapshot: {
    id: string;
    user_id: string;
    period: string;
    services_ids: string[];
    total_earned: number;
    status: string;
    created_at: string;
  };
  total_to_pay: number;
}

export interface StorePaymentRecord {
  id: string;
  store_id: string;
  period: string;
  total_charged: number;
  total_paid: number;
  total_pending: number;
  status: "pending" | "partial" | "paid";
  created_at: string;
}

export interface CreatePaymentRequestDTO {
  snapshot_id: string;
}

export interface CreateDeliveryPaymentDTO {
  snapshot_id: string;
  payment_method: "efectivo" | "transferencia" | "cheque" | "otro";
  reference?: string;
}

// ================================================================
//  HOOK PRINCIPAL
// ================================================================
export function usePayments(token: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers = token ? authHeaders(token) : {};

  // ============== GANANCIAS ==============

  /**
   * Obtener ganancias actuales del domiciliario
   */
  const getDeliveryEarnings = useCallback(async (): Promise<DeliveryEarnings | null> => {
    if (!token) {
      setError("No hay sesión activa");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<DeliveryEarnings>(
        "/payments/delivery-earnings",
        { headers }
      );
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || "Error obteniendo ganancias";
      setError(message);
      console.error("❌ Error en getDeliveryEarnings:", message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, headers]);

  /**
   * Obtener deuda total del domiciliario
   */
  const getDeliveryDebt = useCallback(async (): Promise<number> => {
    if (!token) {
      setError("No hay sesión activa");
      return 0;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<{ total_debt: number }>(
        "/payments/debt/delivery",
        { headers }
      );
      return response.data.total_debt;
    } catch (err: any) {
      const message = err.response?.data?.message || "Error obteniendo deuda";
      setError(message);
      console.error("❌ Error en getDeliveryDebt:", message);
      return 0;
    } finally {
      setLoading(false);
    }
  }, [token, headers]);

  // ============== SOLICITUDES DE CORTE ==============

  /**
   * Crear solicitud de corte (domiciliario)
   */
  const createPaymentRequest = useCallback(
    async (data: CreatePaymentRequestDTO): Promise<DeliveryPaymentRequest | null> => {
      console.log('\n🟦 [HOOK] === createPaymentRequest ===');
      console.log(`📌 Data: ${JSON.stringify(data)}`);
      console.log(`🔐 Token: ${token ? '✅ disponible' : '❌ NO disponible'}`);

      if (!token) {
        console.error('❌ [HOOK] No hay sesión activa');
        setError("No hay sesión activa");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('\n📤 [HOOK] Enviando POST a /payments/requests');
        console.log(`📋 Body: ${JSON.stringify(data)}`);
        console.log(`🔐 Headers: ${JSON.stringify(headers, null, 2)}`);

        const response = await api.post<any>(
          "/payments/requests",
          data,
          { headers }
        );

        console.log(`\n✅ [HOOK] Respuesta recibida:`, response.data);

        const request = response.data?.data || response.data;
        console.log(`📌 Request retornado:`, request);

        return request;
      } catch (err: any) {
        const message = err.response?.data?.message || err.message || "Error creando solicitud";
        console.error("\n❌ [HOOK] Error en createPaymentRequest:", message);
        console.error('   Status:', err.response?.status);
        console.error('   Full error:', JSON.stringify(err.response?.data, null, 2));
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, headers]
  );

  /**
   * Obtener todas las solicitudes de pago del usuario
   */
  const getPaymentRequests = useCallback(async (filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<DeliveryPaymentRequest[]> => {
    if (!token) {
      setError("No hay sesión activa");
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.limit) params.append("limit", filters.limit.toString());
      if (filters?.offset) params.append("offset", filters.offset.toString());

      const response = await api.get<DeliveryPaymentRequest[]>(
        `/payments/requests?${params.toString()}`,
        { headers }
      );
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || "Error obteniendo solicitudes";
      setError(message);
      console.error("❌ Error en getPaymentRequests:", message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token, headers]);

  /**
   * Obtener solicitudes de pago pendientes (coordinador)
   */
  const getPendingPaymentRequests = useCallback(async (): Promise<PendingPaymentRequest[]> => {
    if (!token) {
      setError("No hay sesión activa");
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<{ ok: boolean; data: PendingPaymentRequest[] }>(
        "/payments/requests/pending",
        { headers }
      );
      return response.data.data || [];
    } catch (err: any) {
      const message = err.response?.data?.message || "Error obteniendo solicitudes pendientes";
      setError(message);
      console.error("❌ Error en getPendingPaymentRequests:", message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token, headers]);

  /**
   * Aprobar solicitud de pago (coordinador)
   */
  const approvePaymentRequest = useCallback(
    async (requestId: string, notes?: string): Promise<DeliveryPaymentRequest | null> => {
      if (!token) {
        setError("No hay sesión activa");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await api.patch<DeliveryPaymentRequest>(
          `/payments/requests/${requestId}/approve`,
          { notes },
          { headers }
        );
        return response.data;
      } catch (err: any) {
        const message = err.response?.data?.message || "Error aprobando solicitud";
        setError(message);
        console.error("❌ Error en approvePaymentRequest:", message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, headers]
  );

  /**
   * Rechazar solicitud de pago (coordinador)
   */
  const rejectPaymentRequest = useCallback(
    async (requestId: string, reason?: string): Promise<DeliveryPaymentRequest | null> => {
      if (!token) {
        setError("No hay sesión activa");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await api.patch<DeliveryPaymentRequest>(
          `/payments/requests/${requestId}/reject`,
          { reason },
          { headers }
        );
        return response.data;
      } catch (err: any) {
        const message = err.response?.data?.message || "Error rechazando solicitud";
        setError(message);
        console.error("❌ Error en rejectPaymentRequest:", message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, headers]
  );

  // ============== FACTURAS (SNAPSHOTS) ==============

  /**
   * Obtener snapshots (facturas) del usuario
   */
  const getPaymentSnapshots = useCallback(async (filters?: {
    type?: string;
    status?: string;
    limit?: number;
  }): Promise<PaymentSnapshot[]> => {
    if (!token) {
      setError("No hay sesión activa");
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append("type", filters.type);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.limit) params.append("limit", filters.limit.toString());

      const response = await api.get<PaymentSnapshot[]>(
        `/payments/snapshots?${params.toString()}`,
        { headers }
      );
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || "Error obteniendo snapshots";
      setError(message);
      console.error("❌ Error en getPaymentSnapshots:", message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token, headers]);

  /**
   * Crear snapshot a partir de servicios (utilizado por domiciliarios)
   */
  const createSnapshotFromServices = useCallback(
    async (services_ids: string[]): Promise<PaymentSnapshot | null> => {
      console.log('\n🟦 [HOOK] === createSnapshotFromServices ===');
      console.log(`📦 Service IDs: ${JSON.stringify(services_ids)}`);
      console.log(`🔐 Token: ${token ? '✅ disponible' : '❌ NO disponible'}`);

      if (!token) {
        console.error('❌ [HOOK] No hay sesión activa');
        setError("No hay sesión activa");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('\n📤 [HOOK] Enviando POST a /payments/snapshots/from-services');
        console.log(`📋 Body: ${JSON.stringify({ services_ids })}`);
        console.log(`🔐 Headers: ${JSON.stringify(headers, null, 2)}`);

        const response = await api.post<any>(
          "/payments/snapshots/from-services",
          { services_ids },
          { headers }
        );

        console.log(`\n✅ [HOOK] Respuesta recibida:`, response.data);

        const snapshot = response.data?.data || response.data;
        console.log(`📌 Snapshot retornado:`, snapshot);

        return snapshot;
      } catch (err: any) {
        const message = err.response?.data || err.message || "Error creando snapshot";
        console.error("\n❌ [HOOK] Error en createSnapshotFromServices:", message);
        console.error('   Status:', err.response?.status);
        console.error('   Full error:', JSON.stringify(err.response?.data, null, 2));
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, headers]
  );

  /**
   * Obtener detalles de un snapshot específico
   */
  const getPaymentSnapshot = useCallback(
    async (snapshotId: string): Promise<PaymentSnapshot | null> => {
      if (!token) {
        setError("No hay sesión activa");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await api.get<PaymentSnapshot>(
          `/payments/snapshots/${snapshotId}`,
          { headers }
        );
        return response.data;
      } catch (err: any) {
        const message = err.response?.data?.message || "Error obteniendo snapshot";
        setError(message);
        console.error("❌ Error en getPaymentSnapshot:", message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, headers]
  );

  // ============== DEUDA DE TIENDAS ==============

  /**
   * Obtener registros de deuda de tienda
   */
  const getStorePaymentRecords = useCallback(async (filters?: {
    status?: string;
    limit?: number;
  }): Promise<StorePaymentRecord[]> => {
    if (!token) {
      setError("No hay sesión activa");
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.limit) params.append("limit", filters.limit.toString());

      const response = await api.get<StorePaymentRecord[]>(
        `/payments/store-records?${params.toString()}`,
        { headers }
      );
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || "Error obteniendo registros";
      setError(message);
      console.error("❌ Error en getStorePaymentRecords:", message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token, headers]);

  /**
   * Marcar deuda de tienda como pagada (coordinador)
   */
  const markStorePaymentRecordAsPaid = useCallback(
    async (recordId: string): Promise<StorePaymentRecord | null> => {
      if (!token) {
        setError("No hay sesión activa");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await api.patch<StorePaymentRecord>(
          `/payments/store-records/${recordId}/pay`,
          {},
          { headers }
        );
        return response.data;
      } catch (err: any) {
        const message = err.response?.data?.message || "Error marcando pago";
        setError(message);
        console.error("❌ Error en markStorePaymentRecordAsPaid:", message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, headers]
  );

  /**
   * Obtener deuda total de tienda
   */
  const getStoreDebt = useCallback(async (): Promise<number> => {
    if (!token) {
      setError("No hay sesión activa");
      return 0;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<{ total_debt: number }>(
        "/payments/debt/store",
        { headers }
      );
      return response.data.total_debt;
    } catch (err: any) {
      const message = err.response?.data?.message || "Error obteniendo deuda";
      setError(message);
      console.error("❌ Error en getStoreDebt:", message);
      return 0;
    } finally {
      setLoading(false);
    }
  }, [token, headers]);

  // ============== PAGOS ==============

  /**
   * Registrar pago a domiciliario
   */
  const createDeliveryPayment = useCallback(
    async (data: CreateDeliveryPaymentDTO): Promise<any | null> => {
      if (!token) {
        setError("No hay sesión activa");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await api.post(
          "/payments/delivery-payments",
          data,
          { headers }
        );
        return response.data;
      } catch (err: any) {
        const message = err.response?.data?.message || "Error registrando pago";
        setError(message);
        console.error("❌ Error en createDeliveryPayment:", message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, headers]
  );

  /**
   * Obtener historial de pagos
   */
  const getPaymentHistory = useCallback(async (filters?: {
    user_id?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> => {
    if (!token) {
      setError("No hay sesión activa");
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.user_id) params.append("user_id", filters.user_id);
      if (filters?.type) params.append("type", filters.type);
      if (filters?.limit) params.append("limit", filters.limit.toString());
      if (filters?.offset) params.append("offset", filters.offset.toString());

      const response = await api.get<any[]>(
        `/payments/history?${params.toString()}`,
        { headers }
      );
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || "Error obteniendo historial";
      setError(message);
      console.error("❌ Error en getPaymentHistory:", message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token, headers]);

  /**
   * Pagar servicios como coordinador
   * Crea snapshot y marca servicios como pagados
   */
  const coordinatorPayServices = useCallback(
    async (serviceIds: string[], deliveryId: string): Promise<any | null> => {
      if (!token) {
        setError("No hay sesión activa");
        return null;
      }

      if (!serviceIds || serviceIds.length === 0) {
        setError("No hay servicios para pagar");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('\n🟦 [COORDINATOR] === coordinatorPayServices ===');
        console.log(`📦 Service IDs: ${JSON.stringify(serviceIds)}`);
        console.log(`👤 Delivery ID: ${deliveryId}`);

        // 1. Crear snapshot de pago
        console.log('\n📸 Creando snapshot...');
        const snapshotResponse = await api.post(
          '/payments/snapshots/from-services',
          { services_ids: serviceIds },
          { headers }
        );

        const snapshot = snapshotResponse.data;
        if (!snapshot || !snapshot.id) {
          throw new Error('No se pudo crear snapshot');
        }

        console.log(`✅ Snapshot creado: ${snapshot.id}`);

        // 2. Marcar servicios como pagados
        console.log('\n📝 Marcando servicios como pagados...');
        const markPaymentResponse = await api.patch(
          '/payments/snapshots/mark-paid',
          { 
            snapshot_id: snapshot.id,
            service_ids: serviceIds,
            paid_by_role: 'coordinator'
          },
          { headers }
        );

        console.log(`✅ Servicios marcados como pagados`);

        return {
          snapshot,
          marked: markPaymentResponse.data
        };
      } catch (err: any) {
        const message = err.response?.data?.message || "Error procesando pago";
        setError(message);
        console.error("❌ Error en coordinatorPayServices:", message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, headers]
  );

  return {
    // Estado
    loading,
    error,
    setError,

    // Ganancias
    getDeliveryEarnings,
    getDeliveryDebt,

    // Solicitudes
    createPaymentRequest,
    getPaymentRequests,
    getPendingPaymentRequests,
    approvePaymentRequest,
    rejectPaymentRequest,

    // Snapshots
    getPaymentSnapshots,
    getPaymentSnapshot,
    createSnapshotFromServices,

    // Tiendas
    getStorePaymentRecords,
    markStorePaymentRecordAsPaid,
    getStoreDebt,

    // Pagos
    createDeliveryPayment,
    getPaymentHistory,
    coordinatorPayServices,
  };
}
