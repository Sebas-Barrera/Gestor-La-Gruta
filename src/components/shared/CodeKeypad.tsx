import { Delete, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Longitud por defecto del código */
const DEFAULT_CODE_LENGTH = 4;

interface CodeKeypadProps {
  /** Longitud del código (default: 4) */
  length?: number;
  /** Valor actual del código */
  value: string;
  /** Callback al cambiar el valor */
  onChange: (value: string) => void;
  /** Callback al confirmar el código completo */
  onSubmit: () => void;
  /** Mensaje de error a mostrar */
  error?: string;
  /** Activar animación de shake (error visual) */
  shake?: boolean;
  /** Deshabilitar toda la interacción */
  disabled?: boolean;
}

/**
 * Teclado numérico reutilizable con display de código enmascarado.
 *
 * Usado en:
 *  - Login de admin y almacén (CodeLoginForm)
 *  - Verificación de PIN de trabajador (PinVerificationModal)
 */
export function CodeKeypad({
  length = DEFAULT_CODE_LENGTH,
  value,
  onChange,
  onSubmit,
  error,
  shake = false,
  disabled = false,
}: CodeKeypadProps) {
  const handleKeyPress = (key: string) => {
    if (disabled || value.length >= length) return;
    onChange(value + key);
  };

  const handleClear = () => {
    if (disabled) return;
    onChange('');
  };

  const handleBackspace = () => {
    if (disabled) return;
    onChange(value.slice(0, -1));
  };

  const isComplete = value.length === length;
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div>
      {/* Code Display */}
      <div
        className={cn(
          'flex justify-center gap-3 my-6 transition-transform',
          shake && 'animate-[shake_0.5s_ease-in-out]'
        )}
      >
        {Array.from({ length }, (_, i) => (
          <div
            key={i}
            className={cn(
              'w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all duration-200',
              value.length > i
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-gray-50'
            )}
          >
            {value.length > i && (
              <div className="w-3 h-3 rounded-full bg-blue-500" />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-center text-sm text-red-500 mb-4">{error}</p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handleKeyPress(key)}
            disabled={disabled}
            className="pin-key h-14 rounded-xl bg-gray-50 border border-gray-200 text-xl font-semibold text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none"
          >
            {key}
          </button>
        ))}

        {/* Bottom row: Clear | 0 | Submit/Backspace */}
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="pin-key h-14 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:border-red-300 hover:text-red-500 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none"
        >
          <X className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => handleKeyPress('0')}
          disabled={disabled}
          className="pin-key h-14 rounded-xl bg-gray-50 border border-gray-200 text-xl font-semibold text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none"
        >
          0
        </button>

        <button
          type="button"
          onClick={isComplete ? onSubmit : handleBackspace}
          disabled={disabled}
          className={cn(
            'pin-key h-14 rounded-xl border flex items-center justify-center active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none',
            isComplete
              ? 'bg-blue-500 border-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
          )}
        >
          {isComplete ? <Check className="w-5 h-5" /> : <Delete className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
