// --- Modelo interno del front ---
export interface Service {
  id: string;
  destination: string;
  phone: string;
  notes?: string;
  payment: "efectivo" | "transferencia" | "tarjeta";
  amount: number;
  price?: number;
  isPaid?: boolean;

  prepTime?: number | null;
  expectedAt?: Date | null;
  createdAt: Date;
  status?: "disponible" | "asignado" | "en_ruta" | "entregado" | "cancelado";
  pickup?: string;
  assignedDelivery?: string | null;
  storeId?: string | null;
  storeName?: string | null; // 👈 agregado
  branchId?: string | null;
  zoneId?: string | null;
}




export interface ServicePayload {
  delivery_address: string;
  client_phone: string;
  notes?: string;
  payment_method: "efectivo" | "transferencia" | "tarjeta";
  total_to_collect: number;
  price?: number;
  pickup_address?: string;
  store_id?: string | null;
  branch_id?: string | null;
  zone_id?: string | null;
  expected_at?: number | null; // timestamp (epoch millis) cuando mandamos
}

export interface ServiceResponse {
  id: string;
  delivery_address: string;
  client_phone: string;
  notes?: string;
  payment_method: string;
  total_to_collect: number;
  price?: number;
  is_paid: boolean;
  pickup_address?: string;
  status: string;
  assigned_delivery?: string | null;
  store_id?: string | null;
  branch_id?: string | null;
  zone_id?: string | null;
  expected_at?: string | null;
  created_at: string;
  completed_at?: string | null;
  assigned_at?: string | null;
  trayecto_at?: string | null;
  finalized_at?: string | null;

  // 👇 relación anidada opcional
  store?: {
    id: string;
    name: string;
  } | null;
}



// --- Mappers (transformadores) ---
export function toService(dto: ServiceResponse): Service {
  const expectedDate = dto.expected_at ? new Date(dto.expected_at) : null;
  const createdDate = new Date(dto.created_at);

  return {
    id: dto.id,
    destination: dto.delivery_address,
    phone: dto.client_phone,
    notes: dto.notes,
    payment: dto.payment_method as Service["payment"],
    amount: dto.total_to_collect,
    price: dto.price ?? 0,
    isPaid: dto.is_paid,
    expectedAt: expectedDate,
    prepTime: expectedDate
      ? Math.round((expectedDate.getTime() - createdDate.getTime()) / 60000)
      : null,
    createdAt: createdDate,
    status: dto.status as Service["status"],
    pickup: dto.pickup_address ?? undefined,
    assignedDelivery: dto.assigned_delivery ?? null,
    storeId: dto.store_id ?? null,
    storeName: dto.store?.name ?? null, // 👈 mapeo directo
    branchId: dto.branch_id ?? null,
    zoneId: dto.zone_id ?? null,
  };
}



export function toServicePayload(service: Service): ServicePayload {
  return {
    delivery_address: service.destination,
    client_phone: service.phone,
    notes: service.notes,
    payment_method: service.payment,
    total_to_collect: service.amount,
    price: service.price,
    pickup_address: service.pickup,
    expected_at: service.prepTime
      ? new Date(service.createdAt.getTime() + service.prepTime * 60_000).getTime()
      : null,
    store_id: service.storeId,
    branch_id: service.branchId,
    zone_id: service.zoneId,
  };
}


