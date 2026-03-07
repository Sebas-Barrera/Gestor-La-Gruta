import { useState } from 'react';
import { Store, Plus, MapPin, Users, Package, TrendingUp, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { bars, products } from '@/data/mockData';
import { cn } from '@/lib/utils';

export function BarsSection() {
  const [activeBar, setActiveBar] = useState(bars[0]);

  // Mock stats for each bar
  const barStats = {
    products: products.length,
    value: 45230,
    sales: 156,
    staff: 8,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Gestión de Bares</h2>
        <Button className="gap-2 bg-blue-500 hover:bg-blue-600">
          <Plus className="w-4 h-4" />
          Agregar Bar
        </Button>
      </div>

      {/* Bars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {bars.map((bar, index) => {
          const isActive = bar.id === activeBar.id;

          return (
            <button
              key={bar.id}
              onClick={() => setActiveBar(bar)}
              className={cn(
                'relative text-left p-5 rounded-xl border-2 transition-all duration-300',
                'hover:shadow-lg hover:-translate-y-1',
                isActive
                  ? 'border-blue-500 bg-blue-50 shadow-blue-100'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Actions Menu */}
              <div className="absolute top-3 right-3">
                <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>

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
                    {barStats.products}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ventas Hoy</p>
                  <p className={cn(
                    'text-lg font-bold',
                    isActive ? 'text-blue-700' : 'text-gray-900'
                  )}>
                    {barStats.sales}
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-blue-500 flex items-center justify-center">
              <Store className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{activeBar.name}</h3>
              <div className="flex items-center gap-2 text-gray-500">
                <MapPin className="w-4 h-4" />
                {activeBar.location}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 hover:border-blue-500 hover:text-blue-600">
              <Edit2 className="w-4 h-4" />
              Editar
            </Button>
            <Button variant="outline" className="gap-2 text-red-600 hover:bg-red-50 hover:border-red-300">
              <Trash2 className="w-4 h-4" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Package className="w-4 h-4" />
              <span className="text-sm">Productos</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{barStats.products}</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Valor Inventario</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">${barStats.value.toLocaleString()}</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Ventas Hoy</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{barStats.sales}</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">Personal</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{barStats.staff}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
