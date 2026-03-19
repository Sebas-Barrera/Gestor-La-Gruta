import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Users } from 'lucide-react';
import { StatCard } from '@/components/StatCard';

interface ReportSummaryCardsProps {
  totalMovements: number;
  totalEntries: number;
  totalExits: number;
  activeWorkers: number;
}

/**
 * Tarjetas de resumen para el módulo de reportes.
 * Muestra totales calculados a partir de los movimientos filtrados.
 *
 * Backend: Estos valores se calculan a partir de GET /api/reports/summary
 * con los mismos query params de filtros que se envían a la tabla.
 */
export function ReportSummaryCards({
  totalMovements,
  totalEntries,
  totalExits,
  activeWorkers,
}: ReportSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard
        icon={ArrowLeftRight}
        iconBgColor="bg-blue-100"
        iconColor="text-blue-600"
        value={totalMovements}
        label="Total Movimientos"
        changeLabel="Según filtros aplicados"
        delay={0}
      />
      <StatCard
        icon={ArrowDownCircle}
        iconBgColor="bg-green-100"
        iconColor="text-green-600"
        value={totalEntries}
        label="Entradas"
        changeLabel="Productos ingresados"
        delay={100}
      />
      <StatCard
        icon={ArrowUpCircle}
        iconBgColor="bg-red-100"
        iconColor="text-red-600"
        value={totalExits}
        label="Salidas"
        changeLabel="Productos retirados"
        delay={200}
      />
      <StatCard
        icon={Users}
        iconBgColor="bg-blue-100"
        iconColor="text-blue-600"
        value={activeWorkers}
        label="Trabajadores Activos"
        changeLabel="Involucrados en movimientos"
        delay={300}
      />
    </div>
  );
}
