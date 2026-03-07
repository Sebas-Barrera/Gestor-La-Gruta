import { Eye, Plus, Bell, Settings, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  breadcrumbs: string[];
  onAddProduct: () => void;
  onViewReport: () => void;
}

export function Header({ breadcrumbs, onAddProduct, onViewReport }: HeaderProps) {
  return (
    <header className="h-16 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2">
        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
            <span
              className={cn(
                'text-sm transition-colors duration-200',
                index === breadcrumbs.length - 1
                  ? 'text-emerald-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700 cursor-pointer'
              )}
            >
              {crumb}
            </span>
          </div>
        ))}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onViewReport}
          className="gap-2 text-gray-700 border-gray-300 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/50 transition-all duration-200"
        >
          <Eye className="w-4 h-4" />
          Ver Reporte
        </Button>
        
        <Button
          size="sm"
          onClick={onAddProduct}
          className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm hover:shadow-md hover:shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Agregar Producto
        </Button>

        <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
          <button className="relative p-2 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-gray-100 transition-all duration-200 hover:scale-110">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </button>
          
          <button className="p-2 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-gray-100 transition-all duration-200 hover:scale-110">
            <Settings className="w-5 h-5" />
          </button>
          
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center ml-2 cursor-pointer hover:ring-2 hover:ring-emerald-500/30 transition-all duration-200">
            <span className="text-emerald-700 font-semibold text-sm">JD</span>
          </div>
        </div>
      </div>
    </header>
  );
}
