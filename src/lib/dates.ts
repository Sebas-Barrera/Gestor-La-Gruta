/**
 * Utilidades de fecha para la aplicación.
 *
 * IMPORTANTE — Convenciones:
 *   - Todas las fechas en el frontend se manejan en **hora local** del navegador.
 *   - Los strings de fecha se almacenan en formato ISO "YYYY-MM-DD".
 *   - Los timestamps (fecha + hora) se almacenan como "YYYY-MM-DDTHH:mm:ss".
 *   - Al comunicarse con el backend, enviar siempre strings ISO.
 *
 * ¿Por qué esta utilidad?
 *   `new Date("2026-03-04")` se interpreta como UTC midnight, lo que en
 *   timezones negativas (ej. México UTC-6) resulta en el día anterior.
 *   `new Date("2026-03-04T00:00:00")` se interpreta como hora local.
 *   Estas funciones garantizan consistencia en toda la app.
 */

// ---------------------------------------------------------------------------
// Parsing & Generation
// ---------------------------------------------------------------------------

/**
 * Retorna el string "YYYY-MM-DD" que corresponde exactamente al día actual 
 * de la zona horaria local del navegador (ej: México).
 */
export function getLocalIsoDateString(): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().split('T')[0];
}

/**
 * Convierte un string ISO "YYYY-MM-DD" a un objeto Date en hora local.
 * Retorna `undefined` si el valor es vacío o inválido.
 *
 * @example parseLocalDate("2026-03-04") // → Date(2026, 2, 4) hora local
 */
export function parseLocalDate(value: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value + 'T00:00:00');
  return isNaN(date.getTime()) ? undefined : date;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/**
 * Convierte un Date a string ISO "YYYY-MM-DD".
 * Retorna `""` si la fecha es undefined.
 *
 * Backend: este es el formato esperado en query params y payloads.
 *
 * @example formatISODate(new Date(2026, 2, 4)) // → "2026-03-04"
 */
export function formatISODate(date: Date | undefined): string {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formatea una fecha para mostrar al usuario.
 * Ejemplo: "04 mar 2026"
 *
 * @example formatDisplayDate("2026-03-04T18:00:00") // → "04 mar 2026"
 */
export function formatDisplayDate(timestamp: string): string {
  if (!timestamp) return '';
  // Si es solo fecha (ej "2026-03-04"), forzamos hora local para evitar el salto a UTC-1 día.
  const isDateOnly = timestamp.length === 10;
  const date = isDateOnly ? new Date(timestamp + 'T00:00:00') : new Date(timestamp);
  
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formatea la hora de un timestamp para mostrar al usuario.
 * Ejemplo: "6:00 p.m."
 *
 * @example formatDisplayTime("2026-03-04T18:00:00") // → "6:00 p.m."
 */
export function formatDisplayTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Comparación
// ---------------------------------------------------------------------------

/**
 * Compara solo la parte de fecha (día calendario) de un timestamp contra
 * un rango "desde" / "hasta" en formato "YYYY-MM-DD".
 *
 * Retorna `true` si el timestamp está dentro del rango (inclusive).
 * Si `from` o `to` son vacíos, ese lado del rango no se aplica.
 *
 * Backend: esta misma lógica debe replicarse en el servidor al filtrar
 * movimientos por rango de fechas (WHERE date >= from AND date <= to).
 *
 * @example isDateInRange("2026-03-04T18:00:00", "2026-03-04", "2026-03-06") // → true
 * @example isDateInRange("2026-03-03T15:30:00", "2026-03-04", "")          // → false
 */
export function isDateInRange(
  timestamp: string,
  from: string,
  to: string,
): boolean {
  // Extraer solo "YYYY-MM-DD" del timestamp para comparar días calendario
  const dateOnly = timestamp.slice(0, 10); // "2026-03-04T18:00:00" → "2026-03-04"

  if (from && dateOnly < from) return false;
  if (to && dateOnly > to) return false;
  return true;
}
