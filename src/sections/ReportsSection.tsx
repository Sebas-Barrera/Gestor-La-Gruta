import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Store, FileDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isDateInRange } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { ReportFilters, defaultReportFilters } from '@/components/reports/ReportFilters';
import { ReportMovementsTable } from '@/components/reports/ReportMovementsTable';
import { ReportSummaryCards } from '@/components/reports/ReportSummaryCards';
import { useInventory } from '@/contexts/InventoryContext';
import { useBarManagement } from '@/hooks/useBarManagement';
import type { ReportFilterState } from '@/components/reports/ReportFilters';
import type { InventoryMovement } from '@/types';

export function ReportsSection() {
  const [searchParams] = useSearchParams();
  const initialBarId = searchParams.get('bar') || 'all';

  const [selectedBarId, setSelectedBarId] = useState<string | 'all'>(initialBarId);
  const [filters, setFilters] = useState<ReportFilterState>(defaultReportFilters);
  const [page, setPage] = useState(1);

  const { products, inventoryMovements } = useInventory();
  const { bars, workers } = useBarManagement();

  const availableWorkers = useMemo(() => {
    if (selectedBarId === 'all') return workers.filter(w => w.isActive);
    return workers.filter(w => w.isActive && w.barIds.includes(selectedBarId));
  }, [selectedBarId, workers]);

  const availableProducts = useMemo(() => {
    if (selectedBarId === 'all') return products;
    return products.filter(p => p.barId === selectedBarId);
  }, [selectedBarId, products]);

  const filteredMovements = useMemo(() => {
    return inventoryMovements
      .filter((m: InventoryMovement) => {
        if (selectedBarId !== 'all' && m.barId !== selectedBarId) return false;
        if (filters.workerId && m.workerId !== filters.workerId) return false;
        if (filters.productId && m.productId !== filters.productId) return false;
        if (filters.type && m.type !== filters.type) return false;
        if (filters.search) {
          const s = filters.search.toLowerCase();
          if (
            !m.productName.toLowerCase().includes(s) &&
            !m.notes?.toLowerCase().includes(s) &&
            !m.workerName.toLowerCase().includes(s)
          ) return false;
        }
        if (filters.dateFrom || filters.dateTo) {
          if (!isDateInRange(m.timestamp, filters.dateFrom, filters.dateTo)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [selectedBarId, filters, inventoryMovements]);

  const summaryStats = useMemo(() => {
    const totalEntries = filteredMovements.filter(m => m.type === 'in').length;
    const totalExits = filteredMovements.filter(m => m.type === 'out').length;
    const uniqueWorkers = new Set(filteredMovements.map(m => m.workerId)).size;
    return {
      totalMovements: filteredMovements.length,
      totalEntries,
      totalExits,
      activeWorkers: uniqueWorkers,
    };
  }, [filteredMovements]);

  const pageSize = Number(filters.pageSize) || 15;
  const paginatedMovements = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredMovements.slice(start, start + pageSize);
  }, [filteredMovements, page, pageSize]);

  const barAlertCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    bars.forEach(bar => {
      const barProducts = products.filter(p => p.barId === bar.id);
      counts[bar.id] = barProducts.filter(
        p => p.status === 'low_stock' || p.status === 'out_of_stock',
      ).length;
    });
    return counts;
  }, [bars, products]);

  const handleBarChange = useCallback((barId: string | 'all') => {
    setSelectedBarId(barId);
    setFilters(defaultReportFilters);
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((key: keyof ReportFilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(defaultReportFilters);
    setPage(1);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reportes de Movimientos</h2>
          <p className="text-sm text-gray-500 mt-1">
            Historial completo de entradas y salidas de inventario
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 hover:border-blue-500 hover:text-blue-600"
          onClick={() => {}}
        >
          <FileDown className="w-4 h-4" />
          Exportar
        </Button>
      </div>

      {/* Selector de Bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <span className="text-sm font-medium text-gray-500 whitespace-nowrap flex-shrink-0">
            Reporte de:
          </span>

          <button
            onClick={() => handleBarChange('all')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg border-2 whitespace-nowrap flex-shrink-0',
              'transition-all duration-200',
              selectedBarId === 'all'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-blue-300',
            )}
          >
            <Store className="w-4 h-4" />
            <span className="text-sm font-medium">Todos los Bares</span>
          </button>

          {bars.map(bar => (
            <button
              key={bar.id}
              onClick={() => handleBarChange(bar.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg border-2 whitespace-nowrap flex-shrink-0',
                'transition-all duration-200',
                selectedBarId === bar.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-blue-300',
              )}
            >
              <div className={cn(
                'w-2 h-2 rounded-full',
                barAlertCounts[bar.id] > 0 ? 'bg-amber-500' : 'bg-blue-500',
              )} />
              <span className="text-sm font-medium">{bar.name}</span>
              {barAlertCounts[bar.id] > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {barAlertCounts[bar.id]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <ReportSummaryCards
        totalMovements={summaryStats.totalMovements}
        totalEntries={summaryStats.totalEntries}
        totalExits={summaryStats.totalExits}
        activeWorkers={summaryStats.activeWorkers}
      />

      <ReportFilters
        filters={filters}
        onChange={handleFilterChange}
        onClearAll={handleClearFilters}
        availableWorkers={availableWorkers}
        availableProducts={availableProducts}
      />

      <ReportMovementsTable
        movements={paginatedMovements}
        bars={bars}
        products={products}
        page={page}
        pageSize={pageSize}
        totalFiltered={filteredMovements.length}
        onPageChange={setPage}
        showBarColumn={selectedBarId === 'all'}
      />
    </div>
  );
}
