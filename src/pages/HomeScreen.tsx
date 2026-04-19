import { useNavigate } from 'react-router-dom'
import archiveImg from '@/assets/archive.png'
import printerImg from '@/assets/printer.png'

export default function HomeScreen() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col bg-bg-base px-6 pt-12 pb-8">
      <header className="flex items-end justify-between">
        <h1 className="text-regular-semibold text-text-primary">Home</h1>
        <div className="flex flex-col gap-3">
          <IconButton
            label="Profile"
            onClick={() => navigate('/profile')}
          >
            <ProfileIcon />
          </IconButton>
          <IconButton
            label="New"
            onClick={() => navigate('/compose')}
          >
            <PlusIcon />
          </IconButton>
        </div>
      </header>

      <div className="mt-12 flex flex-col gap-5">
        <Tile label="Printer" onClick={() => navigate('/prints')}>
          <PrinterPlaceholder />
        </Tile>
        <Tile label="Archive" onClick={() => navigate('/archive')}>
          <ArchivePlaceholder />
        </Tile>
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

function Tile({
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
      className="border-fill-primary bg-bg-primary rounded-md flex aspect-[4/3] w-full items-center justify-center border-2 active:opacity-70"
    >
      {children}
    </button>
  )
}

function ProfileIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4 20C4 17 7.58 14 12 14C16.42 14 20 17 20 20"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
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

function PrinterPlaceholder() {
  return (
    <img
      src={printerImg}
      alt="Printer"
      className="h-full w-full object-contain p-6"
    />
  )
}

function ArchivePlaceholder() {
  return (
    <img
      src={archiveImg}
      alt="Archive"
      className="h-full w-full object-contain p-6"
    />
  )
}
