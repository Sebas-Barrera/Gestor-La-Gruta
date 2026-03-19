import { useEffect, useState } from 'react';
import { Edit3, Package, Layers, Calendar, Tag, Building2, Barcode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProductImage } from '@/components/shared/ProductImage';
import type { Product } from '@/types';

interface ProductInfoPanelProps {
  product: Product;
  onAdjustStock: () => void;
  onEditProduct: () => void;
  delay?: number;
}

const statusConfig = {
  in_stock: { label: 'En Stock', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  low_stock: { label: 'Stock Bajo', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  out_of_stock: { label: 'Sin Stock', className: 'bg-red-100 text-red-700 border-red-200' },
};

export function ProductInfoPanel({ 
  product, 
  onAdjustStock, 
  onEditProduct, 
  delay = 0 
}: ProductInfoPanelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const status = statusConfig[product.status];
  const stockPercentage = (product.stock / product.maxStock) * 100;
  const displayUnit = product.isWeightBased ? (product.weightUnit || product.unit) : product.unit;

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden',
        'transition-all duration-600 ease-out',
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <ProductImage product={product} size="lg" />
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-500">{product.category} → {product.subcategory}</p>
            </div>
          </div>
          <span className={cn('text-xs font-medium px-3 py-1 rounded-full border flex-shrink-0', status.className)}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
              <Tag className="w-4 h-4" />
            </div>
            <p className="text-xs text-gray-500 mb-1">SKU</p>
            <p className="text-sm font-semibold text-gray-900">{product.sku}</p>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
              <Package className="w-4 h-4" />
            </div>
            <p className="text-xs text-gray-500 mb-1">Categoría</p>
            <p className="text-sm font-semibold text-gray-900">{product.category}</p>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
              <Layers className="w-4 h-4" />
            </div>
            <p className="text-xs text-gray-500 mb-1">Subcategoría</p>
            <p className="text-sm font-semibold text-gray-900">{product.subcategory}</p>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
              <Calendar className="w-4 h-4" />
            </div>
            <p className="text-xs text-gray-500 mb-1">Últ. Compra</p>
            <p className="text-sm font-semibold text-gray-900">
              {new Date(product.lastPurchase).toLocaleDateString('es-MX', {
                day: '2-digit',
                month: 'short'
              })}
            </p>
          </div>
        </div>

        {/* Supplier */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Proveedor</p>
            <p className="text-sm font-semibold text-gray-900">{product.supplier}</p>
          </div>
        </div>

        {/* Barcode */}
        {product.barcode && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-6">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Barcode className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Código de Barras</p>
              <p className="text-sm font-mono font-semibold text-gray-900">{product.barcode}</p>
            </div>
          </div>
        )}

        {!product.barcode && <div className="mb-3" />}

        {/* Stock Counter */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Stock Actual</span>
            <span className={cn(
              'text-2xl font-bold',
              stockPercentage < 20 ? 'text-red-600' :
              stockPercentage < 50 ? 'text-amber-600' : 'text-blue-600'
            )}>
              {product.isWeightBased ? product.stock.toFixed(1) : product.stock} <span className="text-sm font-normal text-gray-500">{displayUnit}</span>
            </span>
          </div>
          
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-1000 ease-out',
                stockPercentage < 20 ? 'bg-red-500' :
                stockPercentage < 50 ? 'bg-amber-500' : 'bg-blue-500'
              )}
              style={{ 
                width: isVisible ? `${stockPercentage}%` : '0%',
                transitionDelay: `${delay + 300}ms`
              }}
            />
          </div>
          
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>0</span>
            <span>Capacidad máx: {product.maxStock}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onAdjustStock}
            className="flex-1 gap-2 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-200"
          >
            <Edit3 className="w-4 h-4" />
            Ajustar Stock
          </Button>
          <Button
            variant="outline"
            onClick={onEditProduct}
            className="flex-1 gap-2 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-200"
          >
            <Package className="w-4 h-4" />
            Editar Producto
          </Button>
        </div>
      </div>
    </div>
  );
}
