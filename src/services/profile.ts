// src/services/me.ts
import { api, authHeaders } from "@/lib/api";

export async function fetchCurrentUser(token: string) {
  const res = await api.get("/profile", {
    headers: authHeaders(token),
  });
  return res.data.data; // devuelve el objeto perfil completo
}
