import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/contexts/auth';
import { OrbitProvider } from '@/contexts/orbit';
import AppShell from '@/components/AppShell';
import Envelope from '@/pages/Envelope';
import History from '@/pages/History';
import Home from '@/pages/Home';
import Onboarding from '@/pages/Onboarding';
import People from '@/pages/People';
import Profile from '@/pages/Profile';
import Sent from '@/pages/Sent';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import Write from '@/pages/Write';

export default function App() {
  return (
    <AuthProvider>
      <OrbitProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route element={<AppShell />}>
              <Route index element={<Home />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/write" element={<Write />} />
              <Route path="/sent" element={<Sent />} />
              <Route path="/people" element={<People />} />
              <Route path="/history" element={<History />} />
              <Route path="/read/:id" element={<Envelope />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </OrbitProvider>
    </AuthProvider>
  );
}
