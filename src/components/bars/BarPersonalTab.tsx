import { useState } from 'react';
import { Plus, Edit2, Trash2, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { WorkerFormModal } from './WorkerFormModal';
import type { Column } from '@/components/shared/DataTable';
import type { Bar, Worker } from '@/types';

interface BarPersonalTabProps {
  barId: string;
  bars: Bar[];
  workers: Worker[];
  onAddWorker: (data: Omit<Worker, 'id' | 'createdAt'>) => void;
  onUpdateWorker: (id: string, data: Partial<Worker>) => void;
  onDeleteWorker: (id: string) => void;
}

export function BarPersonalTab({ barId, bars, workers, onAddWorker, onUpdateWorker, onDeleteWorker }: BarPersonalTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Worker | null>(null);

  const barWorkers = workers.filter(w => w.barIds.includes(barId));

  const handleSave = (data: Omit<Worker, 'id' | 'createdAt'>) => {
    if (editingWorker) {
      onUpdateWorker(editingWorker.id, data);
    } else {
      onAddWorker(data);
    }
    setEditingWorker(undefined);
  };

  const columns: Column<Worker>[] = [
    {
      key: 'name',
      header: 'Nombre',
      render: (w) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-xs font-semibold text-blue-700">
              {w.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{w.name}</p>
            <p className="text-xs text-gray-500">{w.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'pin',
      header: 'PIN',
      render: () => <span className="text-sm font-mono text-gray-500">••••</span>,
    },
    {
      key: 'phone',
      header: 'Teléfono',
      render: (w) => <span className="text-sm text-gray-600">{w.phone}</span>,
    },
    {
      key: 'bars',
      header: 'Bares Asignados',
      render: (w) => (
        <div className="flex flex-wrap gap-1">
          {w.barIds.map(bid => {
            const bar = bars.find(b => b.id === bid);
            return bar ? (
              <span key={bid} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                {bar.name}
              </span>
            ) : null;
          })}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (w) => (
        <StatusBadge variant={w.isActive ? 'success' : 'error'}>
          <span className="flex items-center gap-1">
            {w.isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
            {w.isActive ? 'Activo' : 'Inactivo'}
          </span>
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (w) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setEditingWorker(w); setFormOpen(true); }}
            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(w); }}
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{barWorkers.length} trabajador(es) asignado(s)</p>
        <Button onClick={() => { setEditingWorker(undefined); setFormOpen(true); }} className="gap-2 bg-blue-500 hover:bg-blue-600" size="sm">
          <Plus className="w-4 h-4" />
          Agregar Personal
        </Button>
      </div>

      <DataTable columns={columns} data={barWorkers} emptyMessage="No hay personal asignado a este bar" />

      <WorkerFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingWorker(undefined); }}
        onSave={handleSave}
        worker={editingWorker}
        bars={bars}
        currentBarId={barId}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { onDeleteWorker(deleteTarget.id); setDeleteTarget(null); } }}
        title="Eliminar Personal"
        description={`¿Estás seguro de eliminar a ${deleteTarget?.name}? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
