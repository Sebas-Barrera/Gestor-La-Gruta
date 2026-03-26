# MASTER PLAN - Sistema de Gestion de Bares Multi-Rol

## PROMPT DE CONTINUACION

> **Copia y pega esto al inicio de una nueva conversacion para continuar:**
>
> ```
> Lee el archivo MASTER_PLAN.md en la raiz del proyecto. Contiene el plan completo de implementacion, el estado actual de progreso y todos los detalles tecnicos. Revisa las tareas marcadas como completadas y continua con la siguiente tarea pendiente. Mantiene los mismos estilos, patrones y convenciones que ya se establecieron. Al terminar cada tarea, actualiza el progreso en MASTER_PLAN.md marcandola como [x].
> ```

---

## DESCRIPCION DEL PROYECTO

App de gestion de inventario para un lugar con **multiples bares**. Dos roles:

1. **Admin** (`/admin/*`): Dashboard completo, gestion de bares/personal/credenciales, historial de movimientos, alertas, ventas, reportes, configuracion.
2. **Trabajador** (`/almacen/*`): Solo ve inventario del bar al que pertenece. Necesita PIN para hacer cambios. Optimizado para pantallas tactiles.

### Stack Tecnologico
- React 19 + Vite 7 + TypeScript 5.9
- Tailwind CSS 3.4 + Shadcn/UI (50+ componentes ya instalados)
- Lucide React (iconos), Recharts (graficas)
- React Hook Form + Zod (formularios/validacion)
- Sonner (toasts), date-fns (fechas)
- **Agregar:** react-router-dom (routing)

### Paleta de Colores (NO cambiar)
- Azul primario: #3b82f6 (blue-500)
- Amber advertencias: #f59e0b
- Rojo critico: #ef4444
- Gris neutro: varias tonalidades
- Verde exito: #10b981

### Reglas Criticas
- **Solo frontend** - datos mock, sin backend ni base de datos
- **NO agregar items al sidebar** - todo va dentro de secciones existentes
- **NO romper UI/funcionalidad existente** - solo agregar y optimizar
- **Componentes reutilizables** donde sea posible (ver seccion de componentes shared)
- **Mock data bien estructurada** para que el companero de backend entienda los tipos
- **Touch-friendly** - botones 44px+, inputs 44px+, PIN keypad 60px+

---

## PROGRESO DE IMPLEMENTACION

### Fase 1: Tipos + Mock Data + Dependencias ✅ HECHA
- [x] 1.1 Instalar `react-router-dom`
- [x] 1.2 Crear `src/types/auth.ts` (UserRole, AuthUser, AuthContextType)
- [x] 1.3 Modificar `src/types/index.ts` (agregar Worker, BarCredential, InventoryMovement, campos extra a Product)
- [x] 1.4 Modificar `src/data/mockData.ts` (agregar productos por peso, workers, barCredentials, inventoryMovements)

### Fase 2: Autenticacion ✅ HECHA
- [x] 2.1 Crear `src/contexts/AuthContext.tsx` (login, logout, verifyPin, sessionStorage)
- [x] 2.2 Crear `src/components/shared/LoginForm.tsx` (form reutilizable email+password)
- [x] 2.3 Crear `src/pages/AdminLoginPage.tsx` (usa LoginForm)
- [x] 2.4 Crear `src/pages/AlmacenLoginPage.tsx` (usa LoginForm)

### Fase 3: Routing + Layouts ✅ HECHA
- [x] 3.1 Crear `src/components/ProtectedRoute.tsx`
- [x] 3.2 Crear `src/layouts/AdminLayout.tsx` (migrar logica de App.tsx, usar Outlet)
- [x] 3.3 Crear `src/layouts/AlmacenLayout.tsx` (layout simplificado para worker)
- [x] 3.4 Crear `src/router.tsx` (todas las rutas)
- [x] 3.5 Modificar `src/main.tsx` (BrowserRouter + AuthProvider)
- [x] 3.6 Modificar `src/App.tsx` (reemplazar con AppRouter)
- [x] 3.7 Modificar `src/components/Sidebar.tsx` (prop role, onLogout)
- [x] 3.8 Modificar `src/components/Header.tsx` (props barName, userRole, userName)
- [x] 3.9 Modificar `src/sections/DashboardSection.tsx` (useNavigate en vez de onNavigate prop)

### Fase 4: Componentes Shared Reutilizables ✅ HECHA
- [x] 4.1 Crear `src/components/shared/StatusBadge.tsx`
- [x] 4.2 Crear `src/components/shared/FormField.tsx`
- [x] 4.3 Crear `src/components/shared/DeleteConfirmDialog.tsx`
- [x] 4.4 Crear `src/components/shared/DataTable.tsx`
- [x] 4.5 Crear `src/components/shared/FilterBar.tsx`

### Fase 5: Gestion de Bares (Admin) ✅ HECHA
- [x] 5.1 Crear `src/hooks/useBarManagement.ts` (CRUD state para bars, workers, credentials, movements)
- [x] 5.2 Crear `src/components/bars/BarFormModal.tsx` (crear + editar bar)
- [x] 5.3 Crear `src/components/bars/BarInfoTab.tsx`
- [x] 5.4 Crear `src/components/bars/WorkerFormModal.tsx` (crear + editar worker)
- [x] 5.5 Crear `src/components/bars/BarPersonalTab.tsx` (lista workers del bar)
- [x] 5.6 Crear `src/components/bars/CredentialFormModal.tsx` (crear + editar credencial)
- [x] 5.7 Crear `src/components/bars/BarCredentialsTab.tsx` (lista credenciales del bar)
- [x] 5.8 Crear `src/components/bars/BarMovementsTab.tsx` (historial + filtros + paginacion)
- [x] 5.9 Modificar `src/sections/BarsSection.tsx` (integrar tabs, modales, useBarManagement)

### Fase 6: Vista Trabajador ✅ HECHA
- [x] 6.1 Crear `src/components/worker/PinVerificationModal.tsx` (keypad numerico grande)
- [x] 6.2 Crear `src/components/worker/StockAdjustmentModal.tsx` (+/- cantidad, peso)
- [x] 6.3 Crear `src/components/worker/ProductFormModal.tsx` (editar producto, requiere PIN)
- [x] 6.4 Crear `src/components/worker/OnScreenKeyboard.tsx` (QWERTY tactil)
- [x] 6.5 Crear `src/components/worker/ScannerOverlay.tsx` (concepto scanner)
- [x] 6.6 Crear `src/components/worker/ScaleOverlay.tsx` (concepto bascula)
- [x] 6.7 Crear `src/sections/WorkerInventorySection.tsx` (inventario filtrado por bar)

### Fase 7: Modificar Componentes de Inventario Existentes ✅ HECHA
- [x] 7.1 Modificar `src/components/ProductInfoPanel.tsx` (barcode, peso, unidades)
- [x] 7.2 Modificar `src/components/ProductCard.tsx` (unidad de peso)
- [x] 7.3 Modificar `src/components/InventoryGrid.tsx` (unidad de peso en slots)

### Fase 8: Touch + CSS + Verificacion ✅ HECHA
- [x] 8.1 Crear `src/styles/touch.css` (utilidades tactiles)
- [x] 8.2 Modificar `src/index.css` (importar touch.css)
- [x] 8.3 Verificar `npm run dev` (sin errores)
- [x] 8.4 Verificar `npm run build` (sin errores TypeScript)

---

## DETALLES TECNICOS POR FASE

### Fase 1: Tipos Detallados

**Agregar a Product (campos opcionales, no rompe nada):**
```typescript
barcode?: string;
isWeightBased?: boolean;
weightUnit?: 'kg' | 'g' | 'ml' | 'L';
```

**Worker:**
```typescript
interface Worker {
  id: string;
  name: string;
  pin: string;           // 4 digitos
  barIds: string[];       // asignado a 1+ bares
  phone: string;
  email: string;
  isActive: boolean;
  avatar?: string;
  createdAt: string;      // ISO date
}
```

**BarCredential:**
```typescript
interface BarCredential {
  id: string;
  barId: string;
  email: string;
  password: string;
  isActive: boolean;
  label?: string;         // "Credencial Principal", "Turno Noche"
}
```

**InventoryMovement:**
```typescript
interface InventoryMovement {
  id: string;
  barId: string;
  productId: string;
  productName: string;
  workerId: string;
  workerName: string;
  type: 'in' | 'out';
  previousQuantity: number;
  newQuantity: number;
  quantity: number;        // cambio absoluto
  unit: string;
  timestamp: string;       // ISO datetime
  notes?: string;
}
```

**Auth types (src/types/auth.ts):**
```typescript
type UserRole = 'admin' | 'worker';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  barId?: string;     // solo para workers
}

interface AuthContextType {
  currentUser: AuthUser | null;
  currentBar: Bar | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  verifyPin: (pin: string) => { valid: boolean; worker?: Worker };
}
```

### Fase 2: Auth - Credenciales Mock

**Admin:**
- `admin@gruta.com` / `admin123`

**Bares:**
- `bar1@gruta.com` / `bargruta123` -> Bar Central (id: '1')
- `bar2@gruta.com` / `bargruta123` -> Bar Terraza (id: '2')
- `bar3@gruta.com` / `bargruta123` -> Bar VIP (id: '3')
- `bar4@gruta.com` / `bargruta123` -> Bar Alberca (id: '4')
- `bar1noche@gruta.com` / `bargruta456` -> Bar Central turno noche (id: '1')

**Workers (PINs):**
- Juan Perez: PIN 1234 (Bar Central)
- Maria Garcia: PIN 5678 (Bar Terraza)
- Carlos Lopez: PIN 9012 (Bar VIP + Bar Central)
- Ana Martinez: PIN 3456 (Bar Alberca)
- Roberto Sanchez: PIN 7890 (Bar Central + Bar Terraza, inactivo)

### Fase 2: Auth - Flujo

1. **Login admin:** email/pass -> valida contra admin hardcoded -> setUser(admin) -> redirect `/admin/dashboard`
2. **Login almacen:** email/pass -> busca en barCredentials -> resuelve Bar -> setUser(worker)+setBar -> redirect `/almacen/inventory`
3. **Verificar PIN:** worker hace cambio -> PinVerificationModal -> ingresa 4 digitos -> AuthContext.verifyPin(pin) busca worker con ese PIN asignado al bar actual -> si coincide, permite; si no, error
4. **Logout:** limpia estado + sessionStorage -> redirect a login correspondiente
5. **Persistencia:** sessionStorage para que refresh no cierre sesion

### Fase 3: Routing - Estructura de Rutas

```
/                          -> Navigate to /admin/login
/admin/login               -> AdminLoginPage
/admin                     -> ProtectedRoute(admin) > AdminLayout
  /admin/dashboard         -> DashboardSection (default)
  /admin/inventory         -> InventorySection
  /admin/sales             -> SalesSection
  /admin/bars              -> BarsSection
  /admin/reports           -> ReportsPlaceholder
  /admin/alerts            -> AlertsSection
  /admin/settings          -> SettingsSection
/almacen/login             -> AlmacenLoginPage
/almacen                   -> ProtectedRoute(worker) > AlmacenLayout
  /almacen/inventory       -> WorkerInventorySection (default)
*                          -> Navigate to /admin/login
```

### Fase 3: AdminLayout

Migrar la logica de App.tsx actual:
- Sidebar con `onSectionChange` que llama `navigate('/admin/${section}')`
- Header con breadcrumbs derivados de `useLocation()`
- `<Outlet />` en vez de `renderSection()` switch
- Mantener `<Toaster />`

### Fase 3: AlmacenLayout

Layout simplificado:
- Sidebar con role='worker' (solo Inventario + Cerrar Sesion)
- Header con nombre del bar prominente, sin botones de admin
- `<Outlet />` para WorkerInventorySection

### Fase 3: Sidebar Cambios

Agregar props:
```typescript
interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  role?: 'admin' | 'worker';
  onLogout?: () => void;
}
```
- Si `role === 'worker'`: solo renderizar Inventario en nav + Cerrar Sesion en bottom
- Cerrar Sesion llama `onLogout` en vez de `onSectionChange('login')`

### Fase 3: Header Cambios

Agregar props:
```typescript
interface HeaderProps {
  breadcrumbs: string[];
  onAddProduct?: () => void;
  onViewReport?: () => void;
  barName?: string;
  userRole?: 'admin' | 'worker';
  userName?: string;
}
```
- Si `userRole === 'worker'`: ocultar "Ver Reporte" y "Agregar Producto", mostrar barName grande, initials del worker

### Fase 4: Componentes Shared

**StatusBadge** - Badge configurable:
```typescript
interface StatusBadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  children: React.ReactNode;
}
```
Usos: estado de producto, activo/inactivo worker, entrada/salida movimiento

**FormField** - Wrapper label+input+error:
```typescript
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}
```
Usos: todos los formularios modales

**DeleteConfirmDialog** - AlertDialog generico:
```typescript
interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}
```
Usos: eliminar bar, worker, credencial

**DataTable** - Tabla generica:
```typescript
interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
}
interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
}
```
Usos: personal tab, credenciales tab, movimientos tab

**FilterBar** - Filtros configurables:
```typescript
interface FilterConfig {
  type: 'select' | 'search' | 'date-range' | 'page-size';
  key: string;
  label: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
}
interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
}
```
Usos: movimientos tab, potencialmente sales section

### Fase 5: BarsSection - Estructura Final

```
BarsSection
  |- Header: "Gestion de Bares" + boton "Agregar Bar" -> abre BarFormModal(sin data)
  |- Grid de bar cards (clickeables)
  |- Panel del bar seleccionado:
  |    |- Info header: icono, nombre, ubicacion
  |    |- Botones: Editar -> BarFormModal(con bar), Eliminar -> DeleteConfirmDialog
  |    |- Stats grid (4 tarjetas: productos, valor, ventas, personal)
  |    |- Tabs:
  |         |- "Informacion" -> BarInfoTab
  |         |- "Personal" -> BarPersonalTab
  |         |    |- Tabla de workers (usa DataTable)
  |         |    |- Boton "Agregar Personal" -> WorkerFormModal(sin data)
  |         |    |- Boton Editar en fila -> WorkerFormModal(con worker)
  |         |    |- Boton Eliminar en fila -> DeleteConfirmDialog
  |         |- "Credenciales" -> BarCredentialsTab
  |         |    |- Tabla de credenciales (usa DataTable)
  |         |    |- Boton "Agregar Credencial" -> CredentialFormModal(sin data)
  |         |    |- Boton Editar en fila -> CredentialFormModal(con credential)
  |         |    |- Boton Eliminar en fila -> DeleteConfirmDialog
  |         |- "Movimientos" -> BarMovementsTab
  |              |- FilterBar (worker, fecha, tipo, busqueda, items/pagina)
  |              |- DataTable con movimientos filtrados
  |              |- Paginacion
  |- BarFormModal (reutilizable crear/editar)
  |- WorkerFormModal (reutilizable crear/editar)
  |- CredentialFormModal (reutilizable crear/editar)
  |- DeleteConfirmDialog (reutilizable para cualquier entidad)
```

### Fase 5: useBarManagement Hook

```typescript
function useBarManagement() {
  const [bars, setBars] = useState(mockBars);
  const [workers, setWorkers] = useState(mockWorkers);
  const [credentials, setCredentials] = useState(mockBarCredentials);
  const [movements, setMovements] = useState(mockInventoryMovements);

  // Bars CRUD
  addBar(data) -> genera id, agrega a bars
  updateBar(id, data) -> actualiza en bars
  deleteBar(id) -> remueve de bars

  // Workers CRUD
  addWorker(data) -> genera id + createdAt, agrega
  updateWorker(id, data) -> actualiza
  removeWorkerFromBar(workerId, barId) -> quita barId del array barIds

  // Credentials CRUD
  addCredential(data) -> genera id, agrega
  updateCredential(id, data) -> actualiza
  deleteCredential(id) -> remueve

  // Queries
  getWorkersForBar(barId) -> filtra workers donde barIds incluye barId
  getCredentialsForBar(barId) -> filtra credentials donde barId coincide
  getMovementsForBar(barId) -> filtra movements donde barId coincide

  return { bars, workers, credentials, movements, ...todas las funciones };
}
```

### Fase 6: Worker View - Flujo

1. Worker login -> ve inventario de su bar
2. Puede ver ProductInfoPanel al click en producto
3. "Ajustar Stock" -> PinVerificationModal -> si correcto -> StockAdjustmentModal
4. "Editar Producto" -> PinVerificationModal -> si correcto -> ProductFormModal
5. Scanner (conceptual): scan sin modal abierto = SALIDA, con modal "Agregar" = ENTRADA
6. Bascula (conceptual): producto en bascula -> OnScreenKeyboard para buscar producto -> seleccionar -> PinVerificationModal -> confirmar salida

### Fase 6: PinVerificationModal

```
+-----------------------------+
|    Verificacion de PIN      |
|                             |
|       * * * _               |
|                             |
|    [1]  [2]  [3]            |
|    [4]  [5]  [6]            |
|    [7]  [8]  [9]            |
|    [C]  [0]  [OK]           |
|                             |
|  PIN incorrecto (si error)  |
+-----------------------------+
```
- Botones: min-h-[60px] min-w-[60px], rounded-xl
- Shake animation en error
- Llama AuthContext.verifyPin(pin)
- Si valido: onVerified(worker) callback
- Si invalido: shake + mensaje error + clear

### Fase 6: StockAdjustmentModal

```
+-----------------------------+
|   Ajustar Stock             |
|   Coca Cola 355ml           |
|                             |
|   [-]    248 latas    [+]   |
|                             |
|   Notas: ____________       |
|                             |
|   [Cancelar]  [Guardar]    |
+-----------------------------+
```
- Para peso: [-] 2.5 kg [+] (incrementos de 0.1)
- Para unidades: [-] 248 latas [+] (incrementos de 1)
- Botones +/- grandes (56px+)

### Fase 7: Cambios a Componentes de Inventario

**ProductInfoPanel:** agregar fila de barcode si existe, mostrar weightUnit para productos por peso
**ProductCard:** mostrar unidad correcta (kg/ml/g en vez de siempre "unidades")
**InventoryGrid:** mostrar unidad de peso en slots

### Fase 8: Touch CSS

```css
.touch-target { min-height: 44px; min-width: 44px; }
.touch-target-lg { min-height: 56px; min-width: 56px; }
.touch-target-xl { min-height: 64px; min-width: 64px; }
.pin-key {
  min-height: 60px; min-width: 60px;
  font-size: 24px; font-weight: 600;
  border-radius: 12px;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.pin-key:active { transform: scale(0.95); background-color: #dbeafe; }
```

---

## ESTRUCTURA DE ARCHIVOS FINAL

```
src/
├── components/
│   ├── bars/
│   │   ├── BarFormModal.tsx          (crear + editar bar)
│   │   ├── BarInfoTab.tsx            (tab info)
│   │   ├── BarPersonalTab.tsx        (tab personal)
│   │   ├── BarCredentialsTab.tsx     (tab credenciales)
│   │   ├── BarMovementsTab.tsx       (tab movimientos)
│   │   ├── WorkerFormModal.tsx       (crear + editar worker)
│   │   └── CredentialFormModal.tsx   (crear + editar credencial)
│   ├── shared/
│   │   ├── LoginForm.tsx             (form login reutilizable)
│   │   ├── StatusBadge.tsx           (badge de estado)
│   │   ├── FormField.tsx             (wrapper campo formulario)
│   │   ├── DeleteConfirmDialog.tsx   (dialogo confirmacion)
│   │   ├── DataTable.tsx             (tabla generica)
│   │   └── FilterBar.tsx             (filtros configurables)
│   ├── worker/
│   │   ├── PinVerificationModal.tsx  (keypad PIN)
│   │   ├── StockAdjustmentModal.tsx  (ajuste stock)
│   │   ├── ProductFormModal.tsx      (editar producto)
│   │   ├── OnScreenKeyboard.tsx      (teclado QWERTY)
│   │   ├── ScannerOverlay.tsx        (concepto scanner)
│   │   └── ScaleOverlay.tsx          (concepto bascula)
│   ├── ui/                           (existente, sin cambios)
│   ├── Sidebar.tsx                   (modificado: prop role)
│   ├── Header.tsx                    (modificado: props worker)
│   ├── ProductInfoPanel.tsx          (modificado: barcode, peso)
│   ├── ProductCard.tsx               (modificado: unidad peso)
│   ├── InventoryGrid.tsx             (modificado: unidad peso)
│   └── ... (existentes sin cambios)
├── contexts/
│   └── AuthContext.tsx
├── data/
│   └── mockData.ts                   (modificado: +workers, +credentials, +movements, +productos peso)
├── hooks/
│   ├── useBarManagement.ts
│   ├── useTouchOptimized.ts
│   └── use-mobile.ts                 (existente)
├── layouts/
│   ├── AdminLayout.tsx
│   └── AlmacenLayout.tsx
├── pages/
│   ├── AdminLoginPage.tsx
│   └── AlmacenLoginPage.tsx
├── sections/
│   ├── WorkerInventorySection.tsx
│   ├── DashboardSection.tsx          (modificado: useNavigate)
│   ├── BarsSection.tsx               (modificado: tabs + modales)
│   └── ... (existentes sin cambios)
├── styles/
│   └── touch.css
├── types/
│   ├── auth.ts
│   └── index.ts                      (modificado: +Worker, +BarCredential, +InventoryMovement)
├── router.tsx
├── App.tsx                           (modificado: usa AppRouter)
├── main.tsx                          (modificado: BrowserRouter + AuthProvider)
└── index.css                         (modificado: importa touch.css)
```

---

## COMPONENTES REUTILIZABLES (RESUMEN)

| Componente | Se usa en |
|------------|-----------|
| LoginForm | AdminLoginPage, AlmacenLoginPage |
| BarFormModal | BarsSection (crear + editar) |
| WorkerFormModal | BarPersonalTab (crear + editar) |
| CredentialFormModal | BarCredentialsTab (crear + editar) |
| DeleteConfirmDialog | BarsSection, BarPersonalTab, BarCredentialsTab |
| DataTable | BarPersonalTab, BarCredentialsTab, BarMovementsTab |
| FilterBar | BarMovementsTab |
| StatusBadge | Products, workers, credentials, movements |
| FormField | Todos los form modals |
| PinVerificationModal | StockAdjust, EditProduct, Scanner, Scale |
| OnScreenKeyboard | Search inputs en worker view, ScaleOverlay |
| ProductInfoPanel | InventorySection (admin), WorkerInventorySection (worker) |
| InventoryGrid | InventorySection (admin), WorkerInventorySection (worker) |
| ProductCard | InventorySection (admin), WorkerInventorySection (worker) |
| Sidebar | AdminLayout, AlmacenLayout (con role prop) |
| Header | AdminLayout, AlmacenLayout (con role prop) |
