import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { CodeKeypad } from '@/components/shared/CodeKeypad';

interface CodeLoginFormProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onSubmit: (code: string) => Promise<{ success: boolean; error?: string }>;
  altLinkText: string;
  altLinkTo: string;
}

/**
 * Formulario de login por código de 4 dígitos.
 *
 * Formulario de login por código numérico de 4 dígitos.
 * Usa el componente CodeKeypad para la entrada del código.
 */
export function CodeLoginForm({ title, subtitle, icon, onSubmit, altLinkText, altLinkTo }: CodeLoginFormProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (code.length !== 4) {
      setError('Ingresa un código de 4 dígitos');
      return;
    }

    setError('');
    setLoading(true);
    const result = await onSubmit(code);
    setLoading(false);

    if (!result.success) {
      setShake(true);
      setError(result.error || 'Código incorrecto');
      setTimeout(() => {
        setShake(false);
        setCode('');
      }, 500);
    }
  }, [code, onSubmit]);

  const handleChange = useCallback((value: string) => {
    setCode(value);
    if (error) setError('');
  }, [error]);

  // Auto-submit cuando el código alcanza 4 dígitos
  useEffect(() => {
    if (code.length === 4) {
      handleSubmit();
    }
  }, [code, handleSubmit]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {icon}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">{title}</h1>
          <p className="text-sm text-gray-500 text-center mb-2">{subtitle}</p>

          {/* Loading overlay */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <CodeKeypad
              value={code}
              onChange={handleChange}
              onSubmit={handleSubmit}
              error={error}
              shake={shake}
              disabled={loading}
            />
          )}

          {/* Alt Link */}
          <div className="mt-6 text-center">
            <Link
              to={altLinkTo}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              {altLinkText}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
