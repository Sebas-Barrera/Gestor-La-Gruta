/**
 * TouchTextarea — Textarea con Teclado Virtual Integrado
 * =======================================================
 * Drop-in replacement de `<textarea>` nativo que abre automáticamente
 * el teclado táctil alpha on-screen al recibir foco.
 *
 * Aplicar en campos de texto multilínea como:
 *   - Notas de ajuste de stock (StockAdjustmentModal)
 *   - Observaciones o comentarios en formularios
 *
 * Requisito: debe estar dentro del árbol de `<KeyboardProvider>`.
 *
 * @example
 * ```tsx
 * <TouchTextarea
 *   value={notes}
 *   onChange={(e) => setNotes(e.target.value)}
 *   placeholder="Razón del ajuste..."
 *   className="w-full min-h-[80px] ..."
 * />
 * ```
 *
 * @module TouchTextarea
 */

import { useRef, useCallback } from 'react';
import { useKeyboard } from '@/hooks/useKeyboard';
import type { ComponentProps } from 'react';

// ─── Component ────────────────────────────────────────────────────────────────

export function TouchTextarea({
  onFocus,
  onBlur,
  onClick,
  ...props
}: ComponentProps<'textarea'>) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { openKeyboard } = useKeyboard();

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      openKeyboard(textareaRef, 'alpha');
      onFocus?.(e);
    },
    [openKeyboard, onFocus],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLTextAreaElement>) => {
      openKeyboard(textareaRef, 'alpha');
      onClick?.(e);
    },
    [openKeyboard, onClick],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      onBlur?.(e);
    },
    [onBlur],
  );

  return (
    <textarea
      ref={textareaRef}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleClick}
      data-touch-input="true"
      inputMode="none"
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      {...props}
    />
  );
}
