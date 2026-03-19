import { MapPin, Phone, User, CheckCircle2, XCircle } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { Bar } from '@/types';

interface BarInfoTabProps {
  bar: Bar;
  productCount: number;
  workerCount: number;
}

export function BarInfoTab({ bar, productCount, workerCount }: BarInfoTabProps) {
  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Ubicación</p>
              <p className="text-sm font-medium text-gray-900">{bar.location}</p>
            </div>
          </div>

          {bar.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Teléfono</p>
                <p className="text-sm font-medium text-gray-900">{bar.phone}</p>
              </div>
            </div>
          )}

          {bar.manager && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Encargado</p>
                <p className="text-sm font-medium text-gray-900">{bar.manager}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {bar.isActive ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            <div>
              <p className="text-xs text-gray-500">Estado</p>
              <StatusBadge variant={bar.isActive ? 'success' : 'error'}>
                {bar.isActive ? 'Activo' : 'Inactivo'}
              </StatusBadge>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Resumen</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Productos en inventario</span>
              <span className="text-sm font-semibold text-gray-900">{productCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Personal asignado</span>
              <span className="text-sm font-semibold text-gray-900">{workerCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
