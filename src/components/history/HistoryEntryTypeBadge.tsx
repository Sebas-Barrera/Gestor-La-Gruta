import { ScanLine, Boxes, ClipboardCheck, Scale, Pencil } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { InventoryHistoryEntryType } from '@/types';

/**
 * Configuración visual de cada tipo de entrada al inventario.
 *
 * Backend: el campo `entryType` en la tabla `inventory_history`
 * es un ENUM con estos 5 valores.
 */
const entryTypeConfig: Record<InventoryHistoryEntryType, {
  label: string;
  variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple';
  icon: React.ElementType;
}> = {
  scan_individual:   { label: 'Escaneo',  variant: 'info',    icon: ScanLine },
  scan_box:          { label: 'Caja',     variant: 'warning', icon: Boxes },
  batch_reception:   { label: 'Lote',     variant: 'success', icon: ClipboardCheck },
  bulk_weight:       { label: 'Báscula',  variant: 'purple',  icon: Scale },
  manual_adjustment: { label: 'Manual',   variant: 'neutral', icon: Pencil },
};

interface HistoryEntryTypeBadgeProps {
  entryType: InventoryHistoryEntryType;
  showLabel?: boolean;
}

export function HistoryEntryTypeBadge({ entryType, showLabel = true }: HistoryEntryTypeBadgeProps) {
  const config = entryTypeConfig[entryType];
  const Icon = config.icon;

  return (
    <StatusBadge variant={config.variant}>
      <span className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {showLabel && config.label}
      </span>
    </StatusBadge>
  );
}

/** Obtiene la etiqueta legible del tipo de entrada */
export function getEntryTypeLabel(entryType: InventoryHistoryEntryType): string {
  return entryTypeConfig[entryType].label;
}
