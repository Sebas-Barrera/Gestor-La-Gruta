import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TouchInput } from '@/components/shared/TouchInput';
import { Switch } from '@/components/ui/switch';
import { FormField } from '@/components/shared/FormField';
import { UserPlus, RefreshCw } from 'lucide-react';
import type { Bar, Worker } from '@/types';

interface WorkerFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Worker, 'id' | 'createdAt'>) => void;
  worker?: Worker;
  bars: Bar[];
  currentBarId?: string;
}

export function WorkerFormModal({ open, onClose, onSave, worker, bars, currentBarId }: WorkerFormModalProps) {
  const isEditing = !!worker;
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedBarIds, setSelectedBarIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (worker) {
      setName(worker.name);
      setPin(worker.pin);
      setPhone(worker.phone);
      setSelectedBarIds(worker.barIds);
      setIsActive(worker.isActive);
    } else {
      setName('');
      setPin('');
      setPhone('');
      setSelectedBarIds(currentBarId ? [currentBarId] : []);
      setIsActive(true);
    }
    setErrors({});
  }, [worker, open, currentBarId]);

  const generatePin = () => {
    const newPin = String(Math.floor(1000 + Math.random() * 9000));
    setPin(newPin);
  };

  const toggleBar = (barId: string) => {
    setSelectedBarIds(prev =>
      prev.includes(barId)
        ? prev.filter(id => id !== barId)
        : [...prev, barId]
    );
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'El nombre es obligatorio';
    if (!pin || pin.length !== 4) errs.pin = 'El PIN debe ser de 4 dígitos';
    if (selectedBarIds.length === 0) errs.bars = 'Debe asignar al menos un bar';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({
      name: name.trim(),
      pin,
      phone: phone.trim(),
      barIds: selectedBarIds,
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
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            {isEditing ? 'Editar Personal' : 'Agregar Personal'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <FormField label="Nombre completo" required error={errors.name}>
            <TouchInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Juan Pérez" />
          </FormField>

          <FormField label="PIN (4 dígitos)" required error={errors.pin}>
            <div className="flex gap-2">
              <TouchInput
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPin(val);
                }}
                placeholder="0000"
                maxLength={4}
                keyboardMode="numeric"
                className="font-mono text-lg tracking-widest"
              />
              <Button type="button" variant="outline" onClick={generatePin} className="shrink-0 gap-1">
                <RefreshCw className="w-4 h-4" />
                Generar
              </Button>
            </div>
          </FormField>

          <FormField label="Teléfono">
            <TouchInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="555-0000" keyboardMode="numeric" />
          </FormField>

          <FormField label="Asignar a Almacenes" required error={errors.bars}>
            <div className="grid grid-cols-2 gap-2">
              {bars.map((bar) => (
                <button
                  key={bar.id}
                  type="button"
                  onClick={() => toggleBar(bar.id)}
                  className={`p-2.5 rounded-lg border-2 text-left text-sm transition-all duration-200 ${
                    selectedBarIds.includes(bar.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300 text-gray-700'
                  }`}
                >
                  <p className="font-medium">{bar.name}</p>
                  <p className="text-xs opacity-70">{bar.location}</p>
                </button>
              ))}
            </div>
          </FormField>

          {isEditing && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Estado</p>
                <p className="text-xs text-gray-500">{isActive ? 'Activo' : 'Inactivo'}</p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                className="data-[state=checked]:bg-blue-500"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button onClick={handleSubmit} className="flex-1 bg-blue-500 hover:bg-blue-600">
              {isEditing ? 'Guardar Cambios' : 'Agregar Personal'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
