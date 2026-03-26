import { useState, useCallback, useMemo } from 'react';
import { lookupBarcode } from '@/lib/barcodeLookup';
import type { Product, ProductBarcode, ReceptionSession, ReceptionItem } from '@/types';
import type { CreateProductData } from '@/components/admin/AddProductModal';

/**
 * Resultado de procesar un escaneo de barcode dentro de una sesión de recepción.
 *
 * - 'added'     → barcode nuevo agregado a la lista (o scanCount incrementado)
 * - 'not_found' → barcode no existe en productBarcodes ni en Product.barcode
 */
export type ScanResult = 'added' | 'not_found';

/**
 * Interfaz pública del hook de recepción por lotes.
 *
 * Sigue el patrón de useBarManagement: estado local + métodos CRUD.
 *
 * Backend (cuando se integre):
 *   - startSession   → POST /api/reception-sessions { barId, adminName }
 *   - confirmSession → PUT  /api/reception-sessions/:id/confirm { notes? }
 *                      El backend crea N InventoryMovement (type: 'in') y actualiza stocks.
 *   - cancelSession  → PUT  /api/reception-sessions/:id/cancel
 *
 * El hook NO hace llamadas al backend. Solo gestiona estado local.
 * El componente padre (BatchReceptionSheet / InventorySection) se encarga
 * de orquestar las llamadas al backend cuando sea necesario.
 */
export interface UseInventoryReceptionReturn {
  /** Sesión activa (null si no hay sesión abierta) */
  session: ReceptionSession | null;
  /** Shorthand: session !== null && session.status === 'open' */
  isSessionActive: boolean;
  /** Items de la sesión activa (vacío si no hay sesión) */
  items: ReceptionItem[];
  /** Suma de totalIndividualQty de todos los items */
  totalUnits: number;
  /** Cantidad de productos distintos en la sesión */
  distinctProducts: number;

  /** Inicia una nueva sesión de recepción */
  startSession: (barId: string, adminName: string) => void;
  /** Cancela la sesión activa (status → 'cancelled') */
  cancelSession: () => void;
  /**
   * Procesa un barcode escaneado.
   * - Si el barcode ya fue escaneado, incrementa su scanCount.
   * - Si es nuevo (pero existe en el catálogo), agrega un ReceptionItem.
   * - Si no existe en el catálogo, retorna 'not_found'.
   */
  processBarcodeScan: (
    barcode: string,
    products: Product[],
    productBarcodes: ProductBarcode[],
  ) => ScanResult;
  /**
   * Agrega un item pesado en báscula (producto a granel).
   * Si el producto ya tiene un item de báscula, suma el peso.
   */
  addWeighedItem: (product: Product, weight: number) => void;
  /**
   * Agrega un item directamente (sin lookup).
   * Útil para agregar un producto recién registrado a la sesión de recepción.
   */
  addScannedItem: (product: Product, productBarcode: ProductBarcode) => void;
  /** Actualiza la cantidad de escaneos de un item (mínimo 1) */
  updateItemScanCount: (itemId: string, newCount: number) => void;
  /** Elimina un item de la sesión */
  removeItem: (itemId: string) => void;
  /**
   * Confirma la sesión y retorna la sesión completa para que el parent
   * haga POST al backend. Status → 'confirmed', confirmedAt → now.
   */
  confirmSession: (notes?: string) => ReceptionSession;
  
  /** Productos en borrador que se van a crear junto a la sesión */
  draftProducts: CreateProductData[];
  /** Agrega un producto en borrador a la sesión y lo suma a la lista visual */
  addDraftProduct: (data: CreateProductData) => void;
}

export function useInventoryReception(): UseInventoryReceptionReturn {
  const [session, setSession] = useState<ReceptionSession | null>(null);
  const [items, setItems] = useState<ReceptionItem[]>([]);
  const [draftProducts, setDraftProducts] = useState<CreateProductData[]>([]);

  const isSessionActive = session !== null && session.status === 'open';

  const totalUnits = useMemo(
    () => items.reduce((sum, item) => sum + item.totalIndividualQty, 0),
    [items],
  );

  const distinctProducts = useMemo(
    () => new Set(items.map(i => i.productId)).size,
    [items],
  );

  // --- Session lifecycle ---

  const startSession = useCallback((barId: string, adminName: string) => {
    const newSession: ReceptionSession = {
      id: `rs-${Date.now()}`,
      barId,
      adminName,
      status: 'open',
      startedAt: new Date().toISOString(),
      items: [],
    };
    setSession(newSession);
    setItems([]);
    setDraftProducts([]);
  }, []);

  const cancelSession = useCallback(() => {
    setSession(prev => prev ? { ...prev, status: 'cancelled' } : null);
    setItems([]);
    setDraftProducts([]);
    setSession(null);
  }, []);

  const confirmSession = useCallback((notes?: string): ReceptionSession => {
    const confirmedSession: ReceptionSession = {
      ...session!,
      status: 'confirmed',
      confirmedAt: new Date().toISOString(),
      notes,
      items: [...items],
    };
    setSession(null);
    setItems([]);
    // Conservamos los draftProducts para que el parent los lea al confirmar
    return confirmedSession;
  }, [session, items]);

  // --- Item management ---

  const processBarcodeScan = useCallback((
    barcode: string,
    products: Product[],
    productBarcodes: ProductBarcode[],
  ): ScanResult => {
    const result = lookupBarcode(barcode, products, productBarcodes);
    if (!result) return 'not_found';

    const { product, productBarcode } = result;

    setItems(prev => {
      // Si ya existe un item con el mismo productBarcodeId, incrementar scanCount
      const existingIndex = prev.findIndex(
        item => item.productBarcodeId === productBarcode.id && !item.isWeightBased,
      );

      if (existingIndex >= 0) {
        return prev.map((item, i) => {
          if (i !== existingIndex) return item;
          const newScanCount = item.scanCount + 1;
          return {
            ...item,
            scanCount: newScanCount,
            totalIndividualQty: newScanCount * item.quantityPerScan,
          };
        });
      }

      // Nuevo item
      const newItem: ReceptionItem = {
        id: `ri-${Date.now()}-${prev.length}`,
        productId: product.id,
        productName: product.name,
        productBarcodeId: productBarcode.id,
        barcodeLabel: productBarcode.label,
        scanCount: 1,
        quantityPerScan: productBarcode.quantityPerScan,
        totalIndividualQty: productBarcode.quantityPerScan,
        unit: product.isWeightBased ? (product.weightUnit || product.unit) : product.unit,
        isWeightBased: false,
      };
      return [...prev, newItem];
    });

    return 'added';
  }, []);

  const addWeighedItem = useCallback((product: Product, weight: number) => {
    setItems(prev => {
      // Si ya existe un item de báscula para este producto, sumar peso
      const existingIndex = prev.findIndex(
        item => item.productId === product.id && item.isWeightBased,
      );

      if (existingIndex >= 0) {
        return prev.map((item, i) => {
          if (i !== existingIndex) return item;
          const newWeight = Number(((item.weight || 0) + weight).toFixed(2));
          return {
            ...item,
            weight: newWeight,
            totalIndividualQty: newWeight,
            scanCount: item.scanCount + 1,
          };
        });
      }

      const newItem: ReceptionItem = {
        id: `ri-${Date.now()}-w`,
        productId: product.id,
        productName: product.name,
        scanCount: 1,
        quantityPerScan: 1,
        totalIndividualQty: weight,
        unit: product.weightUnit || product.unit,
        isWeightBased: true,
        weight,
      };
      return [...prev, newItem];
    });
  }, []);

  const addScannedItem = useCallback((product: Product, productBarcode: ProductBarcode) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(
        item => item.productBarcodeId === productBarcode.id && !item.isWeightBased,
      );

      if (existingIndex >= 0) {
        return prev.map((item, i) => {
          if (i !== existingIndex) return item;
          const newScanCount = item.scanCount + 1;
          return {
            ...item,
            scanCount: newScanCount,
            totalIndividualQty: newScanCount * item.quantityPerScan,
          };
        });
      }

      const newItem: ReceptionItem = {
        id: `ri-${Date.now()}-${prev.length}`,
        productId: product.id,
        productName: product.name,
        productBarcodeId: productBarcode.id,
        barcodeLabel: productBarcode.label,
        scanCount: 1,
        quantityPerScan: productBarcode.quantityPerScan,
        totalIndividualQty: productBarcode.quantityPerScan,
        unit: product.isWeightBased ? (product.weightUnit || product.unit) : product.unit,
        isWeightBased: false,
      };
      return [...prev, newItem];
    });
  }, []);

  const updateItemScanCount = useCallback((itemId: string, newCount: number) => {
    const safeCount = Math.max(1, newCount);
    setItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item;
        if (item.isWeightBased) return item;
        return {
          ...item,
          scanCount: safeCount,
          totalIndividualQty: safeCount * item.quantityPerScan,
        };
      }),
    );
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    // Opcionalmente: si el productBarcodeId coincide con el código de un draft, 
    // podríamos quitarlo de draftProducts, pero se requiere lógica adicional.
  }, []);

  const addDraftProduct = useCallback((data: CreateProductData) => {
    setDraftProducts(prev => [...prev, data]);
    
    // Crear un ReceptionItem temporal (fake ID y barcodeId)
    setItems(prev => [
      ...prev,
      {
        id: `ri-draft-${Date.now()}`,
        productId: `draft-prod-${Date.now()}`,
        productName: data.name,
        productBarcodeId: `draft-barcode-${Date.now()}`,
        barcodeLabel: data.isBoxBarcode ? `Caja de ${data.quantityPerBox}` : 'Individual',
        scanCount: 1,
        quantityPerScan: data.isBoxBarcode ? (data.quantityPerBox || 1) : 1,
        totalIndividualQty: data.isBoxBarcode ? (data.quantityPerBox || 1) : Math.max(1, data.stock || 1),
        unit: data.unit,
        isWeightBased: data.isWeightBased,
        weight: data.isWeightBased ? data.stock : undefined,
      }
    ]);
  }, []);

  return {
    session,
    isSessionActive,
    items,
    totalUnits,
    distinctProducts,
    startSession,
    cancelSession,
    processBarcodeScan,
    addWeighedItem,
    addScannedItem,
    updateItemScanCount,
    removeItem,
    confirmSession,
    draftProducts,
    addDraftProduct,
  };
}
