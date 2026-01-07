// src/models/store.ts

export interface Store {
  id: string;
  name: string;
  adminId: string;
  branchId: string;
  type: "credito" | "efectivo";
  createdAt: string;
  branch?: {
    id: string;
    name: string;
    address: string;
  };
  profiles?: {
    id: string;
    name: string;
    phone: string;
  }[];
}

// Lo que viene del backend (snake_case)
export interface StoreResponse {
  id: string;
  name: string;
  admin_id: string;
  branch_id: string;
  type: "credito" | "efectivo";
  created_at: string;
  branches?: {
    id: string;
    name: string;
    address: string;
  };
  profiles?: {
    id: string;
    name: string;
    phone: string;
  }[];
}

// Payload para crear/editar
export interface StorePayload {
  name: string;
  admin_id?: string;
  branch_id?: string;
  type: "credito" | "efectivo";
}

// Mapper snake_case → camelCase
export function toStore(r: StoreResponse): Store {
  return {
    id: r.id,
    name: r.name,
    adminId: r.admin_id,
    branchId: r.branch_id,
    type: r.type,
    createdAt: r.created_at,
    branch: r.branches
      ? {
          id: r.branches.id,
          name: r.branches.name,
          address: r.branches.address,
        }
      : undefined,
    profiles: r.profiles?.map((p) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
    })),
  };
}
