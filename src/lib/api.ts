import axios from "axios";
import { getApiUrl } from "@/config/environment";

const API_URL = getApiUrl();

// ⚡ Siempre que uses la API, parte de aquí
export const api = axios.create({
  baseURL: `${API_URL}/api`, // 👈 agregamos /api automáticamente
});

// Log para debugging (solo en desarrollo)
if (__DEV__) {
  console.log('🌐 API Base URL:', API_URL);
}

// Helper para headers con token
export function authHeaders(token: string) {
  if (!token) {
    console.warn(`⚠️  [API] authHeaders: No hay token disponible`);
  }
  return { 
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}
