import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { todayAssignment, users, affirmations } from '@/lib/mock-data';

export default function Home() {
  const { user } = useAuth();
  const writeTo = users.find((u) => u.id === todayAssignment.writeToUserId);
  const receiveFrom = users.find((u) => u.id === todayAssignment.receiveFromUserId);
  const receivedAffirmation = todayAssignment.receivedAffirmationId
    ? affirmations.find((a) => a.id === todayAssignment.receivedAffirmationId)
    : null;

  const totalSent = affirmations.filter((a) => a.senderId === user?.id).length;
  const streak = 7;
  const others = users.filter((u) => u.id !== user?.id);

  return (
    <div className="px-5 pt-14 pb-28">
      {/* Title */}
      <h1 className="text-[34px] font-bold text-primary tracking-[-0.02em] leading-none">
        Affirm.
      </h1>

      {/* Main card — grainy sunset gradient */}
      <Link
        to={receivedAffirmation ? `/read/${receivedAffirmation.id}` : '#'}
        className="block mt-5"
      >
        <div className="relative rounded-2xl overflow-hidden min-h-[220px] flex flex-col justify-between p-6 sunset-card">
          {/* Animated gradient */}
          <div className="absolute inset-0 sunset-gradient" />
          {/* Grain overlay */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.18] pointer-events-none mix-blend-overlay" xmlns="http://www.w3.org/2000/svg">
            <filter id="grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="4" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#grain)" />
          </svg>

          <div className="relative z-10">
            {receivedAffirmation ? (
              <>
                <p className="text-[18px] text-white/95 leading-relaxed font-medium">
                  {receivedAffirmation.content}
                </p>
                <p className="text-[14px] text-white/60 mt-4">
                  — {receiveFrom?.name}
                </p>
              </>
            ) : (
              <p className="text-[17px] text-white/80">
                Your letter hasn't arrived yet.
              </p>
            )}
          </div>
        </div>
      </Link>

      {/* Recents bento */}
      <h2 className="text-[22px] font-bold text-primary tracking-[-0.01em] mt-8 mb-3">
        Recents
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {/* Sent */}
        <div className="bg-surface rounded-2xl p-5">
          <p className="text-[13px] text-meta font-medium uppercase tracking-wider">Sent</p>
          <p className="text-[32px] font-bold text-primary tracking-tight mt-2">{totalSent}</p>
          <p className="text-[13px] text-meta">letters</p>
        </div>

        {/* Streak */}
        <div className="bg-surface rounded-2xl p-5">
          <p className="text-[13px] text-meta font-medium uppercase tracking-wider">Streak</p>
          <p className="text-[32px] font-bold text-primary tracking-tight mt-2">{streak}</p>
          <p className="text-[13px] text-meta">days</p>
        </div>

        {/* Write next — full width */}
        <Link to="/write" className="col-span-2 active:scale-[0.98] transition-transform">
          <div className="bg-surface rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-[13px] text-meta font-medium uppercase tracking-wider">Write next</p>
              <p className="text-[20px] text-primary font-bold tracking-[-0.01em] mt-1">{writeTo?.name}</p>
            </div>
            <ChevronRight size={20} className="text-meta" />
          </div>
        </Link>
      </div>

      {/* People */}
      <h2 className="text-[22px] font-bold text-primary tracking-[-0.01em] mt-10 mb-3">
        People
      </h2>

      <div className="flex flex-col gap-2">
        {others.map((other) => {
          const letterCount = affirmations.filter(
            (a) =>
              (a.senderId === user?.id && a.receiverId === other.id) ||
              (a.senderId === other.id && a.receiverId === user?.id)
          ).length;

          return (
            <Link
              key={other.id}
              to={`/person/${other.id}`}
              className="bg-surface rounded-2xl px-5 py-4 flex items-center justify-between active:scale-[0.98] transition-transform"
            >
              <div>
                <p className="text-[16px] text-primary font-semibold">{other.name}</p>
                <p className="text-[13px] text-meta mt-0.5">
                  {letterCount} letter{letterCount !== 1 ? 's' : ''} exchanged
                </p>
              </div>
              <ChevronRight size={18} className="text-meta" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
