import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import type { Product } from '@/types';

export type StatusFilter = 'in_stock' | 'low_stock' | 'out_of_stock';
export type CategoryFilter = string;

export interface InventoryFilters {
  statuses: StatusFilter[];
  categories: CategoryFilter[];
}

interface InventoryFilterProps {
  filters: InventoryFilters;
  onFiltersChange: (filters: InventoryFilters) => void;
  /** Productos disponibles (para extraer categorías dinámicamente) */
  products: Product[];
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'in_stock', label: 'En Stock' },
  { value: 'low_stock', label: 'Stock Bajo' },
  { value: 'out_of_stock', label: 'Sin Stock' },
];

/**
 * Dropdown de filtros para inventario.
 * Reutilizable en InventorySection (admin) y WorkerInventorySection (worker).
 *
 * Filtra por:
 * - Status (in_stock, low_stock, out_of_stock) — checkbox múltiple
 * - Categoría (extraída dinámicamente de los productos) — checkbox múltiple
 *
 * Cuando no hay filtros activos, se muestran todos los productos.
 *
 * Backend: GET /api/products?status[]=low_stock&category[]=Bebidas
 */
export function InventoryFilter({ filters, onFiltersChange, products }: InventoryFilterProps) {
  const categories = [...new Set(products.map(p => p.category))].sort();
  const activeCount = filters.statuses.length + filters.categories.length;

  const toggleStatus = (status: StatusFilter) => {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ ...filters, statuses: next });
  };

  const toggleCategory = (category: string) => {
    const next = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    onFiltersChange({ ...filters, categories: next });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="hover:border-blue-500 hover:text-blue-600 relative"
        >
          <Filter className="w-4 h-4" />
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-medium">
              {activeCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Estado</DropdownMenuLabel>
        {STATUS_OPTIONS.map(opt => (
          <DropdownMenuCheckboxItem
            key={opt.value}
            checked={filters.statuses.includes(opt.value)}
            onCheckedChange={() => toggleStatus(opt.value)}
          >
            {opt.label}
          </DropdownMenuCheckboxItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Categoría</DropdownMenuLabel>
        {categories.map(cat => (
          <DropdownMenuCheckboxItem
            key={cat}
            checked={filters.categories.includes(cat)}
            onCheckedChange={() => toggleCategory(cat)}
          >
            {cat}
          </DropdownMenuCheckboxItem>
        ))}

        {activeCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <button
              onClick={() => onFiltersChange({ statuses: [], categories: [] })}
              className="w-full px-2 py-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium text-left"
            >
              Limpiar filtros
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Aplica los filtros activos a un array de productos.
 * Usar en el componente padre para filtrar la lista.
 *
 * Si no hay filtros activos (arrays vacíos), devuelve todos los productos.
 */
export function applyInventoryFilters(products: Product[], filters: InventoryFilters): Product[] {
  return products.filter(p => {
    const statusMatch = filters.statuses.length === 0 || filters.statuses.includes(p.status);
    const categoryMatch = filters.categories.length === 0 || filters.categories.includes(p.category);
    return statusMatch && categoryMatch;
  });
}
