import { useState, useCallback } from 'react';
import type { Bar, Worker, InventoryMovement } from '@/types';
import { getLocalIsoDateString } from '@/lib/dates';
import { bars as mockBars, workers as mockWorkers, inventoryMovements as mockMovements } from '@/data/mockData';

export function useBarManagement() {
  const [bars, setBars] = useState<Bar[]>(mockBars);
  const [workers, setWorkers] = useState<Worker[]>(mockWorkers);
  const [movements] = useState<InventoryMovement[]>(mockMovements);

  // --- Bars CRUD ---
  const addBar = useCallback((data: Omit<Bar, 'id'>) => {
    const newBar: Bar = { ...data, id: `bar-${Date.now()}` };
    setBars(prev => [...prev, newBar]);
    return newBar;
  }, []);

  const updateBar = useCallback((id: string, data: Partial<Bar>) => {
    setBars(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
  }, []);

  const deleteBar = useCallback((id: string) => {
    setBars(prev => prev.filter(b => b.id !== id));
  }, []);

  // --- Workers CRUD ---
  const addWorker = useCallback((data: Omit<Worker, 'id' | 'createdAt'>) => {
    const newWorker: Worker = {
      ...data,
      id: `w-${Date.now()}`,
      createdAt: getLocalIsoDateString(),
    };
    setWorkers(prev => [...prev, newWorker]);
    return newWorker;
  }, []);

  const updateWorker = useCallback((id: string, data: Partial<Worker>) => {
    setWorkers(prev => prev.map(w => w.id === id ? { ...w, ...data } : w));
  }, []);

  const deleteWorker = useCallback((id: string) => {
    setWorkers(prev => prev.filter(w => w.id !== id));
  }, []);

  const removeWorkerFromBar = useCallback((workerId: string, barId: string) => {
    setWorkers(prev => prev.map(w =>
      w.id === workerId
        ? { ...w, barIds: w.barIds.filter(bid => bid !== barId) }
        : w
    ));
  }, []);



  // --- Queries ---
  const getWorkersForBar = useCallback((barId: string) => {
    return workers.filter(w => w.barIds.includes(barId));
  }, [workers]);

  const getMovementsForBar = useCallback((barId: string) => {
    return movements.filter(m => m.barId === barId);
  }, [movements]);

  return {
    bars,
    workers,
    movements,
    addBar,
    updateBar,
    deleteBar,
    addWorker,
    updateWorker,
    deleteWorker,
    removeWorkerFromBar,
    getWorkersForBar,
    getMovementsForBar,
  };
}
