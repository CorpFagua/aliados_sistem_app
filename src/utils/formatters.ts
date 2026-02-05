/**
 * Utility functions for formatting values
 */

/**
 * Formatea un número como moneda COP (Pesos Colombianos)
 * @param value - Número a formatear
 * @returns String formateado como moneda COP
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formatea un número como porcentaje
 * @param value - Número entre 0 y 100
 * @param decimals - Número de decimales a mostrar
 * @returns String formateado como porcentaje
 */
export function formatPercentage(
  value: number,
  decimals: number = 1
): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formatea una fecha ISO string a formato legible
 * @param isoString - Fecha en formato ISO (YYYY-MM-DD)
 * @returns Fecha formateada (ej: 5 de febrero de 2026)
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString + "T00:00:00");
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Formatea un número de teléfono
 * @param phone - Número telefónico
 * @returns Teléfono formateado
 */
export function formatPhone(phone: string): string {
  if (!phone) return "";
  return phone.replace(/(\d{1,3})(\d{1,3})(\d{1,4})/, "$1 $2 $3");
}
