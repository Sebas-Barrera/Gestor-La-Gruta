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
import { UnknownBarcodeModal } from '@/components/shared/UnknownBarcodeModal';
import { AddProductModal, type CreateProductData } from '@/components/admin/AddProductModal';
import { AddPackagedProductModal } from '@/components/admin/AddPackagedProductModal';
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
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { cleanBarcode } from '@/lib/barcodeUtils';
import { useKeyboard } from '@/hooks/useKeyboard';
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
   * Recibe la sesión completa (status: 'confirmed', items con totales) y los borradores creados.
   */
  onSessionConfirmed: (session: ReceptionSession, drafts: CreateProductData[]) => void;
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
}: BatchReceptionSheetProps) {
  const { closeKeyboard } = useKeyboard();
  const reception = useInventoryReception();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [notes, setNotes] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [scaleOpen, setScaleOpen] = useState(false);
  const [showUnknownBarcode, setShowUnknownBarcode] = useState(false);
  const [unknownBarcode, setUnknownBarcode] = useState('');
  const [initialUnit, setInitialUnit] = useState<string | undefined>(undefined);
  const [initialQuantityPerBox, setInitialQuantityPerBox] = useState<number | undefined>(undefined);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddPackagedProduct, setShowAddPackagedProduct] = useState(false);

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
    const code = cleanBarcode(barcodeInput);
    if (!code) return;

    closeKeyboard();
    ensureSession();
    const result = reception.processBarcodeScan(code, products, productBarcodes);

    if (result === 'not_found') {
      const draft = reception.draftProducts.find(p => p.barcode === code);
      if (draft) {
         const item = reception.items.find(i => i.productName === draft.name && i.unit === draft.unit);
         if (item) {
           reception.updateItemScanCount(item.id, item.scanCount + 1);
         }
         setBarcodeInput('');
         // Re-enfocar inmediatamente después de procesar
         setTimeout(() => document.getElementById('batch-barcode-input')?.focus(), 50);
         return;
      }
      setUnknownBarcode(code);
      setShowUnknownBarcode(true);
      setBarcodeInput('');
      return;
    }

    setBarcodeInput('');
    // Re-enfocar inmediatamente después de escanear exitosamente
    setTimeout(() => document.getElementById('batch-barcode-input')?.focus(), 50);
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
    onSessionConfirmed(session, reception.draftProducts);
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
                    id="batch-barcode-input"
                    placeholder="Escanea o escribe el código..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleBarcodeKeyDown}
                    className="pl-10 min-h-[44px] text-base font-mono"
                    keyboardMode="numeric"
                    preventKeyboardOnFocus
                    autoFocus
                    onBlur={(e) => {
                      if (open && !scaleOpen && !showCancelConfirm && !showUnknownBarcode && !showAddProduct) {
                        if (e.relatedTarget?.tagName !== 'TEXTAREA') {
                          setTimeout(() => { document.getElementById('batch-barcode-input')?.focus(); }, 50);
                        }
                      }
                    }}
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

            {/* Notas - Diseño Mejorado */}
            {reception.items.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-gray-700">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                  <label className="text-sm font-semibold">Observaciones de Recepción</label>
                  <span className="text-xs text-gray-400 font-normal ml-auto">(opcional)</span>
                </div>
                <TouchTextarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Faltó una caja, llegaron productos maltratados..."
                  className="w-full resize-none min-h-[80px] text-sm bg-white"
                />
              </div>
            )}

            {/* Footer: acciones */}
            <div className="flex gap-3 pt-4 border-t mt-4">
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

      {/* Modales internos de creación para Batch Reception */}
      <UnknownBarcodeModal
        open={showUnknownBarcode}
        onClose={() => {
          setShowUnknownBarcode(false);
          setTimeout(() => document.getElementById('batch-barcode-input')?.focus(), 100);
        }}
        barcode={unknownBarcode}
        onRegisterIndividualProduct={(_barcode) => {
          setShowUnknownBarcode(false);
          setInitialUnit(undefined);
          setInitialQuantityPerBox(undefined);
          setShowAddProduct(true);
        }}
        onRegisterPackagedProduct={(_barcode, _qty) => {
          setShowUnknownBarcode(false);
          setInitialQuantityPerBox(_qty);
          setShowAddPackagedProduct(true);
        }}
        onAddToExistingProduct={() => {
          // Funcionalidad simplificada: en recepción por lotes forzamos a crear producto nuevo temporalmente
          // Si eligen agregar a existente, los regresamos indicando que no está implementado en este modo.
          setShowUnknownBarcode(false);
          setBarcodeInput('');
          setTimeout(() => document.getElementById('batch-barcode-input')?.focus(), 100);
        }}
      />

      {/* AddProductModal (producto individual) - no impacta la BD hasta que se confirme la sesión */}
      <AddProductModal
        open={showAddProduct}
        onClose={() => {
          setShowAddProduct(false);
          setInitialUnit(undefined);
          setInitialQuantityPerBox(undefined);
          setTimeout(() => document.getElementById('batch-barcode-input')?.focus(), 100);
        }}
        barId={barId}
        barName={barName}
        initialBarcode={unknownBarcode}
        initialUnit={initialUnit}
        initialQuantityPerBox={initialQuantityPerBox}
        onSave={(data) => {
          reception.addDraftProduct(data);
          setShowAddProduct(false);
          setUnknownBarcode('');
          setInitialUnit(undefined);
          setInitialQuantityPerBox(undefined);
          // Re-enfocar después de guardar el producto
          setTimeout(() => document.getElementById('batch-barcode-input')?.focus(), 100);
        }}
      />

      {/* AddPackagedProductModal (producto en caja/paquete) - no impacta la BD hasta que se confirme la sesión */}
      <AddPackagedProductModal
        open={showAddPackagedProduct}
        onClose={() => {
          setShowAddPackagedProduct(false);
          setInitialQuantityPerBox(undefined);
          setTimeout(() => document.getElementById('batch-barcode-input')?.focus(), 100);
        }}
        barId={barId}
        barName={barName}
        initialBoxBarcode={unknownBarcode}
        initialQuantityPerBox={initialQuantityPerBox}
        onSave={(data) => {
          reception.addDraftProduct(data);
          setShowAddPackagedProduct(false);
          setUnknownBarcode('');
          setInitialQuantityPerBox(undefined);
          // Re-enfocar después de guardar el producto
          setTimeout(() => document.getElementById('batch-barcode-input')?.focus(), 100);
        }}
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
