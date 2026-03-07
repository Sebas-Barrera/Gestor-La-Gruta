import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  value: string | number;
  label: string;
  change?: number;
  changeLabel?: string;
  delay?: number;
}

export function StatCard({
  icon: Icon,
  iconBgColor,
  iconColor,
  value,
  label,
  change,
  changeLabel,
  delay = 0,
}: StatCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    const numericValue = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
    if (isNaN(numericValue)) return;

    const duration = 1000;
    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (numericValue - startValue) * eased;
      setDisplayValue(Math.floor(current));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, value]);

  const formattedValue = value.toString().startsWith('$')
    ? `$${displayValue.toLocaleString()}`
    : displayValue.toLocaleString();

  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div
      ref={cardRef}
      className={cn(
        'bg-white rounded-xl p-5 border border-gray-200',
        'shadow-sm hover:shadow-lg hover:shadow-gray-200/50',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-2 hover:rotate-x-5',
        'transform-gpu',
        isVisible
          ? 'opacity-100 translate-y-0 rotate-y-0'
          : 'opacity-0 translate-y-8 rotate-y-[-90deg]'
      )}
      style={{
        transitionDelay: `${delay}ms`,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            'transition-transform duration-300 hover:scale-110',
            iconBgColor
          )}
        >
          <Icon className={cn('w-6 h-6', iconColor)} />
        </div>

        {change !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
              isPositive && 'bg-blue-100 text-blue-700',
              isNegative && 'bg-red-100 text-red-700',
              !isPositive && !isNegative && 'bg-gray-100 text-gray-600'
            )}
          >
            {isPositive && <TrendingUp className="w-3 h-3" />}
            {isNegative && <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="text-3xl font-bold text-gray-900 tracking-tight">
          {formattedValue}
        </div>
        <div className="text-sm text-gray-500 mt-1">{label}</div>
        {changeLabel && (
          <div className="text-xs text-gray-400 mt-2">{changeLabel}</div>
        )}
      </div>
    </div>
  );
}
