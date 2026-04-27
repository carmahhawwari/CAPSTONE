import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function OnboardIntro() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      navigate('/home', { replace: true })
    }
  }, [user, loading, navigate])

  return (
    <div className="flex min-h-screen flex-col bg-white px-6">
      <div className="flex flex-1 flex-col justify-center">
        <h1 className="text-4xl font-bold text-black">Inklings</h1>
        <p className="text-lg text-gray-700 mt-2">
          Send a little paper note to someone. We'll walk you through it.
        </p>

        <Link
          to="/onboard/recipient"
          className="bg-black text-white font-semibold rounded-md mt-8 w-full py-4 text-center block"
        >
          Start your first receipt
        </Link>

        <Link
          to="/login"
          className="text-gray-700 mt-4 w-full text-center block"
        >
          I already have an account
        </Link>
      </div>
    </div>
  )
}
