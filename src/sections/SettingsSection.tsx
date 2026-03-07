import { useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Database, 
  ChevronRight,
  Mail,
  Moon,
  Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export function SettingsSection() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  return (
    <div className="p-6 space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-emerald-700">JD</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Juan Doe</h2>
            <p className="text-gray-500">Administrador</p>
            <p className="text-sm text-gray-400 mt-1">juan.doe@barinventory.com</p>
          </div>
          <Button className="gap-2 bg-emerald-500 hover:bg-emerald-600">
            <User className="w-4 h-4" />
            Editar Perfil
          </Button>
        </div>
      </div>

      {/* Notifications Group */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Notificaciones
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {/* Push Notifications */}
          <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors duration-200">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Notificaciones Push</p>
              <p className="text-xs text-gray-500">Recibir alertas en la aplicación</p>
            </div>
            <Switch
              checked={notifications}
              onCheckedChange={setNotifications}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          {/* Email Alerts */}
          <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors duration-200">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Alertas por Email</p>
              <p className="text-xs text-gray-500">Recibir alertas de inventario por correo</p>
            </div>
            <Switch
              checked={emailAlerts}
              onCheckedChange={setEmailAlerts}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* System Group */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Sistema
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {/* Auto Sync */}
          <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors duration-200">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Sincronización Automática</p>
              <p className="text-xs text-gray-500">Sincronizar datos en tiempo real</p>
            </div>
            <Switch
              checked={autoSync}
              onCheckedChange={setAutoSync}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          {/* Dark Mode */}
          <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors duration-200">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              {darkMode ? (
                <Moon className="w-5 h-5 text-gray-500" />
              ) : (
                <Sun className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Modo Oscuro</p>
              <p className="text-xs text-gray-500">Cambiar entre tema claro y oscuro</p>
            </div>
            <Switch
              checked={darkMode}
              onCheckedChange={setDarkMode}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Security Group */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Seguridad
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {/* Security */}
          <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Seguridad de la Cuenta</p>
              <p className="text-xs text-gray-500">Contraseña, autenticación de dos factores</p>
            </div>
            <button className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 rounded-xl border border-red-200 p-6">
        <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wider mb-4">
          Zona de Peligro
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-900">Eliminar Cuenta</p>
            <p className="text-xs text-red-600">
              Esta acción no se puede deshacer. Se eliminarán todos tus datos.
            </p>
          </div>
          <Button variant="destructive" size="sm">
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}
