// --- Modelo interno del front ---
export interface User {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  role: "super_admin" | "coordinator" | "store" | "delivery" | "user";
  isActive: boolean;
  branchId?: string | null;
  storeId?: string | null;
  email?: string;
  createdAt: Date;
}

// --- Payload para crear/editar (lo que se envía al backend) ---
export interface UserPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  role: "super_admin" | "coordinator" | "store" | "delivery" | "user";
  branch_id?: string | null;
  store_id?: string | null;
  isActive?: boolean;
}

// --- Respuesta del backend ---
export interface UserResponse {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  role: string;
  isActive: boolean;
  branch_id?: string | null;
  store_id?: string | null;
  created_at: string;
  email?: string;
  branch?: { id: string; name: string } | null;
  store?: { id: string; name: string } | null;
}

// --- Mappers ---
export function toUser(dto: UserResponse): User {
  return {
    id: dto.id,
    name: dto.name,
    phone: dto.phone,
    address: dto.address,
    role: dto.role as User["role"],
    isActive: dto.isActive,
    branchId: dto.branch_id ?? null,
    storeId: dto.store_id ?? null,
    email: dto.email,
    createdAt: new Date(dto.created_at),
  };
}

export function toUserPayload(user: User & { email: string; password: string }): UserPayload {
  return {
    name: user.name,
    email: user.email,
    password: user.password,
    phone: user.phone ?? undefined,
    address: user.address ?? undefined,
    role: user.role,
    branch_id: user.branchId ?? undefined,
    store_id: user.storeId ?? undefined,
    isActive: user.isActive,
  };
}
