import axios from "axios";
import { Service, ServicePayload, ServiceResponse, toService } from "@/models/service";

const API_URL = "http://localhost:3000/api";

// Crear un servicio (envía DTO y devuelve modelo del front)
export async function createService(
  payload: ServicePayload,
  token: string
): Promise<Service> {
  try {
    const res = await axios.post<ServiceResponse>(`${API_URL}/services`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return toService(res.data);
  } catch (err: any) {
    console.error("❌ Error creando servicio:", err.response?.data || err.message);
    throw err;
  }
}

// Obtener lista de servicios
export async function fetchServices(token: string): Promise<Service[]> {
  try {
    const res = await axios.get(`${API_URL}/services`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // ⚡ Aseguramos que siempre sea un array
    const raw = Array.isArray(res.data) ? res.data : res.data.data;

    // ⚡ Transformamos DTO -> Modelo interno
    return raw.map(toService);
  } catch (err: any) {
    console.error("❌ Error fetching services:", err.response?.data || err.message);
    throw err;
  }
}

export async function updateServiceStatus(
  serviceId: string,
  status: "disponible" | "asignado" | "en_ruta" | "entregado" | "cancelado" | "rechazado",
  token: string,
  deliveryId?: string
): Promise<Service> {
  try {
    const res = await axios.patch<ServiceResponse>(
      `${API_URL}/services/${serviceId}/status`,
      { status, deliveryId }, // 👈 se manda si aplica
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return toService(res.data); // ⚡ devuelve el servicio actualizado
  } catch (err: any) {
    console.error("❌ Error updating service status:", err.response?.data || err.message);
    throw err;
  }
}



