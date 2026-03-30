import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock3, Search, UserPlus, Users } from 'lucide-react';
import StampPortrait from '@/components/StampPortrait';
import { useOrbit } from '@/contexts/orbit';
import { useSocial } from '@/contexts/social';

const MAX_ORBIT = 8;

export default function People() {
  const { isOnboarded, orbitIds, updateOrbit } = useOrbit();
  const { friends, directory, receivedRequests, sentRequests, searchDirectory, sendRequest, acceptRequest, declineRequest } =
    useSocial();
  const [selectedIdsState, setSelectedIds] = useState<string[] | null>(null);
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState('');

  const friendIds = useMemo(() => new Set(friends.map((friend) => friend.id)), [friends]);
  const defaultSelectedIds = useMemo(() => {
    const availableOrbitIds = orbitIds.filter((id) => friendIds.has(id));
    return availableOrbitIds.length ? availableOrbitIds : friends.slice(0, 5).map((friend) => friend.id);
  }, [friendIds, friends, orbitIds]);
  const receivedBySenderId = useMemo(
    () => new Map(receivedRequests.map((request) => [request.senderId, request.id])),
    [receivedRequests],
  );
  const sentByReceiverId = useMemo(
    () => new Map(sentRequests.map((request) => [request.receiverId, request.id])),
    [sentRequests],
  );
  const selectedIds = (selectedIdsState ?? defaultSelectedIds).filter((id) => friendIds.has(id));

  const results = query.trim() ? searchDirectory(query) : directory.slice(0, 8);

  const togglePerson = (personId: string) => {
    setSelectedIds((previous) => {
      const base = (previous ?? defaultSelectedIds).filter((id) => friendIds.has(id));

      if (base.includes(personId)) {
        return base.filter((id) => id !== personId);
      }

      if (base.length >= MAX_ORBIT) {
        return base;
      }

      return [...base, personId];
    });
  };

  const handleSavePeople = () => {
    if (!selectedIds.length) {
      setFeedback('Pick at least one accepted friend for the daily wheel.');
      return;
    }

    updateOrbit(selectedIds);
    setFeedback('Your orbit is updated.');
  };

  const handleSendRequest = (receiverId: string) => {
    const error = sendRequest(receiverId);
    setFeedback(error ?? 'Friend request sent.');
  };

  return (
    <div className="pt-8 pb-10">
      <h1 className="font-[var(--font-display)] text-[38px] leading-none font-semibold text-ink">
        Your people
      </h1>
      <p className="mt-4 text-[17px] leading-7 text-muted">
        Search for real accounts, send requests, accept incoming invites, then decide who belongs in the wheel.
      </p>

      {feedback && (
        <div className="mt-6 rounded-[22px] border border-[rgba(166,114,90,0.22)] bg-[rgba(255,251,245,0.82)] px-4 py-4 text-[14px] text-ink">
          {feedback}
        </div>
      )}

      <section className="orbit-card mt-6 rounded-[30px] px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] uppercase tracking-[0.24em] text-dusty">Daily circle</p>
            <p className="mt-2 text-[18px] font-semibold text-ink">Choose who can appear on the wheel</p>
          </div>
          <div className="rounded-full bg-[rgba(217,161,74,0.16)] px-3 py-2 text-[12px] font-medium text-ink">
            {selectedIds.length}/{MAX_ORBIT}
          </div>
        </div>

        {friends.length ? (
          <div className="mt-5 grid grid-cols-2 gap-3">
            {friends.map((person) => {
              const selected = selectedIds.includes(person.id);

              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => togglePerson(person.id)}
                  className={`people-person-card rounded-[24px] border px-4 py-4 text-left transition-all ${
                    selected
                      ? 'border-[rgba(64,50,44,0.52)] bg-[rgba(64,50,44,0.92)] text-[#fff8ef]'
                      : 'border-[color:var(--color-line)] bg-[rgba(255,251,245,0.8)] text-ink'
                  }`}
                >
                  <StampPortrait person={person} className="people-person-stamp" />
                  <p className="mt-3 text-[16px] font-semibold">{person.name}</p>
                  <p className={`mt-1 text-[13px] ${selected ? 'text-[#ead8c9]' : 'text-muted'}`}>
                    {person.relationship}
                  </p>
                  <p className={`mt-3 text-[13px] leading-5 ${selected ? 'text-[#f6ede1]' : 'text-dusty'}`}>
                    {person.memory}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-[24px] border border-dashed border-[color:var(--color-line)] bg-[rgba(255,251,245,0.76)] px-4 py-5">
            <p className="text-[16px] font-semibold text-ink">No accepted friends yet.</p>
            <p className="mt-2 text-[14px] leading-6 text-muted">
              Send a request below, then sign in as that account and accept it. Once the request is accepted, that person will appear here.
            </p>
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={handleSavePeople}
            className="button-primary flex-1 rounded-[22px] px-5 py-4 text-[16px] font-semibold"
          >
            Save people
          </button>
          {!isOnboarded && friends.length > 0 && (
            <Link
              to="/onboarding"
              className="button-secondary flex-1 rounded-[22px] px-5 py-4 text-center text-[16px] font-semibold"
            >
              Continue setup
            </Link>
          )}
        </div>
      </section>

      {receivedRequests.length > 0 && (
        <section className="orbit-card mt-4 rounded-[30px] px-5 py-5">
          <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.24em] text-dusty">
            <Users size={16} />
            Requests waiting on you
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {receivedRequests.map((request) => (
              <div
                key={request.id}
                className="people-person-card rounded-[22px] border border-[color:var(--color-line)] bg-[rgba(255,251,245,0.8)] px-4 py-4"
              >
                {request.sender && <StampPortrait person={request.sender} className="people-person-stamp" />}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[16px] font-semibold text-ink">{request.sender?.name}</p>
                    <p className="mt-1 text-[13px] text-muted">{request.sender?.email}</p>
                  </div>
                  <div className="rounded-full bg-[rgba(166,114,90,0.12)] px-3 py-2 text-[12px] text-ink">
                    {new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      acceptRequest(request.id);
                      setFeedback(`Accepted ${request.sender?.name}.`);
                    }}
                    className="button-primary flex-1 rounded-[18px] px-4 py-3 text-[14px] font-semibold"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      declineRequest(request.id);
                      setFeedback(`Declined ${request.sender?.name}.`);
                    }}
                    className="button-secondary flex-1 rounded-[18px] px-4 py-3 text-[14px] font-semibold"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {sentRequests.length > 0 && (
        <section className="orbit-card mt-4 rounded-[30px] px-5 py-5">
          <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.24em] text-dusty">
            <Clock3 size={16} />
            Pending requests
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {sentRequests.map((request) => (
              <div
                key={request.id}
                className="people-person-card rounded-[22px] border border-[color:var(--color-line)] bg-[rgba(255,251,245,0.8)] px-4 py-4"
              >
                {request.receiver && <StampPortrait person={request.receiver} className="people-person-stamp" />}
                <p className="text-[16px] font-semibold text-ink">{request.receiver?.name}</p>
                <p className="mt-1 text-[13px] text-muted">{request.receiver?.email}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="orbit-card mt-4 rounded-[30px] px-5 py-5">
        <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.24em] text-dusty">
          <Search size={16} />
          Add friends
        </div>
        <div className="mt-4 rounded-[22px] border border-[color:var(--color-line)] bg-[rgba(255,251,245,0.82)] px-4 py-4">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or email"
            className="w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-dusty"
          />
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {results.length ? (
            results.map((person) => {
              const pendingInboundId = receivedBySenderId.get(person.id);
              const pendingOutboundId = sentByReceiverId.get(person.id);
              const isFriend = friendIds.has(person.id);

              return (
                <div
                  key={person.id}
                  className="people-person-card rounded-[22px] border border-[color:var(--color-line)] bg-[rgba(255,251,245,0.8)] px-4 py-4"
                >
                  <StampPortrait person={person} className="people-person-stamp" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[16px] font-semibold text-ink">{person.name}</p>
                      <p className="mt-1 truncate text-[13px] text-muted">{person.email}</p>
                      <p className="mt-2 text-[13px] text-dusty">
                        {person.relationship} in {person.city}
                      </p>
                    </div>

                    {isFriend ? (
                      <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(74,119,81,0.12)] px-3 py-2 text-[12px] font-medium text-[color:var(--color-olive)]">
                        <Check size={14} />
                        Connected
                      </div>
                    ) : pendingInboundId ? (
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            acceptRequest(pendingInboundId);
                            setFeedback(`Accepted ${person.name}.`);
                          }}
                          className="button-primary rounded-[16px] px-4 py-2 text-[13px] font-semibold"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            declineRequest(pendingInboundId);
                            setFeedback(`Declined ${person.name}.`);
                          }}
                          className="button-secondary rounded-[16px] px-4 py-2 text-[13px] font-semibold"
                        >
                          Decline
                        </button>
                      </div>
                    ) : pendingOutboundId ? (
                      <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(166,114,90,0.12)] px-3 py-2 text-[12px] font-medium text-ink">
                        <Clock3 size={14} />
                        Sent
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendRequest(person.id)}
                        className="button-primary inline-flex items-center gap-2 rounded-[18px] px-4 py-3 text-[14px] font-semibold"
                      >
                        <UserPlus size={15} />
                        Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-[22px] border border-dashed border-[color:var(--color-line)] bg-[rgba(255,251,245,0.76)] px-4 py-5 text-[14px] leading-6 text-muted">
              No matching accounts yet. Try another email or create a second local account to test the request flow.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
