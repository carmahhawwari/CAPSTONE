import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Splash from '@/components/Splash'
import FindInklings from '@/pages/FindInklings'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import SignUp from '@/pages/SignUp'
import HomeScreen from '@/pages/HomeScreen'
import Profile from '@/pages/Profile'
import FriendsScreen from '@/pages/FriendsScreen'
import FriendDetailScreen from '@/pages/FriendDetailScreen'
import ArchiveScreen from '@/pages/ArchiveScreen'
import CreateReceipt from '@/pages/CreateReceipt'
import ReceiptSent from '@/pages/ReceiptSent'
import ReceiptsToPrint from '@/pages/ReceiptsToPrint'
import PrintingScreen from '@/pages/PrintingScreen'
import TestPrintScreen from '@/pages/TestPrintScreen'

const SPLASH_SEEN_KEY = 'inklings.splashSeen'

function App() {
  const [showSplash, setShowSplash] = useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem(SPLASH_SEEN_KEY) !== '1',
  )

  const handleSplashComplete = () => {
    sessionStorage.setItem(SPLASH_SEEN_KEY, '1')
    setShowSplash(false)
  }

  return (
    <BrowserRouter>
      {showSplash && <Splash onComplete={handleSplashComplete} />}
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/find-friends" element={<FindInklings />} />
          <Route path="/home" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute><FriendsScreen /></ProtectedRoute>} />
          <Route path="/friends/:id" element={<ProtectedRoute><FriendDetailScreen /></ProtectedRoute>} />
          <Route path="/archive" element={<ProtectedRoute><ArchiveScreen /></ProtectedRoute>} />
          <Route path="/compose" element={<ProtectedRoute><CreateReceipt /></ProtectedRoute>} />
          <Route path="/receipt-sent" element={<ProtectedRoute><ReceiptSent /></ProtectedRoute>} />
          <Route path="/prints" element={<ProtectedRoute><ReceiptsToPrint /></ProtectedRoute>} />
          <Route path="/printing" element={<ProtectedRoute><PrintingScreen /></ProtectedRoute>} />
          <Route path="/test-print" element={<TestPrintScreen />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
