/**
 * KeyboardContext — Teclado Virtual Global
 * =========================================
 * Provee estado global para el teclado táctil on-screen.
 *
 * Uso:
 *   1. Envuelve la app con <KeyboardProvider> en main.tsx.
 *   2. Usa el hook `useKeyboard()` en cualquier componente para abrir/cerrar el teclado.
 *   3. Usa <TouchInput> o <TouchTextarea> como drop-in replacements de <Input>/<textarea>.
 *      Estos componentes llaman `openKeyboard()` automáticamente al recibir foco.
 *
 * El teclado se renderiza UNA SOLA VEZ en la raíz de la app (dentro de KeyboardProvider),
 * lo que evita múltiples instancias y garantiza que siempre esté por encima de los modals.
 *
 * Arquitectura:
 *   KeyboardProvider (main.tsx)
 *     ↕ Context
 *   useKeyboard() hook  ←  TouchInput / TouchTextarea
 *     ↕
 *   <OnScreenKeyboard fixed bottom />
 *
 * @module KeyboardContext
 */

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { OnScreenKeyboard } from '@/components/worker/OnScreenKeyboard';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Modos del teclado virtual */
export type KeyboardMode = 'alpha' | 'numeric';

/** Shape del contexto expuesto a los consumidores */
interface KeyboardContextValue {
  /** Abre el teclado y lo enlaza con el elemento de input especificado */
  openKeyboard: (
    ref: RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
    mode?: KeyboardMode,
  ) => void;
  /** Cierra el teclado y desvincula el input activo */
  closeKeyboard: () => void;
  /** Indica si el teclado está visible actualmente */
  isOpen: boolean;
  /** Modo actual del teclado */
  mode: KeyboardMode;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const KeyboardContext = createContext<KeyboardContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * Provider que debe envolver la app completa en main.tsx.
 *
 * Renderiza el `<OnScreenKeyboard>` una única vez en el árbol DOM,
 * fijo al borde inferior de la pantalla, por encima de todos los modals (z-50).
 */
export function KeyboardProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<KeyboardMode>('alpha');

  /**
   * Indica si el input activo está vacío.
   * Se usa para que OnScreenKeyboard resetee a mayúsculas
   * cuando el usuario borra todo el texto (auto-capitalize primera letra).
   */
  const [inputEmpty, setInputEmpty] = useState(true);

  /** Valor actual del input activo, mostrado en la barra de previsualización */
  const [inputValue, setInputValue] = useState('');

  /** Placeholder del input activo, mostrado cuando inputValue está vacío */
  const [inputPlaceholder, setInputPlaceholder] = useState('');

  /**
   * Ref al OBJETO RefObject del input/textarea activo (no a .current).
   * Se resuelve lazily en handleKeyPress → activeInputRef.current?.current
   * para evitar problemas de timing cuando openKeyboard() se llama antes
   * de que el ref del input esté poblado (ej. autoFocus + Radix Dialog).
   */
  const activeInputRef = useRef<RefObject<HTMLInputElement | HTMLTextAreaElement | null> | null>(null);

  /**
   * Ref al contenedor del teclado en el DOM.
   * Usado por el listener global de mousedown para detectar clicks fuera del teclado.
   */
  const keyboardContainerRef = useRef<HTMLDivElement | null>(null);

  /**
   * Abre el teclado y lo enlaza con el input/textarea especificado.
   *
   * @param ref  - RefObject apuntando al input/textarea que recibirá las teclas
   * @param mode - 'alpha' para teclado completo, 'numeric' para solo números
   */
  const openKeyboard = useCallback(
    (
      ref: RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
      keyboardMode: KeyboardMode = 'alpha',
    ) => {
      activeInputRef.current = ref;
      setMode(keyboardMode);
      setIsOpen(true);
      setInputEmpty(!ref.current?.value);
      setInputValue(ref.current?.value ?? '');
      setInputPlaceholder(ref.current?.placeholder ?? '');

      // Delay para ejecutarse DESPUÉS de que Radix Dialog termine su
      // manejo de foco (FocusScope/focus trap). Sin esto, Radix roba
      // el foco del input y el teclado no puede escribir.
      setTimeout(() => {
        ref.current?.focus({ preventScroll: true });
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    },
    [],
  );

  /**
   * Cierra el teclado y hace blur del input activo para des-seleccionarlo.
   * Esto remueve el borde azul del focus, de modo que el siguiente click
   * en el input dispare onFocus y onClick frescos y vuelva a abrir el teclado.
   */
  const closeKeyboard = useCallback(() => {
    setIsOpen(false);
    activeInputRef.current?.current?.blur();
  }, []);

  /**
   * Dos listeners globales que se activan mientras el teclado está abierto:
   *
   * 1. `pointerdown` (capture) — Previene que Radix UI DismissableLayer cierre
   *    el Dialog cuando el usuario toca una tecla. Radix revisa `event.defaultPrevented`
   *    antes de cerrar; si es `true`, omite el cierre. La fase de captura se activa
   *    ANTES que cualquier listener de burbuja, garantizando que siempre ganemos.
   *
   * 2. `mousedown` (bubble) — Cierra el teclado cuando el usuario hace click fuera
   *    de él (en áreas en blanco del modal, fuera del modal, etc.).
   */
  useEffect(() => {
    if (!isOpen) return;

    // ─ Listener 1: capture-phase pointerdown (Radix interop) ─
    const preventRadixDismiss = (e: PointerEvent) => {
      if (keyboardContainerRef.current?.contains(e.target as Element)) {
        e.preventDefault(); // Radix ve defaultPrevented=true → no cierra el Dialog
      }
    };
    document.addEventListener('pointerdown', preventRadixDismiss, true);

    // ─ Listener 2: bubble-phase mousedown (cerrar teclado fuera) ─
    const handleDocumentMouseDown = (e: MouseEvent) => {
      const target = e.target as Element;
      if (keyboardContainerRef.current?.contains(target)) return;
      if (target.closest('[data-touch-input]')) return;
      closeKeyboard();
    };
    document.addEventListener('mousedown', handleDocumentMouseDown);

    return () => {
      document.removeEventListener('pointerdown', preventRadixDismiss, true);
      document.removeEventListener('mousedown', handleDocumentMouseDown);
    };
  }, [isOpen, closeKeyboard]);

  /**
   * Maneja la pulsación de una tecla del teclado virtual.
   * Inserta el carácter en la posición correcta del cursor del input activo
   * usando la Selection API, compatible con React (dispara evento nativo).
   *
   * @param key - Carácter o acción ('Backspace', 'Enter', ' ')
   */
  const handleKeyPress = useCallback((key: string) => {
    const el = activeInputRef.current?.current;
    if (!el) return;

    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const current = el.value;
    let nextValue: string;
    let nextCursor: number;

    if (key === 'ClearAll') {
      // Long-press en borrar: limpiar todo el input
      nextValue = '';
      nextCursor = 0;
    } else if (key === 'Backspace') {
      if (start === end && start > 0) {
        // Borrar carácter antes del cursor
        nextValue = current.slice(0, start - 1) + current.slice(end);
        nextCursor = start - 1;
      } else if (start !== end) {
        // Borrar selección
        nextValue = current.slice(0, start) + current.slice(end);
        nextCursor = start;
      } else {
        return;
      }
    } else if (key === 'Enter') {
      // En textarea insertar \n, en input simular Enter (no insertar)
      if (el.tagName === 'TEXTAREA') {
        nextValue = current.slice(0, start) + '\n' + current.slice(end);
        nextCursor = start + 1;
      } else {
        // Cerrar teclado al presionar Enter en inputs de una línea
        closeKeyboard();
        return;
      }
    } else {
      // Insertar carácter en la posición del cursor
      nextValue = current.slice(0, start) + key + current.slice(end);
      nextCursor = start + key.length;
    }

    /**
     * Para que React actualice su estado interno debemos usar el setter nativo
     * de la propiedad `value`, bypaseando el descriptor de React.
     * Luego se dispara un evento 'input' para que React detecte el cambio.
     *
     * Nota: TouchInput ya convierte type="number" a type="text" en el DOM,
     * por lo que no se necesita swap temporal de type aquí.
     */
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      el.tagName === 'TEXTAREA'
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype,
      'value',
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(el, nextValue);
    }

    // Disparar evento nativo para que React reactive los handlers onChange
    el.dispatchEvent(new Event('input', { bubbles: true }));

    // Notificar si el input quedó vacío (para auto-capitalize)
    setInputEmpty(nextValue === '');
    setInputValue(nextValue);

    // Restaurar posición del cursor después del render
    requestAnimationFrame(() => {
      el.setSelectionRange(nextCursor, nextCursor);
    });
  }, [closeKeyboard]);

  return (
    <KeyboardContext.Provider value={{ openKeyboard, closeKeyboard, isOpen, mode }}>
      {children}

      {/* Teclado virtual — portaled a document.body para estar al mismo nivel
          que los portals de Radix UI (Dialog, Sheet, etc.) y ganar z-index */}
      {createPortal(
        <OnScreenKeyboard
          visible={isOpen}
          onKeyPress={handleKeyPress}
          onClose={closeKeyboard}
          mode={mode}
          containerRef={keyboardContainerRef}
          inputEmpty={inputEmpty}
          inputValue={inputValue}
          inputPlaceholder={inputPlaceholder}
        />,
        document.body
      )}
    </KeyboardContext.Provider>
  );
}

// ─── Internal hook (solo para uso dentro de shared/TouchInput etc.) ───────────

/**
 * Fallback no-op para cuando el contexto no está disponible.
 * Evita crash (pantalla blanca) en edge cases donde un componente
 * se renderiza momentáneamente fuera del provider (ej. portales de
 * Radix Dialog durante transiciones entre modales).
 */
const NOOP_CONTEXT: KeyboardContextValue = {
  openKeyboard: () => {},
  closeKeyboard: () => {},
  isOpen: false,
  mode: 'alpha',
};

/**
 * Hook interno para acceder al contexto del teclado.
 * No lanzar directamente en componentes de negocio — usar `useKeyboard()` de hooks/.
 *
 * Retorna un fallback no-op si se usa fuera de `<KeyboardProvider>`,
 * en lugar de lanzar un error que crashearía toda la app.
 */
export function useKeyboardContext(): KeyboardContextValue {
  const ctx = useContext(KeyboardContext);
  if (!ctx) {
    console.warn('[KeyboardContext] useKeyboardContext llamado fuera de <KeyboardProvider>. Usando fallback no-op.');
    return NOOP_CONTEXT;
  }
  return ctx;
}
