import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useOrbit } from '@/contexts/orbit';
import { useSocial } from '@/contexts/social';
import { orbitFacts } from '@/lib/mock-data';

export default function Profile() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { incoming, resetOnboarding, sentNotes } = useOrbit();
  const { profile } = useSocial();

  const handleSignOut = () => {
    signOut();
    navigate('/sign-in');
  };

  return (
    <div className="pt-8 pb-10">
      <h1 className="font-[var(--font-display)] text-[38px] leading-none font-semibold text-ink">
        You
      </h1>

      <div className="orbit-card mt-6 rounded-[30px] px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-[var(--font-display)] text-[28px] leading-none font-semibold text-ink">
              {user?.name}
            </p>
            <p className="mt-2 text-[15px] text-muted">{user?.email}</p>
          </div>
          <div className="rounded-full bg-[rgba(217,161,74,0.18)] px-4 py-2 text-[13px] text-ink">
            {profile?.faxNumber ?? user?.faxNumber}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-[22px] bg-[rgba(255,251,245,0.76)] px-4 py-4">
            <p className="text-[12px] uppercase tracking-[0.24em] text-dusty">Sent</p>
            <p className="mt-2 text-[28px] font-semibold text-ink">{sentNotes.length}</p>
          </div>
          <div className="rounded-[22px] bg-[rgba(255,251,245,0.76)] px-4 py-4">
            <p className="text-[12px] uppercase tracking-[0.24em] text-dusty">Received</p>
            <p className="mt-2 text-[28px] font-semibold text-ink">{incoming.length}</p>
          </div>
        </div>
      </div>

      <div className="orbit-card mt-4 rounded-[30px] px-5 py-5">
        <p className="text-[12px] uppercase tracking-[0.24em] text-dusty">Later, when deployed</p>
        <p className="mt-3 font-[var(--font-display)] text-[20px] leading-8 font-semibold text-ink">
          Pair a warm little printer.
        </p>
        <p className="mt-3 text-[15px] leading-7 text-muted">
          Every incoming note could slowly print into the room. The digital version still has to feel worth using first.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          {orbitFacts.map((fact) => (
            <div
              key={fact}
              className="rounded-[20px] border border-[color:var(--color-line)] bg-[rgba(255,251,245,0.78)] px-4 py-4 text-[14px] leading-6 text-muted"
            >
              {fact}
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={resetOnboarding}
        className="button-secondary mt-5 w-full rounded-[22px] px-5 py-4 text-[16px] font-semibold"
      >
        Rebuild orbit
      </button>

      <button
        type="button"
        onClick={handleSignOut}
        className="mt-3 w-full rounded-[22px] border border-[rgba(179,72,56,0.22)] bg-[rgba(255,244,240,0.78)] px-5 py-4 text-[16px] font-semibold text-[#b34838]"
      >
        Sign out
      </button>
    </div>
  );
}
