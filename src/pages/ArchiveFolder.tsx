import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import StampPortrait from '@/components/StampPortrait';
import LetterCard from '@/components/LetterCard';
import { useOrbit } from '@/contexts/orbit';
import { useSocial } from '@/contexts/social';

export default function ArchiveFolder() {
  const { id } = useParams();
  const { incoming, sentNotes } = useOrbit();
  const { getPersonById } = useSocial();
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'keywords'>('date');

  if (!id) {
    return <Navigate to="/archives" replace />;
  }

  const friend = getPersonById(id);
  if (!friend) {
    return <Navigate to="/archives" replace />;
  }

  let letters = [...sentNotes.filter((note) => note.recipientId === friend.id), ...incoming.filter((note) => note.senderId === friend.id)];

  if (filter === 'sent') {
    letters = letters.filter((note) => note.status === 'sent');
  }

  if (filter === 'received') {
    letters = letters.filter((note) => note.status === 'incoming');
  }

  if (sortBy === 'keywords') {
    letters = [...letters].sort((left, right) => left.preview.localeCompare(right.preview));
  } else {
    letters = [...letters].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  return (
    <div className="pt-8 pb-12">
      <Link to="/archives" className="text-[12px] uppercase tracking-[0.24em] text-dusty">
        Back to archives
      </Link>

      <div className="orbit-card mt-5 rounded-[2rem] px-5 py-5">
        <div className="flex items-center gap-4">
          <div className="h-20 w-16 shrink-0">
            <StampPortrait person={friend} className="h-full w-full object-contain drop-shadow-[0_12px_16px_rgba(63,44,35,0.18)]" />
          </div>
          <div>
            <p className="text-[12px] uppercase tracking-[0.24em] text-dusty">Folder tab</p>
            <h1 className="mt-2 font-[var(--font-display)] text-[2.3rem] leading-none font-semibold text-ink">
              {friend.name}
            </h1>
            <p className="mt-2 text-[15px] text-muted">{friend.relationship} in {friend.city}</p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          {(['all', 'sent', 'received'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-full px-4 py-2 text-[13px] font-medium capitalize ${
                filter === option ? 'bg-[rgba(45,36,31,0.92)] text-[#fff8ef]' : 'bg-[rgba(255,251,245,0.88)] text-ink'
              }`}
            >
              {option}
            </button>
          ))}
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as 'date' | 'keywords')}
            className="ml-auto rounded-full border border-[color:var(--color-line)] bg-[rgba(255,251,245,0.88)] px-4 py-2 text-[13px] text-ink"
          >
            <option value="date">Sort: Date</option>
            <option value="keywords">Sort: Keywords</option>
          </select>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {letters.map((note) => (
          <Link key={note.id} to={`/letters/${note.id}`}>
            <LetterCard note={note} counterpartName={friend.name} isReceived={note.status === 'incoming'} />
          </Link>
        ))}
      </div>
    </div>
  );
}
