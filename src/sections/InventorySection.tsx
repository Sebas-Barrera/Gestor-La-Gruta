import { useState } from 'react';
import { Search, Grid3X3, List, Eye, ScanLine, Scale, ClipboardCheck } from 'lucide-react';
import { TouchInput } from '@/components/shared/TouchInput';
import { Button } from '@/components/ui/button';
import { ProductInfoPanel } from '@/components/ProductInfoPanel';
import { InventoryGrid } from '@/components/InventoryGrid';
import { ProductCard } from '@/components/ProductCard';
import { BarSelector } from '@/components/BarSelector';
import { StockAdjustmentModal } from '@/components/worker/StockAdjustmentModal';
import { ProductFormModal } from '@/components/worker/ProductFormModal';
import { AddProductModal } from '@/components/admin/AddProductModal';
import { AddBulkProductModal } from '@/components/admin/AddBulkProductModal';
import { BarReportSheet } from '@/components/admin/BarReportSheet';
import { BatchReceptionSheet } from '@/components/admin/BatchReceptionSheet';
import { ScannerOverlay } from '@/components/worker/ScannerOverlay';
import { ScaleOverlay } from '@/components/worker/ScaleOverlay';
import { InventoryEntryModal } from '@/components/shared/InventoryEntryModal';
import { InventoryExitModal } from '@/components/shared/InventoryExitModal';
import { UnknownBarcodeModal } from '@/components/shared/UnknownBarcodeModal';
import { AddBarcodeToProductModal } from '@/components/shared/AddBarcodeToProductModal';
import { InventoryFilter, applyInventoryFilters } from '@/components/shared/InventoryFilter';
import { InventorySort, applyInventorySort } from '@/components/shared/InventorySort';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { products as allProducts, bars, inventoryAlerts, inventoryMovements, productBarcodes } from '@/data/mockData';
import type { Product, ProductBarcode, CreateBulkProductData, ReceptionSession } from '@/types';
import type { CreateProductData } from '@/components/admin/AddProductModal';
import type { CreateBarcodeData } from '@/components/shared/AddBarcodeToProductModal';
import type { InventoryFilters } from '@/components/shared/InventoryFilter';
import type { InventorySortConfig } from '@/components/shared/InventorySort';

/**
 * Sección de Inventario del Admin.
 *
 * Flujos de inventario:
 * - ENTRADA (isAddMode ON):
 *   · Escáner + barcode encontrado      → InventoryEntryModal (con conversión cajas si aplica)
 *   · Escáner + barcode NO encontrado   → UnknownBarcodeModal → 2 opciones:
 *       1. Registrar producto nuevo (Individual/Caja) → AddProductModal
 *       2. Agregar código a producto existente         → AddBarcodeToProductModal
 *   · Báscula + producto existe          → ScaleOverlay → confirmar peso de entrada
 *   · Báscula + "Agregar nuevo"          → AddBulkProductModal (modal dedicado a granel)
 *   · Recepción por Lotes               → BatchReceptionSheet (escanear múltiples en una sesión)
 * - SALIDA (isAddMode OFF):
 *   · Escáner + barcode encontrado      → InventoryExitModal (confirmar salida)
 *   · Escáner + barcode NO encontrado   → toast error "no registrado"
 *   · Báscula + producto existe          → ScaleOverlay → confirmar peso de salida
 *
 * Otros:
 * - Ver Reporte del bar       → BarReportSheet
 * - Ajustar Stock             → StockAdjustmentModal
 * - Editar Producto           → ProductFormModal
 */
export function InventorySection() {
  const { currentUser } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<Product>(allProducts[0]);
  const [activeBarId, setActiveBarId] = useState('1');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddMode, setIsAddMode] = useState(false);
  const [filters, setFilters] = useState<InventoryFilters>({ statuses: [], categories: [] });
  const [sort, setSort] = useState<InventorySortConfig>({ field: 'name', direction: 'asc' });

  // Estados de modales existentes
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showStockAdjust, setShowStockAdjust] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);

  // Estados de escáner y báscula
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scaleOpen, setScaleOpen] = useState(false);

  // Estados de modales de entrada/salida
  const [showEntryConfirm, setShowEntryConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Barcode escaneado que no se encontró (para abrir AddProductModal con barcode pre-llenado)
  const [scannedBarcode, setScannedBarcode] = useState<string | undefined>(undefined);

  // Modal dedicado para productos a granel (desde báscula)
  const [showAddBulkProduct, setShowAddBulkProduct] = useState(false);

  // Producto seleccionado desde el escáner/báscula para confirmar entrada/salida
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);

  // ProductBarcode del escaneo (para conversión de cajas en InventoryEntryModal)
  const [scannedProductBarcode, setScannedProductBarcode] = useState<ProductBarcode | undefined>(undefined);

  // --- Estados de multi-barcode y recepción por lotes ---
  const [showUnknownBarcode, setShowUnknownBarcode] = useState(false);
  const [showAddBarcodeToProduct, setShowAddBarcodeToProduct] = useState(false);
  const [showBatchReception, setShowBatchReception] = useState(false);
  /** Cantidad por caja cuando el usuario elige "Caja" en UnknownBarcodeModal */
  const [pendingBarcodeQty, setPendingBarcodeQty] = useState<number | undefined>(undefined);

  // Bar activo
  const activeBar = bars.find(b => b.id === activeBarId) || bars[0];
  const adminName = `Admin ${currentUser?.name || ''}`;

  // Productos del bar activo
  const barProducts = allProducts.filter(p => p.barId === activeBarId);

  // Pipeline: búsqueda → filtros → ordenamiento
  const searchedProducts = barProducts.filter(
    p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredProducts = applyInventorySort(
    applyInventoryFilters(searchedProducts, filters),
    sort
  );

  // Datos para el reporte
  const barAlerts = inventoryAlerts.filter(a => {
    const product = allProducts.find(p => p.id === a.productId);
    return product?.barId === activeBarId;
  });
  const barMovements = inventoryMovements.filter(m => m.barId === activeBarId);

  // --- Handlers ---

  const handleSlotClick = (_slotId: string, product?: Product) => {
    if (product) setSelectedProduct(product);
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
  };

  /**
   * Escáner: producto encontrado (con info de barcode si aplica).
   * Si ENTRADA → abrir InventoryEntryModal (con conversión cajas si quantityPerScan > 1)
   * Si SALIDA  → abrir InventoryExitModal
   */
  const handleProductScanned = (product: Product, productBarcode?: ProductBarcode) => {
    setScannerOpen(false);
    setScannedProduct(product);
    setScannedProductBarcode(productBarcode);
    setSelectedProduct(product);

    if (isAddMode) {
      setShowEntryConfirm(true);
    } else {
      setShowExitConfirm(true);
    }
  };

  /**
   * Escáner: barcode no encontrado.
   * Si ENTRADA → abrir UnknownBarcodeModal (antes: abría AddProductModal directo)
   * Si SALIDA  → toast de error
   */
  const handleBarcodeNotFound = (barcode: string) => {
    setScannerOpen(false);

    if (isAddMode) {
      setScannedBarcode(barcode);
      setShowUnknownBarcode(true);
    } else {
      toast.error('Producto no registrado', {
        description: 'Este código de barras no está registrado. Activa el modo "Agregar Inventario" para registrar nuevos productos.',
      });
    }
  };

  /**
   * Escáner: usuario quiere registrar un nuevo producto manualmente.
   * Cierra el escáner → abre AddProductModal sin barcode pre-llenado.
   */
  const handleScannerAddNewProduct = () => {
    setScannerOpen(false);
    setShowAddProduct(true);
  };

  /**
   * Báscula: producto pesado.
   * Si ENTRADA → abrir InventoryEntryModal con el peso
   * Si SALIDA  → abrir InventoryExitModal
   */
  const handleProductWeighed = (product: Product, _weight: number) => {
    setScaleOpen(false);
    setScannedProduct(product);
    setSelectedProduct(product);

    if (isAddMode) {
      setShowEntryConfirm(true);
    } else {
      setShowExitConfirm(true);
    }
  };

  /**
   * Báscula: usuario quiere registrar un nuevo producto a granel.
   * Cierra el overlay de báscula → abre AddBulkProductModal (modal dedicado).
   */
  const handleScaleAddNewProduct = () => {
    setScaleOpen(false);
    setShowAddBulkProduct(true);
  };

  /** Confirmar entrada de inventario */
  const handleEntryConfirm = (quantity: number) => {
    if (!scannedProduct) return;

    console.log('[InventoryEntry] Datos para backend:', {
      productId: scannedProduct.id,
      productName: scannedProduct.name,
      previousQuantity: scannedProduct.stock,
      newQuantity: scannedProduct.stock + quantity,
      quantity,
      type: 'in',
      barId: activeBarId,
      workerName: adminName,
    });

    toast.success(`+${quantity} ${scannedProduct.unit} de "${scannedProduct.name}" agregados`, {
      description: `Entrada registrada en ${activeBar.name} por ${adminName}`,
    });

    setShowEntryConfirm(false);
    setScannedProduct(null);
  };

  /** Confirmar salida de inventario */
  const handleExitConfirm = (quantity: number, notes?: string) => {
    if (!scannedProduct) return;

    console.log('[InventoryExit] Datos para backend:', {
      productId: scannedProduct.id,
      productName: scannedProduct.name,
      previousQuantity: scannedProduct.stock,
      newQuantity: scannedProduct.stock - quantity,
      quantity,
      type: 'out',
      barId: activeBarId,
      workerName: adminName,
      notes,
    });

    toast.success(`-${quantity} ${scannedProduct.unit} de "${scannedProduct.name}" retirados`, {
      description: `Salida registrada de ${activeBar.name} por ${adminName}`,
    });

    setShowExitConfirm(false);
    setScannedProduct(null);
  };

  /** Guardar nuevo producto (desde AddProductModal — escáner) */
  const handleSaveNewProduct = (data: CreateProductData) => {
    console.log('[AddProduct] Datos para backend:', data);

    // Si viene de UnknownBarcodeModal con tipo "Caja", crear también el ProductBarcode
    if (pendingBarcodeQty && pendingBarcodeQty > 1 && data.barcode) {
      console.log('[AddProductBarcode] Datos para backend (caja):', {
        productId: '(nuevo producto)',
        barcode: data.barcode,
        quantityPerScan: pendingBarcodeQty,
        label: `Caja ${pendingBarcodeQty} pzas`,
        isDefault: false,
      });
      toast.success(`Producto "${data.name}" + Caja de ${pendingBarcodeQty} registrados`, {
        description: `SKU: ${data.sku} · Código: ${data.barcode} · Registrado por ${adminName}`,
      });
    } else {
      toast.success(`Producto "${data.name}" registrado en ${activeBar.name}`, {
        description: `SKU: ${data.sku} · Código: ${data.barcode || 'Sin código'} · Registrado por ${adminName}`,
      });
    }

    setScannedBarcode(undefined);
    setPendingBarcodeQty(undefined);
  };

  /**
   * UnknownBarcodeModal → Opción 1: Registrar producto nuevo.
   * Si boxQuantity > 1, se guarda para crear el ProductBarcode al guardar el producto.
   *
   * Backend (flujo completo):
   *   1. POST /api/products → crear producto con barcode
   *   2. POST /api/products/:productId/barcodes → crear ProductBarcode con quantityPerScan
   */
  const handleRegisterNewProduct = (barcode: string, boxQuantity?: number) => {
    setShowUnknownBarcode(false);
    setScannedBarcode(barcode);
    setPendingBarcodeQty(boxQuantity);
    setShowAddProduct(true);
  };

  /**
   * UnknownBarcodeModal → Opción 2: Agregar código a producto existente.
   * Abre AddBarcodeToProductModal con el barcode escaneado.
   */
  const handleAddToExistingProduct = (barcode: string) => {
    setShowUnknownBarcode(false);
    setScannedBarcode(barcode);
    setShowAddBarcodeToProduct(true);
  };

  /**
   * AddBarcodeToProductModal: guardar nuevo ProductBarcode.
   *
   * Backend: POST /api/products/:productId/barcodes
   *   Body: { barcode, quantityPerScan, label }
   */
  const handleSaveNewBarcode = (data: CreateBarcodeData) => {
    console.log('[AddBarcodeToProduct] Datos para backend:', {
      ...data,
      isDefault: false,
      createdAt: new Date().toISOString(),
    });

    const product = allProducts.find(p => p.id === data.productId);
    toast.success(`Código asociado a "${product?.name || data.productId}"`, {
      description: `${data.label} (${data.quantityPerScan} pzas/escaneo) · Registrado por ${adminName}`,
    });

    setScannedBarcode(undefined);
    setShowAddBarcodeToProduct(false);
  };

  /**
   * BatchReceptionSheet: sesión confirmada.
   * El backend debe:
   *   1. POST /api/reception-sessions → crear sesión
   *   2. PUT  /api/reception-sessions/:id/confirm
   *      Internamente crea N InventoryMovement (type: 'in') y actualiza stocks.
   */
  const handleSessionConfirmed = (session: ReceptionSession) => {
    console.log('[BatchReception] Sesión confirmada para backend:', {
      sessionId: session.id,
      barId: session.barId,
      adminName: session.adminName,
      status: session.status,
      confirmedAt: session.confirmedAt,
      notes: session.notes,
      itemCount: session.items.length,
      items: session.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        productBarcodeId: item.productBarcodeId,
        barcodeLabel: item.barcodeLabel,
        scanCount: item.scanCount,
        quantityPerScan: item.quantityPerScan,
        totalIndividualQty: item.totalIndividualQty,
        unit: item.unit,
        isWeightBased: item.isWeightBased,
        weight: item.weight,
      })),
    });

    const totalUnits = session.items.reduce((sum, i) => sum + i.totalIndividualQty, 0);
    toast.success(`Recepción confirmada: ${session.items.length} productos, ${Number.isInteger(totalUnits) ? totalUnits : totalUnits.toFixed(2)} unidades`, {
      description: `${activeBar.name} · Registrado por ${adminName}`,
    });

    setShowBatchReception(false);
  };

  /**
   * Guardar nuevo producto a granel (desde AddBulkProductModal — báscula).
   * Backend: POST /api/products con isWeightBased=true, barcode=NULL, unit=weightUnit
   */
  const handleSaveBulkProduct = (data: CreateBulkProductData) => {
    console.log('[AddBulkProduct] Datos para backend:', {
      ...data,
      isWeightBased: true,
      barcode: null,
      unit: data.weightUnit,
    });
    toast.success(`Producto a granel "${data.name}" registrado en ${activeBar.name}`, {
      description: `SKU: ${data.sku} · Unidad: ${data.weightUnit} · Registrado por ${adminName}`,
    });
  };

  /** Guardar ajuste de stock (desde StockAdjustmentModal) */
  const handleStockAdjust = (newQuantity: number, notes?: string) => {
    const diff = newQuantity - selectedProduct.stock;
    const movementType = diff > 0 ? 'entrada' : 'salida';

    console.log('[StockAdjust] Datos para backend:', {
      productId: selectedProduct.id,
      previousQuantity: selectedProduct.stock,
      newQuantity,
      difference: diff,
      movementType,
      notes,
      barId: activeBarId,
      workerName: adminName,
    });

    toast.success(`Stock de "${selectedProduct.name}" ajustado`, {
      description: `${diff > 0 ? '+' : ''}${diff} ${selectedProduct.unit} (${movementType}) por ${adminName}`,
    });

    setShowStockAdjust(false);
  };

  /** Guardar edición de producto */
  const handleEditProduct = (data: Partial<Product>) => {
    console.log('[EditProduct] Datos para backend:', {
      productId: selectedProduct.id,
      updates: data,
    });

    toast.success(`Producto "${selectedProduct.name}" actualizado`, {
      description: 'Los cambios han sido guardados',
    });

    setShowEditProduct(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Bar Selector */}
      <BarSelector
        bars={bars}
        activeBarId={activeBarId}
        onBarChange={setActiveBarId}
        delay={0}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReport(true)}
            className="gap-2 text-gray-700 border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-200"
          >
            <Eye className="w-4 h-4" />
            Ver Reporte
          </Button>
        }
      />

      {/* Scanner, Scale & Mode Toggle Controls */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => setScannerOpen(true)}
          className="gap-2 hover:border-blue-500 hover:text-blue-600 min-h-[44px]"
        >
          <ScanLine className="w-5 h-5" />
          Escáner
        </Button>
        <Button
          variant="outline"
          onClick={() => setScaleOpen(true)}
          className="gap-2 hover:border-blue-500 hover:text-blue-600 min-h-[44px]"
        >
          <Scale className="w-5 h-5" />
          Báscula
        </Button>
        <Button
          onClick={() => setIsAddMode(!isAddMode)}
          className={`gap-2 min-h-[44px] transition-all duration-200 ${
            isAddMode
              ? 'bg-green-500 hover:bg-green-600 shadow-sm hover:shadow-md hover:shadow-green-500/25'
              : 'bg-blue-500 hover:bg-blue-600 shadow-sm hover:shadow-md hover:shadow-blue-500/25'
          }`}
        >
          {isAddMode ? 'Modo: ENTRADA activo' : 'Agregar Inventario'}
        </Button>

        {/* Botón: Recepción por Lotes (solo visible en modo ENTRADA) */}
        {isAddMode && (
          <Button
            variant="outline"
            onClick={() => setShowBatchReception(true)}
            className="gap-2 min-h-[44px] border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
          >
            <ClipboardCheck className="w-5 h-5" />
            Recepción por Lotes
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Panel - Product Info */}
        <div className="lg:col-span-2">
          <ProductInfoPanel
            product={selectedProduct}
            onAdjustStock={() => setShowStockAdjust(true)}
            onEditProduct={() => setShowEditProduct(true)}
            delay={100}
          />
        </div>

        {/* Right Panel - Visual Grid */}
        <div className="lg:col-span-3">
          <InventoryGrid
            products={barProducts}
            onSlotClick={handleSlotClick}
            delay={200}
          />
        </div>
      </div>

      {/* Product Cards Section */}
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Productos en Inventario
          </h3>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <TouchInput
                placeholder="Buscar por SKU o nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 focus-visible:ring-blue-500"
              />
            </div>

            {/* Filter */}
            <InventoryFilter
              filters={filters}
              onFiltersChange={setFilters}
              products={barProducts}
            />

            {/* Sort */}
            <InventorySort sort={sort} onSortChange={setSort} />

            {/* View Toggle */}
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors duration-200 ${
                  viewMode === 'list'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid / List */}
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'flex flex-col gap-2'
        }>
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              variant={viewMode === 'grid' ? 'card' : 'list'}
              onSelect={handleSelectProduct}
              delay={300 + index * 100}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-1">
              No se encontraron productos
            </h4>
            <p className="text-sm text-gray-500">
              Intenta con otra búsqueda
            </p>
          </div>
        )}
      </div>

      {/* ===== MODALES ===== */}

      {/* Escáner (con soporte multi-barcode) */}
      <ScannerOverlay
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        isAddMode={isAddMode}
        products={barProducts}
        productBarcodes={productBarcodes}
        onProductScanned={handleProductScanned}
        onBarcodeNotFound={handleBarcodeNotFound}
        onAddNewProduct={handleScannerAddNewProduct}
      />

      {/* Báscula */}
      <ScaleOverlay
        open={scaleOpen}
        onClose={() => setScaleOpen(false)}
        isAddMode={isAddMode}
        products={barProducts.filter(p => p.isWeightBased)}
        onProductWeighed={handleProductWeighed}
        onAddNewProduct={handleScaleAddNewProduct}
      />

      {/* Modal: Confirmar Entrada (con conversión de cajas si aplica) */}
      <InventoryEntryModal
        open={showEntryConfirm}
        onClose={() => { setShowEntryConfirm(false); setScannedProduct(null); setScannedProductBarcode(undefined); }}
        product={scannedProduct}
        barName={activeBar.name}
        onConfirm={handleEntryConfirm}
        authorizedBy={adminName}
        productBarcode={scannedProductBarcode}
      />

      {/* Modal: Confirmar Salida */}
      <InventoryExitModal
        open={showExitConfirm}
        onClose={() => { setShowExitConfirm(false); setScannedProduct(null); }}
        product={scannedProduct}
        barName={activeBar.name}
        onConfirm={handleExitConfirm}
        authorizedBy={adminName}
      />

      {/* Modal: Agregar Producto (nuevo, desde escáner) */}
      <AddProductModal
        open={showAddProduct}
        onClose={() => { setShowAddProduct(false); setScannedBarcode(undefined); }}
        onSave={handleSaveNewProduct}
        barId={activeBarId}
        barName={activeBar.name}
        initialBarcode={scannedBarcode}
      />

      {/* Modal: Agregar Producto a Granel (desde báscula) */}
      <AddBulkProductModal
        open={showAddBulkProduct}
        onClose={() => setShowAddBulkProduct(false)}
        onSave={handleSaveBulkProduct}
        barId={activeBarId}
        barName={activeBar.name}
      />

      {/* Sheet: Reporte del Bar */}
      <BarReportSheet
        open={showReport}
        onClose={() => setShowReport(false)}
        bar={activeBar}
        products={barProducts}
        alerts={barAlerts}
        movements={barMovements}
      />

      {/* Modal: Ajustar Stock */}
      <StockAdjustmentModal
        open={showStockAdjust}
        onClose={() => setShowStockAdjust(false)}
        product={selectedProduct}
        onSave={handleStockAdjust}
        workerName={adminName}
      />

      {/* Modal: Editar Producto */}
      <ProductFormModal
        open={showEditProduct}
        onClose={() => setShowEditProduct(false)}
        product={selectedProduct}
        onSave={handleEditProduct}
      />

      {/* Modal: Barcode desconocido (2 opciones: nuevo producto o agregar a existente) */}
      <UnknownBarcodeModal
        open={showUnknownBarcode}
        onClose={() => { setShowUnknownBarcode(false); setScannedBarcode(undefined); }}
        barcode={scannedBarcode || ''}
        onRegisterNewProduct={handleRegisterNewProduct}
        onAddToExistingProduct={handleAddToExistingProduct}
      />

      {/* Modal: Asociar barcode a producto existente */}
      <AddBarcodeToProductModal
        open={showAddBarcodeToProduct}
        onClose={() => { setShowAddBarcodeToProduct(false); setScannedBarcode(undefined); }}
        barcode={scannedBarcode || ''}
        products={barProducts}
        onSave={handleSaveNewBarcode}
      />

      {/* Sheet: Recepción por Lotes */}
      <BatchReceptionSheet
        open={showBatchReception}
        onClose={() => setShowBatchReception(false)}
        barId={activeBarId}
        barName={activeBar.name}
        adminName={adminName}
        products={barProducts}
        productBarcodes={productBarcodes}
        onSessionConfirmed={handleSessionConfirmed}
        onBarcodeNotFound={(barcode) => {
          setScannedBarcode(barcode);
          setShowUnknownBarcode(true);
        }}
      />
    </div>
  );
}
