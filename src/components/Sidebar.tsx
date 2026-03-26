import { useState, useRef, useEffect } from 'react';
import {
  Home,
  Package,
  Store,
  BarChart3,
  ClipboardList,
  Bell,
  Settings,
  LogOut
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
  { icon: Store, label: 'Bares', id: 'bars' },
  { icon: BarChart3, label: 'Reportes', id: 'reports' },
  { icon: ClipboardList, label: 'Historial', id: 'history' },
  { icon: Bell, label: 'Alertas', id: 'alerts', badge: 3 },
  { icon: Settings, label: 'Configuración', id: 'settings' },
];

const workerNavItems: NavItem[] = [
  { icon: Package, label: 'Inventario', id: 'inventory' },
];

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  role?: UserRole;
  onLogout?: () => void;
}

export function Sidebar({ activeSection, onSectionChange, role = 'admin', onLogout }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const navItems = role === 'worker' ? workerNavItems : adminNavItems;

  const bottomItems: NavItem[] = [
    { icon: LogOut, label: 'Cerrar Sesión', id: 'logout' },
  ];

  // When pinned manually (via Logo in Electron), sidebar stays open.
  const [isPinned, setIsPinned] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Manejador del Click Outside: si el sidebar está pineado y el clic fue fuera, lo cerramos.
  useEffect(() => {
    if (!isPinned) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setIsPinned(false);
        setIsExpanded(false); // Por precaución retraemos todo estado visual
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPinned]);

  const handleLogoClick = () => {
    // Validar si estamos en el entorno compilado de Electron
    const isElectron = typeof window !== 'undefined' && 
      (window.electronAPI !== undefined || /electron/i.test(navigator.userAgent));
    
    // Solo permitimos el anclaje manual temporal al dar clic en el logo en Electron
    if (isElectron) {
      setIsPinned((prev) => !prev);
    }
  };

  const handleSectionClick = (section: string) => {
    setIsExpanded(false);
    setIsPinned(false);
    onSectionChange(section);
  };

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-50',
        'flex flex-col transition-[width] duration-300 ease-out overflow-hidden',
        isExpanded || isPinned ? 'w-60' : 'w-[72px]'
      )}
      onMouseEnter={() => { if (!isPinned) setIsExpanded(true); }}
      onMouseLeave={() => { if (!isPinned) setIsExpanded(false); }}
    >
      {/* Logo */}
      <div 
        className={cn(
          "h-16 flex items-center justify-center border-b border-gray-100 px-3 select-none",
          // Solo si estamos en electron parecerá cliqueable (cursor-pointer).
          // De forma nativa window.electronAPI sirve de check seguro.
          typeof window !== 'undefined' && (window.electronAPI || /electron/i.test(navigator.userAgent)) && "cursor-pointer"
        )}
        onClick={handleLogoClick}
      >
        <img
          src={lagrutaLogo}
          alt="La Gruta"
          className={cn(
            'object-contain transition-all duration-300 ease-out',
            isExpanded || isPinned ? 'h-10' : 'h-8'
          )}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSectionClick(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-xl overflow-hidden',
                'transition-colors duration-200 ease-out group relative',
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
                  'w-5 h-5 shrink-0 transition-transform duration-200',
                  'group-hover:scale-110',
                  isActive && 'scale-110'
                )}
              />

              <span className={cn(
                'text-sm font-medium whitespace-nowrap transition-opacity duration-200',
                isExpanded || isPinned ? 'opacity-100' : 'opacity-0'
              )}>
                {item.label}
              </span>

              {item.badge && (
                <span className={cn(
                  'absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs',
                  'flex items-center justify-center font-medium',
                  'animate-in zoom-in duration-200',
                  !isExpanded && !isPinned && 'right-1'
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

      {/* Espacio invisible (ya no reacciona al clic como "lock") */}
      <div
        className="min-h-[48px] flex-shrink-0"
      />

      {/* Bottom Actions */}
      <div className="py-4 px-3 space-y-1 border-t border-gray-100">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'logout') {
                  setIsExpanded(false);
                  setIsPinned(false);
                  if (onLogout) onLogout();
                }
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-xl overflow-hidden',
                'text-gray-500 hover:text-blue-600 hover:bg-gray-50',
                'transition-colors duration-200 ease-out group'
              )}
            >
              <Icon className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className={cn(
                'text-sm font-medium whitespace-nowrap transition-opacity duration-200',
                isExpanded || isPinned ? 'opacity-100' : 'opacity-0'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
