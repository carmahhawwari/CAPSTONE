import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/auth';
import AppShell from '@/components/AppShell';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import Home from '@/pages/Home';
import Write from '@/pages/Write';
import People from '@/pages/People';
import Person from '@/pages/Person';
import History from '@/pages/History';
import Envelope from '@/pages/Envelope';
import Profile from '@/pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route element={<AppShell />}>
            <Route index element={<Home />} />
            <Route path="write" element={<Write />} />
            <Route path="people" element={<People />} />
            <Route path="person/:id" element={<Person />} />
            <Route path="history" element={<History />} />
            <Route path="read/:id" element={<Envelope />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
