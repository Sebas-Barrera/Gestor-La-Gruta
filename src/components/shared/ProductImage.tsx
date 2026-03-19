import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductImageProps {
  product: Product;
  /** Tamaño del contenedor: sm (32px), md (40px), lg (64px) */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeConfig = {
  sm: { container: 'w-8 h-8', icon: 'w-4 h-4', rounded: 'rounded-md' },
  md: { container: 'w-10 h-10', icon: 'w-5 h-5', rounded: 'rounded-lg' },
  lg: { container: 'w-16 h-16', icon: 'w-7 h-7', rounded: 'rounded-xl' },
};

const statusColors = {
  in_stock: { bg: 'bg-blue-100', icon: 'text-blue-500' },
  low_stock: { bg: 'bg-amber-100', icon: 'text-amber-500' },
  out_of_stock: { bg: 'bg-red-100', icon: 'text-red-500' },
};

/**
 * Componente reutilizable para mostrar la imagen de un producto.
 *
 * - Si `product.image` existe (base64, URL o ruta local) → muestra la imagen
 * - Si no → muestra un ícono Package con fondo coloreado según el status del producto
 *
 * @example
 * <ProductImage product={product} size="md" />
 * <ProductImage product={product} size="lg" className="shadow-md" />
 */
export function ProductImage({ product, size = 'md', className }: ProductImageProps) {
  const config = sizeConfig[size];
  const colors = statusColors[product.status];

  if (product.image) {
    return (
      <div className={cn(config.container, config.rounded, 'overflow-hidden flex-shrink-0', className)}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        config.container,
        config.rounded,
        colors.bg,
        'flex items-center justify-center flex-shrink-0',
        className,
      )}
    >
      <Package className={cn(config.icon, colors.icon)} />
    </div>
  );
}
