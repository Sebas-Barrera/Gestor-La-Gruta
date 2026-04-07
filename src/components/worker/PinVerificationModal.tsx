import { useState, useCallback, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { KeyRound } from 'lucide-react';
import { CodeKeypad } from '@/components/shared/CodeKeypad';
import type { Worker } from '@/types';

interface PinVerificationModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: (worker: Worker) => void;
  verifyPin: (pin: string) => { valid: boolean; worker?: Worker };
  title?: string;
}

export function PinVerificationModal({
  open,
  onClose,
  onVerified,
  verifyPin,
  title = 'Verificación de PIN',
}: PinVerificationModalProps) {
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

    const result = verifyPin(pin);
    if (result.valid && result.worker) {
      reset();
      onVerified(result.worker);
    } else {
      setShake(true);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError(
        newAttempts >= 3
          ? 'PIN incorrecto - Contacta al administrador'
          : 'PIN incorrecto'
      );
      setTimeout(() => {
        setShake(false);
        setPin('');
      }, 500);
    }
  }, [pin, verifyPin, reset, onVerified, attempts]);

  const submittedRef = useRef(false);

  const handleChange = useCallback((value: string) => {
    setPin(value);
    submittedRef.current = false;
    if (error) setError('');
  }, [error]);

  useEffect(() => {
    if (pin.length === 4 && !submittedRef.current) {
      submittedRef.current = true;
      handleSubmit();
    }
  }, [pin, handleSubmit]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-blue-600" />
            </div>
            <DialogTitle className="text-lg">{title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
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
