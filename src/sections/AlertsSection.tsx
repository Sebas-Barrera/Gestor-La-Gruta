import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import { BarSelector } from '@/components/BarSelector';
import { cn } from '@/lib/utils';
import { useInventory } from '@/contexts/InventoryContext';
import { useBarManagement } from '@/hooks/useBarManagement';
import type { InventoryAlert } from '@/types';

export function AlertsSection() {
  const [searchParams] = useSearchParams();
  const initialBarId = searchParams.get('bar') || 'all';
  const [activeBarId, setActiveBarId] = useState(initialBarId);

  const { products } = useInventory();
  const { bars } = useBarManagement();

  // ── Alertas calculadas en tiempo real desde stock actual ─────────────
  const allAlerts = useMemo((): InventoryAlert[] => {
    return products
      .filter(p => p.stock <= p.minStock || p.stock <= 0)
      .map(p => ({
        id: p.id,
        productId: p.id,
        productName: p.name,
        type: p.stock <= 0 ? 'out_of_stock' as const : 'low_stock' as const,
        currentStock: p.stock,
        threshold: p.minStock,
        timestamp: new Date().toISOString(),
        barId: p.barId ?? '',
        barName: bars.find(b => b.id === p.barId)?.name,
      }));
  }, [products, bars]);

  const filteredAlerts = useMemo(() => {
    if (activeBarId === 'all') return allAlerts;
    return allAlerts.filter(a => a.barId === activeBarId);
  }, [allAlerts, activeBarId]);

  const outOfStockCount = filteredAlerts.filter(a => a.type === 'out_of_stock').length;
  const lowStockCount = filteredAlerts.filter(a => a.type === 'low_stock').length;

  const sortedAlerts = useMemo(() => {
    return [...filteredAlerts].sort((a, b) => {
      if (a.type === 'out_of_stock' && b.type !== 'out_of_stock') return -1;
      if (a.type !== 'out_of_stock' && b.type === 'out_of_stock') return 1;
      return a.currentStock - b.currentStock;
    });
  }, [filteredAlerts]);

  return (
    <div className="p-6 space-y-6">
      <BarSelector
        bars={bars}
        activeBarId={activeBarId}
        onBarChange={setActiveBarId}
        showAllOption
        delay={0}
      />

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{filteredAlerts.length}</p>
            <p className="text-sm text-gray-500">Alertas totales</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
            <p className="text-sm text-gray-500">Productos agotados</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
            <p className="text-sm text-gray-500">Stock bajo</p>
          </div>
        </div>
      </div>

      {/* Lista de alertas */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Alertas Activas</h3>
          <span className="text-sm text-gray-500">
            {activeBarId === 'all' ? 'Todos los bares' : bars.find(b => b.id === activeBarId)?.name}
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {sortedAlerts.map((alert, index) => {
            const isCritical = alert.type === 'out_of_stock';
            const product = products.find(p => p.id === alert.productId);
            const unit = product?.isWeightBased ? product.weightUnit : product?.unit || 'uds';

            return (
              <div
                key={alert.id}
                className={cn(
                  'flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors duration-200',
                  'animate-in slide-in-from-bottom-2 duration-300',
                )}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                  isCritical ? 'bg-red-100' : 'bg-amber-100',
                )}>
                  {isCritical ? (
                    <XCircle className="w-6 h-6 text-red-600" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-base font-semibold text-gray-900 truncate">
                      {alert.productName}
                    </h4>
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap',
                      isCritical
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700',
                    )}>
                      {isCritical ? 'Sin Stock' : 'Stock Bajo'}
                    </span>
                  </div>
                  <p className={cn('text-sm', isCritical ? 'text-red-600' : 'text-amber-600')}>
                    {isCritical
                      ? 'Producto agotado — reordenar urgente'
                      : `Quedan ${alert.currentStock} ${unit} (mínimo: ${alert.threshold})`}
                  </p>
                  {product && (
                    <p className="text-xs text-gray-400 mt-1">
                      {product.category} → {product.subcategory}
                      {alert.barName && ` · ${alert.barName}`}
                    </p>
                  )}
                </div>

                <div className="hidden sm:flex flex-col items-end gap-1 min-w-[100px]">
                  <span className="text-xs font-medium text-gray-500">
                    {alert.currentStock} / {product?.maxStock ?? '—'} {unit}
                  </span>
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        isCritical ? 'bg-red-500' : 'bg-amber-500',
                      )}
                      style={{
                        width: `${Math.min(100, (alert.currentStock / (product?.maxStock || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {sortedAlerts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-1">
              No hay alertas activas
            </h4>
            <p className="text-sm text-gray-500">
              {activeBarId === 'all'
                ? 'Todos los productos tienen stock suficiente'
                : 'Este bar tiene stock suficiente en todos sus productos'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
