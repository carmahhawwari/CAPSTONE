import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/contexts/auth';
import { OrbitProvider } from '@/contexts/orbit';
import { SocialProvider } from '@/contexts/social';
import AppShell from '@/components/AppShell';
import ArchiveFolder from '@/pages/ArchiveFolder';
import Archives from '@/pages/Archives';
import Envelope from '@/pages/Envelope';
import FriendProfile from '@/pages/FriendProfile';
import Home from '@/pages/Home';
import History from '@/pages/History';
import People from '@/pages/People';
import Profile from '@/pages/Profile';
import Sent from '@/pages/Sent';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import Write from '@/pages/Write';

export default function App() {
  return (
    <AuthProvider>
      <SocialProvider>
        <OrbitProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/sign-up" element={<SignUp />} />
              <Route element={<AppShell />}>
                <Route index element={<Home />} />
                <Route path="/compose" element={<Write />} />
                <Route path="/sent" element={<Sent />} />
                <Route path="/friends" element={<People />} />
                <Route path="/friends/:id" element={<FriendProfile />} />
                <Route path="/notifications" element={<History />} />
                <Route path="/archives" element={<Archives />} />
                <Route path="/archives/:id" element={<ArchiveFolder />} />
                <Route path="/letters/:id" element={<Envelope />} />
                <Route path="/settings" element={<Profile />} />
                <Route path="/people" element={<Navigate to="/friends" replace />} />
                <Route path="/write" element={<Navigate to="/compose" replace />} />
                <Route path="/prompts" element={<Navigate to="/compose" replace />} />
                <Route path="/history" element={<Navigate to="/notifications" replace />} />
                <Route path="/read/:id" element={<Navigate to="/letters/:id" replace />} />
                <Route path="/profile" element={<Navigate to="/settings" replace />} />
                <Route path="/daily-spin" element={<Navigate to="/" replace />} />
                <Route path="/onboarding" element={<Navigate to="/friends" replace />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </OrbitProvider>
      </SocialProvider>
    </AuthProvider>
  );
}
