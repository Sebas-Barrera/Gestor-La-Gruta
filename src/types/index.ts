/**
 * Producto del inventario.
 *
 * Tabla sugerida: `products`
 * ────────────────────────────────────────────────────────────────
 * | Columna       | Tipo DB                              | Notas                              |
 * |---------------|--------------------------------------|------------------------------------|
 * | id            | UUID / SERIAL PK                     | Generado por el backend            |
 * | sku           | VARCHAR(50) UNIQUE NOT NULL           |                                    |
 * | name          | VARCHAR(255) NOT NULL                 |                                    |
 * | category      | VARCHAR(100) NOT NULL                 | FK → categories.id recomendado     |
 * | subcategory   | VARCHAR(100) NOT NULL                 | FK → subcategories.id recomendado  |
 * | supplier      | VARCHAR(255) NOT NULL                 | FK → suppliers.id recomendado      |
 * | stock         | DECIMAL(10,2) DEFAULT 0               |                                    |
 * | minStock      | DECIMAL(10,2) NOT NULL                | Umbral para alerta de stock bajo   |
 * | maxStock      | DECIMAL(10,2) NOT NULL                |                                    |
 * | unit          | VARCHAR(20) NOT NULL                  | Ej: 'lata', 'botella', 'kg'       |
 * | price         | DECIMAL(10,2) NOT NULL                |                                    |
 * | lastPurchase  | TIMESTAMP / DATE                     |                                    |
 * | status        | ENUM('in_stock','low_stock','out_of_stock') | Computado: stock vs minStock |
 * | image         | TEXT NULLABLE                         | URL de imagen                      |
 * | barId         | FK → bars.id NOT NULL                 |                                    |
 * | barcode       | VARCHAR(50) NULLABLE UNIQUE           | Código de barras (EAN/UPC)         |
 * | isWeightBased | BOOLEAN DEFAULT false                 |                                    |
 * | weightUnit    | ENUM('kg','g','ml','L') NULLABLE      | Solo si isWeightBased = true       |
 * ────────────────────────────────────────────────────────────────
 *
 * Relaciones:
 *   - categories    (id, name)                       → 1:N con products.category
 *   - subcategories (id, name, category_id FK)       → 1:N con products.subcategory
 *   - suppliers     (id, name)                       → 1:N con products.supplier
 *   - bars          (id, name, ...)                  → 1:N con products.barId
 *
 * Endpoints sugeridos:
 *   GET    /api/products              → lista (soportar filtros: barId, category, subcategory, status, search)
 *   GET    /api/products/:id          → detalle
 *   POST   /api/products              → crear (ver CreateProductData en AddProductModal)
 *   PUT    /api/products/:id          → editar
 *   DELETE /api/products/:id          → eliminar
 */
export interface Product {
  id: string;
  sku: string;
  name: string;
  /** Categoría principal del producto (ej: 'Bebidas', 'Licores', 'Insumos') */
  category: string;
  /** Subcategoría dentro de la categoría padre (ej: 'Refrescos', 'Tequila', 'Hielo') */
  subcategory: string;
  supplier: string;
  stock: number;
  /** Umbral de stock bajo — si stock <= minStock → status = 'low_stock' */
  minStock: number;
  maxStock: number;
  /** Unidad de medida para display (ej: 'lata', 'botella', 'kg', 'ml') */
  unit: string;
  price: number;
  lastPurchase: string;
  /** Calculado dinámicamente: out_of_stock si stock <= 0, low_stock si stock <= minStock */
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  /**
   * Imagen del producto — puede contener:
   *   - Data URL base64 (ej: "data:image/png;base64,iVBOR...") → funciona offline
   *   - Ruta relativa local (ej: "/products/coca355lata.png")
   *   - URL externa (ej: "https://example.com/product.png") → requiere internet
   *   - NULL/undefined si el producto no tiene imagen
   *
   * Tipo DB: TEXT NULLABLE
   *
   * Nota para backend:
   *   El frontend convierte las URLs externas a base64 antes de guardar,
   *   para garantizar disponibilidad offline. Si se implementa storage de
   *   archivos (S3, CloudStorage), el backend puede almacenar el archivo
   *   y reemplazar el base64 por la URL del storage propio.
   */
  image?: string;
  /** Bar al que pertenece este producto — FK a bars.id */
  barId?: string;
  /** Código de barras EAN/UPC para escaneo */
  barcode?: string;
  /** true si el producto se mide por peso/volumen en lugar de unidades discretas */
  isWeightBased?: boolean;
  /** Unidad de peso/volumen. Solo aplica si isWeightBased = true */
  weightUnit?: 'kg' | 'g' | 'ml' | 'L';
}

/**
 * Bar/punto de venta.
 *
 * DB: tabla `bars` (id UUID PK, name VARCHAR NOT NULL, location VARCHAR, isActive BOOLEAN DEFAULT true)
 * Relaciones: 1:N con products (barId FK), N:N con workers (tabla pivot worker_bars)
 * Endpoints: GET/POST/PUT/DELETE /api/bars
 */
export interface Bar {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
  image?: string;
  manager?: string;
  phone?: string;
}

/**
 * Venta/salida de producto.
 *
 * DB: tabla `sales` (id UUID PK, productId FK, quantity DECIMAL, total DECIMAL, timestamp TIMESTAMP)
 * Endpoints: GET /api/sales?barId=X&dateFrom=...&dateTo=..., POST /api/sales
 */
export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  total: number;
  timestamp: string;
  barId: string;
  barName?: string;
  sellerName?: string;
}

/**
 * Actividad/evento del sistema (log de auditoría).
 *
 * DB: tabla `activities` (id UUID PK, type ENUM, message TEXT, timestamp TIMESTAMP)
 * Endpoints: GET /api/activities?barId=X&type=Y&limit=50
 */
export interface Activity {
  id: string;
  type: 'stock_in' | 'stock_out' | 'alert' | 'login' | 'inventory';
  message: string;
  timestamp: string;
  user?: string;
  barId?: string;
  barName?: string;
  productId?: string;
  productName?: string;
}

/**
 * Alerta de inventario (stock bajo/agotado).
 *
 * DB: tabla `inventory_alerts` (id UUID PK, productId FK, type ENUM, currentStock DECIMAL, threshold DECIMAL)
 * Endpoints: GET /api/inventory-alerts?barId=X&resolved=false, PUT /api/inventory-alerts/:id/resolve
 */
export interface InventoryAlert {
  id: string;
  productId: string;
  productName: string;
  type: 'low_stock' | 'out_of_stock';
  currentStock: number;
  threshold: number;
  timestamp: string;
  barId?: string;
  barName?: string;
}

/**
 * Estadísticas agregadas del dashboard.
 *
 * DB: NO tiene tabla propia - se calcula con queries agregadas
 * Endpoint: GET /api/dashboard/stats?barId=X
 * Cálculos: totalProducts = COUNT(*), inventoryValue = SUM(stock × price), etc.
 */
export interface DashboardStats {
  totalProducts: number;
  inventoryValue: number;
  lowStockCount: number;
  todaySales: number;
  totalProductsChange: number;
  inventoryValueChange: number;
  todaySalesChange: number;
}

export interface BarStats {
  id: string;
  name: string;
  location: string;
  productCount: number;
  inventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  todaySales: number;
  salesTrend: number;
}

export interface Worker {
  id: string;
  name: string;
  pin: string;
  barIds: string[];
  phone: string;
  isActive: boolean;
  avatar?: string;
  createdAt: string;
}


/**
 * Datos para crear un producto a granel (medido por peso/volumen).
 *
 * A diferencia de CreateProductData (escáner), este tipo:
 *   - NO incluye `barcode` (los productos a granel no tienen código de barras)
 *   - NO incluye `isWeightBased` (siempre es true implícitamente)
 *   - NO incluye `unit` (se deriva de `weightUnit`)
 *
 * Tabla sugerida: misma tabla `products` con isWeightBased = true
 * ────────────────────────────────────────────────────────────────
 * | Columna       | Tipo DB                              | Valor por defecto           |
 * |---------------|--------------------------------------|-----------------------------|
 * | isWeightBased | BOOLEAN                              | true                        |
 * | weightUnit    | ENUM('kg','g','ml','L')              | 'kg'                        |
 * | barcode       | VARCHAR(50) NULLABLE UNIQUE           | NULL                        |
 * | unit          | VARCHAR(20) NOT NULL                  | = weightUnit                |
 * ────────────────────────────────────────────────────────────────
 *
 * Endpoint: POST /api/products
 *   El backend debe setear: isWeightBased=true, barcode=NULL, unit=weightUnit
 */
export interface CreateBulkProductData {
  name: string;
  sku: string;
  /** Categoría de producto a granel (ej: 'Frutas y Verduras', 'A Granel') */
  category: string;
  /** Subcategoría dentro de la categoría (ej: 'Frutas', 'Azúcar', 'Aceites') */
  subcategory: string;
  /** Proveedor del producto (ej: 'Central de Abastos') */
  supplier: string;
  /** Precio por unidad de peso/volumen */
  price: number;
  /** Cantidad inicial en weightUnit */
  stock: number;
  /** Umbral para alerta de stock bajo (en weightUnit) */
  minStock: number;
  /** Capacidad máxima de almacenamiento (en weightUnit) */
  maxStock: number;
  /** Unidad de medida del producto a granel */
  weightUnit: 'kg' | 'g' | 'ml' | 'L';
  /** Bar al que pertenece — FK a bars.id */
  barId: string;
  /** Imagen del producto — data URL base64 o ruta local. Tipo DB: TEXT NULLABLE */
  image?: string;
}

/**
 * Cuenta de administrador del sistema.
 *
 * Tabla sugerida: `admin_accounts`
 * ────────────────────────────────────────────────────────────────
 * | Columna       | Tipo DB                              | Notas                              |
 * |---------------|--------------------------------------|------------------------------------|
 * | id            | UUID / SERIAL PK                     | Generado por el backend            |
 * | name          | VARCHAR(255) NOT NULL                 | Nombre completo del administrador  |
 * | accessCode    | CHAR(4) UNIQUE NOT NULL               | Código numérico de 4 dígitos       |
 * | phone         | VARCHAR(50) NULLABLE                  | Teléfono de contacto               |
 * | isActive      | BOOLEAN DEFAULT true                  | Cuenta habilitada/deshabilitada    |
 * | createdAt     | TIMESTAMP DEFAULT NOW()               | Fecha de creación                  |
 * ────────────────────────────────────────────────────────────────
 *
 * Validaciones:
 *   - accessCode debe ser exactamente 4 dígitos numéricos (regex: /^\d{4}$/)
 *   - accessCode debe ser UNIQUE en la tabla
 *
 * Relaciones:
 *   - Ninguna FK directa. Los admins tienen acceso global.
 *
 * Endpoints sugeridos:
 *   GET    /api/admin-accounts              → lista de admins
 *   GET    /api/admin-accounts/:id          → detalle
 *   POST   /api/admin-accounts              → crear admin (body: name, accessCode, phone?, isActive)
 *   PUT    /api/admin-accounts/:id          → editar admin
 *   DELETE /api/admin-accounts/:id          → eliminar admin
 *   POST   /api/auth/login                  → login (body: { accessCode, mode: 'admin' | 'worker' })
 */
export interface AdminAccount {
  id: string;
  /** Nombre completo del administrador */
  name: string;
  /** Código de acceso de 4 dígitos numéricos — UNIQUE, usado como credencial de login */
  accessCode: string;
  /** Teléfono de contacto (opcional) */
  phone?: string;
  /** Si la cuenta está habilitada para iniciar sesión */
  isActive: boolean;
  /** Fecha de creación de la cuenta */
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  barId: string;
  productId: string;
  productName: string;
  workerId: string;
  workerName: string;
  type: 'in' | 'out';
  previousQuantity: number;
  newQuantity: number;
  quantity: number;
  unit: string;
  timestamp: string;
  notes?: string;
}

/**
 * Código de barras asociado a un producto.
 *
 * Un producto puede tener múltiples códigos de barras: uno individual,
 * uno para caja de 12, otro para caja de 24, etc. Cada barcode indica
 * cuántas unidades individuales representa un escaneo.
 *
 * Tabla sugerida: `product_barcodes`
 * ────────────────────────────────────────────────────────────────
 * | Columna          | Tipo DB                              | Notas                              |
 * |------------------|--------------------------------------|------------------------------------|
 * | id               | UUID / SERIAL PK                     | Generado por el backend            |
 * | productId        | FK → products.id NOT NULL             | Producto al que pertenece          |
 * | barcode          | VARCHAR(50) NOT NULL                  | Código EAN/UPC — UNIQUE global     |
 * | quantityPerScan  | INTEGER NOT NULL DEFAULT 1            | Unidades individuales por escaneo  |
 * | label            | VARCHAR(100) NULLABLE                 | Ej: 'Individual', 'Caja 24 pzas'  |
 * | isDefault        | BOOLEAN DEFAULT false                 | Barcode principal del producto     |
 * | createdAt        | TIMESTAMP DEFAULT NOW()               |                                    |
 * ────────────────────────────────────────────────────────────────
 *
 * Constraints:
 *   - UNIQUE(barcode) — un barcode solo puede pertenecer a un producto
 *   - quantityPerScan >= 1
 *   - Máximo un isDefault=true por productId (partial unique index recomendado)
 *
 * Relaciones:
 *   - products (id) → 1:N con product_barcodes.productId
 *
 * Nota de migración:
 *   El campo `products.barcode` es legacy. Al migrar, crear un registro en
 *   `product_barcodes` por cada producto con barcode existente (quantityPerScan=1,
 *   isDefault=true). Eventualmente deprecar `products.barcode`.
 *
 * Endpoints sugeridos:
 *   GET    /api/products/:productId/barcodes       → lista de barcodes del producto
 *   POST   /api/products/:productId/barcodes       → crear barcode (body: barcode, quantityPerScan, label?)
 *   PUT    /api/product-barcodes/:id               → editar barcode
 *   DELETE /api/product-barcodes/:id               → eliminar barcode
 *   GET    /api/product-barcodes/lookup/:barcode   → buscar producto por barcode (returns ProductBarcode + Product)
 */
export interface ProductBarcode {
  id: string;
  /** FK al producto al que pertenece este código de barras */
  productId: string;
  /** Código de barras EAN/UPC u otro formato — UNIQUE global */
  barcode: string;
  /**
   * Cantidad de unidades individuales que representa un escaneo de este código.
   *   - 1  → barcode individual (1 botella/lata)
   *   - 6  → six-pack
   *   - 12 → caja de 12
   *   - 24 → caja de 24
   */
  quantityPerScan: number;
  /** Etiqueta descriptiva: 'Individual', 'Caja 24 pzas', 'Six Pack', etc. */
  label?: string;
  /** Si es el barcode principal/predeterminado del producto */
  isDefault: boolean;
  createdAt: string;
}

/**
 * Línea individual dentro de una sesión de recepción.
 *
 * Tabla sugerida: `reception_items`
 * ────────────────────────────────────────────────────────────────
 * | Columna            | Tipo DB                           | Notas                              |
 * |--------------------|-----------------------------------|------------------------------------|
 * | id                 | UUID / SERIAL PK                  | Generado por el backend            |
 * | sessionId          | FK → reception_sessions.id        |                                    |
 * | productId          | FK → products.id NOT NULL          |                                    |
 * | productBarcodeId   | FK → product_barcodes.id NULLABLE  | NULL si fue agregado por báscula   |
 * | scanCount          | INTEGER NOT NULL DEFAULT 1         | Veces escaneado este barcode       |
 * | quantityPerScan    | INTEGER NOT NULL                   | Copiado del ProductBarcode         |
 * | totalIndividualQty | DECIMAL(10,2) NOT NULL             | = scanCount × quantityPerScan      |
 * | unit               | VARCHAR(20) NOT NULL               | Unidad individual del producto     |
 * | isWeightBased      | BOOLEAN DEFAULT false              | Si fue pesado en báscula           |
 * | weight             | DECIMAL(10,2) NULLABLE             | Peso registrado (si aplica)        |
 * | addedAt            | TIMESTAMP DEFAULT NOW()            |                                    |
 * ────────────────────────────────────────────────────────────────
 */
export interface ReceptionItem {
  id: string;
  productId: string;
  productName: string;
  productBarcodeId?: string;
  /** Etiqueta del barcode: 'Caja 24', 'Individual', etc. */
  barcodeLabel?: string;
  /** Veces que fue escaneado este mismo barcode */
  scanCount: number;
  /** Unidades individuales por escaneo (1 para individual, 24 para caja de 24) */
  quantityPerScan: number;
  /** Total = scanCount × quantityPerScan (para peso: el peso directo) */
  totalIndividualQty: number;
  /** Unidad individual: 'botella', 'lata', 'kg', etc. */
  unit: string;
  /** Si fue pesado en báscula */
  isWeightBased: boolean;
  /** Peso registrado (solo para productos de báscula) */
  weight?: number;
}

/**
 * Sesión de recepción por lotes.
 *
 * Permite al admin escanear/pesar múltiples productos y confirmar
 * todo de un golpe. Cada sesión genera N movimientos de inventario.
 *
 * Tabla sugerida: `reception_sessions`
 * ────────────────────────────────────────────────────────────────
 * | Columna       | Tipo DB                                     | Notas                              |
 * |---------------|---------------------------------------------|------------------------------------|
 * | id            | UUID / SERIAL PK                            | Generado por el backend            |
 * | barId         | FK → bars.id NOT NULL                        | Bar destino de la recepción        |
 * | adminName     | VARCHAR(255) NOT NULL                        | Admin que realizó la recepción     |
 * | status        | ENUM('open','confirmed','cancelled')         |                                    |
 * | startedAt     | TIMESTAMP DEFAULT NOW()                      |                                    |
 * | confirmedAt   | TIMESTAMP NULLABLE                           |                                    |
 * | notes         | TEXT NULLABLE                                 | Notas generales de la recepción    |
 * ────────────────────────────────────────────────────────────────
 *
 * Al confirmar (PUT /api/reception-sessions/:id/confirm):
 *   - Crear un InventoryMovement (type: 'in') por cada ReceptionItem
 *   - Actualizar product.stock += totalIndividualQty por cada item
 *   - Recalcular product.status
 *
 * Endpoints sugeridos:
 *   POST   /api/reception-sessions                → crear sesión (body: barId, adminName)
 *   PUT    /api/reception-sessions/:id/confirm    → confirmar (batch update stocks)
 *   PUT    /api/reception-sessions/:id/cancel     → cancelar
 *   GET    /api/reception-sessions?barId=X        → historial de sesiones
 */
export interface ReceptionSession {
  id: string;
  barId: string;
  adminName: string;
  status: 'open' | 'confirmed' | 'cancelled';
  startedAt: string;
  confirmedAt?: string;
  notes?: string;
  items: ReceptionItem[];
}

// ═══════════════════════════════════════════════════════════════════════════
// HISTORIAL DE INVENTARIO — Módulo de auditoría de entradas al inventario
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tipo de entrada al inventario.
 * Cada valor corresponde a un mecanismo distinto de ingreso de mercancía.
 *
 * Tabla sugerida: columna `entry_type` en `inventory_history`
 * Tipo DB: ENUM('scan_individual','scan_box','batch_reception','bulk_weight','manual_adjustment')
 *
 * Valores:
 *   - scan_individual   → Producto escaneado 1 a 1 (quantityPerScan = 1)
 *   - scan_box          → Caja escaneada (quantityPerScan > 1, ej: "Caja 24 pzas")
 *   - batch_reception   → Item dentro de una sesión de recepción por lotes (ReceptionSession)
 *   - bulk_weight       → Producto pesado en báscula (isWeightBased = true)
 *   - manual_adjustment → Ajuste manual de stock por admin (sin escaneo ni báscula)
 */
export type InventoryHistoryEntryType =
  | 'scan_individual'
  | 'scan_box'
  | 'batch_reception'
  | 'bulk_weight'
  | 'manual_adjustment';

/**
 * Registro histórico de una entrada al inventario de un bar.
 *
 * Cada vez que un admin agrega mercancía (por cualquier mecanismo),
 * se crea un registro de este tipo. Solo cubre ENTRADAS (no salidas).
 *
 * Tabla sugerida: `inventory_history`
 * ──────────────────────────────────────────────────────────────────────────────
 * | Columna                | Tipo DB                                | Notas                                       |
 * |------------------------|----------------------------------------|---------------------------------------------|
 * | id                     | UUID / SERIAL PK                       | Generado por el backend                     |
 * | barId                  | FK → bars.id NOT NULL                  | Bar destino de la entrada                   |
 * | barName                | VARCHAR(255) NOT NULL                  | Desnormalizado para queries rápidos         |
 * | productId              | FK → products.id NOT NULL              | Producto ingresado                          |
 * | productName            | VARCHAR(255) NOT NULL                  | Desnormalizado                              |
 * | productCategory        | VARCHAR(100) NOT NULL                  | Categoría al momento del ingreso            |
 * | productSubcategory     | VARCHAR(100) NOT NULL                  | Subcategoría al momento del ingreso         |
 * | adminId                | FK → admin_accounts.id NOT NULL        | Admin que realizó el ingreso                |
 * | adminName              | VARCHAR(255) NOT NULL                  | Desnormalizado                              |
 * | entryType              | ENUM (ver InventoryHistoryEntryType)   | Mecanismo de ingreso                        |
 * | quantity               | DECIMAL(10,2) NOT NULL                 | Cantidad total en unidades individuales     |
 * | unit                   | VARCHAR(20) NOT NULL                   | Unidad del producto (lata, botella, kg)     |
 * | previousStock          | DECIMAL(10,2) NOT NULL                 | Stock antes del ingreso                     |
 * | newStock               | DECIMAL(10,2) NOT NULL                 | Stock después del ingreso                   |
 * | timestamp              | TIMESTAMP NOT NULL                     | Momento exacto del ingreso                  |
 * | notes                  | TEXT NULLABLE                          | Notas del admin o de la sesión              |
 * | boxQuantity            | INTEGER NULLABLE                       | Cantidad de cajas (solo scan_box)           |
 * | boxSize                | INTEGER NULLABLE                       | Unidades por caja (solo scan_box)           |
 * | boxLabel               | VARCHAR(100) NULLABLE                  | Ej: "Caja 24 pzas" (solo scan_box)         |
 * | barcodeScanned         | VARCHAR(50) NULLABLE                   | Código escaneado (scan_individual/scan_box) |
 * | weight                 | DECIMAL(10,2) NULLABLE                 | Peso registrado (solo bulk_weight)          |
 * | weightUnit             | ENUM('kg','g','ml','L') NULLABLE       | Unidad de peso (solo bulk_weight)           |
 * | receptionSessionId     | FK → reception_sessions.id NULLABLE    | Sesión origen (solo batch_reception)        |
 * | receptionSessionNotes  | TEXT NULLABLE                          | Notas de la sesión (solo batch_reception)   |
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * Índices sugeridos:
 *   - idx_history_bar_timestamp      (barId, timestamp DESC)   → consultas por bar
 *   - idx_history_admin_timestamp    (adminId, timestamp DESC) → consultas por admin
 *   - idx_history_entry_type         (entryType)               → filtro por tipo
 *   - idx_history_product            (productId)               → filtro por producto
 *   - idx_history_session            (receptionSessionId)      → agrupar por sesión
 *
 * Relaciones:
 *   - bars (id)                → 1:N con inventory_history.barId
 *   - products (id)            → 1:N con inventory_history.productId
 *   - admin_accounts (id)      → 1:N con inventory_history.adminId
 *   - reception_sessions (id)  → 1:N con inventory_history.receptionSessionId
 *
 * Endpoints sugeridos:
 *   GET /api/inventory-history
 *     Query params: barId, adminId, entryType, category, dateFrom, dateTo, search, page, pageSize
 *     Response: { data: InventoryHistoryEntry[], total: number, page: number, pageSize: number }
 *
 *   GET /api/inventory-history/:id
 *     Response: InventoryHistoryEntry (con sesión expandida si es batch_reception)
 *
 *   GET /api/inventory-history/summary
 *     Query params: (mismos filtros)
 *     Response: { totalEntries, byType: Record<InventoryHistoryEntryType, number>, uniqueProducts, uniqueAdmins }
 *
 *   GET /api/inventory-history/export
 *     Query params: (mismos filtros)
 *     Response: CSV / Excel file
 */
export interface InventoryHistoryEntry {
  id: string;

  // ── Bar ──
  /** FK al bar destino — bars.id */
  barId: string;
  /** Nombre del bar (desnormalizado para display en tabla sin JOIN) */
  barName: string;

  // ── Producto ──
  /** FK al producto — products.id */
  productId: string;
  /** Nombre del producto al momento del ingreso */
  productName: string;
  /** Categoría del producto al momento del ingreso (ej: 'Bebidas', 'Licores') */
  productCategory: string;
  /** Subcategoría del producto al momento del ingreso (ej: 'Refrescos', 'Tequila') */
  productSubcategory: string;

  // ── Admin ──
  /** FK al admin que realizó el ingreso — admin_accounts.id */
  adminId: string;
  /** Nombre del admin (desnormalizado) */
  adminName: string;

  // ── Tipo y Cantidad ──
  /** Mecanismo de ingreso: escaneo, caja, recepción por lotes, báscula, manual */
  entryType: InventoryHistoryEntryType;
  /** Cantidad total ingresada en unidades individuales del producto */
  quantity: number;
  /** Unidad de medida del producto: 'lata', 'botella', 'kg', 'ml', etc. */
  unit: string;
  /** Stock del producto ANTES del ingreso */
  previousStock: number;
  /** Stock del producto DESPUÉS del ingreso */
  newStock: number;

  // ── Tiempo y Notas ──
  /** Timestamp ISO del momento del ingreso */
  timestamp: string;
  /** Notas del admin sobre este ingreso (opcional) */
  notes?: string;

  // ── Datos de Caja (solo aplica si entryType = 'scan_box') ──
  /** Cantidad de cajas escaneadas */
  boxQuantity?: number;
  /** Unidades individuales por caja (quantityPerScan del ProductBarcode) */
  boxSize?: number;
  /** Etiqueta de la caja: 'Caja 24 latas', 'Caja 12 botellas' */
  boxLabel?: string;

  // ── Datos de Escaneo (aplica si entryType = 'scan_individual' | 'scan_box') ──
  /** Código de barras que fue escaneado */
  barcodeScanned?: string;

  // ── Datos de Peso (solo aplica si entryType = 'bulk_weight') ──
  /** Peso registrado en báscula */
  weight?: number;
  /** Unidad de peso/volumen */
  weightUnit?: 'kg' | 'g' | 'ml' | 'L';

  // ── Datos de Sesión de Recepción (solo aplica si entryType = 'batch_reception') ──
  /** FK a la sesión de recepción — reception_sessions.id */
  receptionSessionId?: string;
  /** Notas de la sesión de recepción (copiadas para display sin JOIN) */
  receptionSessionNotes?: string;
}
