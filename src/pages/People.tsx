import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { users, affirmations, memories } from '@/lib/mock-data';

export default function People() {
  const { user } = useAuth();
  const others = users.filter((u) => u.id !== user?.id);

  return (
    <div className="px-5 pt-14 pb-28">
      <h1 className="text-[34px] font-bold text-primary tracking-[-0.02em] leading-none">
        People
      </h1>

      <div className="mt-6 flex flex-col gap-3">
        {others.map((other) => {
          const letterCount = affirmations.filter(
            (a) =>
              (a.senderId === user?.id && a.receiverId === other.id) ||
              (a.senderId === other.id && a.receiverId === user?.id)
          ).length;

          const memoryCount = memories.filter(
            (m) =>
              (m.userId === user?.id && m.sharedWithUserId === other.id) ||
              (m.userId === other.id && m.sharedWithUserId === user?.id)
          ).length;

          return (
            <Link
              key={other.id}
              to={`/person/${other.id}`}
              className="bg-surface rounded-2xl px-5 py-4 flex items-center justify-between active:scale-[0.98] transition-transform"
            >
              <div>
                <p className="text-[17px] text-primary font-semibold">{other.name}</p>
                <p className="text-[14px] text-meta mt-0.5">
                  {letterCount} letter{letterCount !== 1 ? 's' : ''} · {memoryCount} memor{memoryCount !== 1 ? 'ies' : 'y'}
                </p>
              </div>
              <ChevronRight size={18} className="text-meta shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
