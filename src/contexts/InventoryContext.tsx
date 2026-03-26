import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getProductStatus } from '@/data/mockData';
import {
  products as seedProducts,
  productBarcodes as seedBarcodes,
  inventoryMovements as seedMovements,
} from '@/data/mockData';
import type { Product, ProductBarcode, InventoryMovement, ReceptionSession, CreateBulkProductData } from '@/types';
import { getLocalIsoDateString } from '@/lib/dates';
import type { CreateProductData } from '@/components/admin/AddProductModal';
import type { CreateBarcodeData } from '@/components/shared/AddBarcodeToProductModal';

// ── localStorage keys ────────────────────────────────────────
const KEYS = {
  products: 'inv_products',
  barcodes: 'inv_barcodes',
  movements: 'inv_movements',
  init: 'inv_initialized',
} as const;

// ── Helpers de persistencia ──────────────────────────────────
function genId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadProducts(): Product[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEYS.products) || '[]') as Omit<Product, 'status'>[];
    return raw.map(p => ({ ...p, status: getProductStatus(p.stock, p.minStock) }));
  } catch { return []; }
}

function saveProducts(products: Product[]) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const raw = products.map(({ status, ...rest }) => rest);
  localStorage.setItem(KEYS.products, JSON.stringify(raw));
}

function loadBarcodes(): ProductBarcode[] {
  try { return JSON.parse(localStorage.getItem(KEYS.barcodes) || '[]'); }
  catch { return []; }
}

function saveBarcodes(barcodes: ProductBarcode[]) {
  localStorage.setItem(KEYS.barcodes, JSON.stringify(barcodes));
}

function loadMovements(): InventoryMovement[] {
  try { return JSON.parse(localStorage.getItem(KEYS.movements) || '[]'); }
  catch { return []; }
}

function saveMovements(movements: InventoryMovement[]) {
  localStorage.setItem(KEYS.movements, JSON.stringify(movements));
}

// ── Context type ─────────────────────────────────────────────
interface InventoryContextType {
  products: Product[];
  productBarcodes: ProductBarcode[];
  inventoryMovements: InventoryMovement[];

  addProduct: (data: CreateProductData) => Product;
  addBulkProduct: (data: CreateBulkProductData) => Product;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  addProductBarcode: (data: CreateBarcodeData) => ProductBarcode;

  recordEntry: (productId: string, quantity: number, workerName: string, barId: string, notes?: string) => void;
  recordExit: (productId: string, quantity: number, workerName: string, barId: string, notes?: string) => void;
  adjustStock: (productId: string, newQuantity: number, workerName: string, barId: string, notes?: string) => void;
  confirmBatchReception: (session: ReceptionSession, workerName: string) => void;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

// ── Provider ─────────────────────────────────────────────────
export function InventoryProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productBarcodes, setProductBarcodes] = useState<ProductBarcode[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);

  // Seed from mock data on first run; load from localStorage on subsequent runs
  useEffect(() => {
    const isInit = localStorage.getItem(KEYS.init);
    if (!isInit) {
      saveProducts(seedProducts);
      saveBarcodes(seedBarcodes);
      saveMovements(seedMovements);
      localStorage.setItem(KEYS.init, 'true');
    }
    setProducts(loadProducts());
    setProductBarcodes(loadBarcodes());
    setInventoryMovements(loadMovements());
  }, []);

  // ── Product mutations ────────────────────────────────────
  const addProduct = useCallback((data: CreateProductData): Product => {
    const id = genId('p');

    // CRÍTICO: Si es una caja, convertir el stock de cajas a unidades individuales
    // Ejemplo: 10 cajas de 24 piezas = 240 unidades individuales
    const finalStock = data.isBoxBarcode && data.quantityPerBox
      ? data.stock * data.quantityPerBox
      : data.stock;

    const newProduct: Product = {
      id,
      sku: data.sku,
      name: data.name,
      category: data.category,
      subcategory: data.subcategory,
      supplier: data.supplier,
      stock: finalStock,  // Stock en unidades individuales
      minStock: data.minStock,
      maxStock: data.maxStock,
      unit: data.unit,
      price: data.price,
      lastPurchase: getLocalIsoDateString(),
      barId: data.barId,
      barcode: data.barcode || undefined,
      image: data.image || undefined,
      isWeightBased: data.isWeightBased,
      weightUnit: data.isWeightBased ? data.weightUnit : undefined,
      status: getProductStatus(finalStock, data.minStock),
    };

    setProducts(prev => {
      const next = [...prev, newProduct];
      saveProducts(next);
      return next;
    });

    // Auto-create default barcode(s) si el producto detectó uno
    if (data.barcode) {
      if (data.isBoxBarcode) {
        // 1. Código principal: pertenece a la CAJA
        const boxBarcode: ProductBarcode = {
          id: genId('pb'),
          productId: id,
          barcode: data.barcode,
          quantityPerScan: data.quantityPerBox || 1,
          label: `Caja/Paquete de ${data.quantityPerBox || 1}`,
          isDefault: true,
          createdAt: new Date().toISOString(),
        };

        const barcodesToCreate: ProductBarcode[] = [boxBarcode];

        // 2. Código secundario: pertenece a la PIEZA (SOLO si existe)
        if (data.individualBarcode && data.individualBarcode.trim()) {
          const individualBarcode: ProductBarcode = {
            id: genId('pb_ind'),
            productId: id,
            barcode: data.individualBarcode.trim(),
            quantityPerScan: 1,
            label: 'Individual',
            isDefault: false, // La caja queda como principal
            createdAt: new Date().toISOString(),
          };
          barcodesToCreate.push(individualBarcode);
        }

        setProductBarcodes(prev => {
          const next = [...prev, ...barcodesToCreate];
          saveBarcodes(next);
          return next;
        });
      } else {
        // Flujo tradicional: escanearon una botella suelta
        const pb: ProductBarcode = {
          id: genId('pb'),
          productId: id,
          barcode: data.barcode,
          quantityPerScan: 1,
          label: 'Individual',
          isDefault: true,
          createdAt: new Date().toISOString(),
        };
        setProductBarcodes(prev => {
          const next = [...prev, pb];
          saveBarcodes(next);
          return next;
        });
      }
    }

    // Emitir el movimiento de entrada en historial (ingreso inicial) si el stock > 0
    if (finalStock > 0) {
      const initialMovement: InventoryMovement = {
        id: genId('mov'),
        productId: id,
        productName: data.name,
        type: 'in',
        barId: data.barId,
        workerId: 'admin', // Hardcoded fallback for auto-creation
        workerName: 'Administrador (Alta)',
        previousQuantity: 0,
        newQuantity: finalStock,
        quantity: finalStock,
        unit: data.unit,
        timestamp: new Date().toISOString(),
        notes: data.isBoxBarcode
          ? `Ingreso inicial: ${data.stock} caja(s) × ${data.quantityPerBox} piezas = ${finalStock} unidades`
          : `Ingreso inicial de stock automático`,
      };
      setInventoryMovements(prevM => {
        const next = [initialMovement, ...prevM];
        saveMovements(next);
        return next;
      });
    }

    return newProduct;
  }, []);

  const addBulkProduct = useCallback((data: CreateBulkProductData): Product => {
    const id = genId('p');
    const newProduct: Product = {
      id,
      sku: data.sku,
      name: data.name,
      category: data.category,
      subcategory: data.subcategory,
      supplier: data.supplier,
      stock: data.stock,
      minStock: data.minStock,
      maxStock: data.maxStock,
      unit: data.weightUnit,
      price: data.price,
      lastPurchase: getLocalIsoDateString(),
      barId: data.barId,
      isWeightBased: true,
      weightUnit: data.weightUnit,
      status: getProductStatus(data.stock, data.minStock),
    };

    setProducts(prev => {
      const next = [...prev, newProduct];
      saveProducts(next);
      return next;
    });

    return newProduct;
  }, []);

  const updateProduct = useCallback((productId: string, updates: Partial<Product>) => {
    setProducts(prev => {
      const next = prev.map(p => {
        if (p.id !== productId) return p;
        const updated = { ...p, ...updates, id: p.id };
        updated.status = getProductStatus(updated.stock, updated.minStock);
        return updated;
      });
      saveProducts(next);
      return next;
    });
  }, []);

  const deleteProduct = useCallback((productId: string) => {
    setProducts(prev => {
      const next = prev.filter(p => p.id !== productId);
      saveProducts(next);
      return next;
    });
  }, []);

  // ── Barcode mutations ────────────────────────────────────
  const addProductBarcode = useCallback((data: CreateBarcodeData): ProductBarcode => {
    const pb: ProductBarcode = {
      id: genId('pb'),
      productId: data.productId,
      barcode: data.barcode,
      quantityPerScan: data.quantityPerScan,
      label: data.label,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    setProductBarcodes(prev => {
      const next = [...prev, pb];
      saveBarcodes(next);
      return next;
    });

    return pb;
  }, []);

  // ── Stock mutations ──────────────────────────────────────
  const createMovement = useCallback((
    product: Product,
    type: 'in' | 'out',
    quantity: number,
    workerName: string,
    barId: string,
    newStock: number,
    notes?: string,
  ): InventoryMovement => {
    return {
      id: genId('m'),
      barId,
      productId: product.id,
      productName: product.name,
      workerId: '',
      workerName,
      type,
      previousQuantity: product.stock,
      newQuantity: newStock,
      quantity,
      unit: product.unit,
      timestamp: new Date().toISOString(),
      notes,
    };
  }, []);

  const recordEntry = useCallback((
    productId: string, quantity: number, workerName: string, barId: string, notes?: string,
  ) => {
    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === productId);
      if (idx === -1) return prev;
      const product = prev[idx];
      const newStock = product.stock + quantity;
      const updated = { ...product, stock: newStock, status: getProductStatus(newStock, product.minStock) };

      const movement = createMovement(product, 'in', quantity, workerName, barId, newStock, notes);
      setInventoryMovements(prevM => {
        const next = [movement, ...prevM];
        saveMovements(next);
        return next;
      });

      const next = [...prev];
      next[idx] = updated;
      saveProducts(next);
      return next;
    });
  }, [createMovement]);

  const recordExit = useCallback((
    productId: string, quantity: number, workerName: string, barId: string, notes?: string,
  ) => {
    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === productId);
      if (idx === -1) return prev;
      const product = prev[idx];
      const newStock = Math.max(0, product.stock - quantity);
      const updated = { ...product, stock: newStock, status: getProductStatus(newStock, product.minStock) };

      const movement = createMovement(product, 'out', quantity, workerName, barId, newStock, notes);
      setInventoryMovements(prevM => {
        const next = [movement, ...prevM];
        saveMovements(next);
        return next;
      });

      const next = [...prev];
      next[idx] = updated;
      saveProducts(next);
      return next;
    });
  }, [createMovement]);

  const adjustStock = useCallback((
    productId: string, newQuantity: number, workerName: string, barId: string, notes?: string,
  ) => {
    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === productId);
      if (idx === -1) return prev;
      const product = prev[idx];
      const diff = newQuantity - product.stock;
      const type = diff > 0 ? 'in' : 'out';
      const updated = { ...product, stock: newQuantity, status: getProductStatus(newQuantity, product.minStock) };

      const movement = createMovement(product, type as 'in' | 'out', Math.abs(diff), workerName, barId, newQuantity, notes);
      setInventoryMovements(prevM => {
        const next = [movement, ...prevM];
        saveMovements(next);
        return next;
      });

      const next = [...prev];
      next[idx] = updated;
      saveProducts(next);
      return next;
    });
  }, [createMovement]);

  const confirmBatchReception = useCallback((session: ReceptionSession, workerName: string) => {
    setProducts(prev => {
      const next = [...prev];
      const newMovements: InventoryMovement[] = [];

      for (const item of session.items) {
        const idx = next.findIndex(p => p.id === item.productId);
        if (idx === -1) continue;
        const product = next[idx];
        const newStock = product.stock + item.totalIndividualQty;
        const movement = createMovement(product, 'in', item.totalIndividualQty, workerName, session.barId, newStock, session.notes);
        newMovements.push(movement);
        next[idx] = { ...product, stock: newStock, status: getProductStatus(newStock, product.minStock) };
      }

      setInventoryMovements(prevM => {
        const updated = [...newMovements, ...prevM];
        saveMovements(updated);
        return updated;
      });

      saveProducts(next);
      return next;
    });
  }, [createMovement]);

  return (
    <InventoryContext.Provider value={{
      products,
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
    }}>
      {children}
    </InventoryContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────
export function useInventory(): InventoryContextType {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
}
