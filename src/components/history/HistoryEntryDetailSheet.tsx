import { useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  ScanLine,
  Boxes,
  ClipboardCheck,
  Scale,
  Pencil,
  MapPin,
  Calendar,
  User,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { HistoryEntryTypeBadge } from '@/components/history/HistoryEntryTypeBadge';
import { formatDisplayDate, formatDisplayTime } from '@/lib/dates';
import type { InventoryHistoryEntry, InventoryHistoryEntryType } from '@/types';

interface HistoryEntryDetailSheetProps {
  open: boolean;
  onClose: () => void;
  entry: InventoryHistoryEntry | null;
}

/** Icono principal según el tipo de entrada */
const entryTypeIcons: Record<InventoryHistoryEntryType, React.ElementType> = {
  scan_individual: ScanLine,
  scan_box: Boxes,
  batch_reception: ClipboardCheck,
  bulk_weight: Scale,
  manual_adjustment: Pencil,
};

/** Color de fondo del icono en el header */
const entryTypeHeaderBg: Record<InventoryHistoryEntryType, string> = {
  scan_individual: 'bg-blue-100',
  scan_box: 'bg-amber-100',
  batch_reception: 'bg-green-100',
  bulk_weight: 'bg-purple-100',
  manual_adjustment: 'bg-gray-100',
};

const entryTypeHeaderColor: Record<InventoryHistoryEntryType, string> = {
  scan_individual: 'text-blue-600',
  scan_box: 'text-amber-600',
  batch_reception: 'text-green-600',
  bulk_weight: 'text-purple-600',
  manual_adjustment: 'text-gray-600',
};

/**
 * Panel lateral de detalle para una entrada del historial de inventario.
 * Se abre al hacer click en una fila de la tabla.
 *
 * Muestra toda la información de la entrada, incluyendo secciones
 * condicionales según el tipo de entrada (caja, báscula, lote, etc.).
 *
 * Backend: Los datos vienen de GET /api/inventory-history/:id
 */
export function HistoryEntryDetailSheet({ open, onClose, entry }: HistoryEntryDetailSheetProps) {
  // Mantener referencia a la última entry válida para que el contenido
  // siga visible durante la animación de cierre del Sheet.
  const lastEntryRef = useRef<InventoryHistoryEntry | null>(null);
  if (entry) lastEntryRef.current = entry;
  const displayEntry = entry ?? lastEntryRef.current;

  if (!displayEntry) return null;

  const Icon = entryTypeIcons[displayEntry.entryType];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="sm:max-w-lg w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              entryTypeHeaderBg[displayEntry.entryType]
            )}>
              <Icon className={cn('w-5 h-5', entryTypeHeaderColor[displayEntry.entryType])} />
            </div>
            <div>
              <span className="block">{displayEntry.productName}</span>
              <span className="flex items-center gap-1 text-xs font-normal text-gray-500">
                <MapPin className="w-3 h-3" />
                {displayEntry.barName}
              </span>
            </div>
          </SheetTitle>
          <SheetDescription>
            Detalle del ingreso al inventario
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-5">
          {/* ── Info General ── */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Fecha:</span>
              <span className="font-medium text-gray-900">
                {formatDisplayDate(displayEntry.timestamp)} — {formatDisplayTime(displayEntry.timestamp)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Administrador:</span>
              <span className="font-medium text-gray-900">{displayEntry.adminName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600 ml-6">Tipo de Entrada:</span>
              <HistoryEntryTypeBadge entryType={displayEntry.entryType} />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600 ml-6">Categoría:</span>
              <span className="text-gray-900">
                {displayEntry.productCategory} → {displayEntry.productSubcategory}
              </span>
            </div>
          </div>

          {/* ── Cantidad ── */}
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <h4 className="text-sm font-semibold text-green-800 mb-3">Cantidad Ingresada</h4>
            <div className="flex items-center justify-center gap-3 py-2">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Anterior</p>
                <p className="text-lg font-semibold text-gray-600">{displayEntry.previousStock}</p>
                <p className="text-xs text-gray-400">{displayEntry.unit}</p>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-green-600">+{displayEntry.quantity}</span>
                <ArrowRight className="w-5 h-5 text-green-400 mt-1" />
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Nuevo</p>
                <p className="text-lg font-bold text-green-700">{displayEntry.newStock}</p>
                <p className="text-xs text-gray-400">{displayEntry.unit}</p>
              </div>
            </div>
          </div>

          {/* ── Sección condicional por tipo ── */}

          {/* Escaneo de Caja */}
          {displayEntry.entryType === 'scan_box' && displayEntry.boxQuantity != null && (
            <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Boxes className="w-4 h-4 text-amber-600" />
                <h4 className="text-sm font-semibold text-amber-800">Detalle de Cajas</h4>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700">
                  <span className="font-medium">{displayEntry.boxQuantity}</span> × {displayEntry.boxLabel}
                </p>
                <p className="text-amber-700 font-medium">
                  = {displayEntry.quantity} {displayEntry.unit} individuales
                </p>
                {displayEntry.barcodeScanned && (
                  <p className="text-gray-500">
                    Código: <span className="font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded">{displayEntry.barcodeScanned}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Escaneo Individual */}
          {displayEntry.entryType === 'scan_individual' && displayEntry.barcodeScanned && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <ScanLine className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-semibold text-blue-800">Detalle de Escaneo</h4>
              </div>
              <p className="text-sm text-gray-700">
                Código: <span className="font-mono text-xs bg-blue-100 px-1.5 py-0.5 rounded">{displayEntry.barcodeScanned}</span>
              </p>
            </div>
          )}

          {/* Recepción por Lote */}
          {displayEntry.entryType === 'batch_reception' && (
            <div className="bg-green-50 rounded-lg border border-green-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardCheck className="w-4 h-4 text-green-600" />
                <h4 className="text-sm font-semibold text-green-800">Sesión de Recepción</h4>
              </div>
              <div className="space-y-2 text-sm">
                {displayEntry.receptionSessionId && (
                  <p className="text-gray-500">
                    ID Sesión: <span className="font-mono text-xs bg-green-100 px-1.5 py-0.5 rounded">{displayEntry.receptionSessionId}</span>
                  </p>
                )}
                {displayEntry.receptionSessionNotes && (
                  <div className="mt-2 p-3 bg-white rounded-md border border-green-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">Notas de la sesión:</p>
                    <p className="text-sm text-gray-700 italic">{displayEntry.receptionSessionNotes}</p>
                  </div>
                )}
                <p className="text-xs text-green-600 mt-2">
                  Este ingreso fue parte de una sesión de recepción por lotes.
                </p>
              </div>
            </div>
          )}

          {/* Báscula */}
          {displayEntry.entryType === 'bulk_weight' && displayEntry.weight != null && (
            <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Scale className="w-4 h-4 text-purple-600" />
                <h4 className="text-sm font-semibold text-purple-800">Detalle de Peso</h4>
              </div>
              <p className="text-sm text-gray-700">
                Peso registrado: <span className="font-semibold text-purple-700">{displayEntry.weight} {displayEntry.weightUnit}</span>
              </p>
            </div>
          )}

          {/* Ajuste Manual */}
          {displayEntry.entryType === 'manual_adjustment' && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Pencil className="w-4 h-4 text-gray-600" />
                <h4 className="text-sm font-semibold text-gray-800">Ajuste Manual</h4>
              </div>
              <p className="text-sm text-gray-600">
                Ajuste manual de inventario realizado por el administrador.
              </p>
            </div>
          )}

          {/* ── Notas ── */}
          {displayEntry.notes && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <h4 className="text-sm font-semibold text-gray-700">Notas</h4>
              </div>
              <p className="text-sm text-gray-600">{displayEntry.notes}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
