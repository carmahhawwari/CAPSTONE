import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function OnboardIntro() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) navigate('/home', { replace: true })
  }, [user, loading, navigate])

  return (
    <div className="flex min-h-screen flex-col bg-bg-base px-6">
      <div className="flex flex-1 flex-col justify-center">
        <h1 className="text-regular-semibold text-text-primary">Inklings</h1>
        <p className="text-body text-text-primary mt-2">
          Send a little paper note to someone. We'll walk you through it.
        </p>

        <Link
          to="/onboard/recipient"
          className="text-headline text-text-inverse bg-fill-primary rounded-md mt-8 w-full py-4 text-center"
        >
          Start your first receipt
        </Link>

        <Link
          to="/login"
          className="text-callout text-text-primary mt-4 w-full text-center"
        >
          I already have an account
        </Link>
      </div>
    </div>
  )
}
