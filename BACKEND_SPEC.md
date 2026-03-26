# Backend Specification - Sistema de Inventario

**Documento resumido para el equipo backend**

---

## Endpoints Principales

### Autenticación
```
POST   /api/auth/login                    # Admin login (accessCode)
POST   /api/auth/worker-login             # Worker login (PIN)
POST   /api/auth/worker-select-bar        # Worker selecciona bar (multi-bar)
POST   /api/auth/verify-pin               # Verificar PIN para operaciones sensibles
POST   /api/auth/logout                   # Cerrar sesión
```

### Productos
```
GET    /api/products?barId=X&search=...   # Lista con filtros
GET    /api/products/:id                  # Detalle
POST   /api/products                      # Crear (ver CreateProductData)
PUT    /api/products/:id                  # Actualizar
DELETE /api/products/:id                  # Eliminar (soft delete)
```

### Códigos de Barras (Multi-barcode)
```
GET    /api/products/:id/barcodes          # Códigos de un producto
POST   /api/products/:id/barcodes          # Asociar código (ver ProductBarcode)
GET    /api/product-barcodes/lookup/:code # Buscar producto por código
```

### Inventario
```
POST   /api/inventory-movements            # Registrar entrada/salida
GET    /api/inventory-movements?barId=...  # Historial con filtros
POST   /api/reception-sessions             # Crear sesión recepción lotes
PUT    /api/reception-sessions/:id/confirm # Confirmar y procesar lotes
```

### Bares
```
GET    /api/bars                           # Lista de bares
POST   /api/bars                           # Crear bar
PUT    /api/bars/:id                       # Actualizar
DELETE /api/bars/:id                       # Desactivar (soft delete)
```

### Trabajadores
```
GET    /api/workers?barId=X                # Lista de trabajadores
POST   /api/workers                        # Crear trabajador
PUT    /api/workers/:id                    # Actualizar
DELETE /api/workers/:id                    # Desactivar
```

### Reportes
```
GET    /api/dashboard/stats?barId=X        # Estadísticas agregadas
GET    /api/inventory-alerts?barId=X       # Alertas de stock
GET    /api/inventory-history?barId=...    # Historial auditoría
```

---

## Tipos TypeScript Críticos

### Product
```typescript
interface Product {
  id: string;
  sku: string;              // UNIQUE por bar
  name: string;
  category: string;
  subcategory: string;
  supplier: string;
  stock: number;            // SIEMPRE en unidades individuales
  minStock: number;
  unit: string;             // "lata", "botella", "kg"
  price: number;
  barId: string;            // FK → bars.id
  barcode?: string;         // Legacy (opcional)
  isWeightBased?: boolean;  // true = producto a granel (báscula)
  weightUnit?: string;      // "kg", "g", "L", "ml"
  status: 'in_stock' | 'low_stock' | 'out_of_stock'; // Calculado
}
```

### ProductBarcode (Multi-barcode)
```typescript
interface ProductBarcode {
  id: string;
  productId: string;        // FK → products.id
  barcode: string;          // UNIQUE global
  quantityPerScan: number;  // 1, 6, 12, 24, etc. (conversión cajas)
  label: string;            // "Individual", "Caja 24 latas"
  isDefault: boolean;
  createdAt: string;
}
```

### InventoryMovement
```typescript
interface InventoryMovement {
  id: string;
  productId: string;
  type: 'in' | 'out';
  quantity: number;          // En unidades individuales
  previousQuantity: number;
  newQuantity: number;
  timestamp: string;
  barId: string;
  workerId?: string;
  workerName: string;
  notes?: string;
}
```

---

## 🔑 REGLA DE CONVERSIÓN DE UNIDADES

**CRÍTICO**: `products.stock` SIEMPRE se guarda en **unidades individuales**.

### Ejemplo:
```
Coca Cola 355ml:
  - Barcode individual:  "7501055300143"      (quantityPerScan = 1)
  - Barcode caja 24:     "7501055300143-24"   (quantityPerScan = 24)

Al escanear caja:
  1. lookupBarcode("7501055300143-24") → { product, productBarcode }
  2. Usuario ingresa: 3 cajas
  3. Frontend calcula: 3 × 24 = 72 unidades individuales
  4. POST /api/inventory-movements { quantity: 72, unit: "lata" }
  5. Backend: UPDATE products SET stock = stock + 72
```

**Endpoints afectados**:
- `POST /api/inventory-movements` → quantity siempre en unidades individuales
- `POST /api/products` → si isBoxBarcode=true, stock viene pre-convertido
- `POST /api/reception-sessions/:id/confirm` → items con totalIndividualQty

---

## Validaciones Backend

### Restricciones:
- `Product.sku`: UNIQUE por barId
- `ProductBarcode.barcode`: UNIQUE global
- `Worker.pin`: 4 dígitos, UNIQUE
- `AdminAccount.accessCode`: 4 dígitos, UNIQUE
- `ProductBarcode.quantityPerScan`: >= 1
- `Product.stock`: >= 0 (no negativo)

### Cálculos:
- `Product.status`:
  ```
  if (stock <= 0) return 'out_of_stock'
  if (stock <= minStock) return 'low_stock'
  return 'in_stock'
  ```

### Soft Deletes:
- No eliminar físicamente registros
- Usar campo `isActive = false`

---

## Básculas Profesionales (Hardware)

Para producción, conectar báscula USB/Serial:

### Opción 1: TORREY PCR-20/40
- Capacidad: 20-40 kg
- Conectividad: USB, RS-232, Ethernet
- Con impresora de etiquetas
- Precio: $8,000-$15,000 MXN

### Opción 2: Rhino BPAN-15
- Capacidad: 15 kg
- Conectividad: USB, RS-232
- Compacta y económica
- Precio: $4,500-$7,000 MXN

### Opción 3: OHAUS Defender 5000
- Capacidad: 15 kg
- Conectividad: USB, RS-232, Ethernet
- IP65 (resistente agua/polvo)
- Precio: $12,000-$18,000 MXN

### Integración:
**Opción A**: Web Serial API (Chromium)
```javascript
const port = await navigator.serial.requestPort();
await port.open({ baudRate: 9600 });
const reader = port.readable.getReader();
// Leer peso automáticamente
```

**Opción B**: Backend Proxy + WebSocket
```javascript
// Backend escucha puerto serial → emite WebSocket
// Frontend conecta: ws://localhost:8080
```

**Por ahora**: Frontend simula con `Ctrl+W` (peso aleatorio 0.1-10 kg)

---

## Códigos HTTP

| Código | Uso |
|--------|-----|
| 200 | OK (GET, PUT exitosos) |
| 201 | Created (POST exitoso) |
| 204 | No Content (DELETE exitoso) |
| 400 | Bad Request (datos inválidos) |
| 401 | Unauthorized (auth fallida) |
| 404 | Not Found (recurso no existe) |
| 409 | Conflict (SKU/barcode duplicado) |

---

## Autenticación JWT

Todos los endpoints (excepto `/api/auth/*`) requieren token JWT:

```
Authorization: Bearer <token>
```

Token incluye:
```json
{
  "userId": "admin1",
  "role": "admin" | "worker",
  "barId": "1",
  "exp": 1234567890
}
```

---

## Notas de Implementación

1. **Timestamps**: ISO 8601 con UTC (`2026-03-26T14:30:00Z`)
2. **Paginación**: Default `page=1`, `pageSize=50`, incluir `total`
3. **Búsqueda**: Case-insensitive, buscar en nombre + SKU
4. **Filtros**: Permitir múltiples simultáneos (`?barId=1&status=low_stock`)
5. **Conversión unidades**: Frontend envía cantidad final, backend solo suma/resta
6. **Triggers DB**: Opcional crear trigger para actualizar `Product.status` automáticamente

---

## Ver también

- `src/types/index.ts` - Definiciones completas de tipos TypeScript
- `src/contexts/InventoryContext.tsx` - Lógica de inventario (referencia)
- `src/hooks/useGlobalBarcodeScanner.ts` - Detección de escáner
- `src/hooks/useGlobalScaleDetector.ts` - Simulación de báscula

---

**Última actualización**: 2026-03-26
