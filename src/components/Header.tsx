import { Bell, Settings, ChevronRight, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/auth';

interface HeaderProps {
  breadcrumbs: string[];
  barName?: string;
  userRole?: UserRole;
  onSectionChange?: (section: string) => void;
}

export function Header({ breadcrumbs, barName, userRole = 'admin', onSectionChange }: HeaderProps) {
  return (
    <header className="h-16 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Left: Breadcrumbs or Bar Name */}
      <div className="flex items-center gap-4">
        {userRole === 'worker' && barName ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">{barName}</h2>
              <p className="text-xs text-gray-500">Almacén</p>
            </div>
          </div>
        ) : (
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
                      ? 'text-blue-600 font-medium'
                      : 'text-gray-500 hover:text-gray-700 cursor-pointer'
                  )}
                >
                  {crumb}
                </span>
              </div>
            ))}
          </nav>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {userRole === 'admin' && (
            <button
              onClick={() => onSectionChange?.('alerts')}
              className="relative p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-100 transition-all duration-200 hover:scale-110"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </button>
          )}

          {userRole === 'admin' && (
            <button
              onClick={() => onSectionChange?.('settings')}
              className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-100 transition-all duration-200 hover:scale-110"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
