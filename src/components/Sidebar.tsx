import { useState } from 'react';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Store, 
  BarChart3, 
  Bell, 
  Settings, 
  HelpCircle, 
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  id: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Dashboard', id: 'dashboard' },
  { icon: Package, label: 'Inventario', id: 'inventory' },
  { icon: ShoppingCart, label: 'Ventas', id: 'sales' },
  { icon: Store, label: 'Bares', id: 'bars' },
  { icon: BarChart3, label: 'Reportes', id: 'reports' },
  { icon: Bell, label: 'Alertas', id: 'alerts', badge: 3 },
  { icon: Settings, label: 'Configuración', id: 'settings' },
];

const bottomItems: NavItem[] = [
  { icon: HelpCircle, label: 'Ayuda', id: 'help' },
  { icon: LogOut, label: 'Cerrar Sesión', id: 'logout' },
];

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-50',
        'flex flex-col transition-all duration-300 ease-out',
        isExpanded ? 'w-60' : 'w-[72px]'
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-gray-100">
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
          <span className="text-white font-bold text-lg">B</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-xl',
                'transition-all duration-200 ease-out group relative',
                'hover:translate-x-1',
                isActive 
                  ? 'bg-blue-50 text-blue-600 border-l-3 border-blue-500' 
                  : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50'
              )}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <Icon 
                className={cn(
                  'w-5 h-5 transition-transform duration-200',
                  'group-hover:scale-110',
                  isActive && 'scale-110'
                )} 
              />
              
              {isExpanded && (
                <span className={cn(
                  'text-sm font-medium whitespace-nowrap',
                  'animate-in fade-in slide-in-from-left-2 duration-200'
                )}>
                  {item.label}
                </span>
              )}
              
              {item.badge && (
                <span className={cn(
                  'absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs',
                  'flex items-center justify-center font-medium',
                  'animate-in zoom-in duration-200',
                  !isExpanded && 'right-1'
                )}>
                  {item.badge}
                </span>
              )}
              
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="py-4 px-3 space-y-1 border-t border-gray-100">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => item.id === 'logout' && onSectionChange('login')}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-xl',
                'text-gray-500 hover:text-blue-600 hover:bg-gray-50',
                'transition-all duration-200 ease-out group',
                'hover:translate-x-1'
              )}
            >
              <Icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
              {isExpanded && (
                <span className="text-sm font-medium whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-200">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
