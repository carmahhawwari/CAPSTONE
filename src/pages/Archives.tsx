import { Link } from 'react-router-dom';
import StampPortrait from '@/components/StampPortrait';
import { useOrbit } from '@/contexts/orbit';
import { useSocial } from '@/contexts/social';
import type { OrbitPerson } from '@/types';

export default function Archives() {
  const { incoming, sentNotes } = useOrbit();
  const { getPersonById } = useSocial();

  const seenIds = new Set<string>();
  const archivePeople = [...incoming.map((note) => note.senderId), ...sentNotes.map((note) => note.recipientId)]
    .map((id) => getPersonById(id))
    .filter((person): person is OrbitPerson => {
      if (!person || seenIds.has(person.id)) {
        return false;
      }

      seenIds.add(person.id);
      return true;
    });

  return (
    <div className="pt-8 pb-12">
      <p className="text-[12px] uppercase tracking-[0.24em] text-dusty">PaperMates archive</p>
      <h1 className="mt-3 font-[var(--font-display)] text-[2.8rem] leading-none font-semibold text-ink">
        File box memories.
      </h1>
      <p className="mt-4 text-[17px] leading-7 text-muted">
        Each folder is a thread with one person. Open one to browse sent and received letters together.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4">
        {archivePeople.map((person) => (
          <Link
            key={person.id}
            to={`/archives/${person.id}`}
            className="orbit-card flex items-center gap-4 rounded-[2rem] px-5 py-5 transition-transform hover:-translate-y-0.5"
          >
            <div className="relative h-24 w-28 shrink-0">
              <img src="/images/folder.png" alt="" className="h-full w-full object-contain drop-shadow-[0_16px_22px_rgba(64,49,38,0.14)]" />
              <div className="absolute left-1/2 top-1/2 h-16 w-12 -translate-x-1/2 -translate-y-1/2 rotate-[-13deg]">
                <StampPortrait person={person} className="h-full w-full object-contain drop-shadow-[0_10px_14px_rgba(63,44,35,0.18)]" />
              </div>
            </div>
            <div>
              <p className="text-[12px] uppercase tracking-[0.2em] text-dusty">Archive folder</p>
              <h2 className="mt-2 text-[22px] font-semibold text-ink">{person.name}</h2>
              <p className="mt-2 text-[15px] text-muted">{person.relationship} · {person.city}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
