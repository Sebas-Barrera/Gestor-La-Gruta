import { ArrowDownCircle, ArrowUpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDisplayDate, formatDisplayTime } from '@/lib/dates';
import type { Column } from '@/components/shared/DataTable';
import type { InventoryMovement, Bar, Product } from '@/types';

interface ReportMovementsTableProps {
  movements: InventoryMovement[];
  bars: Bar[];
  /** Productos disponibles para lookup de categoría/subcategoría */
  products: Product[];
  page: number;
  pageSize: number;
  totalFiltered: number;
  onPageChange: (page: number) => void;
  /** true cuando se ven todos los bares (muestra columna "Bar") */
  showBarColumn: boolean;
}

/**
 * Tabla de movimientos de inventario para el módulo de reportes.
 * Reutiliza DataTable y StatusBadge existentes.
 *
 * Backend: Los datos vienen de GET /api/reports/movements
 * La paginación se maneja con query params: ?page=1&pageSize=15
 */
export function ReportMovementsTable({
  movements,
  bars,
  products,
  page,
  pageSize,
  totalFiltered,
  onPageChange,
  showBarColumn,
}: ReportMovementsTableProps) {
  const totalPages = Math.ceil(totalFiltered / pageSize);

  /** Busca el nombre del bar por ID */
  const getBarName = (barId: string): string => {
    return bars.find(b => b.id === barId)?.name || barId;
  };

  const columns: Column<InventoryMovement>[] = [
    // Columna de fecha/hora
    {
      key: 'timestamp',
      header: 'Fecha / Hora',
      render: (m) => (
        <div>
          <p className="text-sm font-medium text-gray-900">
            {formatDisplayDate(m.timestamp)}
          </p>
          <p className="text-xs text-gray-500">
            {formatDisplayTime(m.timestamp)}
          </p>
        </div>
      ),
    },
    // Columna de bar (solo visible en vista general)
    ...(showBarColumn ? [{
      key: 'bar',
      header: 'Bar',
      render: (m: InventoryMovement) => (
        <span className="text-sm text-gray-700 font-medium">{getBarName(m.barId)}</span>
      ),
    }] : []),
    // Producto + categoría/subcategoría
    {
      key: 'product',
      header: 'Producto',
      render: (m) => {
        const product = products.find(p => p.id === m.productId);
        return (
          <div>
            <p className="text-sm font-medium text-gray-900">{m.productName}</p>
            {product && (
              <p className="text-xs text-gray-500">
                {product.category} → {product.subcategory}
              </p>
            )}
          </div>
        );
      },
    },
    // Tipo de movimiento
    {
      key: 'type',
      header: 'Tipo',
      render: (m) => (
        <StatusBadge variant={m.type === 'in' ? 'success' : 'error'}>
          <span className="flex items-center gap-1">
            {m.type === 'in'
              ? <ArrowDownCircle className="w-3 h-3" />
              : <ArrowUpCircle className="w-3 h-3" />
            }
            {m.type === 'in' ? 'Entrada' : 'Salida'}
          </span>
        </StatusBadge>
      ),
    },
    // Cantidad anterior
    {
      key: 'previous',
      header: 'Anterior',
      render: (m) => (
        <span className="text-sm text-gray-500">
          {m.previousQuantity} {m.unit}
        </span>
      ),
    },
    // Cambio (+/-)
    {
      key: 'quantity',
      header: 'Cambio',
      render: (m) => (
        <span className={`text-sm font-semibold ${m.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
          {m.type === 'in' ? '+' : '-'}{m.quantity} {m.unit}
        </span>
      ),
    },
    // Cantidad nueva
    {
      key: 'new',
      header: 'Nueva',
      render: (m) => (
        <span className="text-sm font-medium text-gray-900">
          {m.newQuantity} {m.unit}
        </span>
      ),
    },
    // Trabajador
    {
      key: 'worker',
      header: 'Responsable',
      render: (m) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-blue-600">
              {m.workerName.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <span className="text-sm text-gray-700">{m.workerName}</span>
        </div>
      ),
    },
    // Notas
    {
      key: 'notes',
      header: 'Notas',
      render: (m) => (
        <span className="text-xs text-gray-400 max-w-[150px] truncate block">
          {m.notes || '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={movements}
        emptyMessage="No se encontraron movimientos con los filtros seleccionados"
      />

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalFiltered)} de {totalFiltered} movimientos
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
