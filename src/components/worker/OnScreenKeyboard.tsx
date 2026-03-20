/**
 * OnScreenKeyboard — Teclado Virtual para Monitores Táctiles
 * ===========================================================
 * Teclado virtual fijo en la parte inferior de la pantalla.
 * Diseñado para uso sin mouse ni teclado físico en monitores touchscreen
 * de restaurantes/bares (instalación tipo kiosk).
 *
 * Modos disponibles:
 *   - `alpha`   → Teclado completo QWERTY con español (Ñ), Shift, Espacio, Enter
 *   - `numeric` → Teclado numérico compacto (0-9, punto decimal, borrar)
 *
 * Integración:
 *   - Este componente es renderizado por `KeyboardProvider` en la raíz de la app.
 *   - No usar directamente en componentes de negocio — usar `<TouchInput>` o `<TouchTextarea>`.
 *   - Las teclas llaman a `onKeyPress(key)` donde `key` puede ser:
 *       - Un carácter ('A', 'a', '1', '.', '@', etc.)
 *       - 'Backspace' → borrar carácter anterior
 *       - 'Enter' → confirmar / nueva línea en textarea
 *       - ' ' → espacio
 *
 * @module OnScreenKeyboard
 */

import React, { useState, useEffect } from 'react';
import type { RefObject } from 'react';
import { cn } from '@/lib/utils';
import { Delete, CornerDownLeft, X, ArrowBigUp } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnScreenKeyboardProps {
  /** Si el teclado debe mostrarse */
  visible: boolean;
  /**
   * Callback al pulsar una tecla.
   * Recibe el carácter a insertar o una acción especial:
   * 'Backspace' | 'Enter' | ' ' | cualquier carácter
   */
  onKeyPress: (key: string) => void;
  /** Callback al pulsar el botón de cierre */
  onClose: () => void;
  /** Modo del teclado: completo (alpha) o solo números (numeric) */
  mode?: 'alpha' | 'numeric';
  /**
   * Ref al contenedor del teclado.
   * El KeyboardProvider lo usa para detectar clicks "dentro" del teclado
   * en su listener global de mousedown.
   */
  containerRef?: RefObject<HTMLDivElement | null>;
  /**
   * Indica si el input activo está vacío.
   * Cuando pasa a `true`, el teclado resetea a mayúsculas automáticamente
   * para que la primera letra siempre sea mayúscula (auto-capitalize).
   */
  inputEmpty?: boolean;
  /** Valor actual del input activo, mostrado en la barra de previsualización */
  inputValue?: string;
  /** Placeholder del input activo, mostrado cuando el valor está vacío */
  inputPlaceholder?: string;
}

// ─── Keyboard Layouts ─────────────────────────────────────────────────────────

const alphaRowsUpper = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

const alphaRowsLower = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

/** Teclas especiales para la fila inferior: útiles para URLs, emails, notas */
const specialKeys = ['@', '-', '_', '.', '/', ':'];

/** Layout del teclado numérico */
const numericKeys = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'DEL'],
];

// ─── Component ────────────────────────────────────────────────────────────────

export function OnScreenKeyboard({
  visible,
  onKeyPress,
  onClose,
  mode = 'alpha',
  containerRef,
  inputEmpty,
  inputValue = '',
  inputPlaceholder = '',
}: OnScreenKeyboardProps) {
  /** Estado de mayúsculas/minúsculas (solo aplica en modo alpha) */
  const [isUpperCase, setIsUpperCase] = useState(true);

  /** Resetear a mayúsculas cuando el input queda vacío */
  useEffect(() => {
    if (inputEmpty) setIsUpperCase(true);
  }, [inputEmpty]);

  const alphaRows = isUpperCase ? alphaRowsUpper : alphaRowsLower;

  const handleKey = (key: string) => {
    if (key === 'DEL') {
      onKeyPress('Backspace');
    } else if (key === 'SPACE') {
      onKeyPress(' ');
    } else if (key === 'ENTER') {
      onKeyPress('Enter');
    } else {
      onKeyPress(key);
      // Auto-minúsculas después de escribir la primera letra
      if (isUpperCase && /^[a-zA-ZñÑ]$/.test(key)) {
        setIsUpperCase(false);
      }
    }
  };

  // ─── Estilos de teclas (optimizados para monitores táctiles 15-22") ─────────
  //
  // Dimensiones basadas en guidelines de kiosk/POS:
  //   - Mínimo recomendado: 48px (Apple HIG / Material Design)
  //   - Óptimo para kiosk: 56-64px alto, flex-1 ancho (llenar pantalla)
  //   - Las teclas usan flex-1 para expandirse al ancho disponible del monitor

  const keyBase =
    'flex items-center justify-center rounded-xl border font-semibold active:scale-95 transition-all duration-75 select-none touch-none';

  const keyRegular = cn(
    keyBase,
    'flex-1 h-14 text-lg',
    'bg-white border-gray-200 text-gray-800',
    'hover:bg-blue-50 hover:border-blue-300',
    'shadow-sm shadow-gray-200',
    'active:bg-blue-100',
  );

  const keyAction = cn(
    keyBase,
    'w-[72px] h-14',
    'bg-gray-100 border-gray-300 text-gray-600',
    'hover:bg-gray-200',
  );

  const keyBlue = cn(
    keyBase,
    'w-20 h-14',
    'bg-blue-500 border-blue-600 text-white',
    'hover:bg-blue-600',
    'shadow-sm shadow-blue-200',
  );

  const keyShift = cn(
    keyBase,
    'w-[72px] h-14',
    isUpperCase
      ? 'bg-blue-500 border-blue-600 text-white'
      : 'bg-gray-100 border-gray-300 text-gray-600',
    'hover:opacity-80',
  );

  const keySpecial = cn(
    keyBase,
    'flex-1 h-12 text-base',
    'bg-gray-50 border-gray-200 text-gray-600',
    'hover:bg-gray-100',
  );

  return (
    <React.Fragment>
      <div
        ref={containerRef}
        data-keyboard-container="true"
        onPointerDown={(e) => e.stopPropagation()}
        style={{ pointerEvents: 'auto' }}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[9999]',
          'bg-gray-100/95 backdrop-blur-sm border-t border-gray-300',
          'shadow-[0_-4px_24px_rgba(0,0,0,0.12)]',
          'transition-transform duration-300 ease-out',
          visible ? 'translate-y-0' : 'translate-y-full'
        )}
      >
      {/* Barra superior: indicador + botón cerrar */}
      <div className="flex items-center justify-between px-4 pt-2 pb-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span className="text-xs text-gray-500 font-medium">
            {mode === 'numeric' ? 'Teclado Numérico' : 'Teclado'}
          </span>
        </div>
        <button
          onMouseDown={(e) => e.preventDefault()} // Evitar blur del input al cerrar
          onPointerUp={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-200 transition-colors min-h-[44px]"
        >
          <X className="w-4 h-4" />
          Cerrar
        </button>
      </div>

      {/* Barra de previsualización: muestra lo que se está escribiendo */}
      <div className="mx-4 mb-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 shadow-sm min-h-[44px] flex items-center">
        {inputValue ? (
          <span className="text-base text-gray-800 truncate w-full text-left">
            {inputValue}
          </span>
        ) : (
          <span className="text-base text-gray-400 truncate w-full text-left">
            {inputPlaceholder || 'Escribe aquí...'}
          </span>
        )}
      </div>

      <div className="px-4 pb-5">
        {/* ─── MODO ALPHA ─── */}
        {mode === 'alpha' ? (
          <div className="space-y-2.5">
            {/* Filas de letras */}
            {alphaRows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-2">
                {/* Botón Shift en la fila 3 (izquierda) */}
                {rowIndex === 2 && (
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onPointerUp={() => setIsUpperCase((prev) => !prev)}
                    className={keyShift}
                    aria-label="Shift"
                    title={isUpperCase ? 'Minúsculas' : 'Mayúsculas'}
                  >
                    <ArrowBigUp className="w-6 h-6" />
                  </button>
                )}

                {row.map((key) => (
                  <button
                    key={key}
                    onMouseDown={(e) => e.preventDefault()}
                    onPointerUp={() => handleKey(key)}
                    className={keyRegular}
                  >
                    {key}
                  </button>
                ))}

                {/* Borrar en la fila 3 (derecha) */}
                {rowIndex === 2 && (
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onPointerUp={() => handleKey('DEL')}
                    className={keyAction}
                    aria-label="Borrar"
                  >
                    <Delete className="w-6 h-6" />
                  </button>
                )}
              </div>
            ))}

            {/* Fila inferior: especiales + espacio + enter */}
            <div className="flex gap-2 items-center">
              {/* Teclas especiales (@, -, _, ., /, :) */}
              {specialKeys.map((key) => (
                <button
                  key={key}
                  onMouseDown={(e) => e.preventDefault()}
                  onPointerUp={() => handleKey(key)}
                  className={keySpecial}
                >
                  {key}
                </button>
              ))}

              {/* Espacio */}
              <button
                onMouseDown={(e) => e.preventDefault()}
                onPointerUp={() => handleKey('SPACE')}
                className={cn(
                  keyBase,
                  'flex-[3] h-14 text-base text-gray-500',
                  'bg-white border-gray-200 hover:bg-blue-50',
                  'shadow-sm',
                )}
              >
                espacio
              </button>

              {/* Enter — inserta salto de línea en textarea o cierra teclado en input */}
              <button
                onMouseDown={(e) => e.preventDefault()}
                onPointerUp={() => { handleKey('ENTER'); onClose(); }}
                className={keyBlue}
                aria-label="Enter"
              >
                <CornerDownLeft className="w-6 h-6" />
              </button>
            </div>
          </div>
        ) : (
          /* ─── MODO NUMÉRICO ─── */
          <div className="max-w-[320px] mx-auto space-y-3">
            {numericKeys.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-3">
                {row.map((key) => (
                  <button
                    key={key}
                    onMouseDown={(e) => e.preventDefault()}
                    onPointerUp={() => handleKey(key)}
                    className={cn(
                      keyBase,
                      'flex-1 h-[72px] text-2xl',
                      key === 'DEL'
                        ? 'bg-gray-200 border-gray-300 text-gray-600 hover:bg-gray-300'
                        : 'bg-white border-gray-200 text-gray-800 hover:bg-blue-50 hover:border-blue-300 shadow-sm',
                    )}
                    aria-label={key === 'DEL' ? 'Borrar' : key}
                  >
                    {key === 'DEL' ? <Delete className="w-6 h-6 mx-auto" /> : key}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* closes outer keyboard container */}
      </div>
    </React.Fragment>
  );
}
