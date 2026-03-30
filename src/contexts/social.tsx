import { createContext, useContext, useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/auth';
import {
  acceptFriendRequest,
  declineFriendRequest,
  getAllDirectoryPeople,
  getFriends,
  getRequestsForUser,
  getUserById,
  searchUsers,
  sendFriendRequest,
} from '@/lib/social-store';
import type { FriendRequest, OrbitPerson, User } from '@/types';

interface RequestWithPerson extends FriendRequest {
  sender?: OrbitPerson;
  receiver?: OrbitPerson;
}

interface SocialContextType {
  profile: User | null;
  directory: OrbitPerson[];
  friends: OrbitPerson[];
  receivedRequests: RequestWithPerson[];
  sentRequests: RequestWithPerson[];
  searchDirectory: (query: string) => OrbitPerson[];
  sendRequest: (receiverId: string) => string | null;
  acceptRequest: (requestId: string) => void;
  declineRequest: (requestId: string) => void;
  getPersonById: (personId: string) => OrbitPerson | null;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export function SocialProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [revision, setRevision] = useState(0);

  void revision;

  const profile = user ? getUserById(user.id) : null;
  const friends = user ? getFriends(user.id) : [];
  const directory = user ? getAllDirectoryPeople(user.id) : [];
  const requests = user ? getRequestsForUser(user.id) : { received: [], sent: [] };

  const refresh = () => {
    setRevision((previous) => previous + 1);
  };

  const searchDirectory = (query: string) => {
    if (!user) {
      return [];
    }

    return searchUsers(query, user.id);
  };

  const sendRequest = (receiverId: string) => {
    if (!user) {
      return 'Sign in first.';
    }

    const error = sendFriendRequest(user.id, receiverId);
    refresh();
    return error;
  };

  const acceptRequest = (requestId: string) => {
    acceptFriendRequest(requestId);
    refresh();
  };

  const declineRequest = (requestId: string) => {
    declineFriendRequest(requestId);
    refresh();
  };

  const getPersonById = (personId: string) => {
    const person = getUserById(personId);
    if (!person) {
      return null;
    }

    return {
      id: person.id,
      name: person.name,
      email: person.email,
      relationship: person.relationship ?? 'Friend',
      city: person.city ?? 'Unknown',
      lastContact: 'recently',
      avatar: person.avatar,
      stampImage: person.stampImage ?? '/stamps/lina-stamp.png',
      accent: person.accent ?? '#A6725A',
      memory: person.memory ?? 'Connected on Orbit.',
    };
  };

  return (
    <SocialContext.Provider
      value={{
        profile,
        directory,
        friends,
        receivedRequests: requests.received,
        sentRequests: requests.sent,
        searchDirectory,
        sendRequest,
        acceptRequest,
        declineRequest,
        getPersonById,
      }}
    >
      {children}
    </SocialContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSocial() {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useSocial must be used within a SocialProvider');
  }

  return context;
}
