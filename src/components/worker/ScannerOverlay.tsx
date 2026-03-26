import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TouchInput } from '@/components/shared/TouchInput';
import { ScanLine, Search, ArrowDownCircle, ArrowUpCircle, AlertCircle, Plus, Boxes } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cleanBarcode } from '@/lib/barcodeUtils';
import { useKeyboard } from '@/hooks/useKeyboard';
import { lookupBarcode } from '@/lib/barcodeLookup';
import type { Product, ProductBarcode } from '@/types';

/**
 * Props del overlay de escáner de productos.
 *
 * Soporta dos modos de búsqueda de barcode:
 *   1. **Multi-barcode** (cuando se pasa `productBarcodes`):
 *      Usa `lookupBarcode()` que busca en `product_barcodes` con fallback a `Product.barcode`.
 *      El callback `onProductScanned` recibe también el `ProductBarcode` encontrado.
 *   2. **Legacy** (sin `productBarcodes`):
 *      Busca directamente en `Product.barcode`. Retrocompatible.
 */
interface ScannerOverlayProps {
  open: boolean;
  onClose: () => void;
  isAddMode: boolean;
  products: Product[];
  /**
   * Callback cuando se encuentra un producto por escaneo o búsqueda manual.
   * @param product — el producto encontrado
   * @param productBarcode — info del barcode (cantidad, tipo). undefined si fue búsqueda manual.
   */
  onProductScanned: (product: Product, productBarcode?: ProductBarcode) => void;
  /** Callback cuando el código de barras no existe en el catálogo */
  onBarcodeNotFound?: (barcode: string) => void;
  /**
   * Callback para registrar un nuevo producto manualmente (sin escanear).
   * Solo visible en modo ENTRADA (isAddMode = true).
   * @param initialUnit unit sugerida inicial (ej: "caja")
   */
  onAddNewProduct?: (initialUnit?: string) => void;
  /**
   * Callback para registrar un nuevo producto empaquetado/caja.
   * Solo visible en modo ENTRADA (isAddMode = true).
   * Abre el modal especializado AddPackagedProductModal.
   */
  onAddPackagedProduct?: () => void;
  /**
   * Lista de barcodes del sistema. Si se proporciona, el escáner usa
   * `lookupBarcode()` para soportar múltiples códigos por producto.
   *
   * Backend: GET /api/product-barcodes/lookup/:barcode
   */
  productBarcodes?: ProductBarcode[];
}

export function ScannerOverlay({
  open,
  onClose,
  isAddMode,
  products,
  onProductScanned,
  onBarcodeNotFound,
  onAddNewProduct,
  onAddPackagedProduct,
  productBarcodes,
}: ScannerOverlayProps) {
  const { closeKeyboard } = useKeyboard();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeError, setBarcodeError] = useState<string | null>(null);

  const filtered = searchQuery.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery))
      )
    : [];

  const handleSelect = (product: Product) => {
    resetState();
    onProductScanned(product);
  };

  const handleBarcodeScan = () => {
    const code = cleanBarcode(barcodeInput);
    if (!code) return;

    closeKeyboard();

    // Multi-barcode: usa lookupBarcode() si hay productBarcodes disponibles
    if (productBarcodes) {
      const result = lookupBarcode(code, products, productBarcodes);
      if (result) {
        resetState();
        onProductScanned(result.product, result.productBarcode);
        return;
      }
    } else {
      // Legacy: búsqueda directa en Product.barcode
      const found = products.find(p => p.barcode === code);
      if (found) {
        resetState();
        onProductScanned(found);
        return;
      }
    }

    // No encontrado
    if (onBarcodeNotFound) {
      resetState();
      onBarcodeNotFound(code);
    } else {
      setBarcodeError('Producto no registrado. Pide al administrador que lo registre.');
    }
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBarcodeScan();
    }
  };

  const resetState = () => {
    setBarcodeInput('');
    setSearchQuery('');
    setBarcodeError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };


  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              isAddMode ? 'bg-green-100' : 'bg-blue-100'
            )}>
              <ScanLine className={cn('w-5 h-5', isAddMode ? 'text-green-600' : 'text-blue-600')} />
            </div>
            Escáner de Productos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Mode indicator */}
          <div className={cn(
            'flex items-center gap-3 p-3 rounded-lg border',
            isAddMode
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          )}>
            {isAddMode
              ? <ArrowDownCircle className="w-5 h-5" />
              : <ArrowUpCircle className="w-5 h-5" />
            }
            <div>
              <p className="text-sm font-medium">
                {isAddMode ? 'Modo ENTRADA' : 'Modo SALIDA'}
              </p>
              <p className="text-xs opacity-80">
                {isAddMode
                  ? 'Los productos escaneados se agregarán al inventario'
                  : 'Los productos escaneados saldrán del inventario'
                }
              </p>
            </div>
          </div>

          {/* Barcode scan field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Código de barras</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <TouchInput
                  placeholder="Escanea o escribe el código..."
                  value={barcodeInput}
                  onChange={(e) => { setBarcodeInput(e.target.value); setBarcodeError(null); }}
                  onKeyDown={handleBarcodeKeyDown}
                  className="pl-10 min-h-[44px] text-base font-mono"
                  autoFocus
                  preventKeyboardOnFocus
                />
              </div>
              <Button
                onClick={handleBarcodeScan}
                disabled={!barcodeInput.trim()}
                className="min-h-[44px] bg-blue-500 hover:bg-blue-600"
              >
                Buscar
              </Button>
            </div>

            {/* Barcode not found - with register option (admin) or error (worker) */}
            {barcodeError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{barcodeError}</p>
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">o busca manualmente</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Manual search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <TouchInput
              placeholder="Buscar por nombre o SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 min-h-[44px] text-base"
            />
          </div>

          {/* Results */}
          {filtered.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
              {filtered.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-blue-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">
                      {product.sku}
                      {product.barcode && <span className="ml-2 text-gray-400">· {product.barcode}</span>}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    Stock: {product.stock} {product.isWeightBased ? product.weightUnit : product.unit}
                  </span>
                </button>
              ))}
            </div>
          )}

          {searchQuery.trim() && filtered.length === 0 && (
            <div className="text-center py-4 text-sm text-gray-500">
              No se encontraron productos
            </div>
          )}

          {/* Botón para registrar nuevo producto manualmente (solo en modo ENTRADA) */}
          {isAddMode && (onAddNewProduct || onAddPackagedProduct) && (
            <div className="grid grid-cols-2 gap-3">
              {onAddNewProduct && (
                <Button
                  variant="outline"
                  onClick={() => onAddNewProduct()}
                  className="w-full gap-2 min-h-[44px] border-dashed border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                >
                  <Plus className="w-4 h-4" />
                  Registrar pieza
                </Button>
              )}
              {onAddPackagedProduct && (
                <Button
                  variant="outline"
                  onClick={() => {
                    resetState();
                    onClose();
                    onAddPackagedProduct();
                  }}
                  className="w-full gap-2 min-h-[44px] border-dashed border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400"
                >
                  <Boxes className="w-4 h-4" />
                  Registrar caja
                </Button>
              )}
            </div>
          )}

          <Button variant="outline" onClick={handleClose} className="w-full min-h-[44px]">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
