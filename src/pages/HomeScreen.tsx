import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import archiveImg from '@/assets/archive.png'
import printerImg from '@/assets/printer.png'

export default function HomeScreen() {
  const navigate = useNavigate()

  const handlePrintClick = () => {
    navigate('/prints')
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-base px-6 pt-8 pb-8">
      <header className="flex items-end justify-between">
        <h1 className="text-regular-semibold text-text-primary">Home</h1>
        <div className="flex flex-col gap-2">
          <IconButton
            label="Profile"
            onClick={() => navigate('/profile')}
          >
            <ProfileIcon />
          </IconButton>
          <IconButton
            label="Archive"
            onClick={() => navigate('/archive')}
          >
            <ArchiveIcon />
          </IconButton>
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-3 w-4/5 mx-auto">
        <Tile label="Printer" onClick={handlePrintClick}>
          <PrinterPlaceholder />
        </Tile>
        <Tile label="Send" onClick={() => navigate('/compose')}>
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
      className="bg-bg-primary rounded-md flex aspect-[16/9] w-full items-center justify-center active:opacity-70"
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

function ArchiveIcon() {
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
        d="M4 6h16v2H4V6zm1 3h14v9c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V9zm3 2v5h2v-5H8zm4 0v5h2v-5h-2z"
        fill="currentColor"
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