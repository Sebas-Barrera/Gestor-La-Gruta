import type { Bar, Worker } from '@/types';

export type UserRole = 'admin' | 'worker';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  barId?: string;
  phone?: string;
}

/**
 * Resultado del login de trabajador por PIN.
 *
 * Backend: POST /api/auth/worker-login
 * Body: { pin: string }
 * Response: WorkerLoginResult
 *
 * Si `requiresBarSelection` es true, el frontend muestra un selector de bares
 * y luego llama a selectWorkerBar() para completar la sesión.
 */
export interface WorkerLoginResult {
  success: boolean;
  error?: string;
  /** true cuando el trabajador pertenece a más de 1 bar */
  requiresBarSelection?: boolean;
  /** Datos del trabajador autenticado (para completar login con selectWorkerBar) */
  worker?: Worker;
  /** Bares disponibles para el trabajador (solo cuando requiresBarSelection=true) */
  workerBars?: Bar[];
}

export interface AuthContextType {
  currentUser: AuthUser | null;
  currentBar: Bar | null;
  isAuthenticated: boolean;
  login: (accessCode: string, mode?: 'admin' | 'worker') => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  verifyPin: (pin: string) => { valid: boolean; worker?: Worker };
  verifyAdminPin: (pin: string) => { valid: boolean; admin?: import('@/types').AdminAccount };
  updateProfile: (data: { name: string; phone?: string }) => void;
  /**
   * Login de trabajador por PIN personal.
   * Backend: POST /api/auth/worker-login  Body: { pin }
   */
  workerLogin: (pin: string) => Promise<WorkerLoginResult>;
  /**
   * Completa el login de un trabajador multi-bar seleccionando un bar.
   * Backend: POST /api/auth/worker-select-bar  Body: { workerId, barId }
   */
  selectWorkerBar: (worker: Worker, bar: Bar) => void;
}
