import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { HistoryEntryTypeBadge } from '@/components/history/HistoryEntryTypeBadge';
import { formatDisplayDate, formatDisplayTime } from '@/lib/dates';
import type { Column } from '@/components/shared/DataTable';
import type { InventoryHistoryEntry } from '@/types';

interface HistoryTableProps {
  entries: InventoryHistoryEntry[];
  page: number;
  pageSize: number;
  totalFiltered: number;
  onPageChange: (page: number) => void;
  /** true cuando se ven todos los bares (muestra columna "Bar") */
  showBarColumn: boolean;
  onRowClick: (entry: InventoryHistoryEntry) => void;
}

/**
 * Tabla de historial de entradas al inventario.
 * Reutiliza DataTable y HistoryEntryTypeBadge.
 *
 * Backend: Los datos vienen de GET /api/inventory-history
 * La paginación se maneja con query params: ?page=1&pageSize=15
 */
export function HistoryTable({
  entries,
  page,
  pageSize,
  totalFiltered,
  onPageChange,
  showBarColumn,
  onRowClick,
}: HistoryTableProps) {
  const totalPages = Math.ceil(totalFiltered / pageSize);

  const columns: Column<InventoryHistoryEntry>[] = [
    // Fecha / Hora
    {
      key: 'timestamp',
      header: 'Fecha / Hora',
      render: (e) => (
        <div>
          <p className="text-sm font-medium text-gray-900">
            {formatDisplayDate(e.timestamp)}
          </p>
          <p className="text-xs text-gray-500">
            {formatDisplayTime(e.timestamp)}
          </p>
        </div>
      ),
    },
    // Bar (condicional)
    ...(showBarColumn ? [{
      key: 'bar',
      header: 'Bar',
      render: (e: InventoryHistoryEntry) => (
        <span className="text-sm text-gray-700 font-medium">{e.barName}</span>
      ),
    }] : []),
    // Producto + categoría
    {
      key: 'product',
      header: 'Producto',
      render: (e) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{e.productName}</p>
          <p className="text-xs text-gray-500">
            {e.productCategory} → {e.productSubcategory}
          </p>
        </div>
      ),
    },
    // Admin
    {
      key: 'admin',
      header: 'Admin',
      render: (e) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-blue-600">
              {e.adminName.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <span className="text-sm text-gray-700">{e.adminName}</span>
        </div>
      ),
    },
    // Tipo de entrada
    {
      key: 'entryType',
      header: 'Tipo',
      render: (e) => <HistoryEntryTypeBadge entryType={e.entryType} />,
    },
    // Cantidad
    {
      key: 'quantity',
      header: 'Cantidad',
      render: (e) => (
        <div>
          <span className="text-sm font-semibold text-green-600">
            +{e.quantity} {e.unit}
          </span>
          {e.entryType === 'scan_box' && e.boxQuantity && e.boxLabel && (
            <p className="text-xs text-amber-600">
              {e.boxQuantity} × {e.boxLabel}
            </p>
          )}
          {e.entryType === 'bulk_weight' && e.weight != null && e.weightUnit && (
            <p className="text-xs text-purple-600">
              {e.weight} {e.weightUnit} (báscula)
            </p>
          )}
        </div>
      ),
    },
    // Stock anterior → nuevo
    {
      key: 'stock',
      header: 'Stock',
      render: (e) => (
        <span className="text-sm text-gray-500">
          {e.previousStock} → <span className="font-medium text-gray-900">{e.newStock}</span>
        </span>
      ),
    },
    // Notas
    {
      key: 'notes',
      header: 'Notas',
      render: (e) => {
        const displayNotes = e.receptionSessionNotes || e.notes;
        return (
          <span className="text-xs text-gray-400 max-w-[150px] truncate block">
            {displayNotes || '—'}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={entries}
        emptyMessage="No se encontraron entradas con los filtros seleccionados"
        onRowClick={onRowClick}
      />

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalFiltered)} de {totalFiltered} entradas
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
            <span className="text-sm text-gray-700 px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="gap-1"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
