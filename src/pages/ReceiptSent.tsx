import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ReceiptSent() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate('/home', { replace: true }), 2000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-6">
      <p className="text-headline text-text-primary">
        Your recipt has been sent!
      </p>
    </div>
  )
}
