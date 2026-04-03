import { useState } from "react";
import { User, Database, Bell, Settings, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminManagement } from "@/hooks/useAdminManagement";
import { EditProfileModal } from "@/components/settings/EditProfileModal";
import { AdminAccountsSection } from "@/components/settings/AdminAccountsSection";
import { toast } from "sonner";
import type { AdminAccount } from "@/types";

export function SettingsSection() {
  const { currentUser, updateProfile } = useAuth();
  const { admins, addAdmin, updateAdmin, deleteAdmin } = useAdminManagement();

  const [emailAlerts, setEmailAlerts] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const initials =
    currentUser?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "AD";

  const handleProfileSave = (data: { name: string; phone?: string }) => {
    updateProfile(data);
    toast.success("Perfil actualizado", {
      description: "Los cambios se guardaron correctamente.",
    });
  };

  const handleAddAdmin = async (data: Omit<AdminAccount, "id" | "createdAt">) => {
    await addAdmin(data);
    toast.success("Administrador creado", {
      description: `La cuenta de "${data.name}" fue creada exitosamente.`,
    });
  };

  const handleUpdateAdmin = async (
    id: string,
    data: Omit<AdminAccount, "id" | "createdAt">,
  ) => {
    await updateAdmin(id, data);
    toast.success("Administrador actualizado", {
      description: "Los cambios se guardaron correctamente.",
    });
  };

  const handleDeleteAdmin = async (id: string) => {
    await deleteAdmin(id);
    toast.success("Administrador eliminado", {
      description: "La cuenta fue eliminada.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">
          Administra las preferencias de tu cuenta y del sistema
        </p>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-24 bg-white" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-5 -mt-10">
            <div className="w-20 h-20 rounded-xl bg-white border-4 border-white shadow-md flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">
                {initials}
              </span>
            </div>
            <div className="flex-1 pt-3">
              <h2 className="text-xl font-bold text-gray-900">
                {currentUser?.name ?? "Admin"}
              </h2>
              <p className="text-sm text-gray-500">Administrador</p>
            </div>
            <Button
              onClick={() => setProfileModalOpen(true)}
              className="gap-2 bg-blue-500 hover:bg-blue-600"
            >
              <User className="w-4 h-4" />
              Editar Perfil
            </Button>
          </div>
          <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
            {currentUser?.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                {currentUser.phone}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Último acceso: hoy
            </div>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications Group */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Notificaciones
            </h3>
          </div>

          <div className="divide-y divide-gray-100">
            <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors duration-200">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Alertas por Email
                </p>
                <p className="text-xs text-gray-500">
                  Recibir alertas de inventario por correo
                </p>
              </div>
              <Switch
                checked={emailAlerts}
                onCheckedChange={setEmailAlerts}
                className="data-[state=checked]:bg-blue-500"
              />
            </div>
          </div>
        </div>

        {/* System Group */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Sistema
            </h3>
          </div>

          <div className="divide-y divide-gray-100">
            <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors duration-200">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Sincronización Automática
                </p>
                <p className="text-xs text-gray-500">
                  Sincronizar datos en tiempo real
                </p>
              </div>
              <Switch
                checked={autoSync}
                onCheckedChange={setAutoSync}
                className="data-[state=checked]:bg-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Admin Accounts Management */}
      <AdminAccountsSection
        admins={admins}
        currentAdminId={currentUser?.id ?? ""}
        onAddAdmin={handleAddAdmin}
        onUpdateAdmin={handleUpdateAdmin}
        onDeleteAdmin={handleDeleteAdmin}
      />

      {/* App Info */}
      <div className="text-center text-xs text-gray-400 pt-2">
        La Gruta | Almacén v1.0.0
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onSave={handleProfileSave}
        profile={{
          name: currentUser?.name ?? "",
          phone: currentUser?.phone,
        }}
      />
    </div>
  );
}
