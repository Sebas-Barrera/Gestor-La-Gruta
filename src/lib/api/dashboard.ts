import { supabase } from '@/lib/supabase';
import type { DashboardStats, BarStats, Activity } from '@/types';

export async function getDashboardStats(barId?: string): Promise<DashboardStats> {
  let query = supabase
    .from('products_with_status')
    .select('stock, price, status')
    .eq('is_active', true);
  if (barId) query = query.eq('bar_id', barId);

  const { data, error } = await query;
  if (error) throw error;

  const products = data ?? [];
  const totalProducts = products.length;
  const inventoryValue = products.reduce(
    (sum, p) => sum + Number(p.stock) * Number(p.price),
    0,
  );
  const lowStockCount = products.filter(
    p => p.status === 'low_stock' || p.status === 'out_of_stock',
  ).length;

  return {
    totalProducts,
    inventoryValue,
    lowStockCount,
    todaySales: 0,
    totalProductsChange: 0,
    inventoryValueChange: 0,
    todaySalesChange: 0,
  };
}

export async function getBarStats(): Promise<BarStats[]> {
  const { data: bars, error: barsError } = await supabase
    .from('bars')
    .select('id, name, location')
    .eq('is_active', true);
  if (barsError) throw barsError;

  const stats: BarStats[] = await Promise.all(
    (bars ?? []).map(async bar => {
      const { data: products } = await supabase
        .from('products_with_status')
        .select('stock, price, status')
        .eq('bar_id', bar.id)
        .eq('is_active', true);

      const ps = products ?? [];
      return {
        id: bar.id,
        name: bar.name,
        location: bar.location ?? '',
        productCount: ps.length,
        inventoryValue: ps.reduce(
          (s, p) => s + Number(p.stock) * Number(p.price),
          0,
        ),
        lowStockCount: ps.filter(p => p.status === 'low_stock').length,
        outOfStockCount: ps.filter(p => p.status === 'out_of_stock').length,
        todaySales: 0,
        salesTrend: 0,
      };
    }),
  );

  return stats;
}

export async function getActivities(barId?: string, limit = 50): Promise<Activity[]> {
  let query = supabase
    .from('activities')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);
  if (barId) query = query.eq('bar_id', barId);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map(r => ({
    id: r.id,
    type: r.type as Activity['type'],
    message: r.message,
    timestamp: r.timestamp,
    user: r.user_name ?? undefined,
    barId: r.bar_id ?? undefined,
    barName: r.bar_name ?? undefined,
    productId: r.product_id ?? undefined,
    productName: r.product_name ?? undefined,
  }));
}
