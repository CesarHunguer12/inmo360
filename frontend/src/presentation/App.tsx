import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { UserRole } from '../domain/entities/user';
import { DashboardLayout } from './layouts/DashboardLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { useAuth } from './hooks/AuthProvider';
import { ClientDashboardPage } from './pages/ClientDashboardPage';
import { ClientVisitsPage, FavoritesPage, PreferencesPage, ProfilePage, RecommendationsPage } from './pages/ClientPages';
import { DashboardHomePage } from './pages/DashboardHomePage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { PropertyCatalogPage } from './pages/PropertyCatalogPage';
import { PropertyDetailPage } from './pages/PropertyDetailPage';
import { PropertiesManagementPage } from './pages/PropertiesManagementPage';
import { RecordsPage } from './pages/RecordsPage';
import { RegisterPage } from './pages/RegisterPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersManagementPage } from './pages/UsersManagementPage';

function ProtectedArea({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="text-sm text-slate-500">Verificando sesión segura…</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RolePage({ allow, children }: { allow: UserRole[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!user || !allow.includes(user.role)) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function DashboardIndex() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === 'CLIENTE' ? <ClientDashboardPage user={user} /> : <DashboardHomePage user={user} />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="properties" element={<PropertyCatalogPage />} />
        <Route path="properties/:id" element={<PropertyDetailPage />} />
      </Route>
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="admin" element={<ProtectedArea><RolePage allow={['ADMINISTRADOR']}><Navigate to="/app" replace /></RolePage></ProtectedArea>} />
      <Route path="agent" element={<ProtectedArea><RolePage allow={['AGENTE']}><Navigate to="/app" replace /></RolePage></ProtectedArea>} />
      <Route path="client" element={<ProtectedArea><RolePage allow={['CLIENTE']}><Navigate to="/app" replace /></RolePage></ProtectedArea>} />
      <Route path="app" element={<ProtectedArea><DashboardLayout /></ProtectedArea>}>
        <Route index element={<DashboardIndex />} />
        <Route path="properties" element={<RolePage allow={['ADMINISTRADOR', 'AGENTE']}><PropertiesManagementPage /></RolePage>} />
        <Route path="users" element={<RolePage allow={['ADMINISTRADOR']}><UsersManagementPage /></RolePage>} />
        <Route path="agents" element={<RolePage allow={['ADMINISTRADOR']}><RecordsPage module="agents" /></RolePage>} />
        <Route path="clients" element={<RolePage allow={['ADMINISTRADOR', 'AGENTE']}><RecordsPage module="clients" /></RolePage>} />
        <Route path="owners" element={<RolePage allow={['ADMINISTRADOR', 'AGENTE']}><RecordsPage module="owners" /></RolePage>} />
        <Route path="inquiries" element={<RolePage allow={['ADMINISTRADOR', 'AGENTE']}><RecordsPage module="inquiries" /></RolePage>} />
        <Route path="visits" element={user?.role === 'CLIENTE' ? <ClientVisitsPage /> : <RolePage allow={['ADMINISTRADOR', 'AGENTE']}><RecordsPage module="visits" /></RolePage>} />
        <Route path="opportunities" element={<RolePage allow={['ADMINISTRADOR', 'AGENTE']}><RecordsPage module="opportunities" /></RolePage>} />
        <Route path="operations" element={<RolePage allow={['ADMINISTRADOR', 'AGENTE']}><RecordsPage module="operations" /></RolePage>} />
        <Route path="commissions" element={<RolePage allow={['ADMINISTRADOR', 'AGENTE']}><RecordsPage module="commissions" /></RolePage>} />
        <Route path="reports" element={<RolePage allow={['ADMINISTRADOR', 'AGENTE']}><ReportsPage /></RolePage>} />
        <Route path="catalog" element={<RolePage allow={['CLIENTE']}><PropertyCatalogPage /></RolePage>} />
        <Route path="profile" element={<RolePage allow={['CLIENTE']}><ProfilePage /></RolePage>} />
        <Route path="recommendations" element={<RolePage allow={['CLIENTE']}><RecommendationsPage /></RolePage>} />
        <Route path="favorites" element={<RolePage allow={['CLIENTE']}><FavoritesPage /></RolePage>} />
        <Route path="preferences" element={<RolePage allow={['CLIENTE']}><PreferencesPage /></RolePage>} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/app' : '/'} replace />} />
    </Routes>
  );
}

export function App() {
  return <AppRoutes />;
}
