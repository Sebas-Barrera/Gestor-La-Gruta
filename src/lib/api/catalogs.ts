import { supabase } from '@/lib/supabase';

export interface Category {
  id: string;
  name: string;
  isBulk: boolean;
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(r => ({ id: r.id, name: r.name, isBulk: r.is_bulk }));
}

export async function getSubcategories(categoryId?: string): Promise<Subcategory[]> {
  let query = supabase.from('subcategories').select('*').order('name');
  if (categoryId) query = query.eq('category_id', categoryId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(r => ({ id: r.id, name: r.name, categoryId: r.category_id }));
}

export async function getSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase.from('suppliers').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(r => ({
    id: r.id,
    name: r.name,
    phone: r.phone ?? undefined,
    email: r.email ?? undefined,
  }));
}
