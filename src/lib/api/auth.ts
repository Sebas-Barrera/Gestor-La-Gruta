import { supabase } from '@/lib/supabase';
import type { AdminAccount, Worker, Bar } from '@/types';

// ── Mappers ───────────────────────────────────────────────────

function mapAdmin(row: Record<string, unknown>): AdminAccount {
  return {
    id: row.id as string,
    name: row.name as string,
    accessCode: row.access_code as string,
    phone: (row.phone as string) ?? undefined,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
  };
}

export function mapBar(row: Record<string, unknown>): Bar {
  return {
    id: row.id as string,
    name: row.name as string,
    location: (row.location as string) ?? '',
    isActive: row.is_active as boolean,
    manager: (row.manager as string) ?? undefined,
    phone: (row.phone as string) ?? undefined,
    image: (row.image as string) ?? undefined,
  };
}

export function mapWorker(row: Record<string, unknown>): Worker {
  const workerBars = row.worker_bars as { bar_id: string }[] | undefined;
  return {
    id: row.id as string,
    name: row.name as string,
    pin: row.pin as string,
    barIds: workerBars?.map(wb => wb.bar_id) ?? [],
    phone: (row.phone as string) ?? '',
    isActive: row.is_active as boolean,
    avatar: (row.avatar as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

// ── Loaders (used by AuthContext to cache data on mount) ──────

export async function loadAdminAccounts(): Promise<AdminAccount[]> {
  const { data, error } = await supabase
    .from('admin_accounts')
    .select('*')
    .eq('is_active', true);
  if (error) throw error;
  return (data ?? []).map(r => mapAdmin(r as Record<string, unknown>));
}

export async function loadWorkers(): Promise<Worker[]> {
  const { data, error } = await supabase
    .from('workers')
    .select('*, worker_bars(bar_id)')
    .eq('is_active', true);
  if (error) throw error;
  return (data ?? []).map(r => mapWorker(r as Record<string, unknown>));
}

export async function loadBars(): Promise<Bar[]> {
  const { data, error } = await supabase
    .from('bars')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return (data ?? []).map(r => mapBar(r as Record<string, unknown>));
}

// ── Auth operations ───────────────────────────────────────────

/**
 * Returns the admin matching the given PIN, or null.
 * Uses the live DB (for one-off verification, not cached).
 */
export async function verifyAdminPinRemote(pin: string): Promise<AdminAccount | null> {
  const { data, error } = await supabase
    .from('admin_accounts')
    .select('*')
    .eq('access_code', pin)
    .eq('is_active', true)
    .single();
  if (error || !data) return null;
  return mapAdmin(data as Record<string, unknown>);
}

// ── Admin CRUD ────────────────────────────────────────────────

export async function createAdmin(
  input: Omit<AdminAccount, 'id' | 'createdAt'>,
): Promise<AdminAccount> {
  const { data, error } = await supabase
    .from('admin_accounts')
    .insert({
      name: input.name,
      access_code: input.accessCode,
      phone: input.phone ?? null,
      is_active: input.isActive ?? true,
    })
    .select()
    .single();
  if (error) throw error;
  return mapAdmin(data as Record<string, unknown>);
}

export async function updateAdmin(
  id: string,
  updates: Partial<Omit<AdminAccount, 'id' | 'createdAt'>>,
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.accessCode !== undefined) patch.access_code = updates.accessCode;
  if (updates.phone !== undefined) patch.phone = updates.phone;
  if (updates.isActive !== undefined) patch.is_active = updates.isActive;

  const { error } = await supabase
    .from('admin_accounts')
    .update(patch)
    .eq('id', id);
  if (error) throw error;
}

/** Soft delete — sets is_active = false. */
export async function deleteAdmin(id: string): Promise<void> {
  const { error } = await supabase
    .from('admin_accounts')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}
