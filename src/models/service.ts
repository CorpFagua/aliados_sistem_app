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

  // --- Relaciones e IDs ---
  assignedDelivery?: string | null;         // id del domiciliario
  assignedDeliveryName?: string | null;     // nombre del domiciliario
  storeId?: string | null;                  // id de la tienda
  storeName?: string | null;                // nombre de la tienda
  branchId?: string | null;
  zoneId?: string | null;                   // id de la zona
  zoneName?: string | null;                 // nombre de la zona
}

// --- Payloads para envío al backend ---
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
  expected_at?: Date | null; // timestamp (epoch millis)
  prep_time?: number | null; // minutos solicitados
}

export interface ServicePayloadAdmin extends ServicePayload {
  store_id: string;
}

// --- Respuesta del backend ---
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

  store?: {
    id: string;
    name: string;
  } | null;

  zone?: {
    id: string;
    name: string;
  } | null;

  profiles?: {
    id: string;
    name: string;
  } | null;
}


// --- Mappers ---
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
    assignedDeliveryName: dto.profiles?.name ?? null, // 👈 viene de la relación "profiles"
    storeId: dto.store_id ?? null,
    storeName: dto.store?.name ?? null,
    branchId: dto.branch_id ?? null,
    zoneId: dto.zone_id ?? null,
    zoneName: dto.zone?.name ?? null,
  };
}


// --- Mapper inverso ---
export function toServicePayload(service: Service): ServicePayload {
  return {
    delivery_address: service.destination,
    client_phone: service.phone,
    notes: service.notes,
    payment_method: service.payment,
    total_to_collect: service.amount,
    price: service.price,
    pickup_address: service.pickup,
    prep_time: service.prepTime,
    store_id: service.storeId,
    branch_id: service.branchId,
    zone_id: service.zoneId,
  };
}
