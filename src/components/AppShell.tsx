import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useOrbit } from '@/contexts/orbit';
import BottomNav from './BottomNav';

export default function AppShell() {
  const { isAuthenticated } = useAuth();
  const { isOnboarded } = useOrbit();
  const location = useLocation();
  const navHidden = location.pathname === '/onboarding' || location.pathname.startsWith('/read/');

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  if (!isOnboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (isOnboarded && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="orbit-shell min-h-dvh">
      <div className="orbit-glow orbit-glow-left" />
      <div className="orbit-glow orbit-glow-right" />
      <div className="relative mx-auto min-h-dvh max-w-[430px] px-4 pb-28">
        <Outlet />
        {!navHidden && <BottomNav />}
      </div>
    </div>
  );
}
