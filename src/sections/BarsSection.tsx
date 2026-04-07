import { useState } from 'react';
import { Store, Plus, MapPin, Users, Package, TrendingUp, Edit2, Trash2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useBarManagement } from '@/hooks/useBarManagement';
import { useInventory } from '@/contexts/InventoryContext';
import { BarFormModal } from '@/components/bars/BarFormModal';
import { BarInfoTab } from '@/components/bars/BarInfoTab';
import { BarPersonalTab } from '@/components/bars/BarPersonalTab';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Bar, Worker } from '@/types';

export function BarsSection() {
  const {
    bars,
    workers,
    addBar,
    updateBar,
    deleteBar,
    addWorker,
    updateWorker,
    deleteWorker,
  } = useBarManagement();
  const { products } = useInventory();

  const [selectedBarId, setSelectedBarId] = useState(bars[0]?.id ?? '');
  const [barFormOpen, setBarFormOpen] = useState(false);
  const [editingBar, setEditingBar] = useState<Bar | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Bar | null>(null);

  const selectedBar = bars.find(b => b.id === selectedBarId);

  const getBarStats = (barId: string) => {
    const barProducts = products.filter(p => p.barId === barId);
    const barWorkers = workers.filter(w => w.barIds.includes(barId));
    return {
      productCount: barProducts.length,
      inventoryValue: barProducts.reduce((sum, p) => sum + p.stock * p.price, 0),
      workerCount: barWorkers.length,
    };
  };

  /**
   * Crear o actualizar un bar.
   *
   * Backend:
   *   Crear → POST /api/bars         Body: Omit<Bar, 'id'>   Response: Bar
   *   Editar → PUT /api/bars/:barId   Body: Omit<Bar, 'id'>   Response: Bar
   */
  const handleSaveBar = async (data: Omit<Bar, 'id'>) => {
    if (editingBar) {
      await updateBar(editingBar.id, data);
      toast.success(`Almacén "${data.name}" actualizado`, {
        description: 'Los cambios han sido guardados',
      });
    } else {
      const newBar = await addBar(data);
      setSelectedBarId(newBar.id);
      toast.success(`Almacén "${data.name}" creado`, {
        description: `Ubicación: ${data.location}`,
      });
    }
    setEditingBar(undefined);
  };

  /**
   * Eliminar un bar.
   *
   * Backend:
   *   DELETE /api/bars/:barId
   *   Response: { success: boolean }
   */
  const handleDeleteBar = async () => {
    if (!deleteTarget) return;
    const deletedName = deleteTarget.name;
    await deleteBar(deleteTarget.id);
    setDeleteTarget(null);
    if (selectedBarId === deleteTarget.id) {
      setSelectedBarId(bars.find(b => b.id !== deleteTarget.id)?.id ?? '');
    }
    toast.success(`Almacén "${deletedName}" eliminado`, {
      description: 'El almacén fue eliminado correctamente',
    });
  };

  // ─── Wrappers de Worker con notificaciones ───

  const handleAddWorker = async (data: Omit<Worker, 'id' | 'createdAt'>) => {
    await addWorker(data);
    toast.success(`Trabajador "${data.name}" agregado`, {
      description: `Asignado a ${data.barIds.length} almacén(es)`,
    });
  };

  const handleUpdateWorker = async (id: string, data: Partial<Worker>) => {
    await updateWorker(id, data);
    toast.success(`Trabajador "${data.name || 'seleccionado'}" actualizado`, {
      description: 'Los cambios han sido guardados',
    });
  };

  const handleDeleteWorker = async (id: string) => {
    const worker = workers.find(w => w.id === id);
    await deleteWorker(id);
    toast.success(`Trabajador "${worker?.name || ''}" eliminado`, {
      description: 'El trabajador fue removido del sistema',
    });
  };



  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Gestión de Almacenes</h2>
        <Button
          onClick={() => { setEditingBar(undefined); setBarFormOpen(true); }}
          className="gap-2 bg-blue-500 hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" />
          Agregar Almacén
        </Button>
      </div>

      {/* Bars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {bars.map((bar, index) => {
          const isActive = bar.id === selectedBarId;
          const stats = getBarStats(bar.id);

          return (
            <button
              key={bar.id}
              onClick={() => setSelectedBarId(bar.id)}
              className={cn(
                'relative text-left p-5 rounded-xl border-2 transition-all duration-300',
                'hover:shadow-lg hover:-translate-y-1',
                isActive
                  ? 'border-blue-500 bg-blue-50 shadow-blue-100'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center mb-4',
                isActive ? 'bg-blue-500' : 'bg-gray-100'
              )}>
                <Store className={cn(
                  'w-7 h-7',
                  isActive ? 'text-white' : 'text-gray-500'
                )} />
              </div>

              <h3 className={cn(
                'text-lg font-semibold mb-1',
                isActive ? 'text-blue-900' : 'text-gray-900'
              )}>
                {bar.name}
              </h3>

              <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
                <MapPin className="w-4 h-4" />
                {bar.location}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">Productos</p>
                  <p className={cn(
                    'text-lg font-bold',
                    isActive ? 'text-blue-700' : 'text-gray-900'
                  )}>
                    {stats.productCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Personal</p>
                  <p className={cn(
                    'text-lg font-bold',
                    isActive ? 'text-blue-700' : 'text-gray-900'
                  )}>
                    {stats.workerCount}
                  </p>
                </div>
              </div>

              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Bar Details */}
      {selectedBar && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-blue-500 flex items-center justify-center">
                <Store className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedBar.name}</h3>
                <div className="flex items-center gap-2 text-gray-500">
                  <MapPin className="w-4 h-4" />
                  {selectedBar.location}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="gap-2 hover:border-blue-500 hover:text-blue-600"
                onClick={() => { setEditingBar(selectedBar); setBarFormOpen(true); }}
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </Button>
              <Button
                variant="outline"
                className="gap-2 text-red-600 hover:bg-red-50 hover:border-red-300"
                onClick={() => setDeleteTarget(selectedBar)}
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </Button>
            </div>
          </div>

          {/* Stats Summary */}
          {(() => {
            const stats = getBarStats(selectedBar.id);
            return (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <Package className="w-4 h-4" />
                    <span className="text-sm">Productos</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.productCount}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">Valor Inventario</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">${stats.inventoryValue.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Personal</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.workerCount}</p>
                </div>
              </div>
            );
          })()}

          {/* Tabs */}
          <Tabs defaultValue="info">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="info" className="gap-1.5">
                <Info className="w-4 h-4" />
                Información
              </TabsTrigger>
              <TabsTrigger value="personal" className="gap-1.5">
                <Users className="w-4 h-4" />
                Personal
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <BarInfoTab
                bar={selectedBar}
                productCount={getBarStats(selectedBar.id).productCount}
                workerCount={getBarStats(selectedBar.id).workerCount}
              />
            </TabsContent>

            <TabsContent value="personal">
              <BarPersonalTab
                barId={selectedBar.id}
                bars={bars}
                workers={workers}
                onAddWorker={handleAddWorker}
                onUpdateWorker={handleUpdateWorker}
                onDeleteWorker={handleDeleteWorker}
              />
            </TabsContent>

          </Tabs>
        </div>
      )}

      {/* Bar Form Modal (Add / Edit) */}
      <BarFormModal
        open={barFormOpen}
        onClose={() => { setBarFormOpen(false); setEditingBar(undefined); }}
        onSave={handleSaveBar}
        bar={editingBar}
      />

      {/* Delete Bar Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteBar}
        title="Eliminar Almacén"
        description={`¿Estás seguro de eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
