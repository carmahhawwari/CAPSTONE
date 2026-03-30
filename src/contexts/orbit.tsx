import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/auth';
import { useSocial } from '@/contexts/social';
import { writingPrompts } from '@/lib/mock-data';
import type { OrbitNote, OrbitPerson, PromptChoice, User } from '@/types';

interface SendNoteInput {
  content: string;
  templateId: string;
  fontId: string;
  stamp?: string;
  imageName?: string;
  audioName?: string;
}

interface OrbitContextType {
  orbit: OrbitPerson[];
  orbitIds: string[];
  isOnboarded: boolean;
  needsDailySpin: boolean;
  canRespin: boolean;
  currentContact: OrbitPerson | null;
  incoming: OrbitNote[];
  sentNotes: OrbitNote[];
  lastSentNote: OrbitNote | null;
  promptOptions: PromptChoice[];
  selectedPrompt: PromptChoice | null;
  completeOnboarding: (selectedIds: string[]) => void;
  updateOrbit: (selectedIds: string[]) => void;
  startDailySpin: () => void;
  respin: () => void;
  selectPrompt: (promptId: string) => void;
  sendNote: (input: SendNoteInput) => OrbitNote | null;
  resetOnboarding: () => void;
}

interface OrbitState {
  isOnboarded: boolean;
  orbitIds: string[];
  dailySpinDate: string | null;
  currentContactId: string | null;
  selectedPromptId: string | null;
  canRespin: boolean;
  turnCount: number;
  sentNotes: OrbitNote[];
  lastSentNoteId: string | null;
}

const OrbitContext = createContext<OrbitContextType | undefined>(undefined);

const guestOrbitContext: OrbitContextType = {
  orbit: [],
  orbitIds: [],
  isOnboarded: false,
  needsDailySpin: false,
  canRespin: false,
  currentContact: null,
  incoming: [],
  sentNotes: [],
  lastSentNote: null,
  promptOptions: [],
  selectedPrompt: null,
  completeOnboarding: () => {},
  updateOrbit: () => {},
  startDailySpin: () => {},
  respin: () => {},
  selectPrompt: () => {},
  sendNote: () => null,
  resetOnboarding: () => {},
};

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStorageKey(userId: string) {
  return `orbit.prototype.state.${userId}`;
}

function chooseNextContact(orbitIds: string[], turnCount: number, excludeId?: string | null) {
  const pool = orbitIds.filter((id) => id !== excludeId);
  if (!pool.length) {
    return orbitIds[0] ?? null;
  }

  return pool[(turnCount * 3 + 1) % pool.length];
}

function getPromptOptions(turnCount: number) {
  const prompts = writingPrompts.filter((prompt) => prompt.type === 'prompt');
  const first = prompts[turnCount % prompts.length];
  const second = prompts[(turnCount + 2) % prompts.length];
  const openResponse = writingPrompts.find((prompt) => prompt.id === 'open') ?? writingPrompts[writingPrompts.length - 1];
  return [first, second, openResponse];
}

function buildIncomingNotes(user: User, friends: OrbitPerson[]): OrbitNote[] {
  const starters = friends.slice(0, 3);

  return starters.map((friend, index) => ({
    id: `incoming-${friend.id}`,
    senderId: friend.id,
    senderName: friend.name,
    recipientId: user.id,
    recipientName: user.name,
    content:
      index % 2 === 0
        ? `I kept thinking about you today, so I wanted to leave a small note here. It felt like the kind of day you would have made gentler just by being in it.`
        : `This is just me saying you crossed my mind. I still carry little pieces of our conversations into ordinary days more than I probably admit.`,
    createdAt: new Date(Date.UTC(2026, 2, 22 + index)).toISOString(),
    templateId: 'plain',
    fontId: index % 2 === 0 ? 'letter' : 'type',
    stamp: ['★', '✿', '☀'][index % 3],
    preview: `A note from ${friend.name}.`,
    status: 'incoming',
  }));
}

function buildSentNotes(user: User, friends: OrbitPerson[]) {
  const firstFriend = friends[0];
  if (!firstFriend) {
    return [];
  }

  return [
    {
      id: `sent-seed-${firstFriend.id}`,
      senderId: user.id,
      senderName: user.name,
      recipientId: firstFriend.id,
      recipientName: firstFriend.name,
      content: 'You make ordinary weeks feel less sharp. I wanted to say that plainly.',
      createdAt: new Date(Date.UTC(2026, 2, 21)).toISOString(),
      templateId: 'lined',
      fontId: 'letter',
      stamp: '☀',
      preview: 'You make ordinary weeks feel less sharp.',
      status: 'sent' as const,
    },
  ];
}

function getInitialState(user: User, friends: OrbitPerson[]): OrbitState {
  const friendIds = friends.map((friend) => friend.id);
  const starterNotes = buildSentNotes(user, friends);

  const defaultState: OrbitState = {
    isOnboarded: friendIds.length > 0,
    orbitIds: friendIds.slice(0, 5),
    dailySpinDate: null,
    currentContactId: friendIds[0] ?? null,
    selectedPromptId: null,
    canRespin: true,
    turnCount: 0,
    sentNotes: starterNotes,
    lastSentNoteId: starterNotes[0]?.id ?? null,
  };

  if (typeof window === 'undefined') {
    return defaultState;
  }

  const saved = window.localStorage.getItem(getStorageKey(user.id));
  if (!saved) {
    return defaultState;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<OrbitState>;
    const parsedOrbitIds = Array.isArray(parsed.orbitIds)
      ? parsed.orbitIds.filter((id): id is string => typeof id === 'string' && friendIds.includes(id))
      : defaultState.orbitIds;

    return {
      ...defaultState,
      ...parsed,
      orbitIds: parsedOrbitIds.length ? parsedOrbitIds : defaultState.orbitIds,
      sentNotes: Array.isArray(parsed.sentNotes) ? parsed.sentNotes : defaultState.sentNotes,
    };
  } catch {
    return defaultState;
  }
}

function OrbitProviderInner({ children, user }: { children: ReactNode; user: User }) {
  const { friends } = useSocial();
  const [state, setState] = useState<OrbitState>(() => getInitialState(user, friends));

  useEffect(() => {
    window.localStorage.setItem(getStorageKey(user.id), JSON.stringify(state));
  }, [state, user.id]);

  const friendIds = friends.map((friend) => friend.id);
  const resolvedOrbitIds = state.orbitIds.filter((id) => friendIds.includes(id));
  const fallbackOrbitIds = resolvedOrbitIds.length ? resolvedOrbitIds : friendIds.slice(0, 5);

  const orbit = fallbackOrbitIds
    .map((id) => friends.find((person) => person.id === id) ?? null)
    .filter((person): person is OrbitPerson => Boolean(person));

  const currentContact =
    friends.find((person) => person.id === state.currentContactId) ??
    friends.find((person) => fallbackOrbitIds.includes(person.id)) ??
    null;
  const lastSentNote = state.sentNotes.find((note) => note.id === state.lastSentNoteId) ?? null;
  const needsDailySpin = state.dailySpinDate !== getTodayKey();
  const promptOptions = getPromptOptions(state.turnCount + 1);
  const selectedPrompt = promptOptions.find((prompt) => prompt.id === state.selectedPromptId) ?? null;
  const incoming = buildIncomingNotes(user, friends);

  const completeOnboarding = (selectedIds: string[]) => {
    const fallbackIds = selectedIds.length ? selectedIds : friendIds.slice(0, 5);
    setState((previous) => ({
      ...previous,
      isOnboarded: true,
      orbitIds: fallbackIds,
      currentContactId: chooseNextContact(fallbackIds, previous.turnCount + 1),
      canRespin: true,
      dailySpinDate: null,
      selectedPromptId: null,
    }));
  };

  const updateOrbit = (selectedIds: string[]) => {
    const fallbackIds = selectedIds.length ? selectedIds : fallbackOrbitIds;
    setState((previous) => ({
      ...previous,
      orbitIds: fallbackIds,
      currentContactId: fallbackIds.includes(previous.currentContactId ?? '')
        ? previous.currentContactId
        : chooseNextContact(fallbackIds, previous.turnCount),
    }));
  };

  const startDailySpin = () => {
    const today = getTodayKey();
    setState((previous) => {
      if (previous.dailySpinDate === today) {
        return previous;
      }

      return {
        ...previous,
        dailySpinDate: today,
        currentContactId: chooseNextContact(fallbackOrbitIds, previous.turnCount + 1, previous.currentContactId),
        canRespin: true,
        selectedPromptId: null,
      };
    });
  };

  const respin = () => {
    if (!state.canRespin) {
      return;
    }

    setState((previous) => ({
      ...previous,
      currentContactId: chooseNextContact(fallbackOrbitIds, previous.turnCount + 1, previous.currentContactId),
      canRespin: false,
      selectedPromptId: null,
    }));
  };

  const selectPrompt = (promptId: string) => {
    setState((previous) => ({
      ...previous,
      selectedPromptId: promptId,
    }));
  };

  const sendNote = ({ content, templateId, fontId, stamp, imageName, audioName }: SendNoteInput) => {
    if (!currentContact) {
      return null;
    }

    const nextTurn = state.turnCount + 1;
    const note: OrbitNote = {
      id: `sent-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      recipientId: currentContact.id,
      recipientName: currentContact.name,
      content,
      createdAt: new Date().toISOString(),
      templateId,
      fontId,
      stamp,
      promptLabel: selectedPrompt?.text,
      imageName,
      audioName,
      preview: content.slice(0, 72).trim(),
      status: 'sent',
    };

    setState((previous) => ({
      ...previous,
      sentNotes: [note, ...previous.sentNotes],
      lastSentNoteId: note.id,
      turnCount: nextTurn,
      canRespin: false,
      currentContactId: currentContact.id,
      selectedPromptId: null,
    }));

    return note;
  };

  const resetOnboarding = () => {
    setState(getInitialState(user, friends));
  };

  return (
    <OrbitContext.Provider
      value={{
        orbit,
        orbitIds: fallbackOrbitIds,
        isOnboarded: state.isOnboarded && fallbackOrbitIds.length > 0,
        needsDailySpin,
        canRespin: state.canRespin,
        currentContact,
        incoming,
        sentNotes: state.sentNotes,
        lastSentNote,
        promptOptions,
        selectedPrompt,
        completeOnboarding,
        updateOrbit,
        startDailySpin,
        respin,
        selectPrompt,
        sendNote,
        resetOnboarding,
      }}
    >
      {children}
    </OrbitContext.Provider>
  );
}

export function OrbitProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return <OrbitContext.Provider value={guestOrbitContext}>{children}</OrbitContext.Provider>;
  }

  return (
    <OrbitProviderInner key={user.id} user={user}>
      {children}
    </OrbitProviderInner>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOrbit() {
  const context = useContext(OrbitContext);
  if (!context) {
    throw new Error('useOrbit must be used within an OrbitProvider');
  }

  return context;
}
