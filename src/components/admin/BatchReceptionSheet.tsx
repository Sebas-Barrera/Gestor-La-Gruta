import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { TouchInput } from '@/components/shared/TouchInput';
import { TouchTextarea } from '@/components/shared/TouchTextarea';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { ScaleOverlay } from '@/components/worker/ScaleOverlay';
import {
  ScanLine,
  Scale,
  Package,
  Boxes,
  Minus,
  Plus,
  Trash2,
  ClipboardCheck,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInventoryReception } from '@/hooks/useInventoryReception';
import type { Product, ProductBarcode, ReceptionSession, ReceptionItem } from '@/types';

/**
 * Sheet lateral para recepción de mercancía por lotes.
 *
 * Permite al admin:
 *   1. Escanear múltiples barcodes (cajas, individuales)
 *   2. Pesar productos a granel vía báscula
 *   3. Ver resumen acumulativo de todo lo recibido
 *   4. Confirmar todo de un golpe
 *
 * Sigue el patrón de BarReportSheet (Sheet lateral, shadcn).
 *
 * Backend: Al confirmar, el parent recibe la ReceptionSession completa y debe:
 *   - POST /api/reception-sessions         → crear sesión
 *   - PUT  /api/reception-sessions/:id/confirm → confirmar
 *     El backend internamente:
 *       - Crea N InventoryMovement (type: 'in') por cada ReceptionItem
 *       - Actualiza product.stock += totalIndividualQty por cada item
 *       - Recalcula product.status
 */
interface BatchReceptionSheetProps {
  open: boolean;
  onClose: () => void;
  /** Bar destino de la recepción */
  barId: string;
  barName: string;
  /** Nombre del admin que opera la recepción */
  adminName: string;
  /** Todos los productos del bar activo */
  products: Product[];
  /** Todos los barcodes del sistema */
  productBarcodes: ProductBarcode[];
  /**
   * Callback al confirmar la recepción.
   * Recibe la sesión completa (status: 'confirmed', items con totales).
   */
  onSessionConfirmed: (session: ReceptionSession) => void;
  /**
   * Callback cuando un barcode no se encuentra en el catálogo.
   * El parent abre UnknownBarcodeModal para decidir qué hacer.
   */
  onBarcodeNotFound: (barcode: string) => void;
}

export function BatchReceptionSheet({
  open,
  onClose,
  barId,
  barName,
  adminName,
  products,
  productBarcodes,
  onSessionConfirmed,
  onBarcodeNotFound,
}: BatchReceptionSheetProps) {
  const reception = useInventoryReception();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [notes, setNotes] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [scaleOpen, setScaleOpen] = useState(false);

  // Iniciar sesión al abrir si no está activa
  const ensureSession = () => {
    if (!reception.isSessionActive) {
      reception.startSession(barId, adminName);
    }
  };

  // Auto-iniciar sesión cuando se abre el sheet
  if (open && !reception.isSessionActive) {
    reception.startSession(barId, adminName);
  }

  // --- Handlers ---

  const handleBarcodeScan = () => {
    const code = barcodeInput.trim();
    if (!code) return;

    ensureSession();
    const result = reception.processBarcodeScan(code, products, productBarcodes);

    if (result === 'not_found') {
      onBarcodeNotFound(code);
    }

    setBarcodeInput('');
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBarcodeScan();
  };

  const handleProductWeighed = (product: Product, weight: number) => {
    ensureSession();
    reception.addWeighedItem(product, weight);
    setScaleOpen(false);
  };

  const handleConfirm = () => {
    const session = reception.confirmSession(notes.trim() || undefined);
    onSessionConfirmed(session);
    setNotes('');
    setBarcodeInput('');
    onClose();
  };

  const handleCancel = () => {
    reception.cancelSession();
    setShowCancelConfirm(false);
    setNotes('');
    setBarcodeInput('');
    onClose();
  };

  const handleCloseAttempt = () => {
    if (reception.items.length > 0) {
      setShowCancelConfirm(true);
    } else {
      reception.cancelSession();
      onClose();
    }
  };

  const weightBasedProducts = products.filter(p => p.isWeightBased);

  return (
    <>
      <Sheet open={open} onOpenChange={handleCloseAttempt}>
        <SheetContent side="right" className="sm:max-w-lg w-full overflow-y-auto flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <span className="block">Recepción de Mercancía</span>
                <span className="flex items-center gap-1 text-xs font-normal text-gray-500">
                  <MapPin className="w-3 h-3" />
                  {barName}
                </span>
              </div>
            </SheetTitle>
            <SheetDescription>
              Escanea los productos recibidos y confirma todo de un golpe.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 px-4 pb-6 space-y-5">
            {/* Input de barcode */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Código de barras</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <TouchInput
                    placeholder="Escanea o escribe el código..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleBarcodeKeyDown}
                    className="pl-10 min-h-[44px] text-base font-mono"
                    keyboardMode="numeric"
                  />
                </div>
                <Button
                  onClick={handleBarcodeScan}
                  disabled={!barcodeInput.trim()}
                  className="min-h-[44px] bg-green-500 hover:bg-green-600"
                >
                  <ScanLine className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Botón báscula */}
            {weightBasedProducts.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setScaleOpen(true)}
                className="w-full gap-2 min-h-[44px] hover:border-green-400 hover:text-green-600"
              >
                <Scale className="w-4 h-4" />
                Agregar desde Báscula
              </Button>
            )}

            {/* Cards resumen */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-blue-50">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-gray-600">Productos</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{reception.distinctProducts}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <div className="flex items-center gap-2 mb-1">
                  <Boxes className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-gray-600">Unidades Totales</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {Number.isInteger(reception.totalUnits)
                    ? reception.totalUnits
                    : reception.totalUnits.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Tabla de items */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Items Recibidos ({reception.items.length})
              </h4>

              {reception.items.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <ScanLine className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Escanea un producto para comenzar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {reception.items.map((item) => (
                    <ReceptionItemRow
                      key={item.id}
                      item={item}
                      onUpdateScanCount={(count) => reception.updateItemScanCount(item.id, count)}
                      onRemove={() => reception.removeItem(item.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Notas */}
            {reception.items.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Notas <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <TouchTextarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones sobre la recepción..."
                  className="resize-none"
                  rows={2}
                />
              </div>
            )}

            {/* Footer: acciones */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleCloseAttempt}
                className="flex-1 min-h-[44px]"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={reception.items.length === 0}
                className="flex-1 min-h-[44px] bg-green-500 hover:bg-green-600 disabled:opacity-50"
              >
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Confirmar Recepción
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Báscula dentro de la sesión */}
      <ScaleOverlay
        open={scaleOpen}
        onClose={() => setScaleOpen(false)}
        isAddMode={true}
        products={weightBasedProducts}
        onProductWeighed={handleProductWeighed}
      />

      {/* Diálogo de cancelación */}
      <DeleteConfirmDialog
        open={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancel}
        title="¿Cancelar recepción?"
        description={`Se perderán ${reception.items.length} items registrados. Esta acción no se puede deshacer.`}
      />
    </>
  );
}

// ─── Componente interno: fila de item ─────────────────────────────────────────

interface ReceptionItemRowProps {
  item: ReceptionItem;
  onUpdateScanCount: (count: number) => void;
  onRemove: () => void;
}

function ReceptionItemRow({ item, onUpdateScanCount, onRemove }: ReceptionItemRowProps) {
  const isBox = !item.isWeightBased && item.quantityPerScan > 1;

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      {/* Icon */}
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
        item.isWeightBased ? 'bg-purple-100' : isBox ? 'bg-amber-100' : 'bg-blue-100',
      )}>
        {item.isWeightBased
          ? <Scale className="w-4 h-4 text-purple-600" />
          : isBox
            ? <Boxes className="w-4 h-4 text-amber-600" />
            : <Package className="w-4 h-4 text-blue-600" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
        <p className="text-xs text-gray-500">
          {item.isWeightBased
            ? `Báscula · ${item.weight?.toFixed(2)} ${item.unit}`
            : `${item.barcodeLabel || 'Individual'} · ${item.quantityPerScan} ${item.unit}/escaneo`
          }
        </p>
      </div>

      {/* Scan count controls (no aplica a weight-based) */}
      {!item.isWeightBased && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdateScanCount(item.scanCount - 1)}
            disabled={item.scanCount <= 1}
            className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-sm font-semibold text-gray-900 min-w-[28px] text-center">
            {item.scanCount}x
          </span>
          <button
            onClick={() => onUpdateScanCount(item.scanCount + 1)}
            className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Total */}
      <div className="text-right shrink-0 min-w-[60px]">
        <p className="text-sm font-bold text-gray-900">
          {item.isWeightBased
            ? item.totalIndividualQty.toFixed(2)
            : item.totalIndividualQty
          }
        </p>
        <p className="text-xs text-gray-500">{item.unit}</p>
      </div>

      {/* Delete */}
      <button
        onClick={onRemove}
        className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
