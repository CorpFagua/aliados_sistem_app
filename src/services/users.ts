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
    const res = await api.post<{ ok: boolean; data: UserResponse }>("/users", payload, {
      headers: authHeaders(token),
    });
    if (!res.data.ok) throw res.data;
    return toUser(res.data.data);
  } catch (err: any) {
    console.error("❌ Error creando usuario:", err.response?.data || err.message);
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
    console.log("Updating user with payload:", payload);
    const res = await api.patch<{ ok: boolean; data: UserResponse }>(
      `/users/${id}`,
      payload,
      { headers: authHeaders(token) }
    );
    if (!res.data.ok) throw res.data;
    return toUser(res.data.data);
  } catch (err: any) {
    console.error("❌ Error actualizando usuario:", err.response?.data || err.message);
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

// ⭐ Actualizar estado VIP de un usuario
export async function updateUserVIP(id: string, isVIP: boolean, token: string): Promise<User> {
  try {
    console.log(`⭐ Actualizando VIP para usuario ${id}:`, isVIP);
    const res = await api.patch<{ ok: boolean; data: UserResponse }>(
      `/users/${id}`,
      { is_VIP: isVIP }, // Enviar en snake_case como espera el backend
      { headers: authHeaders(token) }
    );
    if (!res.data.ok) throw res.data;
    return toUser(res.data.data);
  } catch (err: any) {
    console.error("❌ Error actualizando VIP:", err.response?.data || err.message);
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
