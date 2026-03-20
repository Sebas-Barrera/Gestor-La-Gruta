# Touch Keyboard System — Notas para el Equipo de Backend y DB

> **Audiencia:** Equipo de Backend y Base de Datos  
> **Estado:** Frontend implementado. Backend pendiente.  
> Este documento describe el sistema de teclado virtual para monitores táctiles y cualquier consideración de integración relevante para el backend.

---

## ¿Qué es y por qué existe?

La app corre en **monitores touchscreen kiosk** de restaurantes/bares **sin mouse ni teclado físico**. Este sistema implementa un teclado virtual on-screen que se muestra automáticamente cuando el usuario toca cualquier campo de texto o numérico.

**No hay cambios requeridos en el backend ni en la base de datos** para esta funcionalidad. Es puramente frontend.

---

## Arquitectura del sistema de teclado

```
main.tsx
  └── <KeyboardProvider>          # Context global, renderiza el teclado una vez
        └── <OnScreenKeyboard />  # Fijo en bottom de pantalla (z-index: 9999)

Componentes de formulario:
  <TouchInput>     →  reemplaza <Input>    de shadcn/ui   (detecta type="number" automáticamente)  
  <TouchTextarea>  →  reemplaza <textarea> nativos                                                  
```

**Flujo de datos:**
1. Usuario toca un `<TouchInput>` → dispara `onFocus` → llama `openKeyboard(ref, mode)`
2. El teclado aparece fijo en la parte inferior de la pantalla
3. Usuario toca teclas → `handleKeyPress(key)` inserta el carácter en el input usando la Selection API nativa
4. El evento `input` es disparado nativamente para que React actualice su estado

---

## Campos de formulario y sus tipos

Esta tabla documenta todos los inputs del sistema y el tipo de teclado que activan, útil para validación backend:

### ProductFormModal (`POST /api/products`)

| Campo       | Tipo DB       | Teclado    | Validación sugerida                    |
|-------------|---------------|------------|----------------------------------------|
| name        | VARCHAR(255)  | Alpha      | Requerido, min 2 chars                 |
| category    | VARCHAR(100)  | Alpha      | Requerido                              |
| subcategory | VARCHAR(100)  | Alpha      | Requerido                              |
| supplier    | VARCHAR(255)  | Alpha      | Opcional                               |
| price       | DECIMAL(10,2) | Numérico   | Requerido, > 0                         |
| minStock    | DECIMAL(10,2) | Numérico   | Requerido, >= 0                        |
| maxStock    | DECIMAL(10,2) | Numérico   | Requerido, >= minStock                 |
| barcode     | VARCHAR(50)   | Alpha      | Opcional, único por producto           |
| isWeightBased | BOOLEAN    | —          | default: false                         |
| weightUnit  | ENUM          | —          | 'kg' \| 'g' \| 'ml' \| 'L'            |
| image       | TEXT          | Alpha (URL)| Opcional, base64 o URL                 |

### AddBarcodeToProductModal (`POST /api/products/:productId/barcodes`)

| Campo           | Tipo DB       | Teclado  | Validación sugerida           |
|-----------------|---------------|----------|-------------------------------|
| quantityPerScan | INTEGER       | Numérico | Requerido, >= 1               |
| label           | VARCHAR(100)  | Alpha    | Requerido, ej: "Caja 24 pzas" |
| barcode         | VARCHAR(50)   | —        | Viene del scanner, no editable|

### UnknownBarcodeModal (→ delega a AddProductModal o AddBarcodeToProductModal)

| Campo      | Tipo DB | Teclado  | Validación sugerida           |
|------------|---------|----------|-------------------------------|
| boxQuantity | INTEGER | Numérico | Opcional, >= 2 si es caja     |

### StockAdjustmentModal (`POST /api/products/:productId/stock-adjustments`)

| Campo    | Tipo DB       | Teclado | Validación sugerida |
|----------|---------------|---------|---------------------|
| quantity | DECIMAL(10,2) | —       | Botones +/-, no input directo |
| notes    | TEXT          | Alpha   | Opcional, max 500 chars |

---

## Consideraciones de seguridad / validación

1. **Todos los valores deben ser revalidados en el backend** — el teclado virtual no previene que un usuario (con acceso físico al dispositivo) manipule el DOM o haga peticiones directas.
2. **Campos numéricos:** aunque el frontend solo muestra el teclado numérico, el backend debe validar que los valores sean efectivamente números y estén dentro de rangos válidos.
3. **Campos de texto:** el teclado alpha no previene inyección de caracteres especiales. Sanitizar en el servidor.

---

## Archivos relevantes del frontend

| Archivo | Propósito |
|---------|-----------|
| `src/contexts/KeyboardContext.tsx` | Estado global del teclado, lógica de inserción de caracteres |
| `src/hooks/useKeyboard.ts` | Hook público para abrir/cerrar el teclado |
| `src/components/worker/OnScreenKeyboard.tsx` | Componente visual del teclado |
| `src/components/shared/TouchInput.tsx` | Wrapper de `<Input>` con teclado integrado |
| `src/components/shared/TouchTextarea.tsx` | Wrapper de `<textarea>` con teclado integrado |

---

## Sin impacto en API

Este sistema es **exclusivamente frontend**. No requiere:
- Nuevos endpoints
- Cambios de schema
- Nuevas columnas en base de datos
- Cambios en autenticación o sesiones

El teclado solo controla cómo el usuario ingresa datos — los datos mismos no cambian.
