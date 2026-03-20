/**
 * TouchInput — Input con Teclado Virtual Integrado
 * =================================================
 * Drop-in replacement de `<Input>` (shadcn) que abre automáticamente
 * el teclado táctil on-screen al recibir foco en pantallas touch.
 *
 * Características:
 *   - Detecta el modo del teclado automáticamente según `type`:
 *       · `type="number"` → teclado numérico
 *       · `type="text"` o sin tipo → teclado alpha (letras)
 *   - Se puede sobreescribir el modo con la prop `keyboardMode`
 *   - Compatible con todos los props nativos de `<input>` y de shadcn `<Input>`
 *   - No requiere configuración adicional en el componente padre
 *
 * Requisito: debe estar dentro del árbol de `<KeyboardProvider>`.
 *
 * @example
 * ```tsx
 * // Básico — teclado alpha (texto)
 * <TouchInput value={name} onChange={(e) => setName(e.target.value)} />
 *
 * // Numérico — detectado automáticamente
 * <TouchInput type="number" value={price} onChange={(e) => setPrice(+e.target.value)} />
 *
 * // Override manual de modo
 * <TouchInput keyboardMode="numeric" value={code} onChange={...} />
 * ```
 *
 * @module TouchInput
 */

import { useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { useKeyboard } from '@/hooks/useKeyboard';
import type { KeyboardMode } from '@/contexts/KeyboardContext';
import type { ComponentProps } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TouchInputProps extends ComponentProps<typeof Input> {
  /**
   * Modo del teclado al hacer focus en este input.
   * Si no se especifica, se infiere del `type`:
   *   - `type="number"` → `'numeric'`
   *   - cualquier otro → `'alpha'`
   */
  keyboardMode?: KeyboardMode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TouchInput({
  keyboardMode,
  type,
  onFocus,
  onBlur,
  onClick,
  ...props
}: TouchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { openKeyboard } = useKeyboard();

  /**
   * Determina el modo del teclado:
   * 1. Prop `keyboardMode` tiene prioridad
   * 2. Si `type="number"` → numérico
   * 3. Default → alpha
   */
  const resolvedMode: KeyboardMode =
    keyboardMode ?? (type === 'number' ? 'numeric' : 'alpha');

  /**
   * Para type="number", renderizamos el <input> nativo como type="text".
   * Razón: el browser rechaza valores intermedios como "2." en inputs numéricos
   * (los considera inválidos y borra el contenido). Como el teclado virtual ya
   * muestra modo numérico via `keyboardMode` y el teclado nativo está deshabilitado
   * con inputMode="none", type="number" en el DOM no aporta nada y solo causa bugs.
   */
  const nativeType = type === 'number' ? 'text' : type;

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      openKeyboard(inputRef, resolvedMode);
      onFocus?.(e);
    },
    [openKeyboard, resolvedMode, onFocus],
  );

  /** Re-abrir teclado al tocar el input incluso si ya tenía foco */
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLInputElement>) => {
      openKeyboard(inputRef, resolvedMode);
      onClick?.(e);
    },
    [openKeyboard, resolvedMode, onClick],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(e);
    },
    [onBlur],
  );

  return (
    <Input
      ref={inputRef}
      type={nativeType}
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
