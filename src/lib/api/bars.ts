import { supabase } from '@/lib/supabase';
import { mapBar } from './auth';
import type { Bar } from '@/types';

export async function getBars(): Promise<Bar[]> {
  const { data, error } = await supabase
    .from('bars')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return (data ?? []).map(r => mapBar(r as Record<string, unknown>));
}

export async function addBar(bar: Omit<Bar, 'id' | 'isActive'>): Promise<Bar> {
  const { data, error } = await supabase
    .from('bars')
    .insert({
      name: bar.name,
      location: bar.location,
      manager: bar.manager ?? null,
      phone: bar.phone ?? null,
      image: bar.image ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapBar(data as Record<string, unknown>);
}

export async function updateBar(id: string, updates: Partial<Bar>): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.location !== undefined) patch.location = updates.location;
  if (updates.manager !== undefined) patch.manager = updates.manager;
  if (updates.phone !== undefined) patch.phone = updates.phone;
  if (updates.image !== undefined) patch.image = updates.image;
  if (updates.isActive !== undefined) patch.is_active = updates.isActive;

  const { error } = await supabase.from('bars').update(patch).eq('id', id);
  if (error) throw error;
}
