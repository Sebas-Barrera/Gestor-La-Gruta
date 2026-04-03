import { supabase } from '@/lib/supabase';
import type { InventoryMovement, ReceptionSession } from '@/types';

// ── Mapper ────────────────────────────────────────────────────

function mapMovement(row: Record<string, unknown>): InventoryMovement {
  return {
    id: row.id as string,
    barId: row.bar_id as string,
    productId: row.product_id as string,
    productName: row.product_name as string,
    workerId: (row.worker_id as string) ?? '',
    workerName: row.worker_name as string,
    type: row.type as 'in' | 'out',
    quantity: Number(row.quantity),
    previousQuantity: Number(row.previous_quantity),
    newQuantity: Number(row.new_quantity),
    unit: row.unit as string,
    timestamp: row.timestamp as string,
    notes: (row.notes as string) ?? undefined,
  };
}

// ── Internal helper ───────────────────────────────────────────

async function insertMovement(
  payload: Record<string, unknown>,
): Promise<InventoryMovement> {
  const { data, error } = await supabase
    .from('inventory_movements')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return mapMovement(data as Record<string, unknown>);
}

// ── Exports ───────────────────────────────────────────────────

export async function recordEntry(
  productId: string,
  quantity: number,
  workerName: string,
  barId: string,
  productName: string,
  currentStock: number,
  unit: string,
  notes?: string,
): Promise<{ newStock: number; movement: InventoryMovement }> {
  const newStock = currentStock + quantity;

  const { error } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', productId);
  if (error) throw error;

  const movement = await insertMovement({
    bar_id: barId,
    product_id: productId,
    product_name: productName,
    worker_name: workerName,
    type: 'in',
    quantity,
    previous_quantity: currentStock,
    new_quantity: newStock,
    unit,
    notes: notes ?? null,
  });

  return { newStock, movement };
}

export async function recordExit(
  productId: string,
  quantity: number,
  workerName: string,
  barId: string,
  productName: string,
  currentStock: number,
  unit: string,
  notes?: string,
): Promise<{ newStock: number; movement: InventoryMovement }> {
  const newStock = Math.max(0, currentStock - quantity);

  const { error } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', productId);
  if (error) throw error;

  const movement = await insertMovement({
    bar_id: barId,
    product_id: productId,
    product_name: productName,
    worker_name: workerName,
    type: 'out',
    quantity,
    previous_quantity: currentStock,
    new_quantity: newStock,
    unit,
    notes: notes ?? null,
  });

  return { newStock, movement };
}

export async function adjustStock(
  productId: string,
  newQuantity: number,
  workerName: string,
  barId: string,
  productName: string,
  currentStock: number,
  unit: string,
  notes?: string,
): Promise<{ newStock: number; movement: InventoryMovement }> {
  const diff = newQuantity - currentStock;
  const type = diff >= 0 ? 'in' : 'out';

  const { error } = await supabase
    .from('products')
    .update({ stock: newQuantity })
    .eq('id', productId);
  if (error) throw error;

  const movement = await insertMovement({
    bar_id: barId,
    product_id: productId,
    product_name: productName,
    worker_name: workerName,
    type,
    quantity: Math.abs(diff),
    previous_quantity: currentStock,
    new_quantity: newQuantity,
    unit,
    notes: notes ?? null,
  });

  return { newStock: newQuantity, movement };
}

/**
 * Confirms a batch reception session:
 * - Updates stock for each item sequentially (correctly handles same product appearing multiple times)
 * - Inserts one inventory_movement per item
 * - Marks the session as confirmed
 */
export async function confirmBatchReception(
  session: ReceptionSession,
  workerName: string,
): Promise<InventoryMovement[]> {
  const movements: InventoryMovement[] = [];

  // Running stock tracker — handles same product appearing multiple times
  const runningStock = new Map<string, number>();

  for (const item of session.items) {
    // Read current stock from DB (or from running tracker if already updated this batch)
    let currentStock: number;
    if (runningStock.has(item.productId)) {
      currentStock = runningStock.get(item.productId)!;
    } else {
      const { data, error } = await supabase
        .from('products')
        .select('stock, name, unit')
        .eq('id', item.productId)
        .single();
      if (error || !data) continue;
      currentStock = Number(data.stock);
    }

    const newStock = currentStock + item.totalIndividualQty;
    runningStock.set(item.productId, newStock);

    const { error: stockErr } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', item.productId);
    if (stockErr) continue;

    const { data: product } = await supabase
      .from('products')
      .select('name, unit')
      .eq('id', item.productId)
      .single();

    try {
      const mov = await insertMovement({
        bar_id: session.barId,
        product_id: item.productId,
        product_name: product?.name ?? item.productName ?? '',
        worker_name: workerName,
        type: 'in',
        quantity: item.totalIndividualQty,
        previous_quantity: currentStock,
        new_quantity: newStock,
        unit: item.unit,
        notes: session.notes ?? null,
      });
      movements.push(mov);
    } catch {
      // Movement insertion failure shouldn't abort the whole batch
    }
  }

  // Mark session as confirmed
  await supabase
    .from('reception_sessions')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('id', session.id);

  return movements;
}
