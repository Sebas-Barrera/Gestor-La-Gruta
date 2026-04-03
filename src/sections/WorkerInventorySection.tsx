import { useState, useEffect } from "react";
import {
  Search,
  Grid3X3,
  List,
  ScanLine,
  Scale,
  ClipboardCheck,
} from "lucide-react";
import { TouchInput } from "@/components/shared/TouchInput";
import { Button } from "@/components/ui/button";
import { ProductInfoPanel } from "@/components/ProductInfoPanel";
import { InventoryGrid } from "@/components/InventoryGrid";
import { ProductCard } from "@/components/ProductCard";
import { useAuth } from "@/contexts/AuthContext";
import { useInventory } from "@/contexts/InventoryContext";
import { useGlobalBarcodeScanner } from "@/hooks/useGlobalBarcodeScanner";
import { useGlobalScaleDetector } from "@/hooks/useGlobalScaleDetector";
import { PinVerificationModal } from "@/components/worker/PinVerificationModal";
import { StockAdjustmentModal } from "@/components/worker/StockAdjustmentModal";
import { ProductFormModal } from "@/components/worker/ProductFormModal";
import { ScannerOverlay } from "@/components/worker/ScannerOverlay";
import { ScaleOverlay } from "@/components/worker/ScaleOverlay";
import { BatchReceptionSheet } from "@/components/admin/BatchReceptionSheet";
import { InventoryEntryModal } from "@/components/shared/InventoryEntryModal";
import { InventoryExitModal } from "@/components/shared/InventoryExitModal";
import { ScaleConfirmationModal } from "@/components/shared/ScaleConfirmationModal";
import {
  InventoryFilter,
  applyInventoryFilters,
} from "@/components/shared/InventoryFilter";
import {
  InventorySort,
  applyInventorySort,
} from "@/components/shared/InventorySort";
import { toast } from "sonner";
import type {
  Product,
  Worker,
  ReceptionSession,
  ProductBarcode,
} from "@/types";
import type { CreateProductData } from "@/components/admin/AddProductModal";
import type { InventoryFilters } from "@/components/shared/InventoryFilter";
import type { InventorySortConfig } from "@/components/shared/InventorySort";

type PinAction =
  | "adjust_stock"
  | "edit_product"
  | "scanner_entry"
  | "scanner_out"
  | "scale_entry"
  | "scale_out"
  | "batch_reception"
  | null;

export function WorkerInventorySection() {
  const { currentBar, verifyPin } = useAuth();
  const {
    products: allProducts,
    productBarcodes,
    recordEntry,
    recordExit,
    adjustStock,
    updateProduct,
    confirmBatchReception,
    addProduct,
    addProductBarcode,
  } = useInventory();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [filters, setFilters] = useState<InventoryFilters>({
    statuses: [],
    categories: [],
  });
  const [sort, setSort] = useState<InventorySortConfig>({
    field: "name",
    direction: "asc",
  });

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
  const [scannedBarcode, setScannedBarcode] = useState<ProductBarcode | null>(
    null,
  );
  const [showBatchReception, setShowBatchReception] = useState(false);

  // Estados de báscula automática (Ctrl+W)
  const [scaleConfirmOpen, setScaleConfirmOpen] = useState(false);
  const [detectedWeight, setDetectedWeight] = useState(0);
  const [scaleProduct, setScaleProduct] = useState<Product | null>(null);

  // Filter products by current bar
  const barProducts = allProducts.filter((p) => p.barId === currentBar?.id);

  // --- Escáner global (detecta escaneos físicos sin abrir el modal) ---
  const anyModalOpen =
    scannerOpen ||
    scaleOpen ||
    scaleConfirmOpen ||
    pinModalOpen ||
    showEntryConfirm ||
    showExitConfirm ||
    showBatchReception ||
    stockModalOpen ||
    editModalOpen;

  useGlobalBarcodeScanner({
    products: barProducts,
    productBarcodes,
    isAddMode: isAddingProduct,
    enabled: !anyModalOpen,
    onProductScanned: (product, productBarcode) => {
      setScannedProduct(product);
      setScannedBarcode(productBarcode || null);
      setSelectedProduct(product);
      if (isAddingProduct) {
        requestPin("scanner_entry");
      } else {
        requestPin("scanner_out");
      }
    },
    onBarcodeNotFound: () => {
      toast.error("Producto no registrado", {
        description:
          "Este código de barras no está registrado. Pide al administrador que lo registre en el inventario.",
      });
    },
  });

  // --- Báscula global (detecta Ctrl+W y simula peso automático) ---
  useGlobalScaleDetector({
    products: barProducts.filter((p) => p.isWeightBased),
    isAddMode: isAddingProduct,
    enabled: !anyModalOpen,
    onProductWeighed: (product, weight) => {
      setScaleProduct(product);
      setDetectedWeight(weight);
      setSelectedProduct(product);
      // Requiere PIN antes de abrir modal de confirmación
      requestPin(isAddingProduct ? "scale_entry" : "scale_out");
    },
    onNoWeightProducts: () => {
      toast.warning("No hay productos de báscula en este bar", {
        description: "Los productos a granel deben ser registrados por el administrador.",
      });
    },
  });

  // Pipeline: búsqueda → filtros → ordenamiento
  const searchedProducts = barProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredProducts = applyInventorySort(
    applyInventoryFilters(searchedProducts, filters),
    sort,
  );

  // Sincronizar selectedProduct cuando cambian los productos
  useEffect(() => {
    if (selectedProduct) {
      const updated = allProducts.find((p) => p.id === selectedProduct.id);
      if (updated && updated.stock !== selectedProduct.stock) {
        setSelectedProduct(updated);
      }
    } else if (barProducts.length > 0) {
      setSelectedProduct(barProducts[0]);
    }
  }, [allProducts, selectedProduct, barProducts]);

  const requestPin = (action: PinAction) => {
    setPinAction(action);
    setPinModalOpen(true);
  };

  const handlePinVerified = (worker: Worker) => {
    setVerifiedWorker(worker);
    setPinModalOpen(false);

    switch (pinAction) {
      case "adjust_stock":
        setStockModalOpen(true);
        break;
      case "edit_product":
        setEditModalOpen(true);
        break;
      case "scanner_entry":
        setShowEntryConfirm(true);
        break;
      case "scanner_out":
        setShowExitConfirm(true);
        break;
      case "scale_entry":
      case "scale_out":
        // Báscula automática abre modal específico
        setScaleConfirmOpen(true);
        break;
      case "batch_reception":
        setShowBatchReception(true);
        break;
    }
    setPinAction(null);
  };

  const handleProductScanned = (
    product: Product,
    productBarcode?: ProductBarcode,
  ) => {
    setScannerOpen(false);
    setScannedProduct(product);
    setScannedBarcode(productBarcode || null);
    setSelectedProduct(product);

    if (isAddingProduct) {
      requestPin("scanner_entry");
    } else {
      requestPin("scanner_out");
    }
  };

  const handleBarcodeNotFound = () => {
    setScannerOpen(false);
    toast.error("Producto no registrado", {
      description:
        "Este código de barras no está registrado. Pide al administrador que lo registre en el inventario.",
    });
  };

  const handleProductWeighed = (product: Product, _weight: number) => {
    setScaleOpen(false);
    setScannedProduct(product);
    setScannedBarcode(null); // Productos por peso no usan productBarcode
    setSelectedProduct(product);

    if (isAddingProduct) {
      requestPin("scale_entry");
    } else {
      requestPin("scale_out");
    }
  };

  /** Confirmar entrada de inventario */
  const handleEntryConfirm = (quantity: number) => {
    if (!scannedProduct) return;
    const workerName = verifiedWorker?.name || "Trabajador";
    recordEntry(scannedProduct.id, quantity, workerName, currentBar?.id || "");
    toast.success(
      `+${quantity} ${scannedProduct.unit} de "${scannedProduct.name}" agregados`,
      {
        description: `Entrada registrada por ${workerName}`,
      },
    );
    setShowEntryConfirm(false);
    setScannedProduct(null);
    setScannedBarcode(null);
    setVerifiedWorker(null);
  };

  /** Confirmar salida de inventario */
  const handleExitConfirm = (quantity: number, notes?: string) => {
    if (!scannedProduct) return;
    const workerName = verifiedWorker?.name || "Trabajador";
    recordExit(
      scannedProduct.id,
      quantity,
      workerName,
      currentBar?.id || "",
      notes,
    );
    toast.success(
      `-${quantity} ${scannedProduct.unit} de "${scannedProduct.name}" retirados`,
      {
        description: `Salida registrada por ${workerName}`,
      },
    );
    setShowExitConfirm(false);
    setScannedProduct(null);
    setScannedBarcode(null);
    setVerifiedWorker(null);
  };

  /** Recepción por lotes confirmada */
  const handleBatchSessionConfirmed = async (
    session: ReceptionSession,
    drafts: CreateProductData[],
  ) => {
    const workerName = verifiedWorker?.name || "Trabajador";

    // 1. Convertir borradores en productos reales
    const draftIdMap = new Map<string, string>();
    for (const draft of drafts) {
      // FIX BUG: `addProduct()` normalmente inyecta el `draft.stock` como inventario inicial.
      // Sin embargo, `confirmBatchReception` abajo VOLVERÁ a inyectar esa cantidad sumando
      // el `totalIndividualQty`. Por tanto, asignamos temporalmente stock: 0 al crear el producto.
      const newProduct = await addProduct({
        ...draft,
        barId: currentBar?.id || draft.barId,
        stock: 0,
      });
      draftIdMap.set(draft.name, newProduct.id);

      if (draft.barcode) {
        await addProductBarcode({
          productId: newProduct.id,
          barcode: draft.barcode,
          quantityPerScan: 1,
          label: "Individual",
        });
      }
    }

    // 2. Actualizar los IDs ficticios en los items de la sesión
    const finalSession = {
      ...session,
      items: session.items.map((item) => {
        if (item.productId.startsWith("draft-prod-")) {
          return {
            ...item,
            productId: draftIdMap.get(item.productName) || item.productId,
          };
        }
        return item;
      }),
    };

    await confirmBatchReception(finalSession, workerName);
    const totalUnits = finalSession.items.reduce(
      (sum, i) => sum + i.totalIndividualQty,
      0,
    );
    toast.success(
      `Recepción confirmada: ${finalSession.items.length} productos, ${Number.isInteger(totalUnits) ? totalUnits : totalUnits.toFixed(2)} unidades`,
      {
        description: `${currentBar?.name} · Registrado por ${workerName}`,
      },
    );
    setShowBatchReception(false);
    setVerifiedWorker(null);
  };

  /** Guardar ajuste manual de stock */
  const handleStockSave = (newQuantity: number, notes?: string) => {
    if (!selectedProduct) return;
    const workerName = verifiedWorker?.name || "Trabajador";
    const diff = newQuantity - selectedProduct.stock;
    const movementType = diff > 0 ? "entrada" : "salida";
    adjustStock(
      selectedProduct.id,
      newQuantity,
      workerName,
      currentBar?.id || "",
      notes,
    );
    toast.success(`Stock de "${selectedProduct.name}" ajustado`, {
      description: `${diff > 0 ? "+" : ""}${diff} ${selectedProduct.unit} (${movementType}) por ${workerName}`,
    });
    setStockModalOpen(false);
    setVerifiedWorker(null);
  };

  /** Guardar edición de producto */
  const handleProductSave = (data: Partial<Product>) => {
    if (!selectedProduct) return;
    updateProduct(selectedProduct.id, data);
    toast.success(`Producto "${selectedProduct.name}" actualizado`, {
      description: `Cambios guardados por ${verifiedWorker?.name || "Trabajador"}`,
    });
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
              ? "bg-green-500 hover:bg-green-600"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isAddingProduct ? "Modo: ENTRADA activo" : "Agregar Inventario"}
        </Button>

        {/* Recepción por lotes — solo visible en modo ENTRADA, requiere PIN */}
        {isAddingProduct && (
          <Button
            variant="outline"
            onClick={() => requestPin("batch_reception")}
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
          {selectedProduct && (
            <ProductInfoPanel
              product={selectedProduct}
              onAdjustStock={() => requestPin("adjust_stock")}
              onEditProduct={() => requestPin("edit_product")}
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
                onClick={() => setViewMode("grid")}
                className={`p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors duration-200 ${
                  viewMode === "grid"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors duration-200 ${
                  viewMode === "list"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "flex flex-col gap-2"
          }
        >
          {filteredProducts.map((product: Product, index: number) => (
            <ProductCard
              key={product.id}
              product={product}
              variant={viewMode === "grid" ? "card" : "list"}
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
            <p className="text-sm text-gray-500">Intenta con otra búsqueda</p>
          </div>
        )}
      </div>

      {/* ===== MODALES ===== */}

      {/* PIN Verification */}
      <PinVerificationModal
        open={pinModalOpen}
        onClose={() => {
          setPinModalOpen(false);
          setPinAction(null);
          setScannedProduct(null);
          setScannedBarcode(null);
        }}
        onVerified={handlePinVerified}
        verifyPin={verifyPin}
      />

      {/* Escáner */}
      <ScannerOverlay
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        isAddMode={isAddingProduct}
        products={barProducts}
        productBarcodes={productBarcodes}
        onProductScanned={handleProductScanned}
        onBarcodeNotFound={handleBarcodeNotFound}
      />

      {/* Báscula */}
      <ScaleOverlay
        open={scaleOpen}
        onClose={() => setScaleOpen(false)}
        isAddMode={isAddingProduct}
        products={barProducts.filter((p) => p.isWeightBased)}
        onProductWeighed={handleProductWeighed}
      />

      {/* Modal: Confirmar Peso Detectado Automáticamente (Ctrl+W) */}
      <ScaleConfirmationModal
        open={scaleConfirmOpen}
        onClose={() => {
          setScaleConfirmOpen(false);
          setScaleProduct(null);
          setDetectedWeight(0);
          setVerifiedWorker(null);
        }}
        product={scaleProduct}
        detectedWeight={detectedWeight}
        barName={currentBar?.name || ""}
        isAddMode={isAddingProduct}
        onConfirm={(weight) => {
          if (!scaleProduct) return;
          const workerName = verifiedWorker?.name || "Trabajador";
          if (isAddingProduct) {
            recordEntry(
              scaleProduct.id,
              weight,
              workerName,
              currentBar?.id || "",
              `Báscula: ${weight} ${scaleProduct.weightUnit || scaleProduct.unit}`
            );
            toast.success(
              `+${weight} ${scaleProduct.weightUnit || scaleProduct.unit} de "${scaleProduct.name}" agregados`,
              {
                description: `Entrada registrada por ${workerName}`,
              }
            );
          } else {
            recordExit(
              scaleProduct.id,
              weight,
              workerName,
              currentBar?.id || "",
              `Báscula: ${weight} ${scaleProduct.weightUnit || scaleProduct.unit}`
            );
            toast.success(
              `-${weight} ${scaleProduct.weightUnit || scaleProduct.unit} de "${scaleProduct.name}" retirados`,
              {
                description: `Salida registrada por ${workerName}`,
              }
            );
          }
          setScaleConfirmOpen(false);
          setScaleProduct(null);
          setDetectedWeight(0);
          setVerifiedWorker(null);
        }}
        authorizedBy={verifiedWorker?.name}
      />

      {/* Modal: Confirmar Entrada */}
      <InventoryEntryModal
        open={showEntryConfirm}
        onClose={() => {
          setShowEntryConfirm(false);
          setScannedProduct(null);
          setScannedBarcode(null);
          setVerifiedWorker(null);
        }}
        product={scannedProduct}
        barName={currentBar?.name || ""}
        onConfirm={handleEntryConfirm}
        authorizedBy={verifiedWorker?.name}
        productBarcode={scannedBarcode || undefined}
      />

      {/* Modal: Confirmar Salida */}
      <InventoryExitModal
        open={showExitConfirm}
        onClose={() => {
          setShowExitConfirm(false);
          setScannedProduct(null);
          setScannedBarcode(null);
          setVerifiedWorker(null);
        }}
        product={scannedProduct}
        barName={currentBar?.name || ""}
        onConfirm={handleExitConfirm}
        authorizedBy={verifiedWorker?.name}
        productBarcode={scannedBarcode || undefined}
      />

      {/* Recepción por Lotes (solo productos existentes, sin crear nuevos) */}
      <BatchReceptionSheet
        open={showBatchReception}
        onClose={() => {
          setShowBatchReception(false);
          setVerifiedWorker(null);
        }}
        barId={currentBar?.id || ""}
        barName={currentBar?.name || ""}
        adminName={verifiedWorker?.name || "Trabajador"}
        products={barProducts}
        productBarcodes={productBarcodes}
        onSessionConfirmed={handleBatchSessionConfirmed}
      />

      {/* Ajustar Stock (desde ProductInfoPanel) */}
      {selectedProduct && (
        <>
          <StockAdjustmentModal
            open={stockModalOpen}
            onClose={() => {
              setStockModalOpen(false);
              setVerifiedWorker(null);
            }}
            product={selectedProduct}
            onSave={handleStockSave}
            workerName={verifiedWorker?.name}
          />

          <ProductFormModal
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setVerifiedWorker(null);
            }}
            product={selectedProduct}
            onSave={handleProductSave}
          />
        </>
      )}
    </div>
  );
}
