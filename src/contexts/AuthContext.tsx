import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import type { AuthUser, AuthContextType, WorkerLoginResult } from '@/types/auth';
import type { Bar, Worker, AdminAccount } from '@/types';
import {
  loadAdminAccounts,
  loadWorkers,
  loadBars,
} from '@/lib/api/auth';

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = 'bar_inventory_auth';

interface SessionData {
  user: AuthUser;
  barId?: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentBar, setCurrentBar] = useState<Bar | null>(null);

  // In-memory cache — loaded from Supabase on mount
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [bars, setBars] = useState<Bar[]>([]);

  // Load all auth data from Supabase on mount, then restore session
  useEffect(() => {
    async function init() {
      try {
        const [admins, workersList, barsList] = await Promise.all([
          loadAdminAccounts(),
          loadWorkers(),
          loadBars(),
        ]);
        setAdminAccounts(admins);
        setWorkers(workersList);
        setBars(barsList);

        // Restore session now that we have bar data
        const saved = sessionStorage.getItem(SESSION_KEY);
        if (!saved) return;
        const session: SessionData = JSON.parse(saved);
        setCurrentUser(session.user);
        if (session.barId) {
          const bar = barsList.find(b => b.id === session.barId);
          if (bar) setCurrentBar(bar);
        }
      } catch (err) {
        console.error('[AuthContext] Failed to load auth data:', err);
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
    init();
  }, []);

  // ── Admin login ───────────────────────────────────────────
  const login = useCallback(
    async (
      accessCode: string,
      mode?: 'admin' | 'worker',
    ): Promise<{ success: boolean; error?: string }> => {
      const matchedAdmin = adminAccounts.find(
        a => a.accessCode === accessCode && a.isActive,
      );

      if (matchedAdmin && mode === 'worker') {
        return {
          success: false,
          error: 'Este código es de administrador. Usa el login de administrador.',
        };
      }

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
    },
    [adminAccounts],
  );

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

  // ── Worker login por PIN ──────────────────────────────────
  const workerLogin = useCallback(
    async (pin: string): Promise<WorkerLoginResult> => {
      // Admin PIN on worker portal → reject
      const matchedAdmin = adminAccounts.find(
        a => a.accessCode === pin && a.isActive,
      );
      if (matchedAdmin) {
        return {
          success: false,
          error: 'Esta clave es de administrador. Usa el login de administrador.',
        };
      }

      const worker = workers.find(w => w.pin === pin && w.isActive);
      if (!worker) {
        return { success: false, error: 'Clave incorrecta' };
      }

      const workerBars = bars.filter(
        b => worker.barIds.includes(b.id) && b.isActive,
      );
      if (workerBars.length === 0) {
        return { success: false, error: 'No tienes almacenes asignados activos' };
      }

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
        sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ user, barId: bar.id }),
        );
        return { success: true };
      }

      // Multiple bars → require selection
      return { success: true, requiresBarSelection: true, worker, workerBars };
    },
    [adminAccounts, workers, bars],
  );

  // ── Completar login multi-bar ─────────────────────────────
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
  }, []);

  // ── PIN verification (sync — uses in-memory cache) ────────
  const verifyPin = useCallback(
    (pin: string): { valid: boolean; worker?: Worker } => {
      const barId = currentBar?.id;
      if (!barId) return { valid: false };
      const worker = workers.find(
        w => w.pin === pin && w.isActive && w.barIds.includes(barId),
      );
      return worker ? { valid: true, worker } : { valid: false };
    },
    [currentBar, workers],
  );

  const verifyAdminPin = useCallback(
    (pin: string): { valid: boolean; admin?: AdminAccount } => {
      const admin = adminAccounts.find(
        a => a.accessCode === pin && a.isActive,
      );
      return admin ? { valid: true, admin } : { valid: false };
    },
    [adminAccounts],
  );

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
