import { useState, useCallback } from 'react';
import type { AdminAccount } from '@/types';
import { adminAccounts as mockAdmins } from '@/data/mockData';
import { getLocalIsoDateString } from '@/lib/dates';

export function useAdminManagement() {
  const [admins, setAdmins] = useState<AdminAccount[]>(mockAdmins);

  const addAdmin = useCallback((data: Omit<AdminAccount, 'id' | 'createdAt'>) => {
    const newAdmin: AdminAccount = {
      ...data,
      id: `admin-${Date.now()}`,
      createdAt: getLocalIsoDateString(),
    };
    setAdmins(prev => [...prev, newAdmin]);
    return newAdmin;
  }, []);

  const updateAdmin = useCallback((id: string, data: Partial<AdminAccount>) => {
    setAdmins(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  }, []);

  const deleteAdmin = useCallback((id: string) => {
    setAdmins(prev => prev.filter(a => a.id !== id));
  }, []);

  return {
    admins,
    addAdmin,
    updateAdmin,
    deleteAdmin,
  };
}
