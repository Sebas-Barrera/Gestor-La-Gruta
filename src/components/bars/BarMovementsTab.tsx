import { useState, useMemo } from 'react';
import { ArrowDownCircle, ArrowUpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { FilterBar } from '@/components/shared/FilterBar';
import type { FilterConfig } from '@/components/shared/FilterBar';
import type { Column } from '@/components/shared/DataTable';
import type { InventoryMovement, Worker } from '@/types';

interface BarMovementsTabProps {
  barId: string;
  movements: InventoryMovement[];
  workers: Worker[];
}

export function BarMovementsTab({ barId, movements, workers }: BarMovementsTabProps) {
  const [filters, setFilters] = useState<Record<string, string>>({
    search: '',
    worker: '',
    type: '',
    pageSize: '10',
  });
  const [page, setPage] = useState(1);

  const barMovements = movements.filter(m => m.barId === barId);
  const barWorkers = workers.filter(w => w.barIds.includes(barId));

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const filterConfigs: FilterConfig[] = [
    {
      type: 'search',
      key: 'search',
      label: 'Buscar',
      placeholder: 'Buscar producto...',
    },
    {
      type: 'select',
      key: 'worker',
      label: 'Todos los trabajadores',
      options: barWorkers.map(w => ({ value: w.id, label: w.name })),
    },
    {
      type: 'select',
      key: 'type',
      label: 'Todos los tipos',
      options: [
        { value: 'in', label: 'Entrada' },
        { value: 'out', label: 'Salida' },
      ],
    },
    {
      type: 'page-size',
      key: 'pageSize',
      label: 'Por página',
    },
  ];

  const filtered = useMemo(() => {
    return barMovements.filter(m => {
      if (filters.search && !m.productName.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.worker && m.workerId !== filters.worker) return false;
      if (filters.type && m.type !== filters.type) return false;
      return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [barMovements, filters]);

  const pageSize = Number(filters.pageSize) || 10;
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const columns: Column<InventoryMovement>[] = [
    {
      key: 'product',
      header: 'Producto',
      render: (m) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{m.productName}</p>
        </div>
      ),
    },
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
    {
      key: 'previous',
      header: 'Cant. Anterior',
      render: (m) => (
        <span className="text-sm text-gray-600">
          {m.previousQuantity} {m.unit}
        </span>
      ),
    },
    {
      key: 'new',
      header: 'Cant. Nueva',
      render: (m) => (
        <span className="text-sm font-medium text-gray-900">
          {m.newQuantity} {m.unit}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: 'Cambio',
      render: (m) => (
        <span className={`text-sm font-semibold ${m.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
          {m.type === 'in' ? '+' : '-'}{m.quantity} {m.unit}
        </span>
      ),
    },
    {
      key: 'worker',
      header: 'Trabajador',
      render: (m) => <span className="text-sm text-gray-600">{m.workerName}</span>,
    },
    {
      key: 'timestamp',
      header: 'Fecha / Hora',
      render: (m) => (
        <span className="text-sm text-gray-500">
          {new Date(m.timestamp).toLocaleString('es-MX', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'notes',
      header: 'Notas',
      render: (m) => <span className="text-xs text-gray-400">{m.notes || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-4 pt-4">
      <FilterBar filters={filterConfigs} values={filters} onChange={handleFilterChange} />

      <DataTable columns={columns} data={paginated} emptyMessage="No hay movimientos registrados" />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} de {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
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
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
