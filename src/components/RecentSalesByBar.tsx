import { useEffect, useState } from 'react';
import { ShoppingCart, Package, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInventory } from '@/contexts/InventoryContext';

interface RecentSalesByBarProps {
  barId: string;
  barName: string;
  onViewAll?: () => void;
  delay?: number;
}

export function RecentSalesByBar({ barId, barName, onViewAll, delay = 0 }: RecentSalesByBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { inventoryMovements } = useInventory();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const barExits = inventoryMovements
    .filter(m => m.barId === barId && m.type === 'out')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const totalUnits = barExits.reduce((acc, m) => acc + m.quantity, 0);

  function formatRelativeTime(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} h`;
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden',
        'transition-all duration-500 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Salidas Recientes</h3>
              <p className="text-sm text-gray-500">{barName}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-blue-600">{totalUnits} uds</p>
            <p className="text-xs text-gray-500">{barExits.length} movimientos</p>
          </div>
        </div>
      </div>

      {/* Exits List */}
      <div className="p-4 space-y-3">
        {barExits.map((movement, index) => (
          <div
            key={movement.id}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border border-gray-100',
              'hover:bg-gray-50 transition-colors duration-200',
              'animate-in slide-in-from-right duration-300',
            )}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-blue-600" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {movement.productName}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{movement.quantity} {movement.unit}</span>
                <span>•</span>
                <span>{movement.workerName}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(movement.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {barExits.length === 0 && (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <ShoppingCart className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">Sin salidas recientes</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {barExits.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onViewAll}
            className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Ver todas las salidas
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
