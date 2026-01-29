import { api, authHeaders } from "../lib/api";
import {
  User,
  UserPayload,
  UserResponse,
  toUser,
} from "@/models/user";

// ✅ Crear usuario
export async function createUser(payload: UserPayload, token: string): Promise<User> {
  try {
    console.log("[FRONTEND CREATE USER] ===== INICIO =====");
    console.log("[FRONTEND CREATE USER] Payload keys:", Object.keys(payload));
    console.log("[FRONTEND CREATE USER] Payload completo:", JSON.stringify(payload, null, 2));
    console.log("[FRONTEND CREATE USER] is_VIP:", typeof payload.is_VIP, "=", payload.is_VIP);

    const res = await api.post<{ ok: boolean; data: UserResponse }>("/users", payload, {
      headers: authHeaders(token),
    });
    
    console.log("[FRONTEND CREATE USER] Response status:", res.status);
    console.log("[FRONTEND CREATE USER] Response is_VIP:", res.data.data.is_VIP);
    
    if (!res.data.ok) throw res.data;
    const mapped = toUser(res.data.data);
    console.log("[FRONTEND CREATE USER] Mapped user isVIP:", mapped.isVIP);
    return mapped;
  } catch (err: any) {
    console.error("[FRONTEND CREATE USER] ❌ Error:", err.response?.data || err.message);
    throw err;
  }
}

// ✅ Obtener todos los usuarios (según rol)
export async function fetchUsers(token: string): Promise<User[]> {
  try {
    const res = await api.get<{ ok: boolean; data: UserResponse[] }>("/users", {
      headers: authHeaders(token),
    });
    if (!res.data.ok) throw res.data;
    return res.data.data.map(toUser);
  } catch (err: any) {
    console.error("❌ Error listando usuarios:", err.response?.data || err.message);
    throw err;
  }
}

// ✅ Obtener un usuario por ID
export async function fetchUserById(id: string, token: string): Promise<User> {
  try {
    const res = await api.get<{ ok: boolean; data: UserResponse }>(`/users/${id}`, {
      headers: authHeaders(token),
    });
    if (!res.data.ok) throw res.data;
    return toUser(res.data.data);
  } catch (err: any) {
    console.error("❌ Error obteniendo usuario:", err.response?.data || err.message);
    throw err;
  }
}

// ✅ Actualizar usuario
export async function updateUser(id: string, payload: Partial<UserPayload>, token: string): Promise<User> {
  try {
    console.log("[FRONTEND UPDATE USER] ===== INICIO =====");
    console.log("[FRONTEND UPDATE USER] ID:", id);
    console.log("[FRONTEND UPDATE USER] Payload tipo:", typeof payload);
    console.log("[FRONTEND UPDATE USER] Payload keys:", Object.keys(payload));
    console.log("[FRONTEND UPDATE USER] Payload completo:", JSON.stringify(payload, null, 2));
    
    // Verificar tipos de cada campo
    Object.entries(payload).forEach(([key, value]) => {
      console.log(`[FRONTEND UPDATE USER]   ${key}: ${typeof value} = ${JSON.stringify(value)}`);
    });

    const res = await api.patch<{ ok: boolean; data: UserResponse }>(
      `/users/${id}`,
      payload,
      { headers: authHeaders(token) }
    );
    
    console.log("[FRONTEND UPDATE USER] Status:", res.status);
    console.log("[FRONTEND UPDATE USER] Response ok:", res.data.ok);
    console.log("[FRONTEND UPDATE USER] Response data keys:", Object.keys(res.data.data));
    console.log("[FRONTEND UPDATE USER] Response is_VIP:", res.data.data.is_VIP);
    console.log("[FRONTEND UPDATE USER] Respuesta del backend:", JSON.stringify(res.data.data, null, 2));
    
    if (!res.data.ok) throw res.data;
    const mapped = toUser(res.data.data);
    console.log("[FRONTEND UPDATE USER] Mapped user isVIP:", mapped.isVIP);
    return mapped;
  } catch (err: any) {
    console.error("[FRONTEND UPDATE USER] ❌ Error:", err.response?.data || err.message);
    throw err;
  }
}

// ✅ Eliminar usuario
export async function deleteUser(id: string, token: string): Promise<boolean> {
  try {
    const res = await api.delete<{ ok: boolean; data?: any }>(`/users/${id}`, {
      headers: authHeaders(token),
    });
    if (!res.data.ok) throw res.data;
    return true;
  } catch (err: any) {
    console.error("❌ Error eliminando usuario:", err.response?.data || err.message);
    throw err;
  }
}

/* 🔹 NUEVOS MÉTODOS */

/**
 * Obtener lista de domiciliarios (opcional: filtrar por nombre)
 * GET /users/deliveries?search=nombre
 */
export async function fetchDeliveries(token: string, search?: string): Promise<User[]> {
  try {
    const url = search
      ? `/users/deliveries?search=${encodeURIComponent(search)}`
      : `/users/deliveries`;

    const res = await api.get<{ ok: boolean; data: UserResponse[] }>(url, {
      headers: authHeaders(token),
    });

    if (!res.data.ok) throw res.data;
    return res.data.data.map(toUser);
  } catch (err: any) {
    console.error("❌ Error listando domiciliarios:", err.response?.data || err.message);
    throw err;
  }
}

/**
 * Obtener lista de administradores de tienda (opcional: filtrar por nombre)
 * GET /users/stores?search=nombre
 */
export async function fetchStoreAdmins(token: string, search?: string): Promise<User[]> {
  try {
    const url = search
      ? `/users/stores?search=${encodeURIComponent(search)}`
      : `/users/stores`;

    const res = await api.get<{ ok: boolean; data: UserResponse[] }>(url, {
      headers: authHeaders(token),
    });

    if (!res.data.ok) throw res.data;
    return res.data.data.map(toUser);
  } catch (err: any) {
    console.error("❌ Error listando administradores de tienda:", err.response?.data || err.message);
    throw err;
  }
}
