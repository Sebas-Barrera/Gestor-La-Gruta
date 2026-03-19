import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface FilterConfig {
  type: 'select' | 'search' | 'page-size';
  key: string;
  label: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export function FilterBar({ filters, values, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {filters.map((filter) => {
        switch (filter.type) {
          case 'search':
            return (
              <div key={filter.key} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={filter.placeholder || `Buscar...`}
                  value={values[filter.key] || ''}
                  onChange={(e) => onChange(filter.key, e.target.value)}
                  className="pl-10 w-56 focus-visible:ring-blue-500"
                />
              </div>
            );

          case 'select':
            return (
              <select
                key={filter.key}
                value={values[filter.key] || ''}
                onChange={(e) => onChange(filter.key, e.target.value)}
                className="h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">{filter.label}</option>
                {filter.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            );

          case 'page-size':
            return (
              <select
                key={filter.key}
                value={values[filter.key] || '10'}
                onChange={(e) => onChange(filter.key, e.target.value)}
                className="h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {(filter.options || [
                  { value: '10', label: '10 por página' },
                  { value: '25', label: '25 por página' },
                  { value: '50', label: '50 por página' },
                  { value: '100', label: '100 por página' },
                ]).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
