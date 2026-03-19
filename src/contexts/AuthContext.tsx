import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser, AuthContextType } from '@/types/auth';
import type { Bar, Worker } from '@/types';
import { bars, barCredentials, workers, adminAccounts } from '@/data/mockData';

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
    const credential = barCredentials.find(
      bc => bc.accessCode === accessCode && bc.isActive
    );

    // Admin code on worker portal
    if (matchedAdmin && mode === 'worker') {
      return { success: false, error: 'Este código es de administrador. Usa el login de administrador.' };
    }

    // Bar code on admin portal
    if (credential && mode === 'admin') {
      return { success: false, error: 'Este código es de almacén. Usa el login de almacén.' };
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

    // Bar/worker login
    if (credential) {
      const bar = bars.find(b => b.id === credential.barId);
      if (!bar) return { success: false, error: 'Bar no encontrado' };

      const user: AuthUser = {
        id: credential.id,
        name: bar.name,
        role: 'worker',
        barId: credential.barId,
      };
      setCurrentUser(user);
      setCurrentBar(bar);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user, barId: bar.id }));
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

  const verifyPin = useCallback((pin: string): { valid: boolean; worker?: Worker } => {
    const barId = currentBar?.id;
    if (!barId) return { valid: false };

    const worker = workers.find(
      w => w.pin === pin && w.isActive && w.barIds.includes(barId)
    );

    if (worker) return { valid: true, worker };
    return { valid: false };
  }, [currentBar]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentBar,
        isAuthenticated: !!currentUser,
        login,
        logout,
        verifyPin,
        updateProfile,
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
