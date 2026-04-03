import { useState, useCallback, useEffect } from 'react';
import type { Bar, Worker } from '@/types';
import * as barsApi from '@/lib/api/bars';
import * as workersApi from '@/lib/api/workers';
import { loadBars, loadWorkers } from '@/lib/api/auth';

export function useBarManagement() {
  const [bars, setBars] = useState<Bar[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from Supabase on mount
  useEffect(() => {
    async function load() {
      try {
        const [barsList, workersList] = await Promise.all([
          loadBars(),
          loadWorkers(),
        ]);
        setBars(barsList);
        setWorkers(workersList);
      } catch (err) {
        console.error('[useBarManagement] Failed to load:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // --- Bars CRUD ---

  const addBar = useCallback(async (data: Omit<Bar, 'id' | 'isActive'>): Promise<Bar> => {
    const newBar = await barsApi.addBar(data);
    setBars(prev => [...prev, newBar]);
    return newBar;
  }, []);

  const updateBar = useCallback(async (id: string, data: Partial<Bar>): Promise<void> => {
    await barsApi.updateBar(id, data);
    setBars(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
  }, []);

  /** Soft delete — removes from local state, sets is_active=false in DB. */
  const deleteBar = useCallback(async (id: string): Promise<void> => {
    await barsApi.updateBar(id, { isActive: false });
    setBars(prev => prev.filter(b => b.id !== id));
  }, []);

  // --- Workers CRUD ---

  const addWorker = useCallback(
    async (data: Omit<Worker, 'id' | 'createdAt'>): Promise<Worker> => {
      const newWorker = await workersApi.addWorker({
        name: data.name,
        pin: data.pin,
        phone: data.phone,
        barIds: data.barIds,
        avatar: data.avatar,
      });
      setWorkers(prev => [...prev, newWorker]);
      return newWorker;
    },
    [],
  );

  const updateWorker = useCallback(
    async (id: string, data: Partial<Worker>): Promise<void> => {
      await workersApi.updateWorker(id, data);
      setWorkers(prev => prev.map(w => w.id === id ? { ...w, ...data } : w));
    },
    [],
  );

  /** Soft delete — removes from local state, sets is_active=false in DB. */
  const deleteWorker = useCallback(async (id: string): Promise<void> => {
    await workersApi.updateWorker(id, { isActive: false });
    setWorkers(prev => prev.filter(w => w.id !== id));
  }, []);

  const removeWorkerFromBar = useCallback(
    async (workerId: string, barId: string): Promise<void> => {
      const worker = workers.find(w => w.id === workerId);
      if (!worker) return;
      const newBarIds = worker.barIds.filter(bid => bid !== barId);
      await workersApi.updateWorker(workerId, { barIds: newBarIds });
      setWorkers(prev =>
        prev.map(w =>
          w.id === workerId ? { ...w, barIds: newBarIds } : w,
        ),
      );
    },
    [workers],
  );

  // --- Queries ---

  const getWorkersForBar = useCallback(
    (barId: string) => workers.filter(w => w.barIds.includes(barId)),
    [workers],
  );

  return {
    bars,
    workers,
    loading,
    addBar,
    updateBar,
    deleteBar,
    addWorker,
    updateWorker,
    deleteWorker,
    removeWorkerFromBar,
    getWorkersForBar,
  };
}
