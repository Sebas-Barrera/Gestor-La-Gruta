import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Store, FileDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isDateInRange } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { HistoryFilters, defaultHistoryFilters } from '@/components/history/HistoryFilters';
import { HistoryTable } from '@/components/history/HistoryTable';
import { HistorySummaryCards } from '@/components/history/HistorySummaryCards';
import { HistoryEntryDetailSheet } from '@/components/history/HistoryEntryDetailSheet';
import { inventoryHistoryEntries } from '@/data/historyMockData';
import { bars, adminAccounts, products } from '@/data/mockData';
import type { HistoryFilterState } from '@/components/history/HistoryFilters';
import type { InventoryHistoryEntry } from '@/types';

/**
 * Sección principal de Historial de Inventario.
 * Muestra todas las entradas de mercancía al inventario de forma general o por bar.
 *
 * Soporta query param `?bar=<barId>` para pre-seleccionar un bar
 * al navegar desde otras secciones.
 *
 * Backend: Este componente consume los siguientes endpoints:
 *   - GET /api/inventory-history?barId=&adminId=&entryType=&category=&dateFrom=&dateTo=&search=&page=&pageSize=
 *   - GET /api/inventory-history/summary (mismos filtros, retorna conteos agregados)
 *   - GET /api/inventory-history/export (mismos filtros, retorna CSV/Excel)
 */
export function HistorySection() {
  const [searchParams] = useSearchParams();
  const initialBarId = searchParams.get('bar') || 'all';

  const [selectedBarId, setSelectedBarId] = useState<string | 'all'>(initialBarId);
  const [filters, setFilters] = useState<HistoryFilterState>(defaultHistoryFilters);
  const [page, setPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<InventoryHistoryEntry | null>(null);

  // --- Datos disponibles según bar seleccionado ---

  const activeAdmins = useMemo(() => {
    return adminAccounts.filter(a => a.isActive);
  }, []);

  const availableCategories = useMemo(() => {
    const entries = selectedBarId === 'all'
      ? inventoryHistoryEntries
      : inventoryHistoryEntries.filter(e => e.barId === selectedBarId);
    return [...new Set(entries.map(e => e.productCategory))].sort();
  }, [selectedBarId]);

  // --- Filtrado de entradas ---

  const filteredEntries = useMemo(() => {
    return inventoryHistoryEntries
      .filter((e: InventoryHistoryEntry) => {
        // Filtro por bar
        if (selectedBarId !== 'all' && e.barId !== selectedBarId) return false;
        // Filtro por admin
        if (filters.adminId && e.adminId !== filters.adminId) return false;
        // Filtro por tipo de entrada
        if (filters.entryType && e.entryType !== filters.entryType) return false;
        // Filtro por categoría
        if (filters.category && e.productCategory !== filters.category) return false;
        // Filtro por búsqueda de texto
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
        // Filtro por rango de fechas
        if (filters.dateFrom || filters.dateTo) {
          if (!isDateInRange(e.timestamp, filters.dateFrom, filters.dateTo)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [selectedBarId, filters]);

  // --- Estadísticas de resumen ---

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

  // --- Paginación ---

  const pageSize = Number(filters.pageSize) || 15;
  const paginatedEntries = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, page, pageSize]);

  // --- Handlers ---

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

  // Contadores de alertas por bar (para indicador visual en el selector)
  const barAlertCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    bars.forEach(bar => {
      const barProducts = products.filter(p => p.barId === bar.id);
      counts[bar.id] = barProducts.filter(
        p => p.status === 'low_stock' || p.status === 'out_of_stock'
      ).length;
    });
    return counts;
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Título de sección + Botón de exportar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Historial de Entradas al Inventario</h2>
          <p className="text-sm text-gray-500 mt-1">
            Registro completo de todos los ingresos de mercancía
          </p>
        </div>
        {/* 
          TODO Backend: EXPORTACIÓN DE HISTORIAL
          Al construir el archivo Excel/CSV al presionar este botón, el documento DEBE de exportarse 
          en base a ESPECÍFICAMENTE la configuración que se tiene en este componente en este momento.
          Es decir, la consulta de exportación debe considerar:
          1. El bar seleccionado actualmente (puede ser "all" o un ID específico).
          2. Los filtros en memoria aplicados: Admin que hizo el movimiento, Categoría, Tipo de entrada.
          3. Filtros por fechas personalizadas, y términos de búsqueda libre.

          Por ejemplo, si el usuario seleccionó "Bar Central" y fecha "13/03 a 14/03", 
          el Excel resultante DEBE devolver exactamente esos datos tal cual se estuvieran viendo en pantalla.
        */}
        <Button
          variant="outline"
          className="gap-2 hover:border-blue-500 hover:text-blue-600"
          onClick={() => {
            // endpoint export params -> { barId: selectedBarId, ...filters }
            console.log('[HistoryExport] Datos para backend:', {
              barId: selectedBarId,
              ...filters,
            });
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
                : 'border-gray-200 hover:border-blue-300'
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
                  : 'border-gray-200 hover:border-blue-300'
              )}
            >
              <div className={cn(
                'w-2 h-2 rounded-full',
                barAlertCounts[bar.id] > 0 ? 'bg-amber-500' : 'bg-blue-500'
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

      {/* Tarjetas de resumen */}
      <HistorySummaryCards
        totalEntries={summaryStats.totalEntries}
        scanEntries={summaryStats.scanEntries}
        batchEntries={summaryStats.batchEntries}
        otherEntries={summaryStats.otherEntries}
      />

      {/* Filtros */}
      <HistoryFilters
        filters={filters}
        onChange={handleFilterChange}
        onClearAll={handleClearFilters}
        availableAdmins={activeAdmins}
        availableCategories={availableCategories}
      />

      {/* Tabla de historial */}
      <HistoryTable
        entries={paginatedEntries}
        page={page}
        pageSize={pageSize}
        totalFiltered={filteredEntries.length}
        onPageChange={setPage}
        showBarColumn={selectedBarId === 'all'}
        onRowClick={handleRowClick}
      />

      {/* Detail Sheet */}
      <HistoryEntryDetailSheet
        open={selectedEntry !== null}
        onClose={() => setSelectedEntry(null)}
        entry={selectedEntry}
      />
    </div>
  );
}
