import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { todayAssignment, users, affirmations, prompts } from '@/lib/mock-data';

const envelopeColors = ['#E03C00', '#4A3D9E', '#D4890C', '#D4907E', '#8C9DB5', '#3A4A2E'];

export default function Home() {
  const { user } = useAuth();
  const writeTo = users.find((u) => u.id === todayAssignment.writeToUserId);
  const receiveFrom = users.find((u) => u.id === todayAssignment.receiveFromUserId);
  const hasSent = !!todayAssignment.sentAffirmationId;
  const receivedAffirmation = todayAssignment.receivedAffirmationId
    ? affirmations.find((a) => a.id === todayAssignment.receivedAffirmationId)
    : null;
  const todayPrompt = prompts[Math.floor(Math.random() * prompts.length)];
  const color = envelopeColors[1];

  return (
    <div className="px-5 pt-14 pb-28">
      <p className="text-[15px] text-meta">Today</p>
      <h1 className="text-[34px] font-bold text-primary tracking-[-0.02em] leading-tight mt-0.5">
        {user?.name}
      </h1>

      {/* Write card */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-3">
          <p className="text-[16px] text-primary font-medium">Your letter to write</p>
          <div className="flex-1 border-t border-dashed border-dividers" />
        </div>

        {hasSent ? (
          <div className="bg-surface rounded-2xl p-6 text-center">
            <p className="text-[17px] text-primary font-semibold">Sent</p>
            <p className="text-[15px] text-secondary mt-1">
              Your letter to {writeTo?.name} is on its way.
            </p>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <img
                src={writeTo?.avatar}
                alt={writeTo?.name}
                className="w-14 h-14 rounded object-cover object-top"
              />
              <div>
                <p className="text-[20px] text-primary font-bold">{writeTo?.name}</p>
                <p className="text-[14px] text-meta mt-0.5">is waiting for your words</p>
              </div>
            </div>

            <p className="text-[15px] text-secondary mt-5 italic leading-relaxed">
              "{todayPrompt.text}"
            </p>

            <Link
              to="/write"
              className="block bg-primary text-white text-center rounded-2xl py-[14px] text-[16px] font-semibold mt-5 hover:opacity-90 active:scale-[0.98] transition-all"
            >
              Write a Letter
            </Link>
          </div>
        )}
      </div>

      {/* Receive card */}
      <div className="mt-10">
        <div className="flex items-center gap-3 mb-3">
          <p className="text-[16px] text-primary font-medium">A letter for you</p>
          <div className="flex-1 border-t border-dashed border-dividers" />
        </div>

        {receivedAffirmation ? (
          <Link to={`/read/${receivedAffirmation.id}`} className="block active:scale-[0.97] transition-transform">
            <div className="bg-surface rounded-2xl px-5 py-5 flex items-center gap-4">
              <img
                src={receiveFrom?.avatar}
                alt={receiveFrom?.name}
                className="w-11 h-11 rounded object-cover object-top shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[17px] text-primary font-semibold">From {receiveFrom?.name}</p>
                <p className="text-[14px] text-meta mt-0.5">Tap to open</p>
              </div>
            </div>
          </Link>
        ) : (
          <div className="bg-surface rounded-2xl p-6 text-center">
            <p className="text-[17px] text-secondary">Your letter hasn't arrived yet.</p>
            <p className="text-[14px] text-meta mt-1">Check back later today.</p>
          </div>
        )}
      </div>
    </div>
  );
}
