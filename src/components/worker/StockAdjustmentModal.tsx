import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TouchTextarea } from '@/components/shared/TouchTextarea';
import { QuickAddButtons } from '@/components/shared/QuickAddButtons';
import type { Product } from '@/types';

interface StockAdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  product: Product;
  onSave: (newQuantity: number, notes?: string) => void;
  workerName?: string;
}

export function StockAdjustmentModal({ open, onClose, product, onSave, workerName }: StockAdjustmentModalProps) {
  const [quantity, setQuantity] = useState(product.stock);
  const [notes, setNotes] = useState('');

  const increment = product.isWeightBased ? 0.1 : 1;
  const displayUnit = product.isWeightBased ? product.weightUnit || product.unit : product.unit;

  const handleIncrement = () => {
    setQuantity(prev => Math.min(prev + increment, product.maxStock));
  };

  const handleDecrement = () => {
    setQuantity(prev => Math.max(prev - increment, 0));
  };

  const handleSave = () => {
    onSave(Number(quantity.toFixed(2)), notes || undefined);
    setNotes('');
  };

  const handleClose = () => {
    setQuantity(product.stock);
    setNotes('');
    onClose();
  };

  const diff = quantity - product.stock;
  const isIncrease = diff > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="px-6 pt-6 pb-3 shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            Ajustar Stock
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 px-6 pt-2 pb-6 overflow-y-auto flex-1">
          {/* Product info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900">{product.name}</p>
            <p className="text-xs text-gray-500">{product.sku} - Stock actual: {product.stock} {displayUnit}</p>
          </div>

          {/* Quantity controls */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={handleDecrement}
              disabled={quantity <= 0}
              className="w-14 h-14 rounded-xl bg-red-50 border-2 border-red-200 flex items-center justify-center text-red-600 hover:bg-red-100 hover:border-red-300 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Minus className="w-6 h-6" />
            </button>

            <div className="text-center min-w-[120px]">
              <p className="text-3xl font-bold text-gray-900">
                {product.isWeightBased ? quantity.toFixed(1) : quantity}
              </p>
              <p className="text-sm text-gray-500">{displayUnit}</p>
            </div>

            <button
              onClick={handleIncrement}
              disabled={quantity >= product.maxStock}
              className="w-14 h-14 rounded-xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-blue-600 hover:bg-blue-100 hover:border-blue-300 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* Quick-add presets */}
          <QuickAddButtons
            isWeightBased={!!product.isWeightBased}
            weightUnit={product.weightUnit}
            onAdd={(amount) => setQuantity(prev => Math.min(Number((prev + amount).toFixed(2)), product.maxStock))}
            maxAdd={Number((product.maxStock - quantity).toFixed(2))}
            colorScheme="blue"
          />

          {/* Diff indicator */}
          {diff !== 0 && (
            <div className={cn(
              'text-center text-sm font-medium',
              isIncrease ? 'text-green-600' : 'text-red-600'
            )}>
              {isIncrease ? '+' : ''}{product.isWeightBased ? diff.toFixed(1) : diff} {displayUnit}
              {isIncrease ? ' (Entrada)' : ' (Salida)'}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Notas (opcional)</label>
            <TouchTextarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Razón del ajuste..."
              className="w-full min-h-[80px] p-3 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              preventKeyboardOnFocus
            />
          </div>

          {/* Worker info */}
          {workerName && (
            <p className="text-xs text-gray-400 text-center">Autorizado por: {workerName}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1 min-h-[44px]">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={diff === 0}
              className="flex-1 min-h-[44px] bg-blue-500 hover:bg-blue-600"
            >
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
