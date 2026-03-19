import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Minus, Plus, ArrowUpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface InventoryExitModalProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  barName: string;
  onConfirm: (quantity: number, notes?: string) => void;
  /** Nombre de quien autoriza el movimiento (e.g. "Admin Omar Prado" o "Juan Pérez") */
  authorizedBy?: string;
}

export function InventoryExitModal({
  open,
  onClose,
  product,
  barName,
  onConfirm,
  authorizedBy,
}: InventoryExitModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const increment = product?.isWeightBased ? 0.1 : 1;
  const displayUnit = product?.isWeightBased ? product.weightUnit || product.unit : product?.unit;
  const maxQuantity = product?.stock ?? 0;

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
    onConfirm(Number(quantity.toFixed(2)), notes || undefined);
    setQuantity(1);
    setNotes('');
  };

  const handleClose = () => {
    setQuantity(1);
    setNotes('');
    onClose();
  };

  if (!product) return null;

  const exceedsStock = quantity > maxQuantity;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
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
              <p className="text-sm text-gray-500">{displayUnit}</p>
            </div>

            <button
              onClick={handleIncrement}
              disabled={quantity >= maxQuantity}
              className="w-14 h-14 rounded-xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-amber-600 hover:bg-amber-100 hover:border-amber-300 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* Stock warning */}
          {exceedsStock && (
            <p className="text-xs text-red-600 text-center font-medium">
              La cantidad excede el stock disponible ({product.stock} {displayUnit})
            </p>
          )}

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Razón de la salida..."
              className="w-full min-h-[80px] p-3 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
