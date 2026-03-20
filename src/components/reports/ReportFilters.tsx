import { Search, X, CalendarIcon } from 'lucide-react';
import { TouchInput } from '@/components/shared/TouchInput';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/shared/DatePicker';
import { parseLocalDate } from '@/lib/dates';
import type { Worker, Product } from '@/types';

/**
 * Estado de filtros del módulo de reportes.
 *
 * Backend: estos campos se envían como query params a GET /api/reports/movements
 *   - dateFrom / dateTo → formato "YYYY-MM-DD" (rango inclusivo)
 *   - search → búsqueda de texto libre
 *   - workerId / productId / type → filtros exactos (ID o enum)
 *   - pageSize → número de resultados por página
 */
export interface ReportFilterState {
  search: string;
  workerId: string;
  productId: string;
  type: string;
  /** Fecha inicio en formato "YYYY-MM-DD" o "" */
  dateFrom: string;
  /** Fecha fin en formato "YYYY-MM-DD" o "" */
  dateTo: string;
  pageSize: string;
}

export const defaultReportFilters: ReportFilterState = {
  search: '',
  workerId: '',
  productId: '',
  type: '',
  dateFrom: '',
  dateTo: '',
  pageSize: '15',
};

interface ReportFiltersProps {
  filters: ReportFilterState;
  onChange: (key: keyof ReportFilterState, value: string) => void;
  onClearAll: () => void;
  /** Trabajadores disponibles para el bar seleccionado (o todos) */
  availableWorkers: Worker[];
  /** Productos disponibles para el bar seleccionado (o todos) */
  availableProducts: Product[];
}

/**
 * Barra de filtros para el módulo de reportes.
 * Incluye: búsqueda, rango de fechas (con calendario visual), trabajador, producto, tipo.
 *
 * Backend: Los filtros se enviarán como query params a GET /api/reports/movements
 * Ejemplo: ?search=coca&workerId=w1&type=in&dateFrom=2026-03-01&dateTo=2026-03-06
 */
export function ReportFilters({
  filters,
  onChange,
  onClearAll,
  availableWorkers,
  availableProducts,
}: ReportFiltersProps) {
  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => key !== 'pageSize' && value !== ''
  );

  /** Productos únicos por nombre (evita duplicados entre bares) */
  const uniqueProducts = availableProducts.reduce<Product[]>((acc, product) => {
    if (!acc.some(p => p.name === product.name)) acc.push(product);
    return acc;
  }, []);

  const dateFromParsed = parseLocalDate(filters.dateFrom);
  const dateToParsed = parseLocalDate(filters.dateTo);

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
              placeholder="Producto, notas..."
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
        {/* Trabajador */}
        <div className="min-w-[180px]">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Trabajador</label>
          <select
            value={filters.workerId}
            onChange={(e) => onChange('workerId', e.target.value)}
            className="h-10 w-full px-3 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Todos los trabajadores</option>
            {availableWorkers.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        {/* Producto */}
        <div className="min-w-[180px]">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Producto</label>
          <select
            value={filters.productId}
            onChange={(e) => onChange('productId', e.target.value)}
            className="h-10 w-full px-3 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Todos los productos</option>
            {uniqueProducts.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Tipo de movimiento */}
        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Tipo</label>
          <select
            value={filters.type}
            onChange={(e) => onChange('type', e.target.value)}
            className="h-10 w-full px-3 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Todos los tipos</option>
            <option value="in">Entrada</option>
            <option value="out">Salida</option>
          </select>
        </div>

        {/* Por página */}
        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Mostrar</label>
          <select
            value={filters.pageSize}
            onChange={(e) => onChange('pageSize', e.target.value)}
            className="h-10 w-full px-3 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
