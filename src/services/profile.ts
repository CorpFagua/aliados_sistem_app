// src/services/me.ts
import { api, authHeaders } from "@/lib/api";
import { toUser, type UserResponse } from "@/models/user";

export async function fetchCurrentUser(token: string) {
  const res = await api.get("/profile", {
    headers: authHeaders(token),
  });
  const userData: UserResponse = res.data.data;
  return toUser(userData); // Mapear correctamente snake_case → camelCase
}
