/**
 * Catálogos predeterminados para la creación de productos.
 *
 * Estos valores se usan como opciones iniciales en los combobox del formulario
 * "Agregar Producto". El usuario puede seleccionar uno existente o agregar uno nuevo.
 *
 * Backend:
 *   - GET /api/catalogs/categories        → string[]
 *   - GET /api/catalogs/subcategories      → Record<string, string[]>
 *   - GET /api/catalogs/suppliers          → string[]
 *   - POST /api/catalogs/categories        → { name: string }
 *   - POST /api/catalogs/subcategories     → { name: string, category: string }
 *   - POST /api/catalogs/suppliers         → { name: string }
 *
 *   Cuando el backend esté listo, reemplazar estas constantes por llamadas
 *   a la API y cachear con React Query o similar.
 */

/** Categorías principales de productos */
export const DEFAULT_CATEGORIES: string[] = [
  'Bebidas',
  'Licores',
  'Insumos',
];

/**
 * Subcategorías agrupadas por categoría padre.
 *
 * Backend: la relación categoría → subcategoría debe mantenerse en la DB.
 * Tabla sugerida: subcategories (id, name, category_id FK)
 */
export const DEFAULT_SUBCATEGORIES: Record<string, string[]> = {
  Bebidas: ['Refrescos', 'Cervezas', 'Mezcladores', 'Agua Mineral', 'Jugos'],
  Licores: ['Tequila', 'Ron', 'Vodka', 'Whisky', 'Mezcal'],
  Insumos: ['Hielo', 'Frutos Secos', 'Granos', 'Frutas', 'Verduras', 'A Granel', 'Especias', 'Desechables'],
};

/** Proveedores conocidos */
export const DEFAULT_SUPPLIERS: string[] = [
  'Coca Cola México',
  'Grupo Modelo',
  'José Cuervo',
  'Topo Chico',
  'Hielos del Norte',
  'Distribuidora del Norte',
  'Central de Abastos',
  'Jugos del Valle',
];

// ─────────────────────────────────────────────────────────
// Catálogos para productos a granel (peso/volumen)
// ─────────────────────────────────────────────────────────

/**
 * Categorías para productos a granel.
 * Separadas de DEFAULT_CATEGORIES porque el flujo de báscula
 * maneja productos distintos (frutas, verduras, especias, etc.)
 *
 * Backend: misma tabla `categories`, diferenciadas por un flag
 * o por un campo `type` ('standard' | 'bulk').
 */
export const BULK_CATEGORIES: string[] = [
  'Frutas y Verduras',
  'A Granel',
  'Especias y Condimentos',
  'Lácteos y Perecederos',
  'Líquidos',
];

/**
 * Subcategorías para productos a granel, agrupadas por categoría padre.
 *
 * Backend: misma tabla `subcategories`, vinculadas a las categorías bulk.
 */
export const BULK_SUBCATEGORIES: Record<string, string[]> = {
  'Frutas y Verduras': ['Frutas', 'Verduras', 'Hierbas Frescas'],
  'A Granel': ['Azúcar', 'Harina', 'Arroz', 'Granos', 'Frutos Secos', 'Semillas'],
  'Especias y Condimentos': ['Especias', 'Salsas', 'Condimentos'],
  'Lácteos y Perecederos': ['Quesos', 'Cremas', 'Mantequilla'],
  'Líquidos': ['Aceites', 'Vinagres', 'Jarabes', 'Jugos Naturales'],
};

/**
 * Proveedores comunes para productos a granel.
 * Complementa DEFAULT_SUPPLIERS con proveedores típicos de mercado/agro.
 */
export const BULK_SUPPLIERS: string[] = [
  'Central de Abastos',
  'Mercado Local',
  'Distribuidora del Norte',
  'Proveedor Agrícola',
];

// ─────────────────────────────────────────────────────────
// Unidades de peso/volumen (compartidas entre modales)
// ─────────────────────────────────────────────────────────

/** Unidades de peso/volumen para productos a granel */
export const WEIGHT_UNITS: { value: 'kg' | 'g' | 'ml' | 'L'; label: string }[] = [
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'g', label: 'Gramos (g)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'L', label: 'Litros (L)' },
];
