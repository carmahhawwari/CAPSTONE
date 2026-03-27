import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import BottomNav from './BottomNav';

export default function AppShell() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-dvh bg-background">
      <Outlet />
      <BottomNav />
    </div>
  );
}
