import { useState } from 'react';
import { ShoppingCart, Search, Calendar, Download, DollarSign, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import { recentSales } from '@/data/mockData';

export function SalesSection() {
  const [searchQuery, setSearchQuery] = useState('');

  const totalSales = recentSales.reduce((acc, sale) => acc + sale.total, 0);
  const totalItems = recentSales.reduce((acc, sale) => acc + sale.quantity, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          icon={DollarSign}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          value={`$${totalSales.toLocaleString()}`}
          label="Ventas Totales Hoy"
          change={18}
          changeLabel="vs ayer"
          delay={0}
        />
        <StatCard
          icon={ShoppingCart}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          value={recentSales.length}
          label="Transacciones"
          change={12}
          changeLabel="vs ayer"
          delay={100}
        />
        <StatCard
          icon={Package}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
          value={totalItems}
          label="Productos Vendidos"
          change={25}
          changeLabel="vs ayer"
          delay={200}
        />
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Ventas Recientes</h3>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar venta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-48 focus-visible:ring-blue-500"
              />
            </div>
            <Button variant="outline" size="icon" className="hover:border-blue-500 hover:text-blue-600">
              <Calendar className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="gap-2 hover:border-blue-500 hover:text-blue-600">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hora
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentSales.map((sale, index) => (
                <tr 
                  key={sale.id}
                  className="hover:bg-gray-50 transition-colors duration-200"
                  style={{
                    animationDelay: `${index * 60}ms`,
                  }}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{sale.productName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-900">{sale.quantity} unidades</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-semibold text-blue-600">
                      ${sale.total.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-500">
                      {new Date(sale.timestamp).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-500">Bar Central</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
