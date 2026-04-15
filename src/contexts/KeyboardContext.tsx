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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Encuentra el ancestro scrollable más cercano de `el`. Si no hay ninguno
 * en el árbol (común para inputs en páginas cuyo scroll vive en `window`),
 * devuelve `null` y el caller debe usar `window` como fallback.
 */
function findScrollableAncestor(el: HTMLElement): HTMLElement | null {
  let parent = el.parentElement;
  while (parent && parent !== document.body) {
    const { overflowY } = getComputedStyle(parent);
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
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
   * Estado del lift aplicado al DialogContent activo.
   * - `el`: el modal box que estamos levantando
   * - `lift`: cantidad ACUMULADA de pixels que ya levantamos (>0 = subido)
   * - `originalTransform` / `originalTransition`: para restaurar al cerrar
   *
   * Estrategia de lift: en vez de redimensionar el modal o scrollear su
   * contenido (ambos enfoques sufren de problemas de timing/clamping),
   * traducimos directamente el modal hacia arriba con `transform`. Esto
   * es bulletproof — el navegador no tiene forma de "deshacer" la traducción.
   * Si el modal queda más alto que el viewport, su tope se sale por arriba,
   * pero el input enfocado siempre queda arriba del teclado, que es lo que
   * importa.
   */
  const dialogLiftRef = useRef<{
    el: HTMLElement;
    lift: number;
    originalTransform: string;
    originalTransition: string;
  } | null>(null);

  /**
   * Timer pendiente del openKeyboard activo.
   * Evita que llamadas duplicadas (onFocus + onClick disparan ambos en TouchInput)
   * agenden dos pases de medición.
   */
  const pendingTimerRef = useRef<number | null>(null);

  /**
   * Estado del lift aplicado a un wrapper de página (no-modal).
   * Se usa cuando el input no está dentro de ningún Dialog/Sheet — para
   * páginas normales con poco contenido (ej. inventario vacío), donde el
   * scroll natural no alcanza para sacar el input de detrás del teclado.
   *
   * Liftamos `#root` (la raíz de React) y el teclado, que vive en un portal
   * a `document.body` FUERA de #root, no se mueve.
   */
  const pageLiftRef = useRef<{
    el: HTMLElement;
    lift: number;
    originalTransform: string;
    originalTransition: string;
  } | null>(null);

  /** Restaura el DialogContent a su transform/transition original. */
  const restoreDialogLift = useCallback(() => {
    const state = dialogLiftRef.current;
    if (!state) return;
    // Mantener la transición durante el regreso animado.
    state.el.style.transform = state.originalTransform;
    const el = state.el;
    const originalTransition = state.originalTransition;
    window.setTimeout(() => {
      // Solo limpiar transition si nadie reasignó el modal en el ínterin.
      if (dialogLiftRef.current?.el !== el) {
        el.style.transition = originalTransition;
      }
    }, 360);
    dialogLiftRef.current = null;
  }, []);

  /** Restaura el wrapper de página a su transform original. */
  const restorePageLift = useCallback(() => {
    const state = pageLiftRef.current;
    if (!state) return;
    state.el.style.transform = state.originalTransform;
    const el = state.el;
    const originalTransition = state.originalTransition;
    window.setTimeout(() => {
      if (pageLiftRef.current?.el !== el) {
        el.style.transition = originalTransition;
      }
    }, 360);
    pageLiftRef.current = null;
  }, []);

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
      const isSameInput = activeInputRef.current === ref;

      activeInputRef.current = ref;
      setMode(keyboardMode);
      setIsOpen(true);
      setInputEmpty(!ref.current?.value);

      // Dedup: si ya hay un pase pendiente para el mismo input (onFocus+onClick
      // disparan ambos), ignorar la segunda llamada.
      if (isSameInput && pendingTimerRef.current !== null) return;

      // Si veníamos de otro input, cancelar su pase pendiente.
      if (pendingTimerRef.current !== null) {
        clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
      }

      // Delay para ejecutarse DESPUÉS de que:
      // 1. Radix Dialog termine su manejo de foco (FocusScope/focus trap)
      // 2. La animación del teclado se complete (duration-300)
      pendingTimerRef.current = window.setTimeout(() => {
        pendingTimerRef.current = null;
        const inputEl = ref.current;
        if (!inputEl) return;

        inputEl.focus({ preventScroll: true });

        const keyboardEl = keyboardContainerRef.current;
        if (!keyboardEl) return;

        const keyboardTop = keyboardEl.getBoundingClientRect().top;
        const margin = 16;
        const desiredBottom = keyboardTop - margin;

        // Buscar el DialogContent ancestro (modal box). Si no existe, este input
        // vive en una página normal y resolvemos con scroll de la página.
        const dc = inputEl.closest(
          '[data-slot="dialog-content"]',
        ) as HTMLElement | null;

        if (!dc) {
          // ─ Fallback no-modal: lift de la raíz de React ─
          // Sin modal, no hay caja que levantar. Probamos primero scroll natural
          // (página con suficiente contenido), y si no alcanza levantamos #root
          // vía transform. El teclado vive en un portal a body FUERA de #root,
          // así que no se mueve.
          const inputRect = inputEl.getBoundingClientRect();
          const overlap = inputRect.bottom - desiredBottom;
          if (overlap <= 0) return;

          const scrollable = findScrollableAncestor(inputEl);
          const scroller: HTMLElement | Window =
            scrollable ?? window;
          const beforeScroll =
            scroller === window
              ? window.scrollY
              : (scroller as HTMLElement).scrollTop;
          const maxScroll =
            scroller === window
              ? document.documentElement.scrollHeight - window.innerHeight
              : (scroller as HTMLElement).scrollHeight -
                (scroller as HTMLElement).clientHeight;
          const desiredScrollTop = Math.min(beforeScroll + overlap, maxScroll);
          const actualScrollDelta = desiredScrollTop - beforeScroll;

          if (actualScrollDelta >= overlap - 1) {
            // El scroll natural alcanza para destapar el input.
            scroller.scrollTo({ top: desiredScrollTop, behavior: 'smooth' });
            return;
          }

          // Scroll insuficiente — levantar #root con transform.
          // Hacemos scroll del MÁXIMO posible primero (si hay algo) y
          // levantamos la diferencia restante.
          if (actualScrollDelta > 0) {
            scroller.scrollTo({ top: desiredScrollTop, behavior: 'smooth' });
          }
          const remainingOverlap = overlap - Math.max(0, actualScrollDelta);

          // Levantar el `<main>` (área de contenido de página), NO #root.
          // El sidebar es position:fixed dentro de #root; si transformamos #root
          // el sidebar también se mueve y aparece glitchy. Levantando solo
          // <main> el sidebar queda intacto.
          const liftTarget =
            (inputEl.closest('main') as HTMLElement | null) ??
            document.getElementById('root');
          if (!liftTarget) return;

          if (!pageLiftRef.current) {
            pageLiftRef.current = {
              el: liftTarget,
              lift: 0,
              originalTransform: liftTarget.style.transform,
              originalTransition: liftTarget.style.transition,
            };
          }

          const newLift = Math.max(0, pageLiftRef.current.lift + remainingOverlap);
          pageLiftRef.current.lift = newLift;

          liftTarget.style.transition = 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1)';
          liftTarget.style.transform = newLift > 0 ? `translateY(-${newLift}px)` : '';
          return;
        }

        // Si cambiamos a OTRO DialogContent (modal distinto), restaurar el anterior.
        if (dialogLiftRef.current && dialogLiftRef.current.el !== dc) {
          restoreDialogLift();
        }

        // Inicializar estado de lift si es la primera vez con este modal.
        if (!dialogLiftRef.current) {
          dialogLiftRef.current = {
            el: dc,
            lift: 0,
            originalTransform: dc.style.transform,
            originalTransition: dc.style.transition,
          };
        }

        // Calcular el lift adicional necesario.
        // inputRect.bottom refleja la posición ACTUAL del input (con cualquier
        // lift previo ya aplicado). Si el input está abajo del desiredBottom,
        // overlap > 0 y debemos levantar más. Si está arriba, overlap < 0 y
        // podemos bajar el modal (reducir lift).
        const inputRect = inputEl.getBoundingClientRect();
        const overlap = inputRect.bottom - desiredBottom;
        const newLift = Math.max(0, dialogLiftRef.current.lift + overlap);

        dialogLiftRef.current.lift = newLift;

        // Aplicar el lift via transform. Conservamos el translate(-50%) horizontal
        // que Radix usa para centrar el modal. La traducción vertical pasa de -50%
        // (centrado) a calc(-50% - Npx) (centrado + lift hacia arriba).
        //
        // Si newLift es 0, limpiar el transform inline para que Tailwind retome
        // el centrado vía sus clases translate-x-[-50%] translate-y-[-50%].
        dc.style.transition = 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1)';
        dc.style.transform =
          newLift > 0
            ? `translate(-50%, calc(-50% - ${newLift}px))`
            : '';
      }, 350);
    },
    [restoreDialogLift],
  );

  /**
   * Cierra el teclado y hace blur del input activo para des-seleccionarlo.
   * Esto remueve el borde azul del focus, de modo que el siguiente click
   * en el input dispare onFocus y onClick frescos y vuelva a abrir el teclado.
   */
  const closeKeyboard = useCallback(() => {
    setIsOpen(false);
    activeInputRef.current?.current?.blur();
    activeInputRef.current = null;

    if (pendingTimerRef.current !== null) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }

    // Restaurar tanto el DialogContent como el wrapper de página (animados).
    restoreDialogLift();
    restorePageLift();
  }, [restoreDialogLift, restorePageLift]);

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
