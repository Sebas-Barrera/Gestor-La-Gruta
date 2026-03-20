import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TouchInput } from '@/components/shared/TouchInput';
import { FormField } from '@/components/shared/FormField';
import { User } from 'lucide-react';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; phone?: string }) => void;
  profile: { name: string; phone?: string };
}

export function EditProfileModal({ open, onClose, onSave, profile }: EditProfileModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setName(profile.name);
      setPhone(profile.phone || '');
      setErrors({});
    }
  }, [open, profile]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'El nombre es obligatorio';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({
      name: name.trim(),
      phone: phone.trim() || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            Editar Perfil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <FormField label="Nombre completo" required error={errors.name}>
            <TouchInput
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors(prev => { const next = { ...prev }; delete next.name; return next; });
              }}
              placeholder="Ej: Juan Pérez"
            />
          </FormField>

          <FormField label="Teléfono">
            <TouchInput
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="555-0000"
              keyboardMode="numeric"
            />
          </FormField>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="flex-1 bg-blue-500 hover:bg-blue-600">
              Guardar Cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
