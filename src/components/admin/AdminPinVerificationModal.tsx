import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { KeyRound } from 'lucide-react';
import { CodeKeypad } from '@/components/shared/CodeKeypad';
import type { AdminAccount } from '@/types';

interface AdminPinVerificationModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: (admin: AdminAccount) => void;
  verifyAdminPin: (pin: string) => { valid: boolean; admin?: AdminAccount };
  title?: string;
}

export function AdminPinVerificationModal({
  open,
  onClose,
  onVerified,
  verifyAdminPin,
  title = 'Verificación de PIN Administrador',
}: AdminPinVerificationModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const reset = useCallback(() => {
    setPin('');
    setError('');
    setShake(false);
    setAttempts(0);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = useCallback(() => {
    if (pin.length !== 4) {
      setError('Ingresa un PIN de 4 dígitos');
      return;
    }

    const result = verifyAdminPin(pin);
    if (result.valid && result.admin) {
      reset();
      onVerified(result.admin);
    } else {
      setShake(true);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError(
        newAttempts >= 3
          ? 'PIN incorrecto - Verifica tu código de acceso'
          : 'PIN incorrecto'
      );
      setTimeout(() => {
        setShake(false);
        setPin('');
      }, 500);
    }
  }, [pin, verifyAdminPin, reset, onVerified, attempts]);

  const handleChange = useCallback((value: string) => {
    setPin(value);
    if (error) setError('');
  }, [error]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-amber-600" />
            </div>
            <DialogTitle className="text-lg">{title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          <p className="text-sm text-gray-600 mb-4">
            Ingresa tu PIN de administrador para autorizar esta operación
          </p>
          <CodeKeypad
            value={pin}
            onChange={handleChange}
            onSubmit={handleSubmit}
            error={error}
            shake={shake}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
