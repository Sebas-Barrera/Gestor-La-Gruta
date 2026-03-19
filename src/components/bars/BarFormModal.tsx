import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';
import { Store } from 'lucide-react';
import type { Bar } from '@/types';

interface BarFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Bar, 'id'>) => void;
  bar?: Bar;
}

export function BarFormModal({ open, onClose, onSave, bar }: BarFormModalProps) {
  const isEditing = !!bar;
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [manager, setManager] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (bar) {
      setName(bar.name);
      setLocation(bar.location);
      setPhone(bar.phone || '');
      setManager(bar.manager || '');
    } else {
      setName('');
      setLocation('');
      setPhone('');
      setManager('');
    }
    setErrors({});
  }, [bar, open]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'El nombre es obligatorio';
    if (!location.trim()) errs.location = 'La ubicación es obligatoria';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({
      name: name.trim(),
      location: location.trim(),
      phone: phone.trim() || undefined,
      manager: manager.trim() || undefined,
      isActive: bar?.isActive ?? true,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Store className="w-5 h-5 text-blue-600" />
            </div>
            {isEditing ? 'Editar Bar' : 'Agregar Bar'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <FormField label="Nombre del Bar" required error={errors.name}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Bar Central" />
          </FormField>

          <FormField label="Ubicación" required error={errors.location}>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej: Planta Baja" />
          </FormField>

          <FormField label="Teléfono">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ej: 555-0101" />
          </FormField>

          <FormField label="Encargado">
            <Input value={manager} onChange={(e) => setManager(e.target.value)} placeholder="Ej: Juan Pérez" />
          </FormField>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button onClick={handleSubmit} className="flex-1 bg-blue-500 hover:bg-blue-600">
              {isEditing ? 'Guardar Cambios' : 'Agregar Bar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
