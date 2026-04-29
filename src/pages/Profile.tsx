import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface ProfileData {
  display_name: string | null
  username: string | null
  email: string | null
  class_year: string | null
}

export default function Profile() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ display_name: '', class_year: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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

        const newProfile = {
          display_name: data?.display_name ?? null,
          username: data?.username ?? null,
          email: user.email ?? null,
          class_year: null,
        }
        setProfile(newProfile)
        setFormData({
          display_name: newProfile.display_name || '',
          class_year: '',
        })
      } else {
        const newProfile = {
          display_name: user.email?.split('@')[0] ?? null,
          username: null,
          email: user.email ?? null,
          class_year: null,
        }
        setProfile(newProfile)
        setFormData({
          display_name: newProfile.display_name || '',
          class_year: '',
        })
      }
      setLoading(false)
    }

    loadProfile()
  }, [user?.id])

  const handleSave = async () => {
    if (!user?.id || !supabase) return

    setSaving(true)
    setError('')

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name || null,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setProfile((p) =>
        p
          ? {
              ...p,
              display_name: formData.display_name || null,
            }
          : null
      )
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

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
        <div className="mt-12 flex flex-col gap-6 max-w-sm">
          {!isEditing ? (
            <>
              <div className="flex flex-col gap-3">
                <label className="text-callout text-text-secondary">Name</label>
                <div className="text-body text-text-primary border-fill-tertiary bg-bg-base rounded-md w-full border px-4 py-3">
                  {profile.display_name || 'No name set'}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-callout text-text-secondary">Class Year</label>
                <div className="text-body text-text-primary border-fill-tertiary bg-bg-base rounded-md w-full border px-4 py-3">
                  {profile.class_year || 'Not set'}
                </div>
              </div>

              {profile.username && (
                <div className="flex flex-col gap-3">
                  <label className="text-callout text-text-secondary">SUNet ID</label>
                  <div className="text-body text-text-primary border-fill-tertiary bg-bg-base rounded-md w-full border px-4 py-3">
                    @{profile.username}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <label className="text-callout text-text-secondary">Email</label>
                <div className="text-body text-text-primary border-fill-tertiary bg-bg-base rounded-md w-full border px-4 py-3">
                  {profile.email}
                </div>
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="text-callout text-text-primary border-fill-tertiary rounded-md mt-4 w-full border py-3 hover:bg-bg-secondary"
              >
                Edit Profile
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                <label className="text-callout text-text-secondary">Name</label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData((f) => ({ ...f, display_name: e.target.value }))}
                  placeholder="Your name"
                  className="text-body text-text-primary border-fill-tertiary bg-bg-base rounded-md w-full border px-4 py-3 focus:outline-none focus:border-fill-primary"
                />
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-callout text-text-secondary">Class Year</label>
                <select
                  value={formData.class_year}
                  onChange={(e) => setFormData((f) => ({ ...f, class_year: e.target.value }))}
                  className="text-body text-text-primary border-fill-tertiary bg-bg-base rounded-md w-full border px-4 py-3 focus:outline-none focus:border-fill-primary"
                >
                  <option value="">Select a year</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                </select>
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-callout text-text-inverse bg-fill-primary rounded-md flex-1 py-3 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      display_name: profile.display_name || '',
                      class_year: profile.class_year || '',
                    })
                    setError('')
                  }}
                  className="text-callout text-text-primary border-fill-tertiary rounded-md flex-1 border py-3 hover:bg-bg-secondary"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={handleSignOut}
        className="text-headline text-text-inverse bg-fill-primary rounded-md mt-8 w-full py-4"
      >
        Sign Out
      </button>

      <div className="mt-12 text-xs text-text-tertiary text-center">
        Deployed: {import.meta.env.VITE_DEPLOYMENT_TIME || 'Development'}
      </div>
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
