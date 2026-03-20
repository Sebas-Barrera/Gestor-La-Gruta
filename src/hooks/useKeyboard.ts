/**
 * useKeyboard — Hook público del teclado virtual
 * ================================================
 * Permite abrir y cerrar el teclado táctil on-screen desde cualquier componente
 * que esté dentro del árbol de `<KeyboardProvider>`.
 *
 * @example
 * ```tsx
 * const { openKeyboard, closeKeyboard } = useKeyboard();
 *
 * // Abrir teclado alfanumérico
 * openKeyboard(inputRef, 'alpha');
 *
 * // Abrir teclado numérico
 * openKeyboard(inputRef, 'numeric');
 *
 * // Cerrar teclado
 * closeKeyboard();
 * ```
 *
 * Preferir usar <TouchInput> y <TouchTextarea> en los formularios,
 * que ya llaman a este hook automáticamente en el onFocus del input.
 *
 * @module useKeyboard
 */

import { useKeyboardContext } from '@/contexts/KeyboardContext';

export function useKeyboard() {
  return useKeyboardContext();
}
