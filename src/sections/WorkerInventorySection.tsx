import { useState } from 'react';
import { Search, Grid3X3, List, ScanLine, Scale } from 'lucide-react';
import { TouchInput } from '@/components/shared/TouchInput';
import { Button } from '@/components/ui/button';
import { ProductInfoPanel } from '@/components/ProductInfoPanel';
import { InventoryGrid } from '@/components/InventoryGrid';
import { ProductCard } from '@/components/ProductCard';
import { useAuth } from '@/contexts/AuthContext';
import { products } from '@/data/mockData';
import { PinVerificationModal } from '@/components/worker/PinVerificationModal';
import { StockAdjustmentModal } from '@/components/worker/StockAdjustmentModal';
import { ProductFormModal } from '@/components/worker/ProductFormModal';
import { ScannerOverlay } from '@/components/worker/ScannerOverlay';
import { ScaleOverlay } from '@/components/worker/ScaleOverlay';
import { InventoryEntryModal } from '@/components/shared/InventoryEntryModal';
import { InventoryExitModal } from '@/components/shared/InventoryExitModal';
import { InventoryFilter, applyInventoryFilters } from '@/components/shared/InventoryFilter';
import { InventorySort, applyInventorySort } from '@/components/shared/InventorySort';
import { toast } from 'sonner';
import type { Product, Worker } from '@/types';
import type { InventoryFilters } from '@/components/shared/InventoryFilter';
import type { InventorySortConfig } from '@/components/shared/InventorySort';

type PinAction =
  | 'adjust_stock'
  | 'edit_product'
  | 'scanner_entry'
  | 'scanner_out'
  | 'scale_entry'
  | 'scale_out'
  | null;

export function WorkerInventorySection() {
  const { currentBar, verifyPin } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [filters, setFilters] = useState<InventoryFilters>({ statuses: [], categories: [] });
  const [sort, setSort] = useState<InventorySortConfig>({ field: 'name', direction: 'asc' });

  // PIN flow state
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinAction, setPinAction] = useState<PinAction>(null);
  const [verifiedWorker, setVerifiedWorker] = useState<Worker | null>(null);

  // Modal states
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scaleOpen, setScaleOpen] = useState(false);

  // Nuevos modales de entrada/salida
  const [showEntryConfirm, setShowEntryConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);

  // Filter products by current bar
  const barProducts = products.filter(p => p.barId === currentBar?.id);

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

  // Set first product as selected if none selected
  if (!selectedProduct && barProducts.length > 0) {
    setSelectedProduct(barProducts[0]);
  }

  const requestPin = (action: PinAction) => {
    setPinAction(action);
    setPinModalOpen(true);
  };

  const handlePinVerified = (worker: Worker) => {
    setVerifiedWorker(worker);
    setPinModalOpen(false);

    switch (pinAction) {
      case 'adjust_stock':
        setStockModalOpen(true);
        break;
      case 'edit_product':
        setEditModalOpen(true);
        break;
      case 'scanner_entry':
        setShowEntryConfirm(true);
        break;
      case 'scanner_out':
      case 'scale_out':
        setShowExitConfirm(true);
        break;
      case 'scale_entry':
        setShowEntryConfirm(true);
        break;
    }
    setPinAction(null);
  };

  /**
   * Escáner: producto encontrado.
   * Requiere PIN → luego abre modal de entrada o salida.
   */
  const handleProductScanned = (product: Product) => {
    setScannerOpen(false);
    setScannedProduct(product);
    setSelectedProduct(product);

    if (isAddingProduct) {
      requestPin('scanner_entry');
    } else {
      requestPin('scanner_out');
    }
  };

  /**
   * Escáner: barcode no encontrado.
   * Worker no puede registrar productos → toast de error.
   */
  const handleBarcodeNotFound = (_barcode: string) => {
    setScannerOpen(false);
    toast.error('Producto no registrado', {
      description: 'Este código de barras no está registrado. Pide al administrador que lo registre en el inventario.',
    });
  };

  /**
   * Báscula: producto pesado.
   * Requiere PIN → luego abre modal de entrada o salida.
   */
  const handleProductWeighed = (product: Product, _weight: number) => {
    setScaleOpen(false);
    setScannedProduct(product);
    setSelectedProduct(product);

    if (isAddingProduct) {
      requestPin('scale_entry');
    } else {
      requestPin('scale_out');
    }
  };

  /** Confirmar entrada de inventario */
  const handleEntryConfirm = (quantity: number) => {
    if (!scannedProduct) return;

    console.log('[Worker:InventoryEntry] Datos para backend:', {
      productId: scannedProduct.id,
      productName: scannedProduct.name,
      previousQuantity: scannedProduct.stock,
      newQuantity: scannedProduct.stock + quantity,
      quantity,
      type: 'in',
      barId: currentBar?.id,
      workerName: verifiedWorker?.name,
    });

    toast.success(`+${quantity} ${scannedProduct.unit} de "${scannedProduct.name}" agregados`, {
      description: `Entrada registrada por ${verifiedWorker?.name || 'Trabajador'}`,
    });

    setShowEntryConfirm(false);
    setScannedProduct(null);
    setVerifiedWorker(null);
  };

  /** Confirmar salida de inventario */
  const handleExitConfirm = (quantity: number, notes?: string) => {
    if (!scannedProduct) return;

    console.log('[Worker:InventoryExit] Datos para backend:', {
      productId: scannedProduct.id,
      productName: scannedProduct.name,
      previousQuantity: scannedProduct.stock,
      newQuantity: scannedProduct.stock - quantity,
      quantity,
      type: 'out',
      barId: currentBar?.id,
      workerName: verifiedWorker?.name,
      notes,
    });

    toast.success(`-${quantity} ${scannedProduct.unit} de "${scannedProduct.name}" retirados`, {
      description: `Salida registrada por ${verifiedWorker?.name || 'Trabajador'}`,
    });

    setShowExitConfirm(false);
    setScannedProduct(null);
    setVerifiedWorker(null);
  };

  const handleStockSave = (newQuantity: number, notes?: string) => {
    console.log('Stock adjusted:', { product: selectedProduct?.name, newQuantity, notes, worker: verifiedWorker?.name });
    setStockModalOpen(false);
    setVerifiedWorker(null);
  };

  const handleProductSave = (data: Partial<Product>) => {
    console.log('Product edited:', { ...data, worker: verifiedWorker?.name });
    setEditModalOpen(false);
    setVerifiedWorker(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Scanner & Scale Controls */}
      <div className="flex gap-3">
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
          onClick={() => setIsAddingProduct(!isAddingProduct)}
          className={`gap-2 min-h-[44px] ${
            isAddingProduct
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isAddingProduct ? 'Modo: ENTRADA activo' : 'Agregar Inventario'}
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Panel - Product Info */}
        <div className="lg:col-span-2">
          {selectedProduct && (
            <ProductInfoPanel
              product={selectedProduct}
              onAdjustStock={() => requestPin('adjust_stock')}
              onEditProduct={() => requestPin('edit_product')}
              delay={100}
            />
          )}
        </div>

        {/* Right Panel - Visual Grid */}
        <div className="lg:col-span-3">
          <InventoryGrid
            products={barProducts}
            onSlotClick={(_slotId, product) => {
              if (product) setSelectedProduct(product);
            }}
            delay={200}
          />
        </div>
      </div>

      {/* Product Cards Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Productos en Inventario
          </h3>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <TouchInput
                placeholder="Buscar por SKU o nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 focus-visible:ring-blue-500 min-h-[44px] text-base"
              />
            </div>

            <InventoryFilter
              filters={filters}
              onFiltersChange={setFilters}
              products={barProducts}
            />

            <InventorySort sort={sort} onSortChange={setSort} />

            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors duration-200 ${
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

        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'flex flex-col gap-2'
        }>
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              variant={viewMode === 'grid' ? 'card' : 'list'}
              onSelect={(p) => {
                setSelectedProduct(p);
              }}
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

      {/* PIN Verification */}
      <PinVerificationModal
        open={pinModalOpen}
        onClose={() => { setPinModalOpen(false); setPinAction(null); setScannedProduct(null); }}
        onVerified={handlePinVerified}
        verifyPin={verifyPin}
      />

      {/* Escáner */}
      <ScannerOverlay
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        isAddMode={isAddingProduct}
        products={barProducts}
        onProductScanned={handleProductScanned}
        onBarcodeNotFound={handleBarcodeNotFound}
      />

      {/* Báscula */}
      <ScaleOverlay
        open={scaleOpen}
        onClose={() => setScaleOpen(false)}
        isAddMode={isAddingProduct}
        products={barProducts.filter(p => p.isWeightBased)}
        onProductWeighed={handleProductWeighed}
      />

      {/* Modal: Confirmar Entrada */}
      <InventoryEntryModal
        open={showEntryConfirm}
        onClose={() => { setShowEntryConfirm(false); setScannedProduct(null); setVerifiedWorker(null); }}
        product={scannedProduct}
        barName={currentBar?.name || ''}
        onConfirm={handleEntryConfirm}
        authorizedBy={verifiedWorker?.name}
      />

      {/* Modal: Confirmar Salida */}
      <InventoryExitModal
        open={showExitConfirm}
        onClose={() => { setShowExitConfirm(false); setScannedProduct(null); setVerifiedWorker(null); }}
        product={scannedProduct}
        barName={currentBar?.name || ''}
        onConfirm={handleExitConfirm}
        authorizedBy={verifiedWorker?.name}
      />

      {/* Ajustar Stock (desde ProductInfoPanel) */}
      {selectedProduct && (
        <>
          <StockAdjustmentModal
            open={stockModalOpen}
            onClose={() => { setStockModalOpen(false); setVerifiedWorker(null); }}
            product={selectedProduct}
            onSave={handleStockSave}
            workerName={verifiedWorker?.name}
          />

          <ProductFormModal
            open={editModalOpen}
            onClose={() => { setEditModalOpen(false); setVerifiedWorker(null); }}
            product={selectedProduct}
            onSave={handleProductSave}
          />
        </>
      )}
    </div>
  );
}
