import { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { CredentialFormModal } from './CredentialFormModal';
import type { Column } from '@/components/shared/DataTable';
import type { BarCredential } from '@/types';

interface BarCredentialsTabProps {
  barId: string;
  credentials: BarCredential[];
  onAddCredential: (data: Omit<BarCredential, 'id'>) => void;
  onUpdateCredential: (id: string, data: Partial<BarCredential>) => void;
  onDeleteCredential: (id: string) => void;
}

export function BarCredentialsTab({ barId, credentials, onAddCredential, onUpdateCredential, onDeleteCredential }: BarCredentialsTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingCred, setEditingCred] = useState<BarCredential | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<BarCredential | null>(null);
  const [visibleCodes, setVisibleCodes] = useState<Set<string>>(new Set());

  const barCredentials = credentials.filter(c => c.barId === barId);

  const toggleCode = (id: string) => {
    setVisibleCodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = (data: Omit<BarCredential, 'id'>) => {
    if (editingCred) {
      onUpdateCredential(editingCred.id, data);
    } else {
      onAddCredential(data);
    }
    setEditingCred(undefined);
  };

  const columns: Column<BarCredential>[] = [
    {
      key: 'label',
      header: 'Etiqueta',
      render: (c) => <span className="text-sm font-medium text-gray-900">{c.label || 'Sin etiqueta'}</span>,
    },
    {
      key: 'accessCode',
      header: 'Código de Acceso',
      render: (c) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-gray-600">
            {visibleCodes.has(c.id) ? c.accessCode : '••••'}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); toggleCode(c.id); }}
            className="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
          >
            {visibleCodes.has(c.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (c) => (
        <StatusBadge variant={c.isActive ? 'success' : 'neutral'}>
          {c.isActive ? 'Activa' : 'Inactiva'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setEditingCred(c); setFormOpen(true); }}
            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}
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
        <p className="text-sm text-gray-500">{barCredentials.length} credencial(es)</p>
        <Button onClick={() => { setEditingCred(undefined); setFormOpen(true); }} className="gap-2 bg-blue-500 hover:bg-blue-600" size="sm">
          <Plus className="w-4 h-4" />
          Agregar Credencial
        </Button>
      </div>

      <DataTable columns={columns} data={barCredentials} emptyMessage="No hay credenciales para este bar" />

      <CredentialFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingCred(undefined); }}
        onSave={handleSave}
        credential={editingCred}
        barId={barId}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { onDeleteCredential(deleteTarget.id); setDeleteTarget(null); } }}
        title="Eliminar Credencial"
        description={`¿Estás seguro de eliminar la credencial "${deleteTarget?.label || 'Sin etiqueta'}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
