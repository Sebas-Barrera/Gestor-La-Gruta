import { useState, useEffect, useCallback } from 'react';
import { ImageIcon, X, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';
import { cn } from '@/lib/utils';
import { isBase64Image, isValidImageUrl } from '@/lib/imageUtils';

interface ImageUrlFieldProps {
  /** URL o base64 de la imagen actual */
  value: string;
  /** Callback cuando cambia el valor (URL ingresada por el usuario) */
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  className?: string;
}

type PreviewState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Campo reutilizable para ingresar una URL de imagen con preview en vivo.
 *
 * Muestra un input de texto donde el usuario pega la URL de la imagen.
 * Debajo del input se muestra un preview de la imagen si la URL es válida,
 * un indicador de carga mientras descarga, o un mensaje de error si falla.
 *
 * @example
 * <ImageUrlField
 *   value={form.image}
 *   onChange={(url) => updateField('image', url)}
 * />
 */
export function ImageUrlField({
  value,
  onChange,
  label = 'Imagen del Producto',
  error,
  className,
}: ImageUrlFieldProps) {
  const [previewState, setPreviewState] = useState<PreviewState>('idle');

  const hasValue = value.trim().length > 0;
  const showPreview = hasValue && (previewState === 'loaded' || isBase64Image(value));

  const handleImageLoad = useCallback(() => {
    setPreviewState('loaded');
  }, []);

  const handleImageError = useCallback(() => {
    if (value.trim()) {
      setPreviewState('error');
    }
  }, [value]);

  useEffect(() => {
    if (!value.trim()) {
      setPreviewState('idle');
      return;
    }
    if (isBase64Image(value)) {
      setPreviewState('loaded');
      return;
    }
    if (isValidImageUrl(value)) {
      setPreviewState('loading');
    } else {
      setPreviewState('error');
    }
  }, [value]);

  return (
    <FormField label={label} error={error} className={className}>
      <div className="space-y-2">
        {/* Input de URL */}
        <div className="relative">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Pega la URL de la imagen (ej: https://...)"
            className={cn(
              'min-h-[44px] pr-10',
              previewState === 'error' && hasValue && 'border-red-300 focus-visible:ring-red-500',
            )}
          />
          {hasValue && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Preview area */}
        {hasValue && (
          <div
            className={cn(
              'relative rounded-lg border-2 border-dashed overflow-hidden transition-all',
              showPreview ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200 bg-gray-50',
              previewState === 'error' && 'border-red-200 bg-red-50/50',
            )}
          >
            {/* Loading */}
            {previewState === 'loading' && (
              <div className="flex items-center justify-center gap-2 py-6 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Cargando imagen...</span>
              </div>
            )}

            {/* Error */}
            {previewState === 'error' && (
              <div className="flex items-center justify-center gap-2 py-6 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">No se pudo cargar la imagen</span>
              </div>
            )}

            {/* Image (hidden while loading to detect load/error) */}
            {hasValue && previewState !== 'error' && (
              <img
                src={value}
                alt="Preview"
                onLoad={handleImageLoad}
                onError={handleImageError}
                className={cn(
                  'mx-auto object-contain max-h-32',
                  previewState === 'loaded' ? 'block py-3' : 'hidden',
                )}
              />
            )}
          </div>
        )}

        {/* Empty state hint */}
        {!hasValue && (
          <div className="flex items-center gap-2 py-4 justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50">
            <ImageIcon className="w-5 h-5 text-gray-300" />
            <span className="text-sm text-gray-400">Sin imagen</span>
          </div>
        )}
      </div>
    </FormField>
  );
}
