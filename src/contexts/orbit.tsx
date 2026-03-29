import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { currentUser, incomingNotes, orbitCandidates, starterOrbitIds, starterSentNotes } from '@/lib/mock-data';
import type { OrbitNote, OrbitPerson } from '@/types';

interface SendNoteInput {
  content: string;
  templateId: string;
  fontId: string;
  stamp?: string;
}

interface OrbitContextType {
  orbit: OrbitPerson[];
  orbitIds: string[];
  isOnboarded: boolean;
  canRespin: boolean;
  currentContact: OrbitPerson | null;
  incoming: OrbitNote[];
  sentNotes: OrbitNote[];
  lastSentNote: OrbitNote | null;
  completeOnboarding: (selectedIds: string[]) => void;
  updateOrbit: (selectedIds: string[]) => void;
  respin: () => void;
  sendNote: (input: SendNoteInput) => OrbitNote | null;
  resetOnboarding: () => void;
}

interface OrbitState {
  isOnboarded: boolean;
  orbitIds: string[];
  currentContactId: string | null;
  canRespin: boolean;
  turnCount: number;
  sentNotes: OrbitNote[];
  lastSentNoteId: string | null;
}

const STORAGE_KEY = 'orbit.prototype.state';
const OrbitContext = createContext<OrbitContextType | undefined>(undefined);

function chooseNextContact(orbitIds: string[], turnCount: number, excludeId?: string | null) {
  const pool = orbitIds.filter((id) => id !== excludeId);
  if (!pool.length) {
    return orbitIds[0] ?? null;
  }

  return pool[(turnCount * 3 + 1) % pool.length];
}

function getInitialState(): OrbitState {
  if (typeof window === 'undefined') {
    return {
      isOnboarded: false,
      orbitIds: starterOrbitIds,
      currentContactId: starterOrbitIds[0],
      canRespin: true,
      turnCount: 0,
      sentNotes: starterSentNotes,
      lastSentNoteId: starterSentNotes[starterSentNotes.length - 1]?.id ?? null,
    };
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved) as OrbitState;
  }

  return {
    isOnboarded: false,
    orbitIds: starterOrbitIds,
    currentContactId: starterOrbitIds[0],
    canRespin: true,
    turnCount: 0,
    sentNotes: starterSentNotes,
    lastSentNoteId: starterSentNotes[starterSentNotes.length - 1]?.id ?? null,
  };
}

export function OrbitProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OrbitState>(getInitialState);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const orbit = state.orbitIds
    .map((id) => orbitCandidates.find((person) => person.id === id) ?? null)
    .filter((person): person is OrbitPerson => Boolean(person));

  const currentContact = orbitCandidates.find((person) => person.id === state.currentContactId) ?? null;
  const lastSentNote = state.sentNotes.find((note) => note.id === state.lastSentNoteId) ?? null;

  const completeOnboarding = (selectedIds: string[]) => {
    const fallbackIds = selectedIds.length ? selectedIds : starterOrbitIds;
    setState((previous) => ({
      ...previous,
      isOnboarded: true,
      orbitIds: fallbackIds,
      currentContactId: chooseNextContact(fallbackIds, 0),
      canRespin: true,
      turnCount: 0,
    }));
  };

  const updateOrbit = (selectedIds: string[]) => {
    const fallbackIds = selectedIds.length ? selectedIds : state.orbitIds;
    setState((previous) => ({
      ...previous,
      orbitIds: fallbackIds,
      currentContactId: fallbackIds.includes(previous.currentContactId ?? '')
        ? previous.currentContactId
        : chooseNextContact(fallbackIds, previous.turnCount),
    }));
  };

  const respin = () => {
    if (!state.canRespin) {
      return;
    }

    setState((previous) => ({
      ...previous,
      currentContactId: chooseNextContact(previous.orbitIds, previous.turnCount + 1, previous.currentContactId),
      canRespin: false,
    }));
  };

  const sendNote = ({ content, templateId, fontId, stamp }: SendNoteInput) => {
    if (!currentContact) {
      return null;
    }

    const nextTurn = state.turnCount + 1;
    const note: OrbitNote = {
      id: `sent-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      recipientId: currentContact.id,
      recipientName: currentContact.name,
      content,
      createdAt: new Date().toISOString(),
      templateId,
      fontId,
      stamp,
      preview: content.slice(0, 72).trim(),
      status: 'sent',
    };

    setState((previous) => ({
      ...previous,
      sentNotes: [note, ...previous.sentNotes],
      lastSentNoteId: note.id,
      turnCount: nextTurn,
      canRespin: true,
      currentContactId: chooseNextContact(previous.orbitIds, nextTurn, currentContact.id),
    }));

    return note;
  };

  const resetOnboarding = () => {
    setState((previous) => ({
      ...previous,
      isOnboarded: false,
      orbitIds: starterOrbitIds,
      currentContactId: starterOrbitIds[0],
      canRespin: true,
      turnCount: 0,
    }));
  };

  return (
    <OrbitContext.Provider
      value={{
        orbit,
        orbitIds: state.orbitIds,
        isOnboarded: state.isOnboarded,
        canRespin: state.canRespin,
        currentContact,
        incoming: incomingNotes,
        sentNotes: state.sentNotes,
        lastSentNote,
        completeOnboarding,
        updateOrbit,
        respin,
        sendNote,
        resetOnboarding,
      }}
    >
      {children}
    </OrbitContext.Provider>
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
