import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLoginPage } from '@/pages/AdminLoginPage';
import { AlmacenLoginPage } from '@/pages/AlmacenLoginPage';
import { AdminLayout } from '@/layouts/AdminLayout';
import { AlmacenLayout } from '@/layouts/AlmacenLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardSection } from '@/sections/DashboardSection';
import { InventorySection } from '@/sections/InventorySection';
import { BarsSection } from '@/sections/BarsSection';
import { AlertsSection } from '@/sections/AlertsSection';
import { SettingsSection } from '@/sections/SettingsSection';
import { WorkerInventorySection } from '@/sections/WorkerInventorySection';
import { ReportsSection } from '@/sections/ReportsSection';
import { HistorySection } from '@/sections/HistorySection';

export function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/almacen/login" element={<AlmacenLoginPage />} />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardSection />} />
        <Route path="inventory" element={<InventorySection />} />
        <Route path="bars" element={<BarsSection />} />
        <Route path="reports" element={<ReportsSection />} />
        <Route path="history" element={<HistorySection />} />
        <Route path="alerts" element={<AlertsSection />} />
        <Route path="settings" element={<SettingsSection />} />
      </Route>

      {/* Almacen/Worker routes */}
      <Route
        path="/almacen"
        element={
          <ProtectedRoute requiredRole="worker">
            <AlmacenLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="inventory" replace />} />
        <Route path="inventory" element={<WorkerInventorySection />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}
