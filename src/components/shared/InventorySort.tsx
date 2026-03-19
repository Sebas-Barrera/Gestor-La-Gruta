import { SlidersHorizontal, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import type { Product } from '@/types';

export type SortField = 'name' | 'stock' | 'price' | 'status' | 'category';
export type SortDirection = 'asc' | 'desc';

export interface InventorySortConfig {
  field: SortField;
  direction: SortDirection;
}

interface InventorySortProps {
  sort: InventorySortConfig;
  onSortChange: (sort: InventorySortConfig) => void;
}

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'name', label: 'Nombre' },
  { value: 'stock', label: 'Stock actual' },
  { value: 'price', label: 'Precio' },
  { value: 'status', label: 'Estado' },
  { value: 'category', label: 'Categoría' },
];

/**
 * Dropdown de ordenamiento para inventario.
 * Reutilizable en InventorySection (admin) y WorkerInventorySection (worker).
 *
 * Ordena por: nombre, stock, precio, estado, categoría.
 * Permite cambiar dirección (ascendente/descendente).
 *
 * Backend: GET /api/products?sort=stock&order=asc
 */
export function InventorySort({ sort, onSortChange }: InventorySortProps) {
  const currentLabel = SORT_OPTIONS.find(o => o.value === sort.field)?.label || 'Nombre';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 hover:border-blue-500 hover:text-blue-600">
          <SlidersHorizontal className="w-4 h-4" />
          {currentLabel}
          {sort.direction === 'asc' ? (
            <ArrowUp className="w-3 h-3 ml-0.5" />
          ) : (
            <ArrowDown className="w-3 h-3 ml-0.5" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={sort.field}
          onValueChange={(value) => onSortChange({ ...sort, field: value as SortField })}
        >
          {SORT_OPTIONS.map(opt => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value}>
              {opt.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Dirección</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={sort.direction}
          onValueChange={(value) => onSortChange({ ...sort, direction: value as SortDirection })}
        >
          <DropdownMenuRadioItem value="asc">
            <ArrowUp className="w-3.5 h-3.5" />
            Ascendente
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="desc">
            <ArrowDown className="w-3.5 h-3.5" />
            Descendente
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Prioridad de status para ordenamiento */
const STATUS_PRIORITY: Record<Product['status'], number> = {
  out_of_stock: 0,
  low_stock: 1,
  in_stock: 2,
};

/**
 * Aplica el ordenamiento a un array de productos.
 * Usar en el componente padre para ordenar la lista.
 *
 * Backend: ORDER BY <field> <direction>
 */
export function applyInventorySort(products: Product[], sort: InventorySortConfig): Product[] {
  const multiplier = sort.direction === 'asc' ? 1 : -1;

  return [...products].sort((a, b) => {
    switch (sort.field) {
      case 'name':
        return multiplier * a.name.localeCompare(b.name, 'es');
      case 'stock':
        return multiplier * (a.stock - b.stock);
      case 'price':
        return multiplier * (a.price - b.price);
      case 'status':
        return multiplier * (STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]);
      case 'category':
        return multiplier * a.category.localeCompare(b.category, 'es');
      default:
        return 0;
    }
  });
}
