import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CapacityChartProps {
  percentage: number;
  currentLoad: number;
  maxCapacity: number;
  label?: string;
  delay?: number;
}

export function CapacityChart({
  percentage,
  currentLoad,
  maxCapacity,
  label = 'Capacidad Utilizada',
  delay = 0,
}: CapacityChartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const [strokeOffset, setStrokeOffset] = useState(283);

  const radius = 45;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 1200;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedPercentage(Math.floor(percentage * eased));
      setStrokeOffset(circumference * (1 - percentage / 100 * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, percentage, circumference]);

  const available = maxCapacity - currentLoad;

  return (
    <div
      className={cn(
        'bg-white rounded-xl p-6 border border-gray-200 shadow-sm',
        'transition-all duration-500 ease-out',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-8">
        {/* Chart */}
        <div className="relative w-36 h-36 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="10"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#10B981"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              className="transition-all duration-100 ease-out"
            />
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900">{animatedPercentage}%</span>
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-gray-600">Carga Actual</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {currentLoad.toLocaleString()} unidades
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              <span className="text-sm text-gray-600">Capacidad Máx</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {maxCapacity.toLocaleString()} unidades
            </span>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <span className="text-sm text-gray-600">Disponible</span>
            </div>
            <span className="text-sm font-semibold text-blue-600">
              {available.toLocaleString()} unidades
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
