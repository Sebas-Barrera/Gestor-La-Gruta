import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Package,
  DollarSign,
  AlertTriangle,
  XCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Bar, Product, InventoryAlert, InventoryMovement } from '@/types';

/**
 * Props para el panel de reporte del bar.
 *
 * Backend: Este componente consume datos que vendrían de estos endpoints:
 * - GET /api/bars/:barId                → info del bar
 * - GET /api/bars/:barId/products       → productos del bar
 * - GET /api/bars/:barId/alerts         → alertas activas del bar
 * - GET /api/bars/:barId/movements      → últimos movimientos del bar
 */
interface BarReportSheetProps {
  open: boolean;
  onClose: () => void;
  bar: Bar;
  /** Productos filtrados para este bar */
  products: Product[];
  /** Alertas activas para este bar */
  alerts: InventoryAlert[];
  /** Últimos movimientos de inventario del bar */
  movements: InventoryMovement[];
}

export function BarReportSheet({
  open,
  onClose,
  bar,
  products,
  alerts,
  movements,
}: BarReportSheetProps) {
  // Cálculos del reporte
  const totalProducts = products.length;
  const inventoryValue = products.reduce((acc, p) => acc + p.stock * p.price, 0);
  const lowStockProducts = products.filter(p => p.status === 'low_stock');
  const outOfStockProducts = products.filter(p => p.status === 'out_of_stock');
  const statusConfig = {
    in_stock: { label: 'En Stock', className: 'bg-blue-100 text-blue-700' },
    low_stock: { label: 'Stock Bajo', className: 'bg-amber-100 text-amber-700' },
    out_of_stock: { label: 'Sin Stock', className: 'bg-red-100 text-red-700' },
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="sm:max-w-md w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <span className="block">Reporte: {bar.name}</span>
              <span className="flex items-center gap-1 text-xs font-normal text-gray-500">
                <MapPin className="w-3 h-3" />
                {bar.location}
              </span>
            </div>
          </SheetTitle>
          <SheetDescription>
            Resumen del inventario actual del almacén
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-6">
          {/* Stats rápidos */}
          <div className="grid grid-cols-2 gap-3">
            <StatBox
              icon={<Package className="w-4 h-4 text-blue-600" />}
              label="Total Productos"
              value={totalProducts.toString()}
              bgColor="bg-blue-50"
            />
            <StatBox
              icon={<DollarSign className="w-4 h-4 text-green-600" />}
              label="Valor Inventario"
              value={`$${inventoryValue.toLocaleString()}`}
              bgColor="bg-green-50"
            />
            <StatBox
              icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
              label="Stock Bajo"
              value={lowStockProducts.length.toString()}
              bgColor="bg-amber-50"
            />
            <StatBox
              icon={<XCircle className="w-4 h-4 text-red-600" />}
              label="Sin Stock"
              value={outOfStockProducts.length.toString()}
              bgColor="bg-red-50"
            />
          </div>

          {/* Tabla de productos */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Productos ({totalProducts})
            </h4>
            <div className="space-y-2">
              {products.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No hay productos en este almacén
                </p>
              ) : (
                products.map(product => {
                  const percentage = product.maxStock > 0
                    ? Math.round((product.stock / product.maxStock) * 100)
                    : 0;
                  const displayUnit = product.isWeightBased
                    ? (product.weightUnit || product.unit)
                    : product.unit;
                  const status = statusConfig[product.status];

                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.sku} · {product.category} → {product.subcategory}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {product.isWeightBased ? product.stock.toFixed(1) : product.stock}
                            <span className="text-xs font-normal text-gray-500 ml-1">
                              {displayUnit}
                            </span>
                          </p>
                          <p className="text-xs text-gray-400">{percentage}%</p>
                        </div>
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap',
                          status.className
                        )}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Alertas activas */}
          {alerts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Alertas Activas ({alerts.length})
              </h4>
              <div className="space-y-2">
                {alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={cn(
                      'p-3 rounded-lg border',
                      alert.type === 'out_of_stock'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-amber-50 border-amber-200'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={cn(
                        'w-4 h-4',
                        alert.type === 'out_of_stock' ? 'text-red-500' : 'text-amber-500'
                      )} />
                      <p className="text-sm font-medium text-gray-900">{alert.productName}</p>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Stock: {alert.currentStock} / Umbral: {alert.threshold}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Últimos movimientos */}
          {movements.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Últimos Movimientos
              </h4>
              <div className="space-y-2">
                {movements.slice(0, 10).map(mov => (
                  <div key={mov.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      mov.type === 'in' ? 'bg-green-100' : 'bg-red-100'
                    )}>
                      {mov.type === 'in'
                        ? <ArrowUpCircle className="w-4 h-4 text-green-600" />
                        : <ArrowDownCircle className="w-4 h-4 text-red-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {mov.productName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {mov.type === 'in' ? '+' : '-'}{mov.quantity} {mov.unit}
                        {' · '}{mov.workerName}
                      </p>
                      {mov.notes && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{mov.notes}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(mov.timestamp).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Mini componente para las stat boxes del reporte */
function StatBox({
  icon,
  label,
  value,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bgColor: string;
}) {
  return (
    <div className={cn('p-3 rounded-lg', bgColor)}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-gray-600">{label}</span>
      </div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}
