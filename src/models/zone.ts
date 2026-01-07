// --- Modelo interno del front ---
export interface Zone {
  id: string;
  name: string;
  branchId: string;
  isActive: boolean;
  createdAt: Date;
}

export interface ZonePayload {
  name: string;
  branch_id?: string; // 👈 aquí sí respetamos el snake_case porque es para el backend
  is_active?: boolean;
}

// --- Respuesta cruda desde el backend ---
export interface ZoneResponse {
  id: string;
  name: string;
  branch_id: string;
  is_active: boolean;
  created_at: string; // ISO string
}

// DTO -> Modelo interno
export function toZone(dto: ZoneResponse): Zone {
  return {
    id: dto.id,
    name: dto.name,
    branchId: dto.branch_id,
    isActive: dto.is_active,
    createdAt: new Date(dto.created_at),
  };
}

// Modelo -> Payload (para crear/actualizar en el backend)
export function toZonePayload(zone: Zone): ZonePayload {
  return {
    name: zone.name,
    branch_id: zone.branchId,
    is_active: zone.isActive,
  };
}
