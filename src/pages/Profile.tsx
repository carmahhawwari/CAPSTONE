import { useNavigate } from 'react-router-dom'

const FIELDS = [
  'Carmah',
  'Hawwari',
  'chawwari@stanford.edu',
  '65064322020',
]

export default function Profile() {
  const navigate = useNavigate()

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

      <div className="mt-12 flex flex-col gap-3">
        {FIELDS.map((value) => (
          <div
            key={value}
            className="text-body text-text-primary border-fill-tertiary bg-bg-base rounded-md w-full border px-4 py-3"
          >
            {value}
          </div>
        ))}
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
