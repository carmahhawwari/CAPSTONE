import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface ProfileData {
  display_name: string | null
  username: string | null
  email: string | null
}

export default function Profile() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    const loadProfile = async () => {
      if (supabase) {
        const { data } = await supabase
          .from('profiles')
          .select('display_name, username')
          .eq('id', user.id)
          .single()

        setProfile({
          display_name: data?.display_name ?? null,
          username: data?.username ?? null,
          email: user.email ?? null,
        })
      } else {
        // Mock mode
        setProfile({
          display_name: user.email?.split('@')[0] ?? null,
          username: null,
          email: user.email ?? null,
        })
      }
      setLoading(false)
    }

    loadProfile()
  }, [user?.id])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-bg-base items-center justify-center">
        <p className="text-text-tertiary">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-base px-6 pt-12 pb-8">
      <header className="flex items-end justify-between">
        <h1 className="text-regular-semibold text-text-primary">Profile</h1>
        <div className="flex flex-col gap-3">
          <IconButton label="Home" onClick={() => navigate('/home')}>
            <HomeIcon />
          </IconButton>
          <IconButton label="New" onClick={() => navigate('/compose')}>
            <PlusIcon />
          </IconButton>
        </div>
      </header>

      {profile && (
        <div className="mt-12 flex flex-col gap-3">
          <div className="text-body text-text-primary border-fill-tertiary bg-bg-base rounded-md w-full border px-4 py-3">
            {profile.display_name || 'No name set'}
          </div>
          {profile.username && (
            <div className="text-body text-text-primary border-fill-tertiary bg-bg-base rounded-md w-full border px-4 py-3">
              @{profile.username}
            </div>
          )}
          <div className="text-body text-text-primary border-fill-tertiary bg-bg-base rounded-md w-full border px-4 py-3">
            {profile.email}
          </div>
        </div>
      )}

      <button
        onClick={handleSignOut}
        className="text-headline text-text-inverse bg-fill-primary rounded-md mt-8 w-full py-4"
      >
        Sign Out
      </button>
    </div>
  )
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="border-fill-primary flex h-11 w-11 items-center justify-center rounded-full border-2"
    >
      {children}
    </button>
  )
}

function HomeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H15V14H9V21H4C3.45 21 3 20.55 3 20V10.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 5V19M5 12H19"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}
