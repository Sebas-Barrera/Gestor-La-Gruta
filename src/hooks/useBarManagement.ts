import { useState, useCallback } from 'react';
import type { Bar, Worker, BarCredential, InventoryMovement } from '@/types';
import { bars as mockBars, workers as mockWorkers, barCredentials as mockCredentials, inventoryMovements as mockMovements } from '@/data/mockData';

export function useBarManagement() {
  const [bars, setBars] = useState<Bar[]>(mockBars);
  const [workers, setWorkers] = useState<Worker[]>(mockWorkers);
  const [credentials, setCredentials] = useState<BarCredential[]>(mockCredentials);
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
      createdAt: new Date().toISOString().split('T')[0],
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

  // --- Credentials CRUD ---
  const addCredential = useCallback((data: Omit<BarCredential, 'id'>) => {
    const newCred: BarCredential = { ...data, id: `bc-${Date.now()}` };
    setCredentials(prev => [...prev, newCred]);
    return newCred;
  }, []);

  const updateCredential = useCallback((id: string, data: Partial<BarCredential>) => {
    setCredentials(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);

  const deleteCredential = useCallback((id: string) => {
    setCredentials(prev => prev.filter(c => c.id !== id));
  }, []);

  // --- Queries ---
  const getWorkersForBar = useCallback((barId: string) => {
    return workers.filter(w => w.barIds.includes(barId));
  }, [workers]);

  const getCredentialsForBar = useCallback((barId: string) => {
    return credentials.filter(c => c.barId === barId);
  }, [credentials]);

  const getMovementsForBar = useCallback((barId: string) => {
    return movements.filter(m => m.barId === barId);
  }, [movements]);

  return {
    bars,
    workers,
    credentials,
    movements,
    addBar,
    updateBar,
    deleteBar,
    addWorker,
    updateWorker,
    deleteWorker,
    removeWorkerFromBar,
    addCredential,
    updateCredential,
    deleteCredential,
    getWorkersForBar,
    getCredentialsForBar,
    getMovementsForBar,
  };
}
