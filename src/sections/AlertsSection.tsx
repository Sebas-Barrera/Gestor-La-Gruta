import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import { BarSelector } from '@/components/BarSelector';
import { cn } from '@/lib/utils';
import { inventoryAlerts, bars, products as allProducts } from '@/data/mockData';

/**
 * Sección de Alertas de Inventario.
 *
 * Muestra alertas de stock bajo y agotado por bar.
 * El usuario selecciona un bar y ve solo las alertas de ese bar.
 *
 * Tipos de alerta:
 *   - out_of_stock (stock <= 0): Producto agotado — requiere reorden urgente
 *   - low_stock (stock <= minStock): Stock bajo — considerar reorden
 *
 * Backend:
 *   GET /api/alerts?barId=:barId → InventoryAlert[]
 *   Las alertas se generan dinámicamente en base al stock actual vs minStock.
 *   El backend puede computarlas en tiempo real o mantener una tabla de alertas
 *   que se actualice con triggers cuando el stock cambie.
 *
 *   Tabla sugerida (si se persisten):
 *   alerts (id, product_id FK, bar_id FK, type ENUM('low_stock','out_of_stock'),
 *           current_stock DECIMAL, threshold DECIMAL, created_at TIMESTAMP,
 *           resolved_at TIMESTAMP NULLABLE)
 */
export function AlertsSection() {
  const [searchParams] = useSearchParams();
  /** Lee ?bar=<id> de la URL (desde Dashboard "Ver historial completo") */
  const initialBarId = searchParams.get('bar') || 'all';
  const [activeBarId, setActiveBarId] = useState(initialBarId);

  // Filtrar alertas por bar seleccionado
  const filteredAlerts = useMemo(() => {
    if (activeBarId === 'all') return inventoryAlerts;
    return inventoryAlerts.filter(a => a.barId === activeBarId);
  }, [activeBarId]);

  // Contadores para el resumen
  const outOfStockCount = filteredAlerts.filter(a => a.type === 'out_of_stock').length;
  const lowStockCount = filteredAlerts.filter(a => a.type === 'low_stock').length;

  // Ordenar: out_of_stock primero (más urgente), luego low_stock
  const sortedAlerts = useMemo(() => {
    return [...filteredAlerts].sort((a, b) => {
      if (a.type === 'out_of_stock' && b.type !== 'out_of_stock') return -1;
      if (a.type !== 'out_of_stock' && b.type === 'out_of_stock') return 1;
      return a.currentStock - b.currentStock;
    });
  }, [filteredAlerts]);

  return (
    <div className="p-6 space-y-6">
      {/* Bar Selector — incluye opción "Todos" */}
      <BarSelector
        bars={bars}
        activeBarId={activeBarId}
        onBarChange={setActiveBarId}
        showAllOption
        delay={0}
      />

      {/* Resumen de alertas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{filteredAlerts.length}</p>
            <p className="text-sm text-gray-500">Alertas totales</p>
          </div>
        </div>

        {/* Agotados */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
            <p className="text-sm text-gray-500">Productos agotados</p>
          </div>
        </div>

        {/* Stock bajo */}
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
          <h3 className="text-lg font-semibold text-gray-900">
            Alertas Activas
          </h3>
          <span className="text-sm text-gray-500">
            {activeBarId === 'all' ? 'Todos los bares' : bars.find(b => b.id === activeBarId)?.name}
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {sortedAlerts.map((alert, index) => {
            const isCritical = alert.type === 'out_of_stock';
            const product = allProducts.find(p => p.id === alert.productId);
            const unit = product?.isWeightBased ? product.weightUnit : product?.unit || 'uds';

            return (
              <div
                key={alert.id}
                className={cn(
                  'flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors duration-200',
                  'animate-in slide-in-from-bottom-2 duration-300'
                )}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {/* Icono */}
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                  isCritical ? 'bg-red-100' : 'bg-amber-100'
                )}>
                  {isCritical ? (
                    <XCircle className="w-6 h-6 text-red-600" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-base font-semibold text-gray-900 truncate">
                      {alert.productName}
                    </h4>
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap',
                      isCritical
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    )}>
                      {isCritical ? 'Sin Stock' : 'Stock Bajo'}
                    </span>
                  </div>
                  <p className={cn(
                    'text-sm',
                    isCritical ? 'text-red-600' : 'text-amber-600'
                  )}>
                    {isCritical
                      ? 'Producto agotado — reordenar urgente'
                      : `Quedan ${alert.currentStock} ${unit} (mínimo: ${alert.threshold})`
                    }
                  </p>
                  {/* Categoría y bar */}
                  {product && (
                    <p className="text-xs text-gray-400 mt-1">
                      {product.category} → {product.subcategory}
                      {alert.barName && ` · ${alert.barName}`}
                    </p>
                  )}
                </div>

                {/* Barra de stock visual */}
                <div className="hidden sm:flex flex-col items-end gap-1 min-w-[100px]">
                  <span className="text-xs font-medium text-gray-500">
                    {alert.currentStock} / {product?.maxStock ?? '—'} {unit}
                  </span>
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        isCritical ? 'bg-red-500' : 'bg-amber-500'
                      )}
                      style={{
                        width: `${Math.min(100, ((alert.currentStock / (product?.maxStock || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Estado vacío */}
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
                ? 'Todo el inventario está bajo control'
                : `El inventario de ${bars.find(b => b.id === activeBarId)?.name} está bajo control`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
