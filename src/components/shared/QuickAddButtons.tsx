/**
 * QuickAddButtons — Botones de Suma Rápida para Ajustes de Inventario
 * =====================================================================
 * Componente reutilizable que muestra botones con cantidades preestablecidas
 * para agilizar el ajuste de stock. Al hacer click, la cantidad se SUMA
 * al valor actual del input.
 *
 * Se usa en:
 *   - StockAdjustmentModal  (ajuste manual de stock)
 *   - InventoryEntryModal   (entrada de inventario por escáner/báscula)
 *   - InventoryExitModal    (salida de inventario)
 *
 * Los presets se determinan automáticamente según el tipo de producto:
 *
 * | Tipo                         | Presets                              |
 * |------------------------------|--------------------------------------|
 * | Unidad (pz, lata, botella)   | +1, +5, +10, +25, +50               |
 * | Peso kg / Volumen L          | +0.25, +0.5, +1.0, +2.5, +5.0       |
 * | Peso g / Volumen ml          | +50, +100, +250, +500                |
 *
 * Nota para backend:
 *   Este componente es puramente visual (frontend). No emite peticiones HTTP.
 *   El modal padre acumula la cantidad total y la envía al backend en una
 *   sola llamada (POST/PATCH) con el campo `quantity` final.
 *   Los presets no se persisten — solo el resultado final.
 *
 * @module QuickAddButtons
 */

import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuickAddPreset {
  /** Valor numérico que se suma al quantity actual */
  value: number;
  /** Label que se muestra en el botón (e.g. "+5", "+0.25 kg") */
  label: string;
}

interface QuickAddButtonsProps {
  /** true si el producto se mide por peso/volumen */
  isWeightBased: boolean;
  /** Unidad de peso/volumen del producto (solo cuando isWeightBased = true) */
  weightUnit?: 'kg' | 'g' | 'ml' | 'L';
  /** Callback al hacer click en un preset. Recibe la cantidad a sumar. */
  onAdd: (amount: number) => void;
  /**
   * Cantidad máxima que se puede agregar (stock restante hasta el tope).
   * Botones cuyo valor exceda maxAdd se deshabilitan.
   * Si no se pasa, todos los botones están habilitados.
   */
  maxAdd?: number;
  /**
   * Esquema de color para los botones.
   * Debe coincidir con el color del modal padre:
   *   - 'blue'  → StockAdjustmentModal
   *   - 'green' → InventoryEntryModal
   *   - 'amber' → InventoryExitModal
   */
  colorScheme?: 'blue' | 'green' | 'amber';
}

// ─── Preset Definitions ───────────────────────────────────────────────────────

/** Presets para productos por unidad (pz, lata, botella, etc.) */
const UNIT_PRESETS: QuickAddPreset[] = [
  { value: 1,  label: '+1' },
  { value: 5,  label: '+5' },
  { value: 10, label: '+10' },
  { value: 25, label: '+25' },
  { value: 50, label: '+50' },
];

/** Presets para productos medidos en kg o L (valores grandes) */
const WEIGHT_LARGE_PRESETS: QuickAddPreset[] = [
  { value: 0.25, label: '+0.25' },
  { value: 0.5,  label: '+0.5' },
  { value: 1.0,  label: '+1.0' },
  { value: 2.5,  label: '+2.5' },
  { value: 5.0,  label: '+5.0' },
];

/** Presets para productos medidos en g o ml (valores pequeños) */
const WEIGHT_SMALL_PRESETS: QuickAddPreset[] = [
  { value: 50,  label: '+50' },
  { value: 100, label: '+100' },
  { value: 250, label: '+250' },
  { value: 500, label: '+500' },
];

// ─── Color Schemes ────────────────────────────────────────────────────────────

const COLOR_CLASSES = {
  blue: {
    base: 'bg-blue-50 border-blue-200 text-blue-700',
    hover: 'hover:bg-blue-100 hover:border-blue-300',
    unit: 'text-blue-500',
  },
  green: {
    base: 'bg-green-50 border-green-200 text-green-700',
    hover: 'hover:bg-green-100 hover:border-green-300',
    unit: 'text-green-500',
  },
  amber: {
    base: 'bg-amber-50 border-amber-200 text-amber-700',
    hover: 'hover:bg-amber-100 hover:border-amber-300',
    unit: 'text-amber-500',
  },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Selecciona los presets adecuados según el tipo de producto.
 *
 * Lógica:
 *   - No es peso/volumen → presets de unidad (1, 5, 10, 25, 50)
 *   - kg o L             → presets grandes (0.25, 0.5, 1.0, 2.5, 5.0)
 *   - g o ml             → presets pequeños (50, 100, 250, 500)
 */
function getPresets(isWeightBased: boolean, weightUnit?: string): QuickAddPreset[] {
  if (!isWeightBased) return UNIT_PRESETS;
  if (weightUnit === 'g' || weightUnit === 'ml') return WEIGHT_SMALL_PRESETS;
  return WEIGHT_LARGE_PRESETS;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuickAddButtons({
  isWeightBased,
  weightUnit,
  onAdd,
  maxAdd,
  colorScheme = 'blue',
}: QuickAddButtonsProps) {
  const presets = getPresets(isWeightBased, weightUnit);
  const colors = COLOR_CLASSES[colorScheme];
  const unitLabel = isWeightBased ? (weightUnit || 'kg') : '';

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {presets.map((preset) => {
        const disabled = maxAdd !== undefined && preset.value > maxAdd;

        return (
          <button
            key={preset.value}
            onClick={() => onAdd(preset.value)}
            disabled={disabled}
            className={cn(
              'px-3 py-2 min-h-[40px] rounded-full border text-sm font-semibold',
              'transition-all duration-150 active:scale-95',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              colors.base,
              colors.hover,
            )}
          >
            {preset.label}
            {unitLabel && (
              <span className={cn('ml-0.5 text-xs font-normal', colors.unit)}>
                {unitLabel}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
