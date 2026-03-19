import { useEffect, useState } from 'react';
import {
  Package,
  AlertTriangle,
  User,
  Clipboard,
  Clock,
  Store
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Activity, Bar } from '@/types';

interface ActivityLogProps {
  activities: Activity[];
  bars: Bar[];
  /** Callback al hacer click en "Ver historial completo". Backend: GET /api/activities?limit=all */
  onViewAll?: () => void;
  /** Máximo de actividades visibles. Default: 10 */
  maxItems?: number;
  delay?: number;
}

const iconMap = {
  stock_in: Package,
  stock_out: Package,
  alert: AlertTriangle,
  login: User,
  inventory: Clipboard,
};

const iconColors = {
  stock_in: 'bg-blue-100 text-blue-600',
  stock_out: 'bg-orange-100 text-orange-600',
  alert: 'bg-red-100 text-red-600',
  login: 'bg-gray-100 text-gray-600',
  inventory: 'bg-purple-100 text-purple-600',
};

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Ahora';
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
  if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} h`;
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

export function ActivityLog({ activities, bars, onViewAll, maxItems = 10, delay = 0 }: ActivityLogProps) {
  const displayedActivities = activities.slice(0, maxItems);
  const hasMore = activities.length > maxItems;
  const [isVisible, setIsVisible] = useState(false);
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    displayedActivities.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems(prev => [...prev, index]);
      }, 200 + index * 80);
    });
  }, [isVisible, displayedActivities]);

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden',
        'transition-all duration-500 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Registro de Actividad</h3>
          <p className="text-sm text-gray-500">
            {hasMore
              ? `Últimos ${maxItems} movimientos`
              : 'Movimientos en tiempo real'
            }
          </p>
        </div>
        {displayedActivities.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Última actividad</span>
            <span className="text-xs font-medium text-blue-600">
              {formatRelativeTime(displayedActivities[0].timestamp)}
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-200" />

          <div className="space-y-3">
            {displayedActivities.map((activity, index) => {
              const Icon = iconMap[activity.type];
              const iconColorClass = iconColors[activity.type];
              const isItemVisible = visibleItems.includes(index);
              const bar = activity.barId ? bars.find(b => b.id === activity.barId) : null;

              return (
                <div
                  key={activity.id}
                  className={cn(
                    'relative flex items-start gap-4 group',
                    'transition-all duration-500 ease-out',
                    isItemVisible
                      ? 'opacity-100 translate-x-0 rotate-x-0'
                      : 'opacity-0 -translate-x-8 rotate-x-[-30deg]'
                  )}
                  style={{ 
                    transformOrigin: 'left center',
                    transitionDelay: `${index * 60}ms` 
                  }}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'relative z-10 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                      'transition-all duration-300 group-hover:scale-110',
                      iconColorClass
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 bg-gray-50 rounded-lg p-3 group-hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-gray-900 leading-relaxed">
                          {activity.message}
                        </p>
                        
                        {/* Bar Badge */}
                        {bar && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded-md border border-gray-200 text-xs">
                              <Store className="w-3 h-3 text-gray-400" />
                              <span className="font-medium text-gray-700">{bar.name}</span>
                            </span>
                            {activity.user && (
                              <span className="text-xs text-gray-500">
                                por {activity.user}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      {onViewAll && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onViewAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
          >
            Ver historial completo →
          </button>
          {hasMore && (
            <span className="text-xs text-gray-400">
              +{activities.length - maxItems} más
            </span>
          )}
        </div>
      )}
    </div>
  );
}
