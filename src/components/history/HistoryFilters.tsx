import { Search, X, CalendarIcon } from 'lucide-react';
import { TouchInput } from '@/components/shared/TouchInput';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/shared/DatePicker';
import { parseLocalDate } from '@/lib/dates';
import type { AdminAccount } from '@/types';

/**
 * Estado de filtros del módulo de historial de inventario.
 *
 * Backend: estos campos se envían como query params a GET /api/inventory-history
 *   - dateFrom / dateTo       → formato "YYYY-MM-DD" (rango inclusivo)
 *   - search                  → búsqueda de texto libre (producto, notas, admin)
 *   - adminId                 → filtro exacto por admin
 *   - entryType               → filtro exacto por tipo de entrada
 *   - category                → filtro por categoría de producto
 *   - pageSize                → resultados por página
 */
export interface HistoryFilterState {
  search: string;
  adminId: string;
  entryType: string;
  category: string;
  /** Fecha inicio en formato "YYYY-MM-DD" o "" */
  dateFrom: string;
  /** Fecha fin en formato "YYYY-MM-DD" o "" */
  dateTo: string;
  pageSize: string;
}

export const defaultHistoryFilters: HistoryFilterState = {
  search: '',
  adminId: '',
  entryType: '',
  category: '',
  dateFrom: '',
  dateTo: '',
  pageSize: '15',
};

/**
 * Opciones de tipo de entrada para el select.
 * Mapean directamente al ENUM InventoryHistoryEntryType en el backend.
 */
const entryTypeOptions = [
  { value: 'scan_individual', label: 'Escaneo Individual' },
  { value: 'scan_box', label: 'Escaneo Caja' },
  { value: 'batch_reception', label: 'Recepción por Lote' },
  { value: 'bulk_weight', label: 'Peso / Báscula' },
  { value: 'manual_adjustment', label: 'Ajuste Manual' },
];

interface HistoryFiltersProps {
  filters: HistoryFilterState;
  onChange: (key: keyof HistoryFilterState, value: string) => void;
  onClearAll: () => void;
  /** Admins activos disponibles para filtrar */
  availableAdmins: AdminAccount[];
  /** Categorías de productos presentes en los registros (derivadas de los datos) */
  availableCategories: string[];
}

/**
 * Barra de filtros para el módulo de historial de inventario.
 * Incluye: búsqueda, rango de fechas, admin, tipo de entrada, categoría, page size.
 *
 * Backend: Los filtros se enviarán como query params a GET /api/inventory-history
 * Ejemplo: ?search=coca&adminId=admin1&entryType=scan_box&category=Bebidas&dateFrom=2026-03-01&dateTo=2026-03-06
 */
export function HistoryFilters({
  filters,
  onChange,
  onClearAll,
  availableAdmins,
  availableCategories,
}: HistoryFiltersProps) {
  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => key !== 'pageSize' && value !== ''
  );

  const dateFromParsed = parseLocalDate(filters.dateFrom);
  const dateToParsed = parseLocalDate(filters.dateTo);

  const selectClassName = 'h-10 w-full px-3 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
      {/* Primera fila: Búsqueda + Rango de fechas */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Búsqueda por texto */}
        <div className="relative flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <TouchInput
              placeholder="Producto, admin, notas..."
              value={filters.search}
              onChange={(e) => onChange('search', e.target.value)}
              className="pl-10 focus-visible:ring-blue-500"
            />
          </div>
        </div>

        {/* Fecha desde */}
        <div className="min-w-[190px]">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            <CalendarIcon className="inline w-3 h-3 mr-1" />
            Desde
          </label>
          <DatePicker
            value={filters.dateFrom}
            onChange={(v) => onChange('dateFrom', v)}
            placeholder="Seleccionar fecha"
            disabled={(date) => dateToParsed ? date > dateToParsed : false}
          />
        </div>

        {/* Fecha hasta */}
        <div className="min-w-[190px]">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            <CalendarIcon className="inline w-3 h-3 mr-1" />
            Hasta
          </label>
          <DatePicker
            value={filters.dateTo}
            onChange={(v) => onChange('dateTo', v)}
            placeholder="Seleccionar fecha"
            disabled={(date) => dateFromParsed ? date < dateFromParsed : false}
            defaultMonth={dateToParsed || dateFromParsed}
          />
        </div>
      </div>

      {/* Segunda fila: Selects + Limpiar */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Admin */}
        <div className="min-w-[180px]">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Administrador</label>
          <select
            value={filters.adminId}
            onChange={(e) => onChange('adminId', e.target.value)}
            className={selectClassName}
          >
            <option value="">Todos los admins</option>
            {availableAdmins.map((admin) => (
              <option key={admin.id} value={admin.id}>{admin.name}</option>
            ))}
          </select>
        </div>

        {/* Tipo de entrada */}
        <div className="min-w-[180px]">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Tipo de Entrada</label>
          <select
            value={filters.entryType}
            onChange={(e) => onChange('entryType', e.target.value)}
            className={selectClassName}
          >
            <option value="">Todos los tipos</option>
            {entryTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Categoría */}
        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Categoría</label>
          <select
            value={filters.category}
            onChange={(e) => onChange('category', e.target.value)}
            className={selectClassName}
          >
            <option value="">Todas las categorías</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Por página */}
        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Mostrar</label>
          <select
            value={filters.pageSize}
            onChange={(e) => onChange('pageSize', e.target.value)}
            className={selectClassName}
          >
            <option value="15">15 por página</option>
            <option value="25">25 por página</option>
            <option value="50">50 por página</option>
            <option value="100">100 por página</option>
          </select>
        </div>

        {/* Limpiar filtros */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="gap-1.5 h-10 text-gray-500 hover:text-red-600 hover:border-red-300"
          >
            <X className="w-4 h-4" />
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
