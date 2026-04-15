import { useState, useEffect } from "react";
import {
  Search,
  Grid3X3,
  List,
  Eye,
  ScanLine,
  Scale,
  ClipboardCheck,
} from "lucide-react";
import { TouchInput } from "@/components/shared/TouchInput";
import { Button } from "@/components/ui/button";
import { ProductInfoPanel } from "@/components/ProductInfoPanel";
import { InventoryGrid } from "@/components/InventoryGrid";
import { ProductCard } from "@/components/ProductCard";
import { BarSelector } from "@/components/BarSelector";
import { StockAdjustmentModal } from "@/components/worker/StockAdjustmentModal";
import { ProductFormModal } from "@/components/worker/ProductFormModal";
import { AddProductModal } from "@/components/admin/AddProductModal";
import { AddPackagedProductModal } from "@/components/admin/AddPackagedProductModal";
import { AddBulkProductModal } from "@/components/admin/AddBulkProductModal";
import { BarReportSheet } from "@/components/admin/BarReportSheet";
import { BatchReceptionSheet } from "@/components/admin/BatchReceptionSheet";
import { ScannerOverlay } from "@/components/worker/ScannerOverlay";
import { ScaleOverlay } from "@/components/worker/ScaleOverlay";
import { InventoryEntryModal } from "@/components/shared/InventoryEntryModal";
import { InventoryExitModal } from "@/components/shared/InventoryExitModal";
import { UnknownBarcodeModal } from "@/components/shared/UnknownBarcodeModal";
import { AddBarcodeToProductModal } from "@/components/shared/AddBarcodeToProductModal";
import { ScaleConfirmationModal } from "@/components/shared/ScaleConfirmationModal";
import { AdminPinVerificationModal } from "@/components/admin/AdminPinVerificationModal";
import {
  InventoryFilter,
  applyInventoryFilters,
} from "@/components/shared/InventoryFilter";
import {
  InventorySort,
  applyInventorySort,
} from "@/components/shared/InventorySort";
import { useAuth } from "@/contexts/AuthContext";
import { useInventory } from "@/contexts/InventoryContext";
import { useBarManagement } from "@/hooks/useBarManagement";
import { useGlobalBarcodeScanner } from "@/hooks/useGlobalBarcodeScanner";
import { useGlobalScaleDetector } from "@/hooks/useGlobalScaleDetector";
import { toast } from "sonner";
import type {
  Product,
  ProductBarcode,
  CreateBulkProductData,
  ReceptionSession,
} from "@/types";
import type { CreateProductData } from "@/components/admin/AddProductModal";
import type { CreateBarcodeData } from "@/components/shared/AddBarcodeToProductModal";
import type { InventoryFilters } from "@/components/shared/InventoryFilter";
import type { InventorySortConfig } from "@/components/shared/InventorySort";
import type { AdminAccount } from "@/types";

type PinAction =
  | "scanner_entry"
  | "scanner_exit"
  | "scale_entry"
  | "scale_exit"
  | "scale_auto_entry"
  | "scale_auto_exit"
  | "adjust_stock"
  | "batch_reception"
  | null;

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
  const { currentUser, verifyAdminPin } = useAuth();
  const {
    products: allProducts,
    productBarcodes,
    inventoryMovements,
    addProduct,
    addBulkProduct,
    updateProduct,
    deleteProduct,
    addProductBarcode,
    recordEntry,
    recordExit,
    adjustStock,
    confirmBatchReception,
  } = useInventory();
  const { bars } = useBarManagement();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeBarId, setActiveBarId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddMode, setIsAddMode] = useState(false);
  const [filters, setFilters] = useState<InventoryFilters>({
    statuses: [],
    categories: [],
  });
  const [sort, setSort] = useState<InventorySortConfig>({
    field: "name",
    direction: "asc",
  });

  // Estados de modales existentes
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddPackagedProduct, setShowAddPackagedProduct] = useState(false);
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
  const [scannedBarcode, setScannedBarcode] = useState<string | undefined>(
    undefined,
  );
  const [initialUnitForNewProduct, setInitialUnitForNewProduct] = useState<
    string | undefined
  >(undefined);
  const [initialQuantityPerBox, setInitialQuantityPerBox] = useState<
    number | undefined
  >(undefined);

  // Modal dedicado para productos a granel (desde báscula)
  const [showAddBulkProduct, setShowAddBulkProduct] = useState(false);

  // Producto seleccionado desde el escáner/báscula para confirmar entrada/salida
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);

  // ProductBarcode del escaneo (para conversión de cajas en InventoryEntryModal)
  const [scannedProductBarcode, setScannedProductBarcode] = useState<
    ProductBarcode | undefined
  >(undefined);

  // --- Estados de multi-barcode y recepción por lotes ---
  const [showUnknownBarcode, setShowUnknownBarcode] = useState(false);
  const [showAddBarcodeToProduct, setShowAddBarcodeToProduct] = useState(false);
  const [showBatchReception, setShowBatchReception] = useState(false);

  // --- Estados de báscula automática (Ctrl+W) ---
  const [scaleConfirmOpen, setScaleConfirmOpen] = useState(false);
  const [detectedWeight, setDetectedWeight] = useState(0);
  const [scaleProduct, setScaleProduct] = useState<Product | null>(null);

  // --- Estados de verificación de PIN para admins ---
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinAction, setPinAction] = useState<PinAction>(null);
  const [verifiedAdmin, setVerifiedAdmin] = useState<AdminAccount | null>(null);

  // --- Escáner global (detecta escaneos físicos sin abrir el modal) ---
  const anyModalOpen =
    scannerOpen ||
    scaleOpen ||
    scaleConfirmOpen ||
    showEntryConfirm ||
    showExitConfirm ||
    showUnknownBarcode ||
    showAddProduct ||
    showAddPackagedProduct ||
    showAddBarcodeToProduct ||
    showBatchReception ||
    showAddBulkProduct ||
    showStockAdjust ||
    showEditProduct ||
    showReport ||
    pinModalOpen;

  useGlobalBarcodeScanner({
    products: allProducts.filter((p) => p.barId === activeBarId),
    productBarcodes,
    isAddMode,
    enabled: !anyModalOpen,
    onProductScanned: (product, productBarcode) => {
      setScannedProduct(product);
      setScannedProductBarcode(productBarcode);
      setSelectedProduct(product);
      // Solicitar PIN antes de abrir modal de confirmación
      if (isAddMode) {
        requestPin("scanner_entry");
      } else {
        requestPin("scanner_exit");
      }
    },
    onBarcodeNotFound: (barcode) => {
      if (isAddMode) {
        setScannedBarcode(barcode);
        setShowUnknownBarcode(true);
      } else {
        toast.error("Producto no registrado", {
          description:
            'Este código de barras no está registrado. Activa el modo "Agregar Inventario" para registrar nuevos productos.',
        });
      }
    },
  });

  // --- Báscula global (detecta Ctrl+W y simula peso automático) ---
  useGlobalScaleDetector({
    products: allProducts.filter((p) => p.barId === activeBarId && p.isWeightBased),
    isAddMode,
    enabled: !anyModalOpen,
    onProductWeighed: (product, weight) => {
      setScaleProduct(product);
      setDetectedWeight(weight);
      setSelectedProduct(product);
      // Solicitar PIN antes de abrir modal de confirmación
      requestPin(isAddMode ? "scale_auto_entry" : "scale_auto_exit");
    },
    onNoWeightProducts: () => {
      toast.warning("No hay productos de báscula", {
        description: "Registra productos a granel (isWeightBased) para usar esta función.",
      });
    },
  });

  // Bar activo
  const activeBar = bars.find((b) => b.id === activeBarId) || bars[0];
  const adminName = `Admin ${currentUser?.name || ""}`;

  // Seleccionar el primer almacén real cuando termine de cargar la lista
  useEffect(() => {
    if (!activeBarId && bars.length > 0) {
      setActiveBarId(bars[0].id);
    }
  }, [bars, activeBarId]);

  // Productos del bar activo
  const barProducts = allProducts.filter((p) => p.barId === activeBarId);

  // Sincronizar selectedProduct cuando cambian los productos o el bar activo
  useEffect(() => {
    if (selectedProduct) {
      // Si el producto seleccionado no pertenece al bar activo, resetear
      if (selectedProduct.barId !== activeBarId) {
        setSelectedProduct(barProducts.length > 0 ? barProducts[0] : null);
        return;
      }
      const updated = allProducts.find((p) => p.id === selectedProduct.id);
      if (updated && updated.stock !== selectedProduct.stock) {
        setSelectedProduct(updated);
      }
    } else if (barProducts.length > 0) {
      setSelectedProduct(barProducts[0]);
    }
  }, [allProducts, selectedProduct, barProducts, activeBarId]);

  // Esperar a que carguen los almacenes desde Supabase antes de renderizar
  // (debe ir DESPUÉS de todos los hooks para no romper el orden de React)
  if (!activeBar) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Cargando almacenes…
      </div>
    );
  }

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

  // Datos para el reporte (alertas derivadas de productos live)
  const barAlerts = barProducts
    .filter((p) => p.status === "low_stock" || p.status === "out_of_stock")
    .map((p, i) => ({
      id: `alert-${i}`,
      productId: p.id,
      productName: p.name,
      type: p.status as "low_stock" | "out_of_stock",
      currentStock: p.stock,
      threshold: p.minStock,
      timestamp: new Date().toISOString(),
      barId: p.barId,
      barName: activeBar.name,
    }));
  const barMovements = inventoryMovements.filter(
    (m) => m.barId === activeBarId,
  );

  // --- Handlers ---

  const requestPin = (action: PinAction) => {
    setPinAction(action);
    setPinModalOpen(true);
  };

  const handlePinVerified = (admin: AdminAccount) => {
    setVerifiedAdmin(admin);
    setPinModalOpen(false);

    switch (pinAction) {
      case "scanner_entry":
      case "scale_entry":
        setShowEntryConfirm(true);
        break;
      case "scanner_exit":
      case "scale_exit":
        setShowExitConfirm(true);
        break;
      case "scale_auto_entry":
      case "scale_auto_exit":
        setScaleConfirmOpen(true);
        break;
      case "adjust_stock":
        setShowStockAdjust(true);
        break;
      case "batch_reception":
        setShowBatchReception(true);
        break;
    }
    setPinAction(null);
  };

  const handleSlotClick = (_slotId: string, product?: Product) => {
    if (product) setSelectedProduct(product);
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
  };

  /**
   * Escáner: producto encontrado (con info de barcode si aplica).
   * Si ENTRADA → solicitar PIN → abrir InventoryEntryModal (con conversión cajas si quantityPerScan > 1)
   * Si SALIDA  → solicitar PIN → abrir InventoryExitModal
   */
  const handleProductScanned = (
    product: Product,
    productBarcode?: ProductBarcode,
  ) => {
    setScannerOpen(false);
    setScannedProduct(product);
    setScannedProductBarcode(productBarcode);
    setSelectedProduct(product);

    // Solicitar PIN antes de abrir modal de confirmación
    if (isAddMode) {
      requestPin("scanner_entry");
    } else {
      requestPin("scanner_exit");
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
      toast.error("Producto no registrado", {
        description:
          'Este código de barras no está registrado. Activa el modo "Agregar Inventario" para registrar nuevos productos.',
      });
    }
  };

  /**
   * Escáner: usuario quiere registrar un nuevo producto manualmente.
   * Cierra el escáner → abre AddProductModal sin barcode pre-llenado.
   */
  const handleScannerAddNewProduct = (initialUnit?: string) => {
    setInitialUnitForNewProduct(initialUnit);
    setShowAddProduct(true);
    setScannerOpen(false);
  };

  /**
   * Escáner: usuario quiere registrar un nuevo producto empaquetado/caja.
   * Cierra el escáner → abre AddPackagedProductModal.
   */
  const handleScannerAddPackagedProduct = () => {
    setScannedBarcode(undefined);
    setInitialQuantityPerBox(undefined);
    setShowAddPackagedProduct(true);
    setScannerOpen(false);
  };

  /**
   * Báscula: producto pesado.
   * Si ENTRADA → solicitar PIN → abrir InventoryEntryModal con el peso
   * Si SALIDA  → solicitar PIN → abrir InventoryExitModal
   */
  const handleProductWeighed = (product: Product, _weight: number) => {
    setScaleOpen(false);
    setScannedProduct(product);
    setScannedProductBarcode(undefined); // Productos por peso no usan productBarcode
    setSelectedProduct(product);

    // Solicitar PIN antes de abrir modal de confirmación
    if (isAddMode) {
      requestPin("scale_entry");
    } else {
      requestPin("scale_exit");
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
    const authorizedBy = verifiedAdmin ? `Admin ${verifiedAdmin.name}` : adminName;
    recordEntry(scannedProduct.id, quantity, authorizedBy, activeBarId);
    toast.success(
      `+${quantity} ${scannedProduct.unit} de "${scannedProduct.name}" agregados`,
      {
        description: `Entrada registrada en ${activeBar.name} por ${authorizedBy}`,
      },
    );
    setShowEntryConfirm(false);
    setScannedProduct(null);
    setScannedProductBarcode(undefined);
    setVerifiedAdmin(null);
  };

  /** Confirmar salida de inventario */
  const handleExitConfirm = (quantity: number, notes?: string) => {
    if (!scannedProduct) return;
    const authorizedBy = verifiedAdmin ? `Admin ${verifiedAdmin.name}` : adminName;
    recordExit(scannedProduct.id, quantity, authorizedBy, activeBarId, notes);
    toast.success(
      `-${quantity} ${scannedProduct.unit} de "${scannedProduct.name}" retirados`,
      {
        description: `Salida registrada de ${activeBar.name} por ${authorizedBy}`,
      },
    );
    setShowExitConfirm(false);
    setScannedProduct(null);
    setScannedProductBarcode(undefined);
    setVerifiedAdmin(null);
  };

  /** Guardar nuevo producto (desde AddProductModal — escáner) */
  const handleSaveNewProduct = (data: CreateProductData) => {
    // 1. Guardar producto base (Contexto ya se encarga de crear el ProductBarcode si es Caja/Paquete detectado y trae barcode)
    addProduct(data);

    // Si viene de captura inicial (individual normal), AddProductModal manda el 'barcode',
    // pero si ES caja, AddProductModal manda 'isBoxBarcode' en true.
    // InventoryContext.addProduct ya detecta isBoxBarcode y crea automáticamente el PB y el PB_Ind !!

    toast.success(`Producto "${data.name}" agregado exitosamente`, {
      description: `Registrado en ${activeBar.name} por ${adminName}`,
    });

    setShowAddProduct(false);
    setScannedBarcode(undefined);
  };

  /**
   * UnknownBarcodeModal → Opción 1A: Registrar producto individual.
   */
  const handleRegisterIndividualProduct = (barcode: string) => {
    setShowUnknownBarcode(false);
    setScannedBarcode(barcode);
    setInitialUnitForNewProduct(undefined);
    setInitialQuantityPerBox(undefined);
    setShowAddProduct(true);
  };

  /**
   * UnknownBarcodeModal → Opción 1B: Registrar producto empaquetado (caja/paquete).
   */
  const handleRegisterPackagedProduct = (
    boxBarcode: string,
    boxQuantity: number,
  ) => {
    setShowUnknownBarcode(false);
    setScannedBarcode(boxBarcode);
    setInitialQuantityPerBox(boxQuantity);
    setShowAddPackagedProduct(true);
  };

  /**
   * UnknownBarcodeModal → Opción 2: Agregar código a producto existente.
   */
  const handleAddToExistingProduct = (barcode: string) => {
    setShowUnknownBarcode(false);
    setScannedBarcode(barcode);
    setShowAddBarcodeToProduct(true);
  };

  /** Guardar nuevo ProductBarcode */
  const handleSaveNewBarcode = (data: CreateBarcodeData) => {
    addProductBarcode(data);
    const product = allProducts.find((p) => p.id === data.productId);
    toast.success(`Código asociado a "${product?.name || data.productId}"`, {
      description: `${data.label} (${data.quantityPerScan} pzas/escaneo) · Registrado por ${adminName}`,
    });
    setScannedBarcode(undefined);
    setShowAddBarcodeToProduct(false);
  };

  /** Recepción por lotes confirmada */
  const handleSessionConfirmed = async (
    session: ReceptionSession,
    drafts: CreateProductData[],
  ) => {
    const authorizedBy = verifiedAdmin ? `Admin ${verifiedAdmin.name}` : adminName;

    // 1. Convertir borradores en productos reales
    const draftIdMap = new Map<string, string>();
    for (const draft of drafts) {
      // FIX BUG: Evitamos doble inyección de stock forzando inicialización en 0,
      // dejando que confirmBatchReception realice el ingreso real.
      const newProduct = await addProduct({ ...draft, stock: 0 });
      draftIdMap.set(draft.name, newProduct.id);

      // Si el usuario intentó registrar un código de barras en el draft, lo registramos individualmente por compatibilidad
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

    await confirmBatchReception(finalSession, authorizedBy);
    const totalUnits = finalSession.items.reduce(
      (sum, i) => sum + i.totalIndividualQty,
      0,
    );
    toast.success(
      `Recepción confirmada: ${finalSession.items.length} productos, ${Number.isInteger(totalUnits) ? totalUnits : totalUnits.toFixed(2)} unidades`,
      {
        description: `${activeBar.name} · Registrado por ${authorizedBy}`,
      },
    );
    setShowBatchReception(false);
    setVerifiedAdmin(null);
  };

  /** Guardar nuevo producto a granel (desde báscula) */
  const handleSaveBulkProduct = (data: CreateBulkProductData) => {
    addBulkProduct(data);
    toast.success(
      `Producto a granel "${data.name}" registrado en ${activeBar.name}`,
      {
        description: `SKU: ${data.sku} · Unidad: ${data.weightUnit} · Registrado por ${adminName}`,
      },
    );
  };

  /** Guardar ajuste de stock */
  const handleStockAdjust = (newQuantity: number, notes?: string) => {
    if (!selectedProduct) return;
    const authorizedBy = verifiedAdmin ? `Admin ${verifiedAdmin.name}` : adminName;
    const diff = newQuantity - selectedProduct.stock;
    const movementType = diff > 0 ? "entrada" : "salida";
    adjustStock(selectedProduct.id, newQuantity, authorizedBy, activeBarId, notes);
    toast.success(`Stock de "${selectedProduct.name}" ajustado`, {
      description: `${diff > 0 ? "+" : ""}${diff} ${selectedProduct.unit} (${movementType}) por ${authorizedBy}`,
    });
    setShowStockAdjust(false);
    setVerifiedAdmin(null);
  };

  /** Guardar edición de producto */
  const handleEditProduct = (data: Partial<Product>) => {
    if (!selectedProduct) return;
    updateProduct(selectedProduct.id, data);
    toast.success(`Producto "${selectedProduct.name}" actualizado`, {
      description: "Los cambios han sido guardados",
    });
    setShowEditProduct(false);
  };

  /** Eliminar producto */
  const handleDeleteProduct = (product: Product) => {
    deleteProduct(product.id);
    toast.success(`Producto eliminado`, {
      description: `"${product.name}" ha sido removido del inventario permanentemente.`,
    });
    setShowEditProduct(false);
    setSelectedProduct(null);
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
          className="gap-2 hover:border-amber-500 hover:text-amber-600 min-h-[44px]"
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
              ? "bg-green-500 hover:bg-green-600 shadow-sm hover:shadow-md hover:shadow-green-500/25"
              : "bg-blue-500 hover:bg-blue-600 shadow-sm hover:shadow-md hover:shadow-blue-500/25"
          }`}
        >
          {isAddMode ? "Modo: ENTRADA activo" : "Agregar Inventario"}
        </Button>

        {/* Botón: Recepción por Lotes (solo visible en modo ENTRADA) */}
        {isAddMode && (
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
              onEditProduct={() => setShowEditProduct(true)}
              delay={100}
            />
          )}
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
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors duration-200 ${
                  viewMode === "grid"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors duration-200 ${
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

        {/* Products Grid / List */}
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "flex flex-col gap-2"
          }
        >
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              variant={viewMode === "grid" ? "card" : "list"}
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
            <p className="text-sm text-gray-500">Intenta con otra búsqueda</p>
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
        onAddPackagedProduct={handleScannerAddPackagedProduct}
      />

      {/* Báscula */}
      <ScaleOverlay
        open={scaleOpen}
        onClose={() => setScaleOpen(false)}
        isAddMode={isAddMode}
        products={barProducts.filter((p) => p.isWeightBased)}
        onProductWeighed={handleProductWeighed}
        onAddNewProduct={handleScaleAddNewProduct}
      />

      {/* Modal: Confirmar Peso Detectado Automáticamente (Ctrl+W) */}
      <ScaleConfirmationModal
        open={scaleConfirmOpen}
        onClose={() => {
          setScaleConfirmOpen(false);
          setScaleProduct(null);
          setDetectedWeight(0);
          setVerifiedAdmin(null);
        }}
        product={scaleProduct}
        detectedWeight={detectedWeight}
        barName={activeBar.name}
        isAddMode={isAddMode}
        onConfirm={(weight) => {
          if (!scaleProduct) return;
          const authorizedBy = verifiedAdmin ? `Admin ${verifiedAdmin.name}` : adminName;
          if (isAddMode) {
            recordEntry(
              scaleProduct.id,
              weight,
              authorizedBy,
              activeBarId,
              `Báscula: ${weight} ${scaleProduct.weightUnit || scaleProduct.unit}`
            );
            toast.success(
              `+${weight} ${scaleProduct.weightUnit || scaleProduct.unit} de "${scaleProduct.name}" agregados`,
              {
                description: `Entrada registrada en ${activeBar.name} por ${authorizedBy}`,
              }
            );
          } else {
            recordExit(
              scaleProduct.id,
              weight,
              authorizedBy,
              activeBarId,
              `Báscula: ${weight} ${scaleProduct.weightUnit || scaleProduct.unit}`
            );
            toast.success(
              `-${weight} ${scaleProduct.weightUnit || scaleProduct.unit} de "${scaleProduct.name}" retirados`,
              {
                description: `Salida registrada de ${activeBar.name} por ${authorizedBy}`,
              }
            );
          }
          setScaleConfirmOpen(false);
          setScaleProduct(null);
          setDetectedWeight(0);
          setVerifiedAdmin(null);
        }}
        authorizedBy={verifiedAdmin ? `Admin ${verifiedAdmin.name}` : adminName}
      />

      {/* Modal: Confirmar Entrada (con conversión de cajas si aplica) */}
      <InventoryEntryModal
        open={showEntryConfirm}
        onClose={() => {
          setShowEntryConfirm(false);
          setScannedProduct(null);
          setScannedProductBarcode(undefined);
          setVerifiedAdmin(null);
        }}
        product={scannedProduct}
        barName={activeBar.name}
        onConfirm={handleEntryConfirm}
        authorizedBy={verifiedAdmin ? `Admin ${verifiedAdmin.name}` : adminName}
        productBarcode={scannedProductBarcode}
      />

      {/* Modal: Confirmar Salida */}
      <InventoryExitModal
        open={showExitConfirm}
        onClose={() => {
          setShowExitConfirm(false);
          setScannedProduct(null);
          setScannedProductBarcode(undefined);
          setVerifiedAdmin(null);
        }}
        product={scannedProduct}
        barName={activeBar.name}
        onConfirm={handleExitConfirm}
        authorizedBy={verifiedAdmin ? `Admin ${verifiedAdmin.name}` : adminName}
        productBarcode={scannedProductBarcode}
      />

      {/* Modal: Agregar Producto Individual (nuevo, desde escáner) */}
      <AddProductModal
        open={showAddProduct}
        onClose={() => {
          setShowAddProduct(false);
          setScannedBarcode(undefined);
          setInitialUnitForNewProduct(undefined);
          setInitialQuantityPerBox(undefined);
        }}
        onSave={handleSaveNewProduct}
        barId={activeBarId}
        barName={activeBar.name}
        initialBarcode={scannedBarcode}
        initialUnit={initialUnitForNewProduct}
        initialQuantityPerBox={initialQuantityPerBox}
      />

      {/* Modal: Agregar Producto Empaquetado (caja/paquete con 2 barcodes) */}
      <AddPackagedProductModal
        open={showAddPackagedProduct}
        onClose={() => {
          setShowAddPackagedProduct(false);
          setScannedBarcode(undefined);
          setInitialQuantityPerBox(undefined);
        }}
        onSave={handleSaveNewProduct}
        barId={activeBarId}
        barName={activeBar.name}
        initialBoxBarcode={scannedBarcode}
        initialQuantityPerBox={initialQuantityPerBox}
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
      {selectedProduct && (
        <StockAdjustmentModal
          key={`stock-${selectedProduct.id}`}
          open={showStockAdjust}
          onClose={() => {
            setShowStockAdjust(false);
            setVerifiedAdmin(null);
          }}
          product={selectedProduct}
          onSave={handleStockAdjust}
          workerName={verifiedAdmin ? `Admin ${verifiedAdmin.name}` : adminName}
        />
      )}

      {/* Modal: Editar Producto */}
      {selectedProduct && (
        <ProductFormModal
          key={`edit-${selectedProduct.id}`}
          open={showEditProduct}
          onClose={() => setShowEditProduct(false)}
          product={selectedProduct}
          onSave={handleEditProduct}
          onDelete={handleDeleteProduct}
        />
      )}

      {/* Modal: Barcode desconocido (3 opciones: producto individual, producto empaquetado, o agregar a existente) */}
      <UnknownBarcodeModal
        open={showUnknownBarcode}
        onClose={() => {
          setShowUnknownBarcode(false);
          setScannedBarcode(undefined);
        }}
        barcode={scannedBarcode || ""}
        onRegisterIndividualProduct={handleRegisterIndividualProduct}
        onRegisterPackagedProduct={handleRegisterPackagedProduct}
        onAddToExistingProduct={handleAddToExistingProduct}
      />

      {/* Modal: Asociar barcode a producto existente */}
      <AddBarcodeToProductModal
        open={showAddBarcodeToProduct}
        onClose={() => {
          setShowAddBarcodeToProduct(false);
          setScannedBarcode(undefined);
        }}
        barcode={scannedBarcode || ""}
        products={barProducts}
        onSave={handleSaveNewBarcode}
      />

      {/* Sheet: Recepción por Lotes */}
      <BatchReceptionSheet
        open={showBatchReception}
        onClose={() => {
          setShowBatchReception(false);
          setVerifiedAdmin(null);
        }}
        barId={activeBarId}
        barName={activeBar.name}
        adminName={verifiedAdmin ? `Admin ${verifiedAdmin.name}` : adminName}
        products={barProducts}
        productBarcodes={productBarcodes}
        onSessionConfirmed={handleSessionConfirmed}
      />

      {/* Modal: Verificación de PIN para Administrador */}
      <AdminPinVerificationModal
        open={pinModalOpen}
        onClose={() => {
          setPinModalOpen(false);
          setPinAction(null);
          setScannedProduct(null);
          setScannedProductBarcode(undefined);
        }}
        onVerified={handlePinVerified}
        verifyAdminPin={verifyAdminPin}
      />
    </div>
  );
}
