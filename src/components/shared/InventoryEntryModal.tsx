import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Minus, Plus, ArrowDownCircle, Boxes } from 'lucide-react';
import { QuickAddButtons } from '@/components/shared/QuickAddButtons';
import type { Product, ProductBarcode } from '@/types';

/**
 * Props del modal de confirmación de entrada de inventario.
 *
 * Soporta dos modos:
 *   1. **Individual** (sin `productBarcode` o quantityPerScan = 1):
 *      Incrementos de 1 unidad. Muestra solo la cantidad directa.
 *   2. **Caja** (con `productBarcode` y quantityPerScan > 1):
 *      Incrementa en CAJAS. Muestra conversión: "2 cajas × 24 = 48 botellas".
 *      `onConfirm` siempre pasa el total en unidades individuales.
 *
 * Backend: El valor enviado a POST siempre es en unidades individuales.
 *   Ejemplo: 2 cajas × 24 = 48 → onConfirm(48)
 */
interface InventoryEntryModalProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  barName: string;
  /** Siempre recibe total en unidades individuales */
  onConfirm: (quantity: number) => void;
  /** Nombre de quien autoriza el movimiento (e.g. "Admin Omar Prado" o "Juan Pérez") */
  authorizedBy?: string;
  /**
   * Info del barcode escaneado. Si quantityPerScan > 1, muestra UI de conversión
   * (cajas → unidades individuales).
   */
  productBarcode?: ProductBarcode;
}

export function InventoryEntryModal({
  open,
  onClose,
  product,
  barName,
  onConfirm,
  authorizedBy,
  productBarcode,
}: InventoryEntryModalProps) {
  const [quantity, setQuantity] = useState(1);

  const isBox = productBarcode && productBarcode.quantityPerScan > 1;
  const increment = product?.isWeightBased ? 0.1 : 1;
  const displayUnit = product?.isWeightBased ? product.weightUnit || product.unit : product?.unit;

  // Total en unidades individuales (para cajas: quantity × quantityPerScan)
  const totalIndividual = isBox ? quantity * productBarcode.quantityPerScan : quantity;

  useEffect(() => {
    if (open) {
      setQuantity(product?.isWeightBased ? 0.1 : 1);
    }
  }, [open, product?.isWeightBased]);

  const handleIncrement = () => {
    setQuantity(prev => Number((prev + increment).toFixed(2)));
  };

  const handleDecrement = () => {
    setQuantity(prev => Math.max(Number((prev - increment).toFixed(2)), increment));
  };

  const handleConfirm = () => {
    // Siempre enviar total en unidades individuales
    onConfirm(Number(totalIndividual.toFixed(2)));
    setQuantity(1);
  };

  const handleClose = () => {
    setQuantity(1);
    onClose();
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <ArrowDownCircle className="w-5 h-5 text-green-600" />
            </div>
            Confirmar Entrada
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Product & bar info */}
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-green-900">{product.name}</p>
            <p className="text-xs text-green-700">
              {product.sku} · {product.category} → {product.subcategory}
            </p>
            <p className="text-xs text-green-700">
              Stock actual: {product.stock} {displayUnit}
            </p>
            <p className="text-xs text-green-600 mt-1">Destino: {barName}</p>
          </div>

          {/* Box conversion info */}
          {isBox && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <Boxes className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  {productBarcode.label}
                </p>
                <p className="text-xs text-amber-700">
                  Cada escaneo = {productBarcode.quantityPerScan} {displayUnit}
                </p>
              </div>
            </div>
          )}

          {/* Quantity question */}
          <p className="text-sm text-gray-700 text-center font-medium">
            {isBox
              ? `¿Cuántas ${productBarcode.label?.toLowerCase() || 'cajas'} de ${product.name} quieres agregar?`
              : `¿Cuántas ${displayUnit} de ${product.name} quieres agregar?`
            }
          </p>

          {/* Quantity controls */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={handleDecrement}
              disabled={quantity <= increment}
              className="w-14 h-14 rounded-xl bg-red-50 border-2 border-red-200 flex items-center justify-center text-red-600 hover:bg-red-100 hover:border-red-300 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Minus className="w-6 h-6" />
            </button>

            <div className="text-center min-w-[120px]">
              <p className="text-3xl font-bold text-gray-900">
                {product.isWeightBased ? quantity.toFixed(1) : quantity}
              </p>
              <p className="text-sm text-gray-500">
                {isBox ? (productBarcode.label?.toLowerCase() || 'cajas') : displayUnit}
              </p>
            </div>

            <button
              onClick={handleIncrement}
              className="w-14 h-14 rounded-xl bg-green-50 border-2 border-green-200 flex items-center justify-center text-green-600 hover:bg-green-100 hover:border-green-300 active:scale-95 transition-all duration-150"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* Quick-add presets */}
          <QuickAddButtons
            isWeightBased={!!product.isWeightBased}
            weightUnit={product.weightUnit}
            onAdd={(amount) => setQuantity(prev => Number((prev + amount).toFixed(2)))}
            colorScheme="green"
          />

          {/* Box total conversion */}
          {isBox && (
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">{quantity}</span> {productBarcode.label?.toLowerCase() || 'cajas'}
                {' × '}
                <span className="font-semibold">{productBarcode.quantityPerScan}</span>
                {' = '}
                <span className="text-lg font-bold text-blue-700">{totalIndividual}</span>
                {' '}{displayUnit}
              </p>
            </div>
          )}

          {/* Authorized by */}
          {authorizedBy && (
            <p className="text-xs text-gray-400 text-center">Registrado por: {authorizedBy}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1 min-h-[44px]">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 min-h-[44px] bg-green-500 hover:bg-green-600 text-white"
            >
              Confirmar Entrada
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
