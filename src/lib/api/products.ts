import { supabase } from '@/lib/supabase';
import type { Product, ProductBarcode, CreateBulkProductData } from '@/types';
import type { CreateProductData } from '@/components/admin/AddProductModal';
import type { CreateBarcodeData } from '@/components/shared/AddBarcodeToProductModal';
import { getLocalIsoDateString } from '@/lib/dates';

// ── Helpers ───────────────────────────────────────────────────

export function computeStatus(
  stock: number,
  minStock: number,
): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= minStock) return 'low_stock';
  return 'in_stock';
}

function mapProduct(row: Record<string, unknown>): Product {
  const stock = Number(row.stock);
  const minStock = Number(row.min_stock);
  return {
    id: row.id as string,
    sku: row.sku as string,
    barId: row.bar_id as string,
    name: row.name as string,
    category: row.category as string,
    subcategory: row.subcategory as string,
    supplier: (row.supplier as string) ?? '',
    stock,
    minStock,
    maxStock: Number(row.max_stock),
    unit: row.unit as string,
    price: Number(row.price),
    lastPurchase: (row.last_purchase as string) ?? '',
    image: (row.image as string) ?? undefined,
    isWeightBased: row.is_weight_based as boolean,
    weightUnit: (row.weight_unit as Product['weightUnit']) ?? undefined,
    status:
      (row.status as Product['status']) ?? computeStatus(stock, minStock),
  };
}

function mapBarcode(row: Record<string, unknown>): ProductBarcode {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    barcode: row.barcode as string,
    quantityPerScan: row.quantity_per_scan as number,
    label: (row.label as string) ?? undefined,
    isDefault: row.is_default as boolean,
    createdAt: row.created_at as string,
  };
}

// ── Queries ───────────────────────────────────────────────────

/** Load ALL active products (used by InventoryContext on mount). */
export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products_with_status')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return (data ?? []).map(r => mapProduct(r as Record<string, unknown>));
}

/** Load ALL barcodes (used by InventoryContext on mount). */
export async function getAllBarcodes(): Promise<ProductBarcode[]> {
  const { data, error } = await supabase
    .from('product_barcodes')
    .select('*');
  if (error) throw error;
  return (data ?? []).map(r => mapBarcode(r as Record<string, unknown>));
}

/** Load barcodes for a specific product. */
export async function getProductBarcodes(productId: string): Promise<ProductBarcode[]> {
  const { data, error } = await supabase
    .from('product_barcodes')
    .select('*')
    .eq('product_id', productId)
    .order('is_default', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(r => mapBarcode(r as Record<string, unknown>));
}

/** Find product by barcode scan. */
export async function lookupBarcode(
  barcode: string,
): Promise<{ barcode: ProductBarcode; product: Product } | null> {
  const { data, error } = await supabase
    .from('product_barcodes')
    .select('*, products(*)')
    .eq('barcode', barcode)
    .single();

  if (error || !data) return null;

  // Get status from the view
  const { data: withStatus } = await supabase
    .from('products_with_status')
    .select('*')
    .eq('id', (data.products as Record<string, unknown>).id)
    .single();

  const product = mapProduct(
    (withStatus ?? data.products) as Record<string, unknown>,
  );
  return { barcode: mapBarcode(data as Record<string, unknown>), product };
}

// ── Mutations ─────────────────────────────────────────────────

export async function addProduct(data: CreateProductData): Promise<Product> {
  // CRÍTICO: convertir cajas a unidades individuales antes de guardar
  const finalStock =
    data.isBoxBarcode && data.quantityPerBox
      ? data.stock * data.quantityPerBox
      : data.stock;

  const { data: row, error } = await supabase
    .from('products')
    .insert({
      sku: data.sku,
      bar_id: data.barId,
      name: data.name,
      category: data.category,
      subcategory: data.subcategory,
      supplier: data.supplier,
      stock: finalStock,
      min_stock: data.minStock,
      max_stock: data.maxStock,
      unit: data.unit,
      price: data.price,
      last_purchase: getLocalIsoDateString(),
      image: data.image ?? null,
      is_weight_based: data.isWeightBased ?? false,
      weight_unit: data.isWeightBased ? (data.weightUnit ?? null) : null,
    })
    .select()
    .single();
  if (error) throw error;

  // Auto-crear barcodes
  if (data.barcode) {
    const barcodesToInsert: Record<string, unknown>[] = [];

    if (data.isBoxBarcode) {
      barcodesToInsert.push({
        product_id: row.id,
        barcode: data.barcode,
        quantity_per_scan: data.quantityPerBox ?? 1,
        label: `Caja/Paquete de ${data.quantityPerBox ?? 1}`,
        is_default: true,
      });
      if (data.individualBarcode?.trim()) {
        barcodesToInsert.push({
          product_id: row.id,
          barcode: data.individualBarcode.trim(),
          quantity_per_scan: 1,
          label: 'Individual',
          is_default: false,
        });
      }
    } else {
      barcodesToInsert.push({
        product_id: row.id,
        barcode: data.barcode,
        quantity_per_scan: 1,
        label: 'Individual',
        is_default: true,
      });
    }

    const { error: bcErr } = await supabase
      .from('product_barcodes')
      .insert(barcodesToInsert);
    if (bcErr) throw bcErr;
  }

  return {
    id: row.id,
    sku: row.sku,
    barId: row.bar_id,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory,
    supplier: row.supplier ?? '',
    stock: finalStock,
    minStock: data.minStock,
    maxStock: data.maxStock,
    unit: row.unit,
    price: Number(row.price),
    lastPurchase: row.last_purchase ?? '',
    image: row.image ?? undefined,
    barcode: data.barcode ?? undefined,
    isWeightBased: row.is_weight_based,
    weightUnit: data.isWeightBased ? data.weightUnit : undefined,
    status: computeStatus(finalStock, data.minStock),
  };
}

export async function addBulkProduct(
  data: CreateBulkProductData,
): Promise<Product> {
  const { data: row, error } = await supabase
    .from('products')
    .insert({
      sku: data.sku,
      bar_id: data.barId,
      name: data.name,
      category: data.category,
      subcategory: data.subcategory,
      supplier: data.supplier,
      stock: data.stock,
      min_stock: data.minStock,
      max_stock: data.maxStock,
      unit: data.weightUnit,
      price: data.price,
      last_purchase: getLocalIsoDateString(),
      image: data.image ?? null,
      is_weight_based: true,
      weight_unit: data.weightUnit,
    })
    .select()
    .single();
  if (error) throw error;

  return {
    id: row.id,
    sku: row.sku,
    barId: row.bar_id,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory,
    supplier: row.supplier ?? '',
    stock: data.stock,
    minStock: data.minStock,
    maxStock: data.maxStock,
    unit: data.weightUnit,
    price: Number(row.price),
    lastPurchase: row.last_purchase ?? '',
    image: data.image ?? undefined,
    isWeightBased: true,
    weightUnit: data.weightUnit,
    status: computeStatus(data.stock, data.minStock),
  };
}

export async function updateProduct(
  productId: string,
  updates: Partial<Product>,
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.category !== undefined) patch.category = updates.category;
  if (updates.subcategory !== undefined) patch.subcategory = updates.subcategory;
  if (updates.supplier !== undefined) patch.supplier = updates.supplier;
  if (updates.stock !== undefined) patch.stock = updates.stock;
  if (updates.minStock !== undefined) patch.min_stock = updates.minStock;
  if (updates.maxStock !== undefined) patch.max_stock = updates.maxStock;
  if (updates.unit !== undefined) patch.unit = updates.unit;
  if (updates.price !== undefined) patch.price = updates.price;
  if (updates.image !== undefined) patch.image = updates.image;
  if (updates.isWeightBased !== undefined)
    patch.is_weight_based = updates.isWeightBased;
  if (updates.weightUnit !== undefined) patch.weight_unit = updates.weightUnit;

  const { error } = await supabase
    .from('products')
    .update(patch)
    .eq('id', productId);
  if (error) throw error;
}

/** Soft delete — sets is_active = false. */
export async function deleteProduct(productId: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', productId);
  if (error) throw error;
}

export async function addProductBarcode(
  data: CreateBarcodeData,
): Promise<ProductBarcode> {
  const { data: row, error } = await supabase
    .from('product_barcodes')
    .insert({
      product_id: data.productId,
      barcode: data.barcode,
      quantity_per_scan: data.quantityPerScan,
      label: data.label ?? null,
      is_default: false,
    })
    .select()
    .single();
  if (error) throw error;
  return mapBarcode(row as Record<string, unknown>);
}
