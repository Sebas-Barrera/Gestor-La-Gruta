import type { Bar, Worker } from '@/types';

export type UserRole = 'admin' | 'worker';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  barId?: string;
  phone?: string;
}

export interface AuthContextType {
  currentUser: AuthUser | null;
  currentBar: Bar | null;
  isAuthenticated: boolean;
  login: (accessCode: string, mode?: 'admin' | 'worker') => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  verifyPin: (pin: string) => { valid: boolean; worker?: Worker };
  updateProfile: (data: { name: string; phone?: string }) => void;
}
