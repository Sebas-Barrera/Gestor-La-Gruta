import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { FormField } from '@/components/shared/FormField';
import { ShieldCheck } from 'lucide-react';
import type { AdminAccount } from '@/types';

/** Regex para validar exactamente 4 dígitos numéricos */
const ACCESS_CODE_REGEX = /^\d{4}$/;

interface AdminFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<AdminAccount, 'id' | 'createdAt'>) => void;
  admin?: AdminAccount;
}

export function AdminFormModal({ open, onClose, onSave, admin }: AdminFormModalProps) {
  const isEditing = !!admin;
  const [name, setName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (admin) {
        setName(admin.name);
        setAccessCode(admin.accessCode);
        setPhone(admin.phone || '');
        setIsActive(admin.isActive);
      } else {
        setName('');
        setAccessCode('');
        setPhone('');
        setIsActive(true);
      }
      setErrors({});
    }
  }, [open, admin]);

  const clearError = (key: string) => {
    if (errors[key]) {
      setErrors(prev => { const next = { ...prev }; delete next[key]; return next; });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'El nombre es obligatorio';
    if (!accessCode.trim()) {
      errs.accessCode = 'El código de acceso es obligatorio';
    } else if (!ACCESS_CODE_REGEX.test(accessCode.trim())) {
      errs.accessCode = 'El código debe ser exactamente 4 dígitos numéricos';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAccessCodeChange = (value: string) => {
    const filtered = value.replace(/\D/g, '').slice(0, 4);
    setAccessCode(filtered);
    clearError('accessCode');
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({
      name: name.trim(),
      accessCode: accessCode.trim(),
      phone: phone.trim() || undefined,
      isActive,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            </div>
            {isEditing ? 'Editar Administrador' : 'Agregar Administrador'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <FormField label="Nombre completo" required error={errors.name}>
            <Input
              value={name}
              onChange={(e) => { setName(e.target.value); clearError('name'); }}
              placeholder="Ej: Juan Pérez"
            />
          </FormField>

          <FormField label="Código de acceso (4 dígitos)" required error={errors.accessCode}>
            <Input
              value={accessCode}
              onChange={(e) => handleAccessCodeChange(e.target.value)}
              placeholder="0000"
              maxLength={4}
              inputMode="numeric"
              className="font-mono text-center text-lg tracking-[0.5em]"
            />
          </FormField>

          <FormField label="Teléfono">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="555-0000"
            />
          </FormField>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Cuenta activa</p>
              <p className="text-xs text-gray-500">Permitir que esta cuenta inicie sesión</p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              className="data-[state=checked]:bg-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="flex-1 bg-blue-500 hover:bg-blue-600">
              {isEditing ? 'Guardar Cambios' : 'Agregar Administrador'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
