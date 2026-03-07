import { useEffect, useState } from 'react';
import { Plus, Package, MapPin, Weight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onAddToLocation: (product: Product) => void;
  delay?: number;
}

const statusConfig = {
  in_stock: { label: 'En Stock', className: 'bg-emerald-100 text-emerald-700' },
  low_stock: { label: 'Stock Bajo', className: 'bg-amber-100 text-amber-700' },
  out_of_stock: { label: 'Sin Stock', className: 'bg-red-100 text-red-700' },
};

export function ProductCard({ product, onAddToLocation, delay = 0 }: ProductCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const status = statusConfig[product.status];
  const stockPercentage = (product.stock / product.maxStock) * 100;

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
        <h4 className="text-base font-semibold text-gray-900 mb-1">{product.name}</h4>
        <p className="text-sm text-gray-500 mb-4">
          {product.category} → {product.subcategory}
        </p>

        {/* Stock Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-500">Stock</span>
            <span className={cn(
              'font-medium',
              stockPercentage < 20 ? 'text-red-600' :
              stockPercentage < 50 ? 'text-amber-600' : 'text-emerald-600'
            )}>
              {product.stock} / {product.maxStock}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700 ease-out',
                stockPercentage < 20 ? 'bg-red-500' :
                stockPercentage < 50 ? 'bg-amber-500' : 'bg-emerald-500'
              )}
              style={{ 
                width: isVisible ? `${stockPercentage}%` : '0%',
                transitionDelay: `${delay + 200}ms`
              }}
            />
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 text-xs mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <span>Ubicación: {product.location || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Weight className="w-3.5 h-3.5 text-gray-400" />
            <span>${product.price} c/u</span>
          </div>
        </div>

        {/* Action Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddToLocation(product)}
          disabled={product.status === 'out_of_stock'}
          className={cn(
            'w-full gap-2 transition-all duration-200',
            'hover:bg-emerald-500 hover:text-white hover:border-emerald-500',
            product.status === 'out_of_stock' && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Plus className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
          Agregar a ubicación
        </Button>
      </div>
    </div>
  );
}
