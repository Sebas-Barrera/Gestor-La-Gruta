import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Minus, Plus, ArrowUpCircle, Boxes } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TouchTextarea } from '@/components/shared/TouchTextarea';
import { QuickAddButtons } from '@/components/shared/QuickAddButtons';
import type { Product, ProductBarcode } from '@/types';

/**
 * Props del modal de confirmación de salida de inventario.
 *
 * Soporta dos modos:
 *   1. **Individual** (sin `productBarcode` o quantityPerScan = 1):
 *      Decrementos de 1 unidad. Muestra solo la cantidad directa.
 *   2. **Caja** (con `productBarcode` y quantityPerScan > 1):
 *      Decrementa en CAJAS. Muestra conversión: "2 cajas × 24 = 48 botellas".
 *      `onConfirm` siempre pasa el total en unidades individuales.
 */
interface InventoryExitModalProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  barName: string;
  /** Siempre recibe total en unidades individuales */
  onConfirm: (quantity: number, notes?: string) => void;
  /** Nombre de quien autoriza el movimiento (e.g. "Admin Omar Prado" o "Juan Pérez") */
  authorizedBy?: string;
  /**
   * Info del barcode escaneado. Si quantityPerScan > 1, muestra UI de conversión
   * (cajas → unidades individuales).
   */
  productBarcode?: ProductBarcode;
}

export function InventoryExitModal({
  open,
  onClose,
  product,
  barName,
  onConfirm,
  authorizedBy,
  productBarcode,
}: InventoryExitModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const isBox = productBarcode && productBarcode.quantityPerScan > 1;
  const increment = product?.isWeightBased ? 0.1 : 1;
  const displayUnit = product?.isWeightBased ? product.weightUnit || product.unit : product?.unit;
  const maxQuantity = product?.stock ?? 0;

  // Total en unidades individuales (para cajas: quantity × quantityPerScan)
  const totalIndividual = isBox ? quantity * productBarcode.quantityPerScan : quantity;

  useEffect(() => {
    if (open) {
      setQuantity(product?.isWeightBased ? 0.1 : 1);
      setNotes('');
    }
  }, [open, product?.isWeightBased]);

  const handleIncrement = () => {
    setQuantity(prev => Math.min(Number((prev + increment).toFixed(2)), maxQuantity));
  };

  const handleDecrement = () => {
    setQuantity(prev => Math.max(Number((prev - increment).toFixed(2)), increment));
  };

  const handleConfirm = () => {
    // Siempre enviar total en unidades individuales
    onConfirm(Number(totalIndividual.toFixed(2)), notes || undefined);
    setQuantity(1);
    setNotes('');
  };

  const handleClose = () => {
    setQuantity(1);
    setNotes('');
    onClose();
  };

  if (!product) return null;

  const exceedsStock = totalIndividual > maxQuantity;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <ArrowUpCircle className="w-5 h-5 text-amber-600" />
            </div>
            Confirmar Salida de Inventario
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Product & bar info */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm font-medium text-amber-900">{product.name}</p>
            <p className="text-xs text-amber-700">
              {product.sku} · {product.category} → {product.subcategory}
            </p>
            <p className="text-xs text-amber-700">
              Stock actual: {product.stock} {displayUnit}
            </p>
            <p className="text-xs text-amber-600 mt-1">Salida de: {barName}</p>
          </div>

          {/* Box conversion info */}
          {isBox && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Boxes className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {productBarcode.label}
                </p>
                <p className="text-xs text-blue-700">
                  Cada escaneo = {productBarcode.quantityPerScan} {displayUnit}
                </p>
              </div>
            </div>
          )}

          {/* Quantity controls */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={handleDecrement}
              disabled={quantity <= increment}
              className="w-14 h-14 rounded-xl bg-gray-50 border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:border-gray-300 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Minus className="w-6 h-6" />
            </button>

            <div className="text-center min-w-[120px]">
              <p className={cn(
                'text-3xl font-bold',
                exceedsStock ? 'text-red-600' : 'text-gray-900'
              )}>
                {product.isWeightBased ? quantity.toFixed(1) : quantity}
              </p>
              <p className="text-sm text-gray-500">
                {isBox ? (productBarcode.label?.toLowerCase() || 'cajas') : displayUnit}
              </p>
            </div>

            <button
              onClick={handleIncrement}
              disabled={quantity >= maxQuantity}
              className="w-14 h-14 rounded-xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-amber-600 hover:bg-amber-100 hover:border-amber-300 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* Quick-add presets */}
          <QuickAddButtons
            isWeightBased={!!product.isWeightBased}
            weightUnit={product.weightUnit}
            onAdd={(amount) => {
              const maxBoxes = isBox ? Math.floor(maxQuantity / productBarcode.quantityPerScan) : maxQuantity;
              setQuantity(prev => Math.min(Number((prev + amount).toFixed(2)), maxBoxes));
            }}
            maxAdd={isBox ? Number((Math.floor(maxQuantity / productBarcode.quantityPerScan) - quantity).toFixed(2)) : Number((maxQuantity - quantity).toFixed(2))}
            colorScheme="amber"
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

          {/* Stock warning */}
          {exceedsStock && (
            <p className="text-xs text-red-600 text-center font-medium">
              La cantidad excede el stock disponible ({product.stock} {displayUnit})
            </p>
          )}

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Notas (opcional)</label>
            <TouchTextarea
              value={notes}
              onChange={(e) => {
                // Filtrar bytes residuales del escáner físico (\r\n → "0D0A")
                const cleaned = e.target.value.replace(/0D0A/gi, '').replace(/[\r\n]/g, '');
                setNotes(cleaned);
              }}
              placeholder="Razón de la salida..."
              className="w-full min-h-[80px] p-3 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              preventKeyboardOnFocus
            />
          </div>

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
              disabled={exceedsStock || quantity <= 0}
              className="flex-1 min-h-[44px] bg-amber-500 hover:bg-amber-600 text-white"
            >
              Confirmar Salida
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
