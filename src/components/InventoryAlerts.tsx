import { useEffect, useState } from 'react';
import { AlertTriangle, XCircle, Package, ChevronRight, Store, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InventoryAlert, Bar, Product } from '@/types';

interface InventoryAlertsProps {
  alerts: InventoryAlert[];
  bars: Bar[];
  products: Product[];
  onViewAll: () => void;
  /** Callback al hacer click en la flecha de una alerta. Navega al producto en inventario. Backend: GET /api/products/:id */
  onAlertClick?: (alert: InventoryAlert) => void;
  delay?: number;
}

export function InventoryAlerts({ alerts, bars, products, onViewAll, onAlertClick, delay = 0 }: InventoryAlertsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    alerts.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems(prev => [...prev, index]);
      }, 200 + index * 100);
    });
  }, [isVisible, alerts]);

  const criticalAlerts = alerts.filter(a => a.type === 'out_of_stock');
  const lowStockAlerts = alerts.filter(a => a.type === 'low_stock');

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden',
        'transition-all duration-500 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium animate-pulse">
                {alerts.length}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Alertas de Inventario</h3>
            <p className="text-sm text-gray-500">Productos que requieren atención</p>
          </div>
        </div>
        <button
          onClick={onViewAll}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors duration-200"
        >
          Ver todas
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 p-4 border-b border-gray-100">
        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{criticalAlerts.length}</p>
            <p className="text-xs text-red-600/70">Sin stock</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{lowStockAlerts.length}</p>
            <p className="text-xs text-amber-600/70">Stock bajo</p>
          </div>
        </div>
      </div>

      {/* Alert List */}
      <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
        {alerts.map((alert, index) => {
          const isItemVisible = visibleItems.includes(index);
          const isCritical = alert.type === 'out_of_stock';
          const bar = alert.barId ? bars.find(b => b.id === alert.barId) : null;
          const product = products.find(p => p.id === alert.productId);
          const stockPercentage = product ? (alert.currentStock / product.maxStock) * 100 : 0;

          return (
            <div
              key={alert.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border',
                'transition-all duration-500 ease-out',
                'hover:translate-x-1 cursor-pointer',
                isCritical 
                  ? 'bg-red-50 border-red-100 hover:bg-red-100' 
                  : 'bg-amber-50 border-amber-100 hover:bg-amber-100',
                isItemVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
              )}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                isCritical ? 'bg-red-200' : 'bg-amber-200'
              )}>
                {isCritical ? (
                  <XCircle className="w-5 h-5 text-red-700" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {alert.productName}
                  </p>
                </div>

                {/* Categoría / Subcategoría */}
                {product && (
                  <p className="text-xs text-gray-500 mb-1 truncate">
                    {product.category} → {product.subcategory}
                  </p>
                )}

                {/* Bar Badge */}
                {bar && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Store className="w-3 h-3 text-gray-400" />
                    <span className="text-xs font-medium text-gray-600">{bar.name}</span>
                  </div>
                )}

                {/* Stock Info */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        isCritical ? 'bg-red-500' : 'bg-amber-500'
                      )}
                      style={{ width: `${stockPercentage}%` }}
                    />
                  </div>
                  <span className={cn(
                    'text-xs font-medium whitespace-nowrap',
                    isCritical ? 'text-red-600' : 'text-amber-600'
                  )}>
                    {alert.currentStock}/{product?.maxStock || alert.threshold}
                  </span>
                </div>

                <p className={cn(
                  'text-xs mt-1.5',
                  isCritical ? 'text-red-600' : 'text-amber-600'
                )}>
                  {isCritical 
                    ? '⚠️ Producto agotado - Reordenar urgente' 
                    : `⚡ Quedan ${alert.currentStock} unidades - Considerar reorden`
                  }
                </p>
              </div>

              <button
                onClick={() => onAlertClick?.(alert)}
                className="p-1.5 rounded-lg hover:bg-white/50 transition-colors flex-shrink-0"
                title="Ver producto en inventario"
              >
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          );
        })}

        {alerts.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-gray-500 text-sm">No hay alertas de inventario</p>
            <p className="text-gray-400 text-xs mt-1">Todo está bajo control</p>
          </div>
        )}
      </div>
    </div>
  );
}
