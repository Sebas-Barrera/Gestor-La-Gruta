import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TouchInput } from '@/components/shared/TouchInput';
import { Scale, Search, ArrowDownCircle, ArrowUpCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface ScaleOverlayProps {
  open: boolean;
  onClose: () => void;
  isAddMode: boolean;
  products: Product[];
  onProductWeighed: (product: Product, weight: number) => void;
  /**
   * Callback para registrar un nuevo producto a granel (peso/volumen).
   * Solo disponible en modo ENTRADA (isAddMode = true).
   * Sigue el mismo patrón que onBarcodeNotFound del ScannerOverlay:
   *   cierra el overlay y abre AddProductModal con isWeightBased pre-activado.
   *
   * Backend: el flujo continúa con POST /api/products (isWeightBased = true)
   */
  onAddNewProduct?: () => void;
}

export function ScaleOverlay({ open, onClose, isAddMode, products, onProductWeighed, onAddNewProduct }: ScaleOverlayProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [weight, setWeight] = useState('');

  const filtered = searchQuery.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  const handleConfirm = () => {
    if (!selectedProduct || !weight) return;
    onProductWeighed(selectedProduct, Number(weight));
    setSearchQuery('');
    setSelectedProduct(null);
    setWeight('');
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedProduct(null);
    setWeight('');
    onClose();
  };

  /** Cierra el overlay y dispara el flujo de agregar nuevo producto a granel */
  const handleAddNewProduct = () => {
    handleClose();
    onAddNewProduct?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              isAddMode ? 'bg-green-100' : 'bg-blue-100'
            )}>
              <Scale className={cn('w-5 h-5', isAddMode ? 'text-green-600' : 'text-blue-600')} />
            </div>
            Báscula - Productos a Granel
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
            <p className="text-sm font-medium">
              {isAddMode ? 'Modo ENTRADA' : 'Modo SALIDA'}
            </p>
          </div>

          {!selectedProduct ? (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <TouchInput
                  placeholder="Buscar producto a granel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 min-h-[44px] text-base"
                  autoFocus
                  preventKeyboardOnFocus
                />
              </div>

              {/* Product list */}
              <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                {filtered.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-blue-50 transition-colors min-h-[44px]"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">
                        {product.category} → {product.subcategory} · Stock: {product.stock} {product.weightUnit}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-gray-400">{product.weightUnit}</span>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-500">No se encontraron productos a granel</p>
                    {isAddMode && onAddNewProduct && (
                      <p className="text-xs text-gray-400 mt-1">
                        Puedes registrar uno nuevo con el botón de abajo
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Botón para agregar nuevo producto a granel (solo en modo ENTRADA) */}
              {isAddMode && onAddNewProduct && (
                <Button
                  variant="outline"
                  onClick={handleAddNewProduct}
                  className="w-full gap-2 min-h-[44px] border-dashed border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
                >
                  <Plus className="w-4 h-4" />
                  Registrar nuevo producto a granel
                </Button>
              )}
            </>
          ) : (
            <>
              {/* Selected product */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">{selectedProduct.name}</p>
                <p className="text-xs text-blue-600">
                  {selectedProduct.category} → {selectedProduct.subcategory}
                </p>
                <p className="text-xs text-blue-600">
                  Stock actual: {selectedProduct.stock} {selectedProduct.weightUnit}
                </p>
              </div>

              {/* Weight display */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                <Scale className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400 mb-3">Peso detectado (simulación)</p>
                <div className="flex items-center justify-center gap-2">
                  <TouchInput
                    type="number"
                    step="0.01"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="0.00"
                    className="w-32 text-center text-2xl font-bold min-h-[50px]"
                    autoFocus
                    preventKeyboardOnFocus
                  />
                  <span className="text-lg text-gray-500">{selectedProduct.weightUnit}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => { setSelectedProduct(null); setWeight(''); }}
                  className="flex-1 min-h-[44px]"
                >
                  Cambiar Producto
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={!weight || Number(weight) <= 0}
                  className="flex-1 min-h-[44px] bg-blue-500 hover:bg-blue-600"
                >
                  Confirmar
                </Button>
              </div>
            </>
          )}

          <Button variant="outline" onClick={handleClose} className="w-full min-h-[44px]">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
