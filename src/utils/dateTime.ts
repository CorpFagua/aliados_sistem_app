/**
 * Utilidades para manejo de fecha y hora en zona local Colombia (UTC-5)
 * El dispositivo usa la zona horaria del sistema operativo
 */

/**
 * Obtener la fecha actual del dispositivo en formato YYYY-MM-DD
 * Usa la zona horaria local del dispositivo (que debe estar configurada a Colombia)
 * 
 * @returns Fecha en formato YYYY-MM-DD (ej: "2026-02-06")
 */
export function getTodayLocalFormat(): string {
  const now = new Date();
  return formatDateToYYYYMMDD(now);
}

/**
 * Obtener la hora actual del dispositivo como ISO string local
 * Usa la zona horaria local del dispositivo
 * 
 * @returns ISO string con hora local (ej: "2026-02-06T14:30:00")
 */
export function getNowLocalISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Convertir un objeto Date a formato YYYY-MM-DD usando zona local del dispositivo
 * 
 * @param date - Objeto Date
 * @returns Fecha en formato YYYY-MM-DD
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Convertir una fecha en formato YYYY-MM-DD a objeto Date (inicio del día)
 * Interpreta la fecha en zona local del dispositivo
 * 
 * @param dateStr - Fecha en formato YYYY-MM-DD
 * @returns Objeto Date (00:00:00 de ese día)
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0);
}

/**
 * Obtener el inicio del día (00:00:00) para una fecha
 * 
 * @param date - Objeto Date
 * @returns Nuevo objeto Date con hora establecida a 00:00:00
 */
export function startOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

/**
 * Obtener el final del día (23:59:59) para una fecha
 * 
 * @param date - Objeto Date
 * @returns Nuevo objeto Date con hora establecida a 23:59:59
 */
export function endOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
}

/**
 * Sumar n días a una fecha
 * 
 * @param date - Objeto Date
 * @param days - Número de días a sumar (puede ser negativo)
 * @returns Nuevo objeto Date
 */
export function addDays(date: Date, days: number): Date {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

/**
 * Obtener la diferencia en días entre dos fechas
 * 
 * @param from - Fecha inicial
 * @param to - Fecha final
 * @returns Número de días (puede ser negativo)
 */
export function daysBetween(from: Date, to: Date): number {
  const start = startOfDay(from);
  const end = startOfDay(to);
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Formatear una fecha ISO string a formato legible en zona local
 * Ejemplo: "2026-02-06" → "6 de febrero de 2026"
 * 
 * @param isoString - Fecha en formato YYYY-MM-DD o ISO completo
 * @returns Fecha formateada en español
 */
export function formatDateLocal(isoString: string): string {
  // Convertir UTC a fecha Colombia antes de formatear para evitar desfase de día
  const dateStr = isoString.includes('T')
    ? parseBackendDateToLocal(isoString)
    : isoString.split('T')[0];
  const date = parseLocalDate(dateStr);

  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Formatear una fecha ISO string a formato corto
 * Ejemplo: "2026-02-06" → "06/02/2026"
 * 
 * @param isoString - Fecha en formato YYYY-MM-DD
 * @returns Fecha formateada DD/MM/YYYY
 */
export function formatDateShort(isoString: string): string {
  const dateStr = isoString.split('T')[0];
  const date = parseLocalDate(dateStr);
  
  return new Intl.DateTimeFormat("es-CO", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Formatear una fecha/hora ISO a formato completo legible
 * Ejemplo: "2026-02-06T14:30:00Z" → "6 de febrero de 2026, 14:30"
 * 
 * @param isoString - Fecha ISO completa
 * @returns Fecha y hora formateadas en español
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);

  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: 'America/Bogota',
  }).format(date);
}

/**
 * Formatear solo la hora de una fecha ISO
 * Ejemplo: "2026-02-06T14:30:00Z" → "14:30"
 * 
 * @param isoString - Fecha ISO completa
 * @returns Hora formateada HH:MM
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);

  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: 'America/Bogota',
  }).format(date);
}

/**
 * Verificar si una fecha está hoy
 * 
 * @param dateStr - Fecha en formato YYYY-MM-DD
 * @returns true si es hoy, false en caso contrario
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayLocalFormat();
}

/**
 * Obtener el nombre del día de la semana
 * 
 * @param dateStr - Fecha en formato YYYY-MM-DD
 * @returns Nombre del día en español (ej: "lunes", "martes", etc)
 */
export function getDayName(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
  }).format(date);
}

/**
 * Obtener el nombre del mes
 * 
 * @param dateStr - Fecha en formato YYYY-MM-DD
 * @returns Nombre del mes en español
 */
export function getMonthName(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  
  return new Intl.DateTimeFormat("es-CO", {
    month: "long",
  }).format(date);
}

/**
 * Obtener información legible para mostrar una fecha relativa
 * Ejemplos: "Hoy", "Ayer", "5 de febrero"
 * 
 * @param dateStr - Fecha en formato YYYY-MM-DD
 * @returns Texto para mostrar
 */
export function getRelativeDateLabel(dateStr: string): string {
  const today = getTodayLocalFormat();
  const yesterday = formatDateToYYYYMMDD(addDays(new Date(), -1));
  
  if (dateStr === today) {
    return "Hoy";
  } else if (dateStr === yesterday) {
    return "Ayer";
  } else {
    return formatDateLocal(dateStr);
  }
}

// ============================================================
// 🎯 PUNTO CENTRAL DE PARSEO - CONVIERTE UTC DEL BACKEND A LOCAL
// ============================================================
// Usar estas funciones para parsear respuestas del backend
// Si necesitas cambiar cómo se convierten las fechas, SOLO edita aquí

/**
 * Convertir fecha UTC ISO 8601 a formato local YYYY-MM-DD
 * PUNTO CENTRAL: Usar siempre esta función para parsear fechas del backend
 * 
 * Ejemplo: "2026-02-07T04:30:00Z" (UTC) → "2026-02-06" (Colombia local)
 * 
 * @param utcIso - Fecha ISO 8601 UTC (ej: "2026-02-07T04:30:00Z")
 * @returns Fecha en formato YYYY-MM-DD en zona local Colombia
 */
export function parseBackendDateToLocal(utcIso: string): string {
  if (!utcIso) return '';
  
  const utcDate = new Date(utcIso);
  const COLOMBIA_OFFSET_MS = -5 * 60 * 60 * 1000; // UTC-5
  const localDate = new Date(utcDate.getTime() + COLOMBIA_OFFSET_MS);
  
  const year = localDate.getUTCFullYear();
  const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(localDate.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Convertir fecha UTC ISO 8601 a hora local HH:MM:SS
 * PUNTO CENTRAL: Usar siempre esta función para parsear horas del backend
 * 
 * Ejemplo: "2026-02-07T04:30:00Z" (UTC) → "23:30:00" (Colombia local)
 * 
 * @param utcIso - Fecha ISO 8601 UTC
 * @returns Hora en formato HH:MM:SS en zona local Colombia
 */
export function parseBackendTimeToLocal(utcIso: string): string {
  if (!utcIso) return '';
  
  const utcDate = new Date(utcIso);
  const COLOMBIA_OFFSET_MS = -5 * 60 * 60 * 1000; // UTC-5
  const localDate = new Date(utcDate.getTime() + COLOMBIA_OFFSET_MS);
  
  const hours = String(localDate.getUTCHours()).padStart(2, '0');
  const minutes = String(localDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(localDate.getUTCSeconds()).padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Convertir fecha UTC ISO 8601 a formato local completo YYYY-MM-DD HH:MM:SS
 * PUNTO CENTRAL: Usar siempre esta función para parsear fechas+horas del backend
 * 
 * Ejemplo: "2026-02-07T04:30:00Z" (UTC) → "2026-02-06 23:30:00" (Colombia local)
 * 
 * @param utcIso - Fecha ISO 8601 UTC
 * @returns Fecha y hora en formato YYYY-MM-DD HH:MM:SS en zona local Colombia
 */
export function parseBackendDateTimeToLocal(utcIso: string): string {
  if (!utcIso) return '';
  
  const date = parseBackendDateToLocal(utcIso);
  const time = parseBackendTimeToLocal(utcIso);
  
  return `${date} ${time}`;
}
