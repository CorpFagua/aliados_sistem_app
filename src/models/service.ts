// ================================================================
//  MODELO INTERNO DEL FRONT
// ================================================================
export interface Service {
  id: string;

  // Datos base
  destination: string;                       // delivery_address
  phone: string;                             // client_phone
  clientName?: string | null;                // client_name
  notes?: string;
  payment: "efectivo" | "transferencia" | "tarjeta";
  amount: number;                            // total_to_collect
  price?: number;                            // price
  priceDeliverySrv?: number;                 // price_delivery_srv (para domiciliarios)
  isPaid?: boolean;

  // Tiempos
  prepTime?: number | null;
  completedAt?: Date | null;
  expectedAt?: Date | null;
  createdAt: Date;

  // Estado
  status?: "disponible" | "asignado" | "en_ruta" | "entregado" | "cancelado";

  // Paquetería
  pickup?: string | null;                    // pickup_address

  // Tipo de servicio
  typeId?: ServiceTypeId | null;             // tipo de servicio (domicilio, paquetería)

  // Relaciones
  assignedDelivery?: string | null;
  assignedDeliveryName?: string | null;

  storeId?: string | null;                   // ID de la tienda (para precios)
  storeName?: string | null;                 // Nombre de la tienda

  profileStoreId?: string | null;            // ID del perfil (usuario) tienda
  profileStoreName?: string | null;          // Nombre del perfil (usuario) tienda 🟢

  branchId?: string | null;
  zoneId?: string | null;
  zoneName?: string | null;
}


// ================================================================
//  PAYLOADS PARA CREACIÓN NORMAL (TIENDAS)
// ================================================================
export interface ServicePayload {
  delivery_address: string;
  client_phone: string;
  client_name?: string | null;              // nombre del cliente
  notes?: string;

  payment_method: "efectivo" | "transferencia" | "tarjeta";

  total_to_collect: number;
  price?: number;
  price_delivery_srv?: number;               // precio para domiciliario

  pickup_address?: string;

  store_id?: string | null;
  branch_id?: string | null;
  zone_id?: string | null;
  profile_store_id?: string | null;  // 🟢 Nuevo campo

  expected_at?: Date | null;   // programados
  prep_time?: number | null;   // minutos
}


// ================================================================
//  PAYLOAD PARA TIENDAS CON ADMIN
// ================================================================
export interface ServicePayloadAdmin extends ServicePayload {
  store_id: string; // requerido para admin
}


// ================================================================
//  SERVICE TYPES PARA ADMIN (TABLA service_types EN SUPABASE)
// ================================================================
export type ServiceTypeId =
  | "domicilio"
  | "paqueteria_aliados"
  | "paqueteria_coordinadora";


// ================================================================
//  PAYLOAD ESPECIAL PARA CREACIÓN POR ADMIN
// ================================================================
export interface ServiceAdminPayload {
  type_id: ServiceTypeId;           // tipo de servicio

  branch_id?: string;               // sucursal (obtenida del usuario si no se proporciona)
  store_id?: string;                // tienda (para obtener precios)
  profile_store_id?: string;        // 🟢 perfil (usuario) que solicita el servicio

  delivery_address: string;         // destino (requerido)
  pickup_address?: string | null;   // origen (para paquetería)

  client_phone?: string | null;
  client_name?: string | null;      // nombre del cliente
  notes?: string | null;

  payment_method: "efectivo" | "transferencia" | "tarjeta";

  total_to_collect?: number | null; // monto recoger (domicilio)
  price?: number | null;            // costo servicio (paquetería)
  price_delivery_srv?: number | null; // precio para domiciliario
  
  prep_time?: number | null;        // tiempo de preparación (domicilio)
  guide_number?: string | null;     // número de guía (para paqueteria_coordinadora)
  
  // NOTE: zone_id se asigna DESPUÉS de crear el servicio
}


// ================================================================
//  RESPUESTA COMPLETA DEL BACKEND
// ================================================================
export interface ServiceResponse {
  id: string;

  delivery_address: string;
  client_phone: string;
  client_name?: string | null;
  notes?: string;

  payment_method: string;
  total_to_collect: number;

  price?: number;
  price_delivery_srv?: number;
  is_paid: boolean;

  pickup_address?: string;

  status: string;

  assigned_delivery?: string | null;

  store_id?: string | null;
  profile_store_id?: string | null;
  branch_id?: string | null;
  zone_id?: string | null;

  expected_at?: string | null;
  created_at: string;

  completed_at?: string | null;
  assigned_at?: string | null;
  trayecto_at?: string | null;
  finalized_at?: string | null;

  type_id?: string | null;  // tipo de servicio (domicilio, paquetería_aliados, paquetería_coordinadora)

  store?: {
    id: string;
    name: string;
  } | null;

  profile_store?: {
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


// ================================================================
//  MAPPER: BACKEND → FRONT
// ================================================================
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
    price: dto.price ?? undefined,
    isPaid: dto.is_paid,

    expectedAt: expectedDate,
    prepTime: expectedDate
      ? Math.round((expectedDate.getTime() - createdDate.getTime()) / 60000)
      : null,

    createdAt: createdDate,
    completedAt: dto.completed_at ? new Date(dto.completed_at) : null,
    status: dto.status as Service["status"],

    pickup: dto.pickup_address ?? null,

    typeId: (dto.type_id as ServiceTypeId) ?? null,

    assignedDelivery: dto.assigned_delivery ?? null,
    assignedDeliveryName: dto.profiles?.name ?? null,

    storeId: dto.store_id ?? null,
    storeName: dto.store?.name ?? null,

    profileStoreId: dto.profile_store_id ?? null,
    profileStoreName: dto.profile_store?.name ?? null,  // 🟢 Nombre del perfil tienda

    branchId: dto.branch_id ?? null,

    zoneId: dto.zone_id ?? null,
    zoneName: dto.zone?.name ?? null,
  };
}


// ================================================================
//  MAPPER: FRONT → PAYLOAD (TIENDA)
// ================================================================
export function toServicePayload(service: Service): ServicePayload {
  return {
    delivery_address: service.destination,
    client_phone: service.phone,
    client_name: service.clientName ?? null,

    notes: service.notes,
    payment_method: service.payment,

    total_to_collect: service.amount,
    price: service.price,
    price_delivery_srv: service.priceDeliverySrv ?? undefined,

    pickup_address: service.pickup ?? undefined,

    prep_time: service.prepTime ?? null,

    store_id: service.storeId ?? null,
    branch_id: service.branchId ?? null,
    zone_id: service.zoneId ?? null,
    profile_store_id: service.profileStoreId ?? null,  // 🟢 Agregar profile_store_id
  };
}
