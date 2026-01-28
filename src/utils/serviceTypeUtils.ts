import { Service, ServiceTypeId } from "@/models/service";

/**
 * Determina el tipo de servicio basado en type_id
 */
export function getServiceType(service: Service): "domicilio" | "paqueteria" | "desconocido" {
  if (!service.typeId) {
    // Fallback: si no existe type_id, usar la presencia de pickup como indicador
    return service.pickup ? "paqueteria" : "domicilio";
  }

  if (service.typeId === "domicilio") {
    return "domicilio";
  }

  if (service.typeId === "paqueteria_aliados" || service.typeId === "paqueteria_coordinadora") {
    return "paqueteria";
  }

  return "desconocido";
}

/**
 * Obtiene el color para el badge del tipo de servicio
 */
export function getServiceTypeColor(serviceType: "domicilio" | "paqueteria" | "desconocido"): string {
  const colors: Record<string, string> = {
    domicilio: "#10B981",      // Verde esmeralda brillante
    paqueteria: "#0EA5E9",     // Azul celeste
    desconocido: "#6B7280",    // Gris
  };
  return colors[serviceType] ?? colors.desconocido;
}

/**
 * Obtiene el label legible para el tipo de servicio
 */
export function getServiceTypeLabel(serviceType: "domicilio" | "paqueteria" | "desconocido"): string {
  const labels: Record<string, string> = {
    domicilio: "Domicilio",
    paqueteria: "Paquetería",
    desconocido: "Desconocido",
  };
  return labels[serviceType] ?? labels.desconocido;
}

/**
 * Obtiene el ícono para el tipo de servicio
 */
export function getServiceTypeIcon(serviceType: "domicilio" | "paqueteria" | "desconocido"): string {
  const icons: Record<string, string> = {
    domicilio: "home-outline",
    paqueteria: "cube-outline",
    desconocido: "help-outline",
  };
  return icons[serviceType] ?? icons.desconocido;
}

/**
 * Filtra servicios por tipo
 */
export function filterServicesByType(
  services: Service[],
  filterType: "todos" | "domicilio" | "paqueteria"
): Service[] {
  if (filterType === "todos") {
    return services;
  }

  return services.filter((service) => getServiceType(service) === filterType);
}
