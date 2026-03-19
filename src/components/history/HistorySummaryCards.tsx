import { ArrowDownCircle, ScanLine, ClipboardCheck, Scale } from 'lucide-react';
import { StatCard } from '@/components/StatCard';

interface HistorySummaryCardsProps {
  /** Total de entradas que coinciden con los filtros actuales */
  totalEntries: number;
  /** Entradas por escaneo (individual + caja) */
  scanEntries: number;
  /** Entradas por recepción por lotes */
  batchEntries: number;
  /** Entradas por báscula + ajustes manuales */
  otherEntries: number;
}

/**
 * Tarjetas de resumen para el módulo de historial de inventario.
 * Muestra totales calculados a partir de las entradas filtradas.
 *
 * Backend: Estos valores se calculan a partir de GET /api/inventory-history/summary
 * con los mismos query params de filtros que se envían a la tabla.
 */
export function HistorySummaryCards({
  totalEntries,
  scanEntries,
  batchEntries,
  otherEntries,
}: HistorySummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard
        icon={ArrowDownCircle}
        iconBgColor="bg-blue-100"
        iconColor="text-blue-600"
        value={totalEntries}
        label="Total Entradas"
        changeLabel="Según filtros aplicados"
        delay={0}
      />
      <StatCard
        icon={ScanLine}
        iconBgColor="bg-green-100"
        iconColor="text-green-600"
        value={scanEntries}
        label="Escaneos"
        changeLabel="Individual + Cajas"
        delay={100}
      />
      <StatCard
        icon={ClipboardCheck}
        iconBgColor="bg-amber-100"
        iconColor="text-amber-600"
        value={batchEntries}
        label="Recepciones por Lote"
        changeLabel="Sesiones de recepción"
        delay={200}
      />
      <StatCard
        icon={Scale}
        iconBgColor="bg-purple-100"
        iconColor="text-purple-600"
        value={otherEntries}
        label="Báscula y Ajustes"
        changeLabel="Peso + manuales"
        delay={300}
      />
    </div>
  );
}
