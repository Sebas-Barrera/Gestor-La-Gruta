import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import * as productsApi from '@/lib/api/products';
import * as inventoryApi from '@/lib/api/inventory';
import type {
  Product,
  ProductBarcode,
  InventoryMovement,
  ReceptionSession,
  CreateBulkProductData,
} from '@/types';
import type { CreateProductData } from '@/components/admin/AddProductModal';
import type { CreateBarcodeData } from '@/components/shared/AddBarcodeToProductModal';

// ── Context type ──────────────────────────────────────────────

interface InventoryContextType {
  products: Product[];
  productBarcodes: ProductBarcode[];
  inventoryMovements: InventoryMovement[];
  loading: boolean;

  addProduct: (data: CreateProductData) => Promise<Product>;
  addBulkProduct: (data: CreateBulkProductData) => Promise<Product>;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  addProductBarcode: (data: CreateBarcodeData) => Promise<ProductBarcode>;

  recordEntry: (
    productId: string,
    quantity: number,
    workerName: string,
    barId: string,
    notes?: string,
  ) => Promise<void>;
  recordExit: (
    productId: string,
    quantity: number,
    workerName: string,
    barId: string,
    notes?: string,
  ) => Promise<void>;
  adjustStock: (
    productId: string,
    newQuantity: number,
    workerName: string,
    barId: string,
    notes?: string,
  ) => Promise<void>;
  confirmBatchReception: (
    session: ReceptionSession,
    workerName: string,
  ) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productBarcodes, setProductBarcodes] = useState<ProductBarcode[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all inventory data from Supabase on mount
  useEffect(() => {
    async function load() {
      try {
        const [prods, barcodes] = await Promise.all([
          productsApi.getAllProducts(),
          productsApi.getAllBarcodes(),
        ]);
        setProducts(prods);
        setProductBarcodes(barcodes);
      } catch (err) {
        console.error('[InventoryContext] Failed to load inventory:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Product mutations ─────────────────────────────────────

  const addProduct = useCallback(async (data: CreateProductData): Promise<Product> => {
    const newProduct = await productsApi.addProduct(data);
    setProducts(prev => [...prev, newProduct]);

    // Sync barcodes that were auto-created
    if (data.barcode) {
      const barcodes = await productsApi.getProductBarcodes(newProduct.id);
      setProductBarcodes(prev => [...prev, ...barcodes]);
    }

    return newProduct;
  }, []);

  const addBulkProduct = useCallback(
    async (data: CreateBulkProductData): Promise<Product> => {
      const newProduct = await productsApi.addBulkProduct(data);
      setProducts(prev => [...prev, newProduct]);
      return newProduct;
    },
    [],
  );

  const updateProduct = useCallback(
    async (productId: string, updates: Partial<Product>): Promise<void> => {
      await productsApi.updateProduct(productId, updates);
      setProducts(prev =>
        prev.map(p => {
          if (p.id !== productId) return p;
          const updated = { ...p, ...updates };
          updated.status = productsApi.computeStatus(updated.stock, updated.minStock);
          return updated;
        }),
      );
    },
    [],
  );

  const deleteProduct = useCallback(async (productId: string): Promise<void> => {
    await productsApi.deleteProduct(productId);
    // Soft delete — remove from local state
    setProducts(prev => prev.filter(p => p.id !== productId));
  }, []);

  // ── Barcode mutations ─────────────────────────────────────

  const addProductBarcode = useCallback(
    async (data: CreateBarcodeData): Promise<ProductBarcode> => {
      const pb = await productsApi.addProductBarcode(data);
      setProductBarcodes(prev => [...prev, pb]);
      return pb;
    },
    [],
  );

  // ── Stock mutations ───────────────────────────────────────

  const recordEntry = useCallback(
    async (
      productId: string,
      quantity: number,
      workerName: string,
      barId: string,
      notes?: string,
    ): Promise<void> => {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const { newStock, movement } = await inventoryApi.recordEntry(
        productId,
        quantity,
        workerName,
        barId,
        product.name,
        product.stock,
        product.unit,
        notes,
      );

      setProducts(prev =>
        prev.map(p =>
          p.id === productId
            ? { ...p, stock: newStock, status: productsApi.computeStatus(newStock, p.minStock) }
            : p,
        ),
      );
      setInventoryMovements(prev => [movement, ...prev]);
    },
    [products],
  );

  const recordExit = useCallback(
    async (
      productId: string,
      quantity: number,
      workerName: string,
      barId: string,
      notes?: string,
    ): Promise<void> => {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const { newStock, movement } = await inventoryApi.recordExit(
        productId,
        quantity,
        workerName,
        barId,
        product.name,
        product.stock,
        product.unit,
        notes,
      );

      setProducts(prev =>
        prev.map(p =>
          p.id === productId
            ? { ...p, stock: newStock, status: productsApi.computeStatus(newStock, p.minStock) }
            : p,
        ),
      );
      setInventoryMovements(prev => [movement, ...prev]);
    },
    [products],
  );

  const adjustStock = useCallback(
    async (
      productId: string,
      newQuantity: number,
      workerName: string,
      barId: string,
      notes?: string,
    ): Promise<void> => {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const { newStock, movement } = await inventoryApi.adjustStock(
        productId,
        newQuantity,
        workerName,
        barId,
        product.name,
        product.stock,
        product.unit,
        notes,
      );

      setProducts(prev =>
        prev.map(p =>
          p.id === productId
            ? { ...p, stock: newStock, status: productsApi.computeStatus(newStock, p.minStock) }
            : p,
        ),
      );
      setInventoryMovements(prev => [movement, ...prev]);
    },
    [products],
  );

  const confirmBatchReception = useCallback(
    async (session: ReceptionSession, workerName: string): Promise<void> => {
      const movements = await inventoryApi.confirmBatchReception(session, workerName);

      // Update local state — accumulate stock for same product appearing multiple times
      setProducts(prev => {
        const next = [...prev];
        for (const item of session.items) {
          const idx = next.findIndex(p => p.id === item.productId);
          if (idx === -1) continue;
          const newStock = next[idx].stock + item.totalIndividualQty;
          next[idx] = {
            ...next[idx],
            stock: newStock,
            status: productsApi.computeStatus(newStock, next[idx].minStock),
          };
        }
        return next;
      });

      if (movements.length > 0) {
        setInventoryMovements(prev => [...movements, ...prev]);
      }
    },
    [],
  );

  return (
    <InventoryContext.Provider
      value={{
        products,
        productBarcodes,
        inventoryMovements,
        loading,
        addProduct,
        addBulkProduct,
        updateProduct,
        deleteProduct,
        addProductBarcode,
        recordEntry,
        recordExit,
        adjustStock,
        confirmBatchReception,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────

export function useInventory(): InventoryContextType {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
}
