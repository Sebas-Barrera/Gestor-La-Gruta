import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser, AuthContextType, WorkerLoginResult } from '@/types/auth';
import type { Bar, Worker } from '@/types';
import { bars, workers, adminAccounts } from '@/data/mockData';

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = 'bar_inventory_auth';

interface SessionData {
  user: AuthUser;
  barId?: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentBar, setCurrentBar] = useState<Bar | null>(null);

  // Restore session on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (!saved) return;

    try {
      const session: SessionData = JSON.parse(saved);
      setCurrentUser(session.user);
      if (session.barId) {
        const bar = bars.find(b => b.id === session.barId);
        if (bar) setCurrentBar(bar);
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, []);

  const login = useCallback(async (accessCode: string, mode?: 'admin' | 'worker') => {
    const matchedAdmin = adminAccounts.find(
      a => a.accessCode === accessCode && a.isActive
    );

    // Admin code on worker portal
    if (matchedAdmin && mode === 'worker') {
      return { success: false, error: 'Este código es de administrador. Usa el login de administrador.' };
    }

    // Admin login
    if (matchedAdmin) {
      const user: AuthUser = {
        id: matchedAdmin.id,
        name: matchedAdmin.name,
        role: 'admin',
        phone: matchedAdmin.phone,
      };
      setCurrentUser(user);
      setCurrentBar(null);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user }));
      return { success: true };
    }

    return { success: false, error: 'Código incorrecto' };
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setCurrentBar(null);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  const updateProfile = useCallback((data: { name: string; phone?: string }) => {
    setCurrentUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user: updated }));
      return updated;
    });
  }, []);

  // ── Worker login por PIN personal ──
  // Backend: POST /api/auth/worker-login  Body: { pin: string }
  // Response: WorkerLoginResult
  const workerLogin = useCallback(async (pin: string): Promise<WorkerLoginResult> => {
    // Verificar si el PIN coincide con un código de admin
    const matchedAdmin = adminAccounts.find(a => a.accessCode === pin && a.isActive);
    if (matchedAdmin) {
      return { success: false, error: 'Esta clave es de administrador. Usa el login de administrador.' };
    }

    // Buscar trabajador activo por PIN
    const worker = workers.find(w => w.pin === pin && w.isActive);
    if (!worker) {
      console.log('[Auth:WorkerLogin] POST /api/auth/worker-login', { pin, result: 'not_found' });
      return { success: false, error: 'Clave incorrecta' };
    }

    // Obtener los bares activos del trabajador
    const workerBars = bars.filter(b => worker.barIds.includes(b.id) && b.isActive);
    if (workerBars.length === 0) {
      console.log('[Auth:WorkerLogin] POST /api/auth/worker-login', { pin, workerId: worker.id, result: 'no_active_bars' });
      return { success: false, error: 'No tienes bares asignados activos' };
    }

    // Si el trabajador pertenece a un solo bar → login directo
    if (workerBars.length === 1) {
      const bar = workerBars[0];
      const user: AuthUser = {
        id: worker.id,
        name: worker.name,
        role: 'worker',
        barId: bar.id,
        phone: worker.phone,
      };
      setCurrentUser(user);
      setCurrentBar(bar);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user, barId: bar.id }));
      console.log('[Auth:WorkerLogin] POST /api/auth/worker-login', { pin, workerId: worker.id, barId: bar.id, result: 'auto_login' });
      return { success: true };
    }

    // Múltiples bares → requiere selección
    console.log('[Auth:WorkerLogin] POST /api/auth/worker-login', { pin, workerId: worker.id, barIds: worker.barIds, result: 'requires_bar_selection' });
    return { success: true, requiresBarSelection: true, worker, workerBars };
  }, []);

  // ── Completar login de trabajador multi-bar ──
  // Backend: POST /api/auth/worker-select-bar  Body: { workerId: string, barId: string }
  const selectWorkerBar = useCallback((worker: Worker, bar: Bar) => {
    const user: AuthUser = {
      id: worker.id,
      name: worker.name,
      role: 'worker',
      barId: bar.id,
      phone: worker.phone,
    };
    setCurrentUser(user);
    setCurrentBar(bar);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user, barId: bar.id }));
    console.log('[Auth:WorkerSelectBar] POST /api/auth/worker-select-bar', { workerId: worker.id, barId: bar.id });
  }, []);

  const verifyPin = useCallback((pin: string): { valid: boolean; worker?: Worker } => {
    const barId = currentBar?.id;
    if (!barId) return { valid: false };

    const worker = workers.find(
      w => w.pin === pin && w.isActive && w.barIds.includes(barId)
    );

    if (worker) return { valid: true, worker };
    return { valid: false };
  }, [currentBar]);

  const verifyAdminPin = useCallback((pin: string): { valid: boolean; admin?: import('@/types').AdminAccount } => {
    const admin = adminAccounts.find(
      a => a.accessCode === pin && a.isActive
    );

    if (admin) return { valid: true, admin };
    return { valid: false };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentBar,
        isAuthenticated: !!currentUser,
        login,
        logout,
        verifyPin,
        verifyAdminPin,
        updateProfile,
        workerLogin,
        selectWorkerBar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
