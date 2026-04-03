import { useState, useCallback, useEffect } from 'react';
import type { AdminAccount } from '@/types';
import {
  loadAdminAccounts,
  createAdmin,
  updateAdmin as updateAdminApi,
  deleteAdmin as deleteAdminApi,
} from '@/lib/api/auth';

export function useAdminManagement() {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminAccounts()
      .then(setAdmins)
      .catch(err => console.error('[useAdminManagement] Failed to load:', err))
      .finally(() => setLoading(false));
  }, []);

  const addAdmin = useCallback(
    async (data: Omit<AdminAccount, 'id' | 'createdAt'>): Promise<AdminAccount> => {
      const newAdmin = await createAdmin(data);
      setAdmins(prev => [...prev, newAdmin]);
      return newAdmin;
    },
    [],
  );

  const updateAdmin = useCallback(
    async (id: string, data: Partial<Omit<AdminAccount, 'id' | 'createdAt'>>): Promise<void> => {
      await updateAdminApi(id, data);
      setAdmins(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
    },
    [],
  );

  /** Soft delete — sets is_active = false. */
  const deleteAdmin = useCallback(async (id: string): Promise<void> => {
    await deleteAdminApi(id);
    setAdmins(prev => prev.filter(a => a.id !== id));
  }, []);

  return {
    admins,
    loading,
    addAdmin,
    updateAdmin,
    deleteAdmin,
  };
}
