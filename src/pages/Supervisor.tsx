import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { SupervisorDashboard } from '@/components/SupervisorDashboard';
import { TenantViewBanner } from '@/components/TenantViewBanner';

export default function Supervisor() {
  const { hasRole } = useAuth();

  // Verificar se o usuário tem permissão de supervisor
  if (!hasRole(['supervisor', 'admin', 'client_owner', 'manager'])) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
        <TenantViewBanner />
      <SupervisorDashboard />
    </Layout>
  );
}