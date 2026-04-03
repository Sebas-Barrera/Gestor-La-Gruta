import { supabase } from '@/lib/supabase';
import { mapWorker } from './auth';
import type { Worker } from '@/types';

export async function getWorkers(): Promise<Worker[]> {
  const { data, error } = await supabase
    .from('workers')
    .select('*, worker_bars(bar_id)')
    .order('name');
  if (error) throw error;
  return (data ?? []).map(r => mapWorker(r as Record<string, unknown>));
}

export async function addWorker(input: {
  name: string;
  pin: string;
  phone?: string;
  barIds: string[];
  avatar?: string;
}): Promise<Worker> {
  const { data, error } = await supabase
    .from('workers')
    .insert({
      name: input.name,
      pin: input.pin,
      phone: input.phone ?? null,
      avatar: input.avatar ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  if (input.barIds.length > 0) {
    const { error: wbError } = await supabase
      .from('worker_bars')
      .insert(input.barIds.map(barId => ({ worker_id: data.id, bar_id: barId })));
    if (wbError) throw wbError;
  }

  return { ...mapWorker(data as Record<string, unknown>), barIds: input.barIds };
}

export async function updateWorker(id: string, updates: Partial<Worker>): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.pin !== undefined) patch.pin = updates.pin;
  if (updates.phone !== undefined) patch.phone = updates.phone;
  if (updates.avatar !== undefined) patch.avatar = updates.avatar;
  if (updates.isActive !== undefined) patch.is_active = updates.isActive;

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from('workers').update(patch).eq('id', id);
    if (error) throw error;
  }

  if (updates.barIds !== undefined) {
    await supabase.from('worker_bars').delete().eq('worker_id', id);
    if (updates.barIds.length > 0) {
      const { error: wbError } = await supabase
        .from('worker_bars')
        .insert(updates.barIds.map(barId => ({ worker_id: id, bar_id: barId })));
      if (wbError) throw wbError;
    }
  }
}
