import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL_LOCAL;

// ⚡ Siempre que uses la API, parte de aquí
export const api = axios.create({
  baseURL: `${API_URL}/api`, // 👈 agregamos /api automáticamente
});

// Helper para headers con token
export function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}
