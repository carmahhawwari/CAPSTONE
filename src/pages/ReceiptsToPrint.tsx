import { useNavigate } from 'react-router-dom'

const QUEUE = ['p1', 'p2', 'p3']

export default function ReceiptsToPrint() {
  const navigate = useNavigate()

  const handlePrint = () => {
    navigate('/home')
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-base">
      <header className="flex items-end justify-between px-6 pt-12 pb-3">
        <h1 className="text-regular-semibold text-text-primary">
          Recipts to Print
        </h1>
        <IconButton label="Home" onClick={() => navigate('/home')}>
          <HomeIcon />
        </IconButton>
      </header>

      <div className="flex flex-col gap-5 px-6 pt-6 pb-32">
        {QUEUE.map((id) => (
          <div
            key={id}
            className="border-fill-primary bg-bg-primary rounded-md flex aspect-[16/10] w-full items-center justify-center border-2"
          >
            <span className="text-regular-semibold text-text-primary">?</span>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 z-10 mt-auto">
        <div className="bg-bg-base relative px-6 pt-2 pb-8">
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-full left-0 right-0 h-6"
            style={{
              background:
                'linear-gradient(to top, var(--color-bg-base), rgba(253, 253, 253, 0))',
            }}
          />
          <button
            type="button"
            onClick={handlePrint}
            className="text-headline text-text-inverse bg-fill-primary rounded-md w-full py-4"
          >
            Send to Printer
          </button>
        </div>
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
