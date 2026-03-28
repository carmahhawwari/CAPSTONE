import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { pastAssignments, users, affirmations } from '@/lib/mock-data';

const envelopeColors = ['#E03C00', '#4A3D9E', '#D4890C', '#D4907E', '#8C9DB5', '#3A4A2E'];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function History() {
  const { user } = useAuth();

  return (
    <div className="px-5 pt-14 pb-28">
      <h1 className="text-[34px] font-normal text-primary tracking-[-0.02em] leading-none font-serif">
        History
      </h1>

      <div className="mt-6 flex flex-col gap-6">
        {pastAssignments.map((assignment, ai) => {
          const writeTo = users.find((u) => u.id === assignment.writeToUserId);
          const receiveFrom = users.find((u) => u.id === assignment.receiveFromUserId);
          const sentAffirmation = assignment.sentAffirmationId
            ? affirmations.find((a) => a.id === assignment.sentAffirmationId)
            : null;
          const receivedAffirmation = assignment.receivedAffirmationId
            ? affirmations.find((a) => a.id === assignment.receivedAffirmationId)
            : null;
          const color = envelopeColors[ai % envelopeColors.length];

          return (
            <div key={assignment.id}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3">
                <p className="text-[14px] text-meta font-medium">{formatDate(assignment.date)}</p>
                <div className="flex-1 border-t border-dashed border-dividers" />
              </div>

              <div className="flex flex-col gap-3">
                {/* Sent */}
                {sentAffirmation && (
                  <div className="bg-surface rounded-xl px-5 py-4">
                    <div className="mb-2.5">
                      <p className="text-[14px] text-meta">You wrote to</p>
                      <p className="text-[16px] text-primary font-medium">{writeTo?.name}</p>
                    </div>
                    <p className="text-[15px] text-secondary leading-relaxed line-clamp-3">
                      {sentAffirmation.content}
                    </p>
                  </div>
                )}

                {/* Received */}
                {receivedAffirmation && (
                  <Link
                    to={`/read/${receivedAffirmation.id}`}
                    className="block active:scale-[0.98] transition-transform"
                  >
                    <div
                      className="rounded-xl px-5 py-4"
                      style={{ backgroundColor: color + '12', border: `1px solid ${color}18` }}
                    >
                      <div>
                        <p className="text-[14px] text-meta">Letter from</p>
                        <p className="text-[16px] text-primary font-medium">{receiveFrom?.name}</p>
                        <p className="text-[14px] text-secondary mt-1 line-clamp-1">
                          {receivedAffirmation.content}
                        </p>
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
