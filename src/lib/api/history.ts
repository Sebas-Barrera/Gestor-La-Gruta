import { supabase } from '@/lib/supabase';
import type { InventoryHistoryEntry, InventoryAlert } from '@/types';

// ── Mappers ───────────────────────────────────────────────────

function mapHistory(row: Record<string, unknown>): InventoryHistoryEntry {
  return {
    id: row.id as string,
    barId: row.bar_id as string,
    barName: row.bar_name as string,
    productId: row.product_id as string,
    productName: row.product_name as string,
    productCategory: row.product_category as string,
    productSubcategory: row.product_subcategory as string,
    adminId: row.admin_id as string,
    adminName: row.admin_name as string,
    entryType: row.entry_type as InventoryHistoryEntry['entryType'],
    quantity: Number(row.quantity),
    unit: row.unit as string,
    previousStock: Number(row.previous_stock),
    newStock: Number(row.new_stock),
    timestamp: row.timestamp as string,
    notes: (row.notes as string) ?? undefined,
    boxQuantity: (row.box_quantity as number) ?? undefined,
    boxSize: (row.box_size as number) ?? undefined,
    boxLabel: (row.box_label as string) ?? undefined,
    barcodeScanned: (row.barcode_scanned as string) ?? undefined,
    weight: (row.weight as number) ?? undefined,
    weightUnit: (row.weight_unit as InventoryHistoryEntry['weightUnit']) ?? undefined,
    receptionSessionId: (row.reception_session_id as string) ?? undefined,
    receptionSessionNotes: (row.reception_session_notes as string) ?? undefined,
  };
}

function mapAlert(row: Record<string, unknown>): InventoryAlert {
  const products = row.products as Record<string, unknown> | undefined;
  const bars = row.bars as Record<string, unknown> | undefined;
  return {
    id: row.id as string,
    productId: row.product_id as string,
    productName: (products?.name as string) ?? '',
    type: row.type as InventoryAlert['type'],
    currentStock: Number(row.current_stock),
    threshold: Number(row.threshold),
    timestamp: row.timestamp as string,
    barId: row.bar_id as string,
    barName: (bars?.name as string) ?? undefined,
  };
}

// ── Queries ───────────────────────────────────────────────────

export interface HistoryFilters {
  barId?: string;
  adminId?: string;
  entryType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export async function getInventoryHistory(
  filters: HistoryFilters = {},
): Promise<InventoryHistoryEntry[]> {
  const { barId, adminId, entryType, dateFrom, dateTo, page = 1, pageSize = 50 } = filters;

  let query = supabase
    .from('inventory_history')
    .select('*')
    .order('timestamp', { ascending: false });

  if (barId) query = query.eq('bar_id', barId);
  if (adminId) query = query.eq('admin_id', adminId);
  if (entryType) query = query.eq('entry_type', entryType);
  if (dateFrom) query = query.gte('timestamp', dateFrom);
  if (dateTo) query = query.lte('timestamp', dateTo);

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(r => mapHistory(r as Record<string, unknown>));
}

export async function getInventoryAlerts(barId?: string): Promise<InventoryAlert[]> {
  let query = supabase
    .from('inventory_alerts')
    .select('*, products(name), bars(name)')
    .eq('is_resolved', false)
    .order('timestamp', { ascending: false });

  if (barId) query = query.eq('bar_id', barId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(r => mapAlert(r as Record<string, unknown>));
}

export async function resolveAlert(alertId: string): Promise<void> {
  const { error } = await supabase
    .from('inventory_alerts')
    .update({ is_resolved: true, resolved_at: new Date().toISOString() })
    .eq('id', alertId);
  if (error) throw error;
}
