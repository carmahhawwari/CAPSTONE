import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getFriends, type FriendProfile } from '@/lib/friends'
import { getArchive, type ReceiptWithProfiles } from '@/lib/receipts'
import type { Block } from '@/types/canvas'

const SAVED_TAB = '__saved__'

function firstText(blocks: Block[]): string {
  for (const b of blocks) {
    if (b.type === 'text' && b.content?.trim()) return b.content
  }
  return ''
}

export default function ArchiveScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [friends, setFriends] = useState<FriendProfile[]>([])
  const [receipts, setReceipts] = useState<ReceiptWithProfiles[]>([])
  const [activeTab, setActiveTab] = useState<string>(SAVED_TAB)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([getFriends(), getArchive()])
      .then(([fs, rs]) => {
        setFriends(fs)
        setReceipts(rs)
        if (fs.length > 0) setActiveTab(fs[0].id)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [user])

  const filtered = useMemo(() => {
    if (activeTab === SAVED_TAB) {
      return receipts.filter((r) => r.recipient_id === null && r.author_id === user?.id)
    }
    return receipts.filter(
      (r) =>
        (r.author_id === activeTab && r.recipient_id === user?.id) ||
        (r.author_id === user?.id && r.recipient_id === activeTab),
    )
  }, [activeTab, receipts, user?.id])

  return (
    <div className="flex min-h-screen flex-col bg-bg-base">
      <div className="sticky top-0 z-10">
        <header className="bg-bg-base relative flex items-start justify-between gap-4 px-6 pt-12 pb-3">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <h1 className="text-regular-semibold text-text-primary">Archives</h1>
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
              <TabButton
                active={activeTab === SAVED_TAB}
                onClick={() => setActiveTab(SAVED_TAB)}
              >
                Saved
              </TabButton>
              {friends.map((f) => {
                const label = (f.display_name || f.username || 'Friend').split(' ')[0]
                return (
                  <TabButton
                    key={f.id}
                    active={activeTab === f.id}
                    onClick={() => setActiveTab(f.id)}
                  >
                    {label}
                  </TabButton>
                )
              })}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3">
            <IconButton label="Home" onClick={() => navigate('/home')}>
              <HomeIcon />
            </IconButton>
            <IconButton label="New" onClick={() => navigate('/compose')}>
              <PlusIcon />
            </IconButton>
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-full h-6"
            style={{
              background:
                'linear-gradient(to bottom, var(--color-bg-base), rgba(253, 253, 253, 0))',
            }}
          />
        </header>
      </div>

      <div className="mt-6 flex flex-col gap-5 px-6 pb-8">
        {error && <p className="text-subheadline text-text-tertiary">{error}</p>}
        {loading ? (
          <p className="text-subheadline text-text-tertiary">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-subheadline text-text-tertiary">No letters yet.</p>
        ) : (
          filtered.map((r) => {
            const content = (r.content as { blocks?: Block[] } | null) ?? {}
            const snippet = firstText(content.blocks ?? [])
            return (
              <div
                key={r.id}
                className="border-fill-primary bg-bg-primary rounded-md aspect-[16/10] w-full border-2 p-4 flex flex-col justify-between overflow-hidden"
              >
                <p className="text-subheadline text-text-primary line-clamp-4">
                  {snippet || '(no text)'}
                </p>
                <p className="text-footnote text-text-tertiary">
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'text-headline text-text-inverse bg-fill-primary rounded-full whitespace-nowrap px-5 py-2'
          : 'text-headline text-text-primary whitespace-nowrap px-2 py-2'
      }
    >
      {children}
    </button>
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
