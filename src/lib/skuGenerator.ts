/**
 * SKU Generator — Genera SKUs únicos automáticamente
 * ====================================================
 * Formato: CAT-NAM-NNN
 *   CAT = primeras 3 letras de la categoría (sin acentos, mayúsculas)
 *   NAM = primeras 3 letras del nombre del producto (sin acentos, mayúsculas)
 *   NNN = secuencial con padding de 3 dígitos (001, 002, ...)
 *
 * Ejemplos:
 *   Bebidas + Coca Cola 355ml   → BEB-COC-001
 *   Licores + José Cuervo       → LIC-JOS-001
 *   Insumos + Sal de grano      → INS-SAL-001
 *
 * Backend: Cuando se integre el backend, el servidor debería generar
 * el SKU para garantizar unicidad con UNIQUE constraint en la DB.
 * console.log('[Product:CreateSKU] POST /api/products/generate-sku Body:', { category, name });
 *
 * @module skuGenerator
 */

/**
 * Normaliza un string para usarlo como prefijo de SKU:
 * - Remueve acentos/diacríticos
 * - Convierte a mayúsculas
 * - Toma las primeras `length` letras (solo A-Z)
 */
function normalizePrefix(text: string, length: number): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remover acentos
    .replace(/[^a-zA-Z]/g, '')       // solo letras
    .substring(0, length)
    .toUpperCase();
}

/**
 * Genera un SKU único basado en categoría, nombre y SKUs existentes.
 *
 * @param category - Categoría del producto (e.g. "Bebidas", "Licores")
 * @param name     - Nombre del producto (e.g. "Coca Cola 355ml")
 * @param existingSkus - Array de SKUs existentes para evitar colisiones
 * @returns SKU generado (e.g. "BEB-COC-001")
 */
export function generateSku(
  category: string,
  name: string,
  existingSkus: string[],
): string {
  const catPrefix = normalizePrefix(category, 3);
  const namePrefix = normalizePrefix(name, 3);

  // Si no hay suficientes letras, rellenar con X
  const cat = catPrefix.padEnd(3, 'X');
  const nam = namePrefix.padEnd(3, 'X');
  const base = `${cat}-${nam}`;

  // Encontrar el secuencial más alto para este prefijo
  const existingSequences = existingSkus
    .filter(sku => sku.toUpperCase().startsWith(base + '-'))
    .map(sku => {
      const parts = sku.split('-');
      return parseInt(parts[parts.length - 1], 10) || 0;
    });

  const maxSeq = existingSequences.length > 0 ? Math.max(...existingSequences) : 0;
  const nextSeq = String(maxSeq + 1).padStart(3, '0');

  return `${base}-${nextSeq}`;
}
