import { useParams, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { users, affirmations, memories } from '@/lib/mock-data';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function Person() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const other = users.find((u) => u.id === id);

  if (!other) {
    return (
      <div className="px-5 pt-14 pb-28">
        <p className="text-secondary">Person not found.</p>
      </div>
    );
  }

  // Shared affirmations between current user and this person
  const sharedAffirmations = affirmations
    .filter(
      (a) =>
        (a.senderId === user?.id && a.receiverId === other.id) ||
        (a.senderId === other.id && a.receiverId === user?.id)
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Shared memories
  const sharedMemories = memories.filter(
    (m) =>
      (m.userId === user?.id && m.sharedWithUserId === other.id) ||
      (m.userId === other.id && m.sharedWithUserId === user?.id)
  );

  return (
    <div className="px-5 pt-10 pb-28">
      {/* Back */}
      <Link to="/people" className="w-12 h-12 rounded-full bg-[#ECECEC] flex items-center justify-center mb-8">
        <ChevronLeft size={22} className="text-primary" />
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-primary tracking-[-0.02em]">{other.name}</h1>
      </div>

      {/* Shared Affirmations */}
      <div className="mt-10">
        <div className="flex items-center gap-3 mb-4">
          <p className="text-[16px] text-primary font-medium">Letters exchanged</p>
          <div className="flex-1 border-t border-dashed border-dividers" />
        </div>

        {sharedAffirmations.length === 0 ? (
          <p className="text-[15px] text-tertiary">No letters yet between you two.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {sharedAffirmations.map((a) => {
              const isSent = a.senderId === user?.id;
              return (
                <div key={a.id} className="bg-surface rounded-2xl px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[14px] text-meta font-medium">
                      {isSent ? 'You wrote' : `${other.name} wrote`}
                    </p>
                    <p className="text-[13px] text-meta">{formatDate(a.createdAt)}</p>
                  </div>
                  <p className="text-[15px] text-primary-body leading-relaxed">{a.content}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Shared Memories */}
      <div className="mt-10">
        <div className="flex items-center gap-3 mb-4">
          <p className="text-[16px] text-primary font-medium">Memories together</p>
          <div className="flex-1 border-t border-dashed border-dividers" />
        </div>

        {sharedMemories.length === 0 ? (
          <p className="text-[15px] text-tertiary">No memories added yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {sharedMemories.map((m) => (
              <div key={m.id} className="bg-surface rounded-2xl px-5 py-4">
                <p className="text-[16px] text-primary font-medium">{m.title}</p>
                <p className="text-[15px] text-secondary mt-1 leading-snug">{m.description}</p>
                {m.location && (
                  <p className="text-[13px] text-meta mt-2">{m.location}</p>
                )}
                <div className="flex gap-1.5 mt-2.5">
                  {m.tags.map((tag) => (
                    <span key={tag} className="text-[12px] text-meta bg-background rounded-full px-2.5 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
