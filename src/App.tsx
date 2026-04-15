import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Login from '@/pages/Login'
import SignUp from '@/pages/SignUp'
import HomeScreen from '@/pages/HomeScreen'
import FriendsScreen from '@/pages/FriendsScreen'
import FriendDetailScreen from '@/pages/FriendDetailScreen'
import ArchiveScreen from '@/pages/ArchiveScreen'
import BlockBasedComposeScreen from '@/pages/BlockBasedComposeScreen'
import PrintingScreen from '@/pages/PrintingScreen'
import TestPrintScreen from '@/pages/TestPrintScreen'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute><FriendsScreen /></ProtectedRoute>} />
          <Route path="/friends/:id" element={<ProtectedRoute><FriendDetailScreen /></ProtectedRoute>} />
          <Route path="/archive" element={<ProtectedRoute><ArchiveScreen /></ProtectedRoute>} />
          <Route path="/compose" element={<ProtectedRoute><BlockBasedComposeScreen /></ProtectedRoute>} />
          <Route path="/printing" element={<ProtectedRoute><PrintingScreen /></ProtectedRoute>} />
          <Route path="/test-print" element={<TestPrintScreen />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
