import { useEffect, useState } from 'react';
import { Check, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Bar } from '@/types';

interface BarSelectorProps {
  bars: Bar[];
  activeBarId: string;
  onBarChange: (barId: string) => void;
  delay?: number;
}

export function BarSelector({ bars, activeBarId, onBarChange, delay = 0 }: BarSelectorProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 shadow-sm p-4',
        'transition-all duration-500 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Seleccionar Bar</h3>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {bars.map((bar, index) => {
          const isActive = bar.id === activeBarId;
          
          return (
            <button
              key={bar.id}
              onClick={() => onBarChange(bar.id)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border-2 min-w-fit',
                'transition-all duration-300 ease-out',
                'hover:scale-[1.02] hover:shadow-md',
                isActive
                  ? 'border-blue-500 bg-blue-50 shadow-blue-100'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              )}
              style={{
                animationDelay: `${index * 60}ms`,
              }}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300',
                  isActive ? 'bg-blue-500' : 'bg-gray-100'
                )}
              >
                <Store
                  className={cn(
                    'w-5 h-5 transition-colors duration-300',
                    isActive ? 'text-white' : 'text-gray-500'
                  )}
                />
              </div>
              
              <div className="text-left">
                <p
                  className={cn(
                    'text-sm font-semibold transition-colors duration-300',
                    isActive ? 'text-blue-700' : 'text-gray-900'
                  )}
                >
                  {bar.name}
                </p>
                <p className="text-xs text-gray-500">{bar.location}</p>
              </div>
              
              {isActive && (
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center animate-in zoom-in duration-200">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
