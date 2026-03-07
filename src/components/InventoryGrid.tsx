import { useEffect, useState } from 'react';
import { Plus, Package, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface InventorySlot {
  id: string;
  label: string;
  product?: Product;
  capacity: number;
  current: number;
}

interface InventoryGridProps {
  products: Product[];
  onSlotClick: (slotId: string) => void;
  delay?: number;
}

export function InventoryGrid({ products, onSlotClick, delay = 0 }: InventoryGridProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [visibleSlots, setVisibleSlots] = useState<number[]>([]);

  // Generate slots based on products
  const slots: InventorySlot[] = Array.from({ length: 12 }, (_, i) => {
    const row = String.fromCharCode(65 + Math.floor(i / 4));
    const col = (i % 4) + 1;
    const product = products[i];
    
    return {
      id: `${row}${col}`,
      label: `${row}${col}`,
      product,
      capacity: product?.maxStock || 100,
      current: product?.stock || 0,
    };
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    slots.forEach((_, index) => {
      setTimeout(() => {
        setVisibleSlots(prev => [...prev, index]);
      }, 300 + index * 40);
    });
  }, [isVisible, slots.length]);

  const getSlotStatus = (slot: InventorySlot) => {
    if (!slot.product) return 'empty';
    const percentage = (slot.current / slot.capacity) * 100;
    if (percentage === 0) return 'empty';
    if (percentage < 20) return 'critical';
    if (percentage < 50) return 'low';
    return 'good';
  };

  const statusStyles = {
    empty: 'bg-gray-50 border-gray-200 border-dashed',
    good: 'bg-blue-50 border-blue-200',
    low: 'bg-amber-50 border-amber-200',
    critical: 'bg-red-50 border-red-200',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 shadow-sm p-5',
        'transition-all duration-600 ease-out',
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Mapa de Inventario</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200" />
            <span className="text-gray-600">Buen stock</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200" />
            <span className="text-gray-600">Stock bajo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-100 border border-red-200" />
            <span className="text-gray-600">Crítico</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-3">
        {slots.map((slot, index) => {
          const status = getSlotStatus(slot);
          const isSlotVisible = visibleSlots.includes(index);
          const percentage = slot.product ? (slot.current / slot.capacity) * 100 : 0;

          return (
            <button
              key={slot.id}
              onClick={() => onSlotClick(slot.id)}
              className={cn(
                'relative aspect-square rounded-xl border-2 p-3',
                'flex flex-col items-center justify-center',
                'transition-all duration-300 ease-out',
                'hover:scale-105 hover:shadow-lg hover:z-10',
                statusStyles[status as keyof typeof statusStyles],
                isSlotVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              )}
              style={{ transitionDelay: `${index * 40}ms` }}
            >
              {/* Slot Label */}
              <span className="absolute top-2 left-2 text-xs font-medium text-gray-400">
                {slot.label}
              </span>

              {slot.product ? (
                <>
                  {/* Product Icon */}
                  {(() => {
                    const name = slot.product.name.toLowerCase();
                    const hasImage = name.includes('coca') || name.includes('cerveza') || name.includes('a. mineral tc');
                    return (
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center mb-2',
                        !hasImage && status === 'good' && 'bg-blue-200',
                        !hasImage && status === 'low' && 'bg-amber-200',
                        !hasImage && status === 'critical' && 'bg-red-200',
                      )}>
                        {name.includes('coca') ? (
                          <img src="/products/coca355lata.png" alt={slot.product.name} className="w-full h-full object-contain" />
                        ) : name.includes('cerveza') ? (
                          <img src="/products/corona355vidrio.png" alt={slot.product.name} className="w-full h-full object-contain" />
                        ) : name.includes('a. mineral tc') ? (
                          <img src="/products/aguaMineral355TC.png" alt={slot.product.name} className="w-full h-full object-contain" />
                        ) : (
                          <Package className={cn(
                            'w-5 h-5',
                            status === 'good' && 'text-blue-700',
                            status === 'low' && 'text-amber-700',
                            status === 'critical' && 'text-red-700',
                          )} />
                        )}
                      </div>
                    );
                  })()}

                  {/* Product Info */}
                  <p className="text-xs font-medium text-gray-700 text-center line-clamp-1 px-1">
                    {slot.product.name.split(' ')[0]}
                  </p>
                  
                  <div className="flex items-center gap-1 mt-1">
                    <span className={cn(
                      'text-xs font-bold',
                      status === 'good' && 'text-blue-600',
                      status === 'low' && 'text-amber-600',
                      status === 'critical' && 'text-red-600',
                    )}>
                      {slot.current}
                    </span>
                    <span className="text-xs text-gray-400">/{slot.capacity}</span>
                  </div>

                  {/* Mini Progress */}
                  <div className="w-full h-1 bg-gray-200 rounded-full mt-2 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        status === 'good' && 'bg-blue-500',
                        status === 'low' && 'bg-amber-500',
                        status === 'critical' && 'bg-red-500',
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* Alert Indicator */}
                  {status === 'critical' && (
                    <div className="absolute top-2 right-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Empty Slot */}
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-2">
                    <Plus className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-400">Vacío</p>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
