import { useEffect, useState } from 'react';
import { Store, TrendingUp, TrendingDown, Minus, DollarSign, Package, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BarStats } from '@/types';

interface BarPerformanceChartProps {
  bars: BarStats[];
  delay?: number;
}

export function BarPerformanceChart({ bars, delay = 0 }: BarPerformanceChartProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // Ordenar por ventas (descendente)
  const sortedBars = [...bars].sort((a, b) => b.todaySales - a.todaySales);
  const maxSales = Math.max(...bars.map(b => b.todaySales));

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
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Rendimiento por Bar</h3>
            <p className="text-sm text-gray-500">Comparación de ventas e inventario</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Hoy</span>
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
              En tiempo real
            </span>
          </div>
        </div>
      </div>

      {/* Bars List */}
      <div className="p-4 space-y-4">
        {sortedBars.map((bar, index) => {
          const salesPercentage = maxSales > 0 ? (bar.todaySales / maxSales) * 100 : 0;
          const hasIssues = bar.lowStockCount > 0 || bar.outOfStockCount > 0;

          return (
            <div
              key={bar.id}
              className={cn(
                'group p-4 rounded-xl border transition-all duration-300',
                'hover:shadow-md hover:border-emerald-200',
                hasIssues ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100 bg-gray-50/30'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Header Row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    hasIssues ? 'bg-amber-100' : 'bg-emerald-100'
                  )}>
                    <Store className={cn(
                      'w-5 h-5',
                      hasIssues ? 'text-amber-600' : 'text-emerald-600'
                    )} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{bar.name}</h4>
                    <p className="text-xs text-gray-500">{bar.location}</p>
                  </div>
                </div>

                {/* Sales Amount */}
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">
                    ${bar.todaySales.toLocaleString()}
                  </p>
                  <div className="flex items-center justify-end gap-1">
                    {bar.salesTrend > 0 ? (
                      <>
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        <span className="text-xs text-emerald-600">+{bar.salesTrend}%</span>
                      </>
                    ) : bar.salesTrend < 0 ? (
                      <>
                        <TrendingDown className="w-3 h-3 text-red-500" />
                        <span className="text-xs text-red-600">{bar.salesTrend}%</span>
                      </>
                    ) : (
                      <>
                        <Minus className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">0%</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700 ease-out',
                      hasIssues ? 'bg-amber-500' : 'bg-emerald-500'
                    )}
                    style={{ width: `${salesPercentage}%` }}
                  />
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-600">{bar.productCount} productos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-600">${bar.inventoryValue.toLocaleString()} inv.</span>
                </div>
                {hasIssues && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-amber-600 font-medium">
                      {bar.lowStockCount + bar.outOfStockCount} alertas
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Total: <span className="font-semibold text-gray-900">${bars.reduce((acc, b) => acc + b.todaySales, 0).toLocaleString()}</span>
          </span>
          <button className="text-emerald-600 hover:text-emerald-700 font-medium">
            Ver reporte detallado →
          </button>
        </div>
      </div>
    </div>
  );
}
