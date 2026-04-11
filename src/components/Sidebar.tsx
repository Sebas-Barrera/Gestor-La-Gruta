import { useState, useRef, useEffect } from 'react';
import {
  Home,
  Package,
  Store,
  BarChart3,
  ClipboardList,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/auth';
import lagrutaLogo from '@/assets/lagruta-logo.png';

interface NavItem {
  icon: React.ElementType;
  label: string;
  id: string;
  badge?: number;
}

const adminNavItems: NavItem[] = [
  { icon: Home, label: 'Dashboard', id: 'dashboard' },
  { icon: Package, label: 'Inventario', id: 'inventory' },
  { icon: Store, label: 'Almacenes', id: 'bars' },
  { icon: BarChart3, label: 'Reportes', id: 'reports' },
  { icon: ClipboardList, label: 'Historial', id: 'history' },
  { icon: Bell, label: 'Alertas', id: 'alerts', badge: 3 },
  { icon: Settings, label: 'Configuración', id: 'settings' },
];

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  role?: UserRole;
  onLogout?: () => void;
}

export function Sidebar({ activeSection, onSectionChange, role = 'admin', onLogout }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const navItems = role === 'admin' ? adminNavItems : [];

  // Cerrar sidebar al tocar fuera
  useEffect(() => {
    if (!isExpanded) return;

    const handleOutsideTouch = (e: MouseEvent | TouchEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideTouch);
    document.addEventListener('touchstart', handleOutsideTouch);
    return () => {
      document.removeEventListener('mousedown', handleOutsideTouch);
      document.removeEventListener('touchstart', handleOutsideTouch);
    };
  }, [isExpanded]);

  const toggleSidebar = () => setIsExpanded(prev => !prev);

  const handleSectionClick = (section: string) => {
    setIsExpanded(false);
    onSectionChange(section);
  };

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-50',
        'flex flex-col transition-[width] duration-300 ease-out overflow-hidden',
        isExpanded ? 'w-72' : 'w-[96px]'
      )}
    >
      {/* Header: Logo + Hamburguesa */}
      <div className="h-20 flex items-center border-b border-gray-100 px-4 gap-3">
        <button
          onClick={toggleSidebar}
          className="w-14 h-14 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors shrink-0"
        >
          {isExpanded ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>

        <img
          src={lagrutaLogo}
          alt="La Gruta"
          className={cn(
            'object-contain h-10 transition-opacity duration-300',
            isExpanded ? 'opacity-100' : 'opacity-0'
          )}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSectionClick(item.id)}
              className={cn(
                'w-full flex items-center gap-4 px-4 py-4 rounded-xl overflow-hidden',
                'transition-colors duration-200 ease-out group relative',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 active:bg-gray-100 active:text-blue-600'
              )}
            >
              <Icon
                className={cn(
                  'w-7 h-7 shrink-0 transition-transform duration-200',
                  isActive && 'scale-110'
                )}
              />

              <span className={cn(
                'text-lg font-medium whitespace-nowrap transition-opacity duration-200',
                isExpanded ? 'opacity-100' : 'opacity-0'
              )}>
                {item.label}
              </span>

              {item.badge && (
                <span className={cn(
                  'absolute top-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs',
                  'flex items-center justify-center font-semibold',
                  isExpanded ? 'right-3' : 'right-2'
                )}>
                  {item.badge}
                </span>
              )}

              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-blue-500 rounded-r-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom: Logout */}
      <div className="py-4 px-4 space-y-1 border-t border-gray-100">
        <button
          onClick={() => {
            setIsExpanded(false);
            if (onLogout) onLogout();
          }}
          className={cn(
            'w-full flex items-center gap-4 px-4 py-4 rounded-xl overflow-hidden',
            'text-gray-500 active:bg-gray-100 active:text-blue-600',
            'transition-colors duration-200 ease-out group'
          )}
        >
          <LogOut className="w-7 h-7 shrink-0" />
          <span className={cn(
            'text-lg font-medium whitespace-nowrap transition-opacity duration-200',
            isExpanded ? 'opacity-100' : 'opacity-0'
          )}>
            Cerrar Sesión
          </span>
        </button>
      </div>
    </aside>
  );
}
