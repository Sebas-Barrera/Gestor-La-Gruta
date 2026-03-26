/**
 * Utilidades para manejo de códigos de barras
 */

/**
 * Limpia un código de barras eliminando caracteres no deseados
 * que algunos escáneres agregan automáticamente.
 *
 * Elimina:
 * - "0D0A" (código hexadecimal de CR+LF)
 * - Caracteres de retorno de carro (\r)
 * - Caracteres de salto de línea (\n)
 * - Espacios en blanco al inicio y final
 *
 * @param barcode - Código de barras a limpiar
 * @returns Código de barras limpio
 *
 * @example
 * ```ts
 * cleanBarcode("75012345678900D0A")  // "7501234567890"
 * cleanBarcode("123456\r\n")         // "123456"
 * cleanBarcode("  7890  ")           // "7890"
 * ```
 */
export function cleanBarcode(barcode: string): string {
  if (!barcode) return '';

  return barcode
    // Eliminar secuencia "0D0A" (case insensitive)
    .replace(/0D0A/gi, '')
    // Eliminar caracteres de control: CR y LF
    .replace(/[\r\n]/g, '')
    // Eliminar espacios al inicio y final
    .trim();
}

/**
 * Valida si un código de barras tiene un formato válido.
 *
 * Criterios:
 * - No debe estar vacío después de limpiarlo
 * - Debe tener al menos 4 caracteres (códigos de barras mínimos)
 * - Solo debe contener caracteres alfanuméricos y guiones
 *
 * @param barcode - Código de barras a validar
 * @returns true si el código es válido, false en caso contrario
 */
export function isValidBarcode(barcode: string): boolean {
  const cleaned = cleanBarcode(barcode);

  if (cleaned.length < 4) return false;

  // Permitir alfanuméricos y guiones (formatos comunes: EAN, UPC, Code128, etc.)
  const validPattern = /^[A-Za-z0-9-]+$/;
  return validPattern.test(cleaned);
}
