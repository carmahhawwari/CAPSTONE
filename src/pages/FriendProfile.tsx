import { Link, Navigate, useParams } from 'react-router-dom';
import { PenSquare } from 'lucide-react';
import StampPortrait from '@/components/StampPortrait';
import LetterCard from '@/components/LetterCard';
import { useOrbit } from '@/contexts/orbit';
import { useSocial } from '@/contexts/social';

export default function FriendProfile() {
  const { id } = useParams();
  const { incoming, sentNotes } = useOrbit();
  const { getPersonById } = useSocial();

  if (!id) {
    return <Navigate to="/friends" replace />;
  }

  const friend = getPersonById(id);
  if (!friend) {
    return <Navigate to="/friends" replace />;
  }

  const sentToFriend = sentNotes.filter((note) => note.recipientId === friend.id);
  const receivedFromFriend = incoming.filter((note) => note.senderId === friend.id);
  const thread = [...sentToFriend, ...receivedFromFriend].sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  return (
    <div className="pt-8 pb-24">
      <Link to="/friends" className="text-[12px] uppercase tracking-[0.24em] text-dusty">
        Back to friends
      </Link>

      <div className="orbit-card mt-5 rounded-[2rem] px-5 py-6 text-center">
        <div className="mx-auto h-[10rem] w-[8rem]">
          <StampPortrait person={friend} className="h-full w-full object-contain drop-shadow-[0_18px_22px_rgba(64,49,38,0.18)]" />
        </div>
        <p className="mt-3 text-[12px] uppercase tracking-[0.24em] text-dusty">PaperMate profile</p>
        <h1 className="mt-2 font-[var(--font-display)] text-[2.35rem] leading-none font-semibold text-ink">
          {friend.name}
        </h1>
        <p className="mt-3 text-[15px] text-muted">{friend.relationship} · Printer at {friend.city}</p>
        <p className="mt-4 text-[14px] leading-6 text-dusty">
          {sentToFriend.length} messages sent · Friends since {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="mt-7">
        <div className="flex items-center justify-between">
          <h2 className="font-[var(--font-display)] text-[1.8rem] text-ink">Letters to {friend.name}</h2>
          <Link to={`/compose?recipient=${friend.id}`} className="button-primary rounded-full px-4 py-3 text-[14px] font-semibold">
            Write now
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {thread.map((note) => (
            <Link key={note.id} to={`/letters/${note.id}`}>
              <LetterCard note={note} counterpartName={friend.name} isReceived={note.status === 'incoming'} />
            </Link>
          ))}
        </div>
      </div>

      <Link
        to={`/compose?recipient=${friend.id}`}
        className="button-primary fixed right-6 bottom-28 inline-flex h-14 w-14 items-center justify-center rounded-full shadow-[0_16px_28px_rgba(52,39,33,0.22)]"
        aria-label={`Compose a letter to ${friend.name}`}
      >
        <PenSquare size={22} />
      </Link>
    </div>
  );
}
