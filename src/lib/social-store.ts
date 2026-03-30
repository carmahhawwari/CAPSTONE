import { currentUser, orbitCandidates } from '@/lib/mock-data';
import type { FriendRequest, OrbitPerson, User } from '@/types';

interface StoredUser extends User {
  password: string;
}

interface Friendship {
  id: string;
  userAId: string;
  userBId: string;
  createdAt: string;
}

interface SocialStore {
  users: StoredUser[];
  friendRequests: FriendRequest[];
  friendships: Friendship[];
}

const STORE_KEY = 'orbit.prototype.social-store';
const DEFAULT_PASSWORD = 'password123';
const STARTER_FRIEND_IDS = ['p1', 'p2', 'p3', 'p5', 'p7'];

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function makeFaxNumber(id: string) {
  return `ORB-${id.slice(-4).toUpperCase()}`;
}

function seededUsers(): StoredUser[] {
  const seededCurrentUser: StoredUser = {
    ...currentUser,
    accent: '#A6725A',
    city: 'San Francisco',
    relationship: 'You',
    stampImage: '/stamps/mina-stamp.png',
    memory: 'The one writing the note.',
    password: DEFAULT_PASSWORD,
  };

  const seededFriends = orbitCandidates.map((person) => ({
    id: person.id,
    name: person.name,
    email: `${slugify(person.name)}@orbit.local`,
    avatar: person.avatar,
    faxNumber: makeFaxNumber(person.id),
    joinedAt: '2026-01-12T08:00:00Z',
    accent: person.accent,
    city: person.city,
    relationship: person.relationship,
    stampImage: person.stampImage,
    memory: person.memory,
    password: DEFAULT_PASSWORD,
  }));

  return [seededCurrentUser, ...seededFriends];
}

function seededFriendships(): Friendship[] {
  return STARTER_FRIEND_IDS.map((friendId, index) => ({
    id: `friendship-seed-${friendId}`,
    userAId: currentUser.id,
    userBId: friendId,
    createdAt: new Date(Date.UTC(2026, 0, 12 + index)).toISOString(),
  }));
}

function defaultStore(): SocialStore {
  return {
    users: seededUsers(),
    friendRequests: [],
    friendships: seededFriendships(),
  };
}

function readStore(): SocialStore {
  if (typeof window === 'undefined') {
    return defaultStore();
  }

  const saved = window.localStorage.getItem(STORE_KEY);
  if (!saved) {
    const seeded = defaultStore();
    window.localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<SocialStore>;
    return {
      users: Array.isArray(parsed.users) && parsed.users.length ? (parsed.users as StoredUser[]) : defaultStore().users,
      friendRequests: Array.isArray(parsed.friendRequests) ? (parsed.friendRequests as FriendRequest[]) : [],
      friendships: Array.isArray(parsed.friendships) ? (parsed.friendships as Friendship[]) : defaultStore().friendships,
    };
  } catch {
    const seeded = defaultStore();
    window.localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function writeStore(store: SocialStore) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function toOrbitPerson(user: StoredUser): OrbitPerson {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    relationship: user.relationship ?? 'Friend',
    city: user.city ?? 'Unknown',
    lastContact: 'recently',
    avatar: user.avatar,
    stampImage: user.stampImage ?? '/stamps/lina-stamp.png',
    accent: user.accent ?? '#A6725A',
    memory: user.memory ?? 'Connected on Orbit.',
  };
}

export function getUserById(userId: string) {
  return readStore().users.find((user) => user.id === userId) ?? null;
}

export function getUserByEmail(email: string) {
  return readStore().users.find((user) => user.email.toLowerCase() === email.trim().toLowerCase()) ?? null;
}

export function createUser(input: { name: string; email: string; password: string }) {
  const store = readStore();
  const normalizedEmail = input.email.trim().toLowerCase();

  if (store.users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    return { error: 'An account with that email already exists.', user: null as StoredUser | null };
  }

  const id = `user-${Date.now()}`;
  const avatar = input.name.trim().charAt(0).toUpperCase() || 'U';
  const stampIndex = store.users.length % orbitCandidates.length;
  const user: StoredUser = {
    id,
    name: input.name.trim(),
    email: normalizedEmail,
    avatar,
    faxNumber: makeFaxNumber(id),
    joinedAt: new Date().toISOString(),
    accent: orbitCandidates[stampIndex]?.accent ?? '#A6725A',
    city: 'Unknown',
    relationship: 'Friend',
    stampImage: orbitCandidates[stampIndex]?.stampImage ?? '/stamps/lina-stamp.png',
    memory: 'Connected on Orbit.',
    password: input.password,
  };

  store.users = [...store.users, user];
  writeStore(store);
  return { error: null, user };
}

export function validateUser(email: string, password: string) {
  const user = getUserByEmail(email);
  if (!user || user.password !== password) {
    return null;
  }

  return user;
}

export function searchUsers(query: string, currentUserId: string) {
  const value = query.trim().toLowerCase();
  if (!value) {
    return [];
  }

  return readStore().users
    .filter((user) => user.id !== currentUserId)
    .filter((user) => user.name.toLowerCase().includes(value) || user.email.toLowerCase().includes(value))
    .map(toOrbitPerson);
}

export function getAllDirectoryPeople(currentUserId: string) {
  return readStore().users.filter((user) => user.id !== currentUserId).map(toOrbitPerson);
}

export function getFriends(currentUserId: string) {
  const store = readStore();
  const friendIds = store.friendships.flatMap((friendship) => {
    if (friendship.userAId === currentUserId) {
      return [friendship.userBId];
    }

    if (friendship.userBId === currentUserId) {
      return [friendship.userAId];
    }

    return [];
  });

  return store.users.filter((user) => friendIds.includes(user.id)).map(toOrbitPerson);
}

export function getRequestsForUser(currentUserId: string) {
  const store = readStore();

  const received = store.friendRequests
    .filter((request) => request.receiverId === currentUserId && request.status === 'pending')
    .map((request) => ({ request, sender: store.users.find((user) => user.id === request.senderId) ?? null }))
    .filter((item): item is { request: FriendRequest; sender: StoredUser } => Boolean(item.sender));

  const sent = store.friendRequests
    .filter((request) => request.senderId === currentUserId && request.status === 'pending')
    .map((request) => ({ request, receiver: store.users.find((user) => user.id === request.receiverId) ?? null }))
    .filter((item): item is { request: FriendRequest; receiver: StoredUser } => Boolean(item.receiver));

  return {
    received: received.map(({ request, sender }) => ({ ...request, sender: toOrbitPerson(sender) })),
    sent: sent.map(({ request, receiver }) => ({ ...request, receiver: toOrbitPerson(receiver) })),
  };
}

export function sendFriendRequest(senderId: string, receiverId: string) {
  const store = readStore();
  const alreadyFriends = store.friendships.some(
    (friendship) =>
      (friendship.userAId === senderId && friendship.userBId === receiverId) ||
      (friendship.userAId === receiverId && friendship.userBId === senderId),
  );

  if (alreadyFriends) {
    return 'You are already connected.';
  }

  const alreadyPending = store.friendRequests.some(
    (request) =>
      request.status === 'pending' &&
      ((request.senderId === senderId && request.receiverId === receiverId) ||
        (request.senderId === receiverId && request.receiverId === senderId)),
  );

  if (alreadyPending) {
    return 'A pending request already exists.';
  }

  store.friendRequests = [
    ...store.friendRequests,
    {
      id: `request-${Date.now()}`,
      senderId,
      receiverId,
      createdAt: new Date().toISOString(),
      status: 'pending',
    },
  ];
  writeStore(store);
  return null;
}

export function acceptFriendRequest(requestId: string) {
  const store = readStore();
  const request = store.friendRequests.find((item) => item.id === requestId);
  if (!request) {
    return;
  }

  store.friendRequests = store.friendRequests.map((item) =>
    item.id === requestId ? { ...item, status: 'accepted' } : item,
  );
  store.friendships = [
    ...store.friendships,
    {
      id: `friendship-${Date.now()}`,
      userAId: request.senderId,
      userBId: request.receiverId,
      createdAt: new Date().toISOString(),
    },
  ];
  writeStore(store);
}

export function declineFriendRequest(requestId: string) {
  const store = readStore();
  store.friendRequests = store.friendRequests.map((item) =>
    item.id === requestId ? { ...item, status: 'declined' } : item,
  );
  writeStore(store);
}
