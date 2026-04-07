import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Store, FileDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isDateInRange } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { HistoryFilters, defaultHistoryFilters } from '@/components/history/HistoryFilters';
import { HistoryTable } from '@/components/history/HistoryTable';
import { HistorySummaryCards } from '@/components/history/HistorySummaryCards';
import { HistoryEntryDetailSheet } from '@/components/history/HistoryEntryDetailSheet';
import { getInventoryHistory } from '@/lib/api/history';
import { useInventory } from '@/contexts/InventoryContext';
import { useBarManagement } from '@/hooks/useBarManagement';
import { useAdminManagement } from '@/hooks/useAdminManagement';
import type { HistoryFilterState } from '@/components/history/HistoryFilters';
import type { InventoryHistoryEntry } from '@/types';

export function HistorySection() {
  const [searchParams] = useSearchParams();
  const initialBarId = searchParams.get('bar') || 'all';

  const [selectedBarId, setSelectedBarId] = useState<string | 'all'>(initialBarId);
  const [filters, setFilters] = useState<HistoryFilterState>(defaultHistoryFilters);
  const [page, setPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<InventoryHistoryEntry | null>(null);
  const [historyEntries, setHistoryEntries] = useState<InventoryHistoryEntry[]>([]);

  const { products } = useInventory();
  const { bars } = useBarManagement();
  const { admins } = useAdminManagement();

  useEffect(() => {
    getInventoryHistory({
      barId: selectedBarId === 'all' ? undefined : selectedBarId,
      pageSize: 500,
    })
      .then(setHistoryEntries)
      .catch(err => console.error('[HistorySection] Failed to load history:', err));
  }, [selectedBarId]);

  const activeAdmins = useMemo(() => admins.filter(a => a.isActive), [admins]);

  const availableCategories = useMemo(() => {
    return [...new Set(historyEntries.map(e => e.productCategory))].sort();
  }, [historyEntries]);

  const filteredEntries = useMemo(() => {
    return historyEntries
      .filter((e: InventoryHistoryEntry) => {
        if (filters.adminId && e.adminId !== filters.adminId) return false;
        if (filters.entryType && e.entryType !== filters.entryType) return false;
        if (filters.category && e.productCategory !== filters.category) return false;
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesProduct = e.productName.toLowerCase().includes(searchLower);
          const matchesAdmin = e.adminName.toLowerCase().includes(searchLower);
          const matchesNotes = e.notes?.toLowerCase().includes(searchLower);
          const matchesSessionNotes = e.receptionSessionNotes?.toLowerCase().includes(searchLower);
          const matchesBar = e.barName.toLowerCase().includes(searchLower);
          const matchesBarcode = e.barcodeScanned?.toLowerCase().includes(searchLower);
          if (!matchesProduct && !matchesAdmin && !matchesNotes && !matchesSessionNotes && !matchesBar && !matchesBarcode) return false;
        }
        if (filters.dateFrom || filters.dateTo) {
          if (!isDateInRange(e.timestamp, filters.dateFrom, filters.dateTo)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [historyEntries, filters]);

  const summaryStats = useMemo(() => {
    const scanIndividual = filteredEntries.filter(e => e.entryType === 'scan_individual').length;
    const scanBox = filteredEntries.filter(e => e.entryType === 'scan_box').length;
    const batchReception = filteredEntries.filter(e => e.entryType === 'batch_reception').length;
    const bulkWeight = filteredEntries.filter(e => e.entryType === 'bulk_weight').length;
    const manualAdj = filteredEntries.filter(e => e.entryType === 'manual_adjustment').length;
    return {
      totalEntries: filteredEntries.length,
      scanEntries: scanIndividual + scanBox,
      batchEntries: batchReception,
      otherEntries: bulkWeight + manualAdj,
    };
  }, [filteredEntries]);

  const pageSize = Number(filters.pageSize) || 15;
  const paginatedEntries = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, page, pageSize]);

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
    setFilters(defaultHistoryFilters);
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((key: keyof HistoryFilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(defaultHistoryFilters);
    setPage(1);
  }, []);

  const handleRowClick = useCallback((entry: InventoryHistoryEntry) => {
    setSelectedEntry(entry);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Historial de Entradas al Inventario</h2>
          <p className="text-sm text-gray-500 mt-1">
            Registro completo de todos los ingresos de mercancía
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 hover:border-blue-500 hover:text-blue-600"
          onClick={() => {
            console.log('[HistoryExport] Datos para backend:', { barId: selectedBarId, ...filters });
          }}
        >
          <FileDown className="w-4 h-4" />
          Exportar
        </Button>
      </div>

      {/* Selector de Bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <span className="text-sm font-medium text-gray-500 whitespace-nowrap flex-shrink-0">
            Historial de:
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
            <span className="text-sm font-medium">Todos los Almacenes</span>
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

      <HistorySummaryCards
        totalEntries={summaryStats.totalEntries}
        scanEntries={summaryStats.scanEntries}
        batchEntries={summaryStats.batchEntries}
        otherEntries={summaryStats.otherEntries}
      />

      <HistoryFilters
        filters={filters}
        onChange={handleFilterChange}
        onClearAll={handleClearFilters}
        availableAdmins={activeAdmins}
        availableCategories={availableCategories}
      />

      <HistoryTable
        entries={paginatedEntries}
        page={page}
        pageSize={pageSize}
        totalFiltered={filteredEntries.length}
        onPageChange={setPage}
        showBarColumn={selectedBarId === 'all'}
        onRowClick={handleRowClick}
      />

      <HistoryEntryDetailSheet
        open={selectedEntry !== null}
        onClose={() => setSelectedEntry(null)}
        entry={selectedEntry}
      />
    </div>
  );
}
