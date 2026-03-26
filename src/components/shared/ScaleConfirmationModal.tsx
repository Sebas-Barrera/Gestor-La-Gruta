import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TouchInput } from '@/components/shared/TouchInput';
import { Scale, ArrowDownCircle, ArrowUpCircle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

/**
 * Props del modal de confirmación de báscula.
 *
 * Este modal se abre cuando se detecta peso automáticamente (Ctrl+W).
 * Muestra el peso detectado y permite al usuario editarlo si es necesario.
 *
 * Backend: El valor enviado siempre es el peso final en la unidad del producto (kg, g, L, ml).
 */
interface ScaleConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  /** Peso detectado automáticamente (simulado con Ctrl+W) */
  detectedWeight: number;
  barName: string;
  /** true = modo ENTRADA, false = modo SALIDA */
  isAddMode: boolean;
  /** Siempre recibe el peso final en unidades del producto */
  onConfirm: (weight: number) => void;
  /** Nombre de quien autoriza el movimiento */
  authorizedBy?: string;
}

export function ScaleConfirmationModal({
  open,
  onClose,
  product,
  detectedWeight,
  barName,
  isAddMode,
  onConfirm,
  authorizedBy,
}: ScaleConfirmationModalProps) {
  const [weight, setWeight] = useState(detectedWeight);

  // Actualizar peso cuando cambia el detectado
  useEffect(() => {
    if (open) {
      setWeight(detectedWeight);
    }
  }, [open, detectedWeight]);

  const handleConfirm = () => {
    onConfirm(Number(weight.toFixed(2)));
    setWeight(0);
  };

  const handleClose = () => {
    setWeight(0);
    onClose();
  };

  if (!product) return null;

  const weightUnit = product.weightUnit || product.unit || 'kg';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              isAddMode ? 'bg-green-100' : 'bg-amber-100'
            )}>
              <Scale className={cn('w-5 h-5', isAddMode ? 'text-green-600' : 'text-amber-600')} />
            </div>
            Báscula Detectada - {isAddMode ? 'ENTRADA' : 'SALIDA'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Indicador de modo */}
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
              {isAddMode ? 'Agregar al inventario' : 'Retirar del inventario'}
            </p>
          </div>

          {/* Info del producto */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            {product.image && (
              <img
                src={product.image}
                alt={product.name}
                className="w-20 h-20 object-contain mx-auto mb-3 rounded"
              />
            )}
            <p className="text-lg font-semibold text-blue-900 text-center">
              {product.name}
            </p>
            <p className="text-sm text-blue-600 text-center">
              {product.category} → {product.subcategory}
            </p>
            <p className="text-sm text-blue-600 text-center mt-1">
              Stock actual: {product.stock} {weightUnit}
            </p>
            <p className="text-xs text-blue-500 text-center mt-1">
              {barName}
            </p>
          </div>

          {/* Peso detectado */}
          <div className="border-2 border-dashed border-green-300 rounded-xl p-6 text-center bg-green-50">
            <Scale className="w-12 h-12 text-green-500 mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-green-600 font-medium mb-2">
              Peso detectado automáticamente
            </p>
            <div className="flex items-center justify-center gap-2 mb-3">
              <TouchInput
                type="number"
                step="0.01"
                min="0.01"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-32 text-center text-3xl font-bold text-green-700 min-h-[60px]"
                autoFocus
                preventKeyboardOnFocus
              />
              <span className="text-2xl text-green-600">{weightUnit}</span>
            </div>
            <p className="text-xs text-gray-500">
              Presiona <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs font-mono">Ctrl+W</kbd> para detectar nuevamente
            </p>
          </div>

          {/* Info de autorización */}
          {authorizedBy && (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-600">
                Autorizado por: <span className="font-medium">{authorizedBy}</span>
              </span>
            </div>
          )}

          {/* Nota sobre simulación */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">Simulación de báscula física</p>
              <p>
                Para producción, conecta una báscula profesional vía USB/Serial.
                Ver <code className="bg-blue-100 px-1 rounded">BACKEND_SPEC.md</code> para recomendaciones.
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 min-h-[44px]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!weight || weight <= 0}
              className={cn(
                'flex-1 min-h-[44px]',
                isAddMode ? 'bg-green-500 hover:bg-green-600' : 'bg-amber-500 hover:bg-amber-600'
              )}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
