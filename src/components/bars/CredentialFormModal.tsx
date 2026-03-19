import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { FormField } from '@/components/shared/FormField';
import { KeyRound } from 'lucide-react';
import type { BarCredential } from '@/types';

/** Regex para validar exactamente 4 dígitos numéricos */
const ACCESS_CODE_REGEX = /^\d{4}$/;

interface CredentialFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<BarCredential, 'id'>) => void;
  credential?: BarCredential;
  barId: string;
}

export function CredentialFormModal({ open, onClose, onSave, credential, barId }: CredentialFormModalProps) {
  const isEditing = !!credential;
  const [label, setLabel] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (credential) {
      setLabel(credential.label || '');
      setAccessCode(credential.accessCode);
      setIsActive(credential.isActive);
    } else {
      setLabel('');
      setAccessCode('');
      setIsActive(true);
    }
    setErrors({});
  }, [credential, open]);

  const validate = () => {
    const errs: Record<string, string> = {};
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
    if (errors.accessCode) {
      setErrors(prev => { const next = { ...prev }; delete next.accessCode; return next; });
    }
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({
      barId,
      label: label.trim() || undefined,
      accessCode: accessCode.trim(),
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
              <KeyRound className="w-5 h-5 text-blue-600" />
            </div>
            {isEditing ? 'Editar Credencial' : 'Agregar Credencial'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <FormField label="Etiqueta">
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ej: Credencial Principal" />
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

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Activa</p>
              <p className="text-xs text-gray-500">Habilitar esta credencial para iniciar sesión</p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              className="data-[state=checked]:bg-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button onClick={handleSubmit} className="flex-1 bg-blue-500 hover:bg-blue-600">
              {isEditing ? 'Guardar Cambios' : 'Agregar Credencial'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
