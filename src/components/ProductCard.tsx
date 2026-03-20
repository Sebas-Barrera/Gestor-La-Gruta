import { useEffect, useState } from 'react';
import { Package, Weight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProductImage } from '@/components/shared/ProductImage';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  delay?: number;
  /** 'card' = tarjeta rectangular (default), 'list' = fila compacta horizontal */
  variant?: 'card' | 'list';
}

const statusConfig = {
  in_stock: { label: 'En Stock', className: 'bg-blue-100 text-blue-700' },
  low_stock: { label: 'Stock Bajo', className: 'bg-amber-100 text-amber-700' },
  out_of_stock: { label: 'Sin Stock', className: 'bg-red-100 text-red-700' },
};

export function ProductCard({ product, onSelect, delay = 0, variant = 'card' }: ProductCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const status = statusConfig[product.status];
  const stockPercentage = (product.stock / product.maxStock) * 100;
  const displayUnit = product.isWeightBased ? (product.weightUnit || product.unit) : product.unit;

  const stockColor =
    stockPercentage < 20 ? 'red' :
    stockPercentage < 50 ? 'amber' : 'blue';

  const stockColorClasses = {
    red:   { text: 'text-red-600',   bar: 'bg-red-500' },
    amber: { text: 'text-amber-600', bar: 'bg-amber-500' },
    blue:  { text: 'text-blue-600',  bar: 'bg-blue-500' },
  }[stockColor];

  // ─── List variant (compact row) ────────────────────────────────────────────
  if (variant === 'list') {
    return (
      <div
        onClick={() => onSelect(product)}
        className={cn(
          'bg-white rounded-lg border border-gray-200 px-4 py-3 cursor-pointer',
          'transition-all duration-300 ease-out',
          'hover:shadow-md hover:border-blue-200',
          isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
        )}
        style={{ transitionDelay: `${delay}ms` }}
      >
        <div className="flex items-center gap-4">
          <ProductImage product={product} size="md" />

          {/* Name + SKU */}
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h4>
            <p className="text-xs text-gray-500">{product.sku}</p>
          </div>

          {/* Category */}
          <p className="hidden sm:block text-xs text-gray-500 w-32 truncate">
            {product.category}
          </p>

          {/* Stock bar */}
          <div className="w-28 hidden md:block">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={cn('font-medium', stockColorClasses.text)}>
                {product.isWeightBased ? product.stock.toFixed(1) : product.stock}/{product.maxStock}
              </span>
              <span className="text-gray-400">{displayUnit}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-700 ease-out', stockColorClasses.bar)}
                style={{
                  width: isVisible ? `${stockPercentage}%` : '0%',
                  transitionDelay: `${delay + 150}ms`,
                }}
              />
            </div>
          </div>

          {/* Price */}
          <span className="text-sm font-medium text-gray-700 w-20 text-right">
            ${product.price}
          </span>

          {/* Status badge */}
          <span className={cn('text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap', status.className)}>
            {status.label}
          </span>
        </div>
      </div>
    );
  }

  // ─── Card variant (default rectangular) ────────────────────────────────────
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden',
        'transition-all duration-500 ease-out',
        'hover:-translate-y-2 hover:shadow-lg hover:shadow-gray-200/50',
        'hover:rotate-x-5 hover:-rotate-y-3',
        isVisible
          ? 'opacity-100 translate-z-0 rotate-x-0'
          : 'opacity-0 translate-z-[-100px] rotate-x-[15deg]'
      )}
      style={{
        transitionDelay: `${delay}ms`,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-500">{product.sku}</span>
        </div>
        <span className={cn('text-xs font-medium px-2 py-1 rounded-full', status.className)}>
          {status.label}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <ProductImage product={product} size="md" />
          <div className="min-w-0 flex-1">
            <h4 className="text-base font-semibold text-gray-900 leading-tight">{product.name}</h4>
            <p className="text-sm text-gray-500">
              {product.category} → {product.subcategory}
            </p>
          </div>
        </div>

        {/* Stock Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-500">Stock</span>
            <span className={cn('font-medium', stockColorClasses.text)}>
              {product.isWeightBased ? product.stock.toFixed(1) : product.stock} / {product.maxStock} {displayUnit}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700 ease-out',
                stockColorClasses.bar,
              )}
              style={{
                width: isVisible ? `${stockPercentage}%` : '0%',
                transitionDelay: `${delay + 200}ms`
              }}
            />
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
          <Weight className="w-3.5 h-3.5 text-gray-400" />
          <span>${product.price} c/u</span>
        </div>

        {/* Action Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelect(product)}
          className={cn(
            'w-full gap-2 transition-all duration-200',
            'hover:bg-blue-500 hover:text-white hover:border-blue-500',
          )}
        >
          <Package className="w-4 h-4" />
          Ver Producto
        </Button>
      </div>
    </div>
  );
}
