import { AlertTriangle, XCircle, CheckCircle2, Bell, Settings, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { inventoryAlerts } from '@/data/mockData';
import { cn } from '@/lib/utils';

export function AlertsSection() {
  return (
    <div className="p-6 space-y-6">
      {/* Alert Settings */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Settings className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Configuración de Alertas</h3>
            <p className="text-sm text-gray-500">Personaliza cuando recibir notificaciones</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Notificaciones Push</p>
                <p className="text-xs text-gray-500">En la aplicación</p>
              </div>
            </div>
            <Switch defaultChecked className="data-[state=checked]:bg-emerald-500" />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Email</p>
                <p className="text-xs text-gray-500">Alertas por correo</p>
              </div>
            </div>
            <Switch className="data-[state=checked]:bg-emerald-500" />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Stock Crítico</p>
                <p className="text-xs text-gray-500">Cuando llegue a 0</p>
              </div>
            </div>
            <Switch defaultChecked className="data-[state=checked]:bg-emerald-500" />
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Alertas Activas</h3>
        </div>

        <div className="divide-y divide-gray-100">
          {inventoryAlerts.map((alert, index) => {
            const isCritical = alert.type === 'out_of_stock';

            return (
              <div
                key={alert.id}
                className={cn(
                  'flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors duration-200',
                  'animate-in slide-in-from-bottom-2 duration-300'
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
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

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-base font-semibold text-gray-900">
                      {alert.productName}
                    </h4>
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
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
                      ? 'Este producto se ha agotado completamente' 
                      : `Solo quedan ${alert.currentStock} unidades (mínimo: ${alert.threshold})`
                    }
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    {new Date(alert.timestamp).toLocaleString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-600"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Resolver
                </Button>
              </div>
            );
          })}
        </div>

        {inventoryAlerts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-1">
              No hay alertas activas
            </h4>
            <p className="text-sm text-gray-500">
              Todo el inventario está bajo control
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
