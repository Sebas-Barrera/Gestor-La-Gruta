import type { Product, ProductBarcode } from '@/types';

/**
 * Resultado de una búsqueda de código de barras.
 * Contiene el producto encontrado y la información del barcode (cantidad, tipo, etc.).
 */
export interface BarcodeLookupResult {
  product: Product;
  productBarcode: ProductBarcode;
}

/**
 * Busca un producto por código de barras.
 *
 * Orden de búsqueda:
 *   1. Tabla `product_barcodes` (nueva — soporta múltiples barcodes por producto)
 *   2. Campo `Product.barcode` (legacy — fallback para compatibilidad)
 *
 * Backend: GET /api/product-barcodes/lookup/:barcode
 *   Response: { product: Product, productBarcode: ProductBarcode } | 404
 */
export function lookupBarcode(
  barcode: string,
  products: Product[],
  productBarcodes: ProductBarcode[],
): BarcodeLookupResult | null {
  // 1. Buscar en product_barcodes (tabla nueva)
  const pb = productBarcodes.find(pb => pb.barcode === barcode);
  if (pb) {
    const product = products.find(p => p.id === pb.productId);
    if (product) return { product, productBarcode: pb };
  }

  // 2. Fallback: campo legacy Product.barcode (quantityPerScan = 1)
  const legacyProduct = products.find(p => p.barcode === barcode);
  if (legacyProduct) {
    const syntheticPb: ProductBarcode = {
      id: `legacy-${legacyProduct.id}`,
      productId: legacyProduct.id,
      barcode,
      quantityPerScan: 1,
      label: 'Individual',
      isDefault: true,
      createdAt: '',
    };
    return { product: legacyProduct, productBarcode: syntheticPb };
  }

  return null;
}
