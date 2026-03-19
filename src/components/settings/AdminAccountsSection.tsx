import { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, ShieldCheck, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import type { Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { AdminFormModal } from './AdminFormModal';
import type { AdminAccount } from '@/types';

interface AdminAccountsSectionProps {
  admins: AdminAccount[];
  currentAdminId: string;
  onAddAdmin: (data: Omit<AdminAccount, 'id' | 'createdAt'>) => void;
  onUpdateAdmin: (id: string, data: Omit<AdminAccount, 'id' | 'createdAt'>) => void;
  onDeleteAdmin: (id: string) => void;
}

export function AdminAccountsSection({
  admins,
  currentAdminId,
  onAddAdmin,
  onUpdateAdmin,
  onDeleteAdmin,
}: AdminAccountsSectionProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminAccount | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<AdminAccount | null>(null);
  const [visibleCodes, setVisibleCodes] = useState<Set<string>>(new Set());

  const toggleCode = (id: string) => {
    setVisibleCodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = (data: Omit<AdminAccount, 'id' | 'createdAt'>) => {
    if (editingAdmin) {
      onUpdateAdmin(editingAdmin.id, data);
    } else {
      onAddAdmin(data);
    }
    setEditingAdmin(undefined);
  };

  const columns: Column<AdminAccount>[] = [
    {
      key: 'name',
      header: 'Nombre',
      render: (a) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-blue-700">
              {a.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {a.name}
              {a.id === currentAdminId && (
                <span className="ml-2 text-xs text-blue-600 font-normal">(Tú)</span>
              )}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Teléfono',
      render: (a) => <span className="text-sm text-gray-600">{a.phone || '—'}</span>,
    },
    {
      key: 'accessCode',
      header: 'Código de Acceso',
      render: (a) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-gray-500">
            {visibleCodes.has(a.id) ? a.accessCode : '••••'}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); toggleCode(a.id); }}
            className="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
          >
            {visibleCodes.has(a.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (a) => (
        <StatusBadge variant={a.isActive ? 'success' : 'error'}>
          <span className="flex items-center gap-1">
            {a.isActive ? <ShieldCheck className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
            {a.isActive ? 'Activa' : 'Inactiva'}
          </span>
        </StatusBadge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Creado',
      render: (a) => <span className="text-sm text-gray-500">{a.createdAt}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (a) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setEditingAdmin(a); setFormOpen(true); }}
            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {a.id !== currentAdminId && (
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(a); }}
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Cuentas de Administrador
          </h3>
          <span className="text-xs text-gray-400 ml-1">({admins.length})</span>
        </div>
        <Button
          onClick={() => { setEditingAdmin(undefined); setFormOpen(true); }}
          className="gap-2 bg-blue-500 hover:bg-blue-600"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </Button>
      </div>

      <div className="p-5">
        <DataTable
          columns={columns}
          data={admins}
          emptyMessage="No hay cuentas de administrador"
        />
      </div>

      <AdminFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingAdmin(undefined); }}
        onSave={handleSave}
        admin={editingAdmin}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteAdmin(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        title="Eliminar Administrador"
        description={`¿Estás seguro de eliminar la cuenta de "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
