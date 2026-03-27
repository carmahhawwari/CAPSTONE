import type { User, Affirmation, Memory, Prompt, DailyAssignment } from '@/types';

export const currentUser: User = {
  id: 'u1',
  name: 'Carmah',
  email: 'carmah@example.com',
  avatar: '/images/char1.svg',
  createdAt: '2025-01-01T00:00:00Z',
};

export const users: User[] = [
  currentUser,
  { id: 'u2', name: 'Lina', email: 'lina@example.com', avatar: '/images/char2.svg', createdAt: '2025-01-02T00:00:00Z' },
  { id: 'u3', name: 'Rayan', email: 'rayan@example.com', avatar: '/images/char3.svg', createdAt: '2025-01-03T00:00:00Z' },
  { id: 'u4', name: 'Noor', email: 'noor@example.com', avatar: '/images/char4.svg', createdAt: '2025-02-01T00:00:00Z' },
];

export const memories: Memory[] = [
  {
    id: 'm1',
    userId: 'u1',
    sharedWithUserId: 'u2',
    title: 'Late night study session',
    description: 'We stayed up until 3am finishing our project together. You brought me coffee without asking.',
    date: '2025-09-20T03:00:00Z',
    location: 'Green Library',
    tags: ['gratitude', 'friendship'],
    createdAt: '2025-09-21T00:00:00Z',
  },
  {
    id: 'm2',
    userId: 'u1',
    sharedWithUserId: 'u2',
    title: 'First day jitters',
    description: 'You walked me to my first class and waited outside until I was settled.',
    date: '2025-09-01T08:00:00Z',
    tags: ['support', 'beginnings'],
    createdAt: '2025-09-01T12:00:00Z',
  },
  {
    id: 'm3',
    userId: 'u1',
    sharedWithUserId: 'u3',
    title: 'Road trip to Big Sur',
    description: 'We got lost three times and laughed so hard we had to pull over. Best wrong turns of my life.',
    date: '2025-11-15T10:00:00Z',
    location: 'Big Sur',
    tags: ['adventure', 'joy'],
    createdAt: '2025-11-16T00:00:00Z',
  },
  {
    id: 'm4',
    userId: 'u1',
    sharedWithUserId: 'u4',
    title: 'The quiet bench moment',
    description: 'We sat on that bench for an hour saying nothing. Sometimes that\'s all you need.',
    date: '2025-12-05T16:00:00Z',
    tags: ['presence', 'comfort'],
    createdAt: '2025-12-06T00:00:00Z',
  },
];

export const prompts: Prompt[] = [
  { id: 'p1', text: 'Tell them what they helped you through this week.' },
  { id: 'p2', text: 'Share a memory you\'ve never said out loud.' },
  { id: 'p3', text: 'What\'s something small they did that meant everything?' },
  { id: 'p4', text: 'What would you want them to know if you couldn\'t see them tomorrow?' },
];

// Today's assignment: write to Lina, receive from Rayan
export const todayAssignment: DailyAssignment = {
  id: 'd1',
  date: new Date().toISOString().split('T')[0],
  writeToUserId: 'u2',
  receiveFromUserId: 'u3',
  sentAffirmationId: undefined,
  receivedAffirmationId: 'a2',
};

// Past assignments
export const pastAssignments: DailyAssignment[] = [
  {
    id: 'd2',
    date: '2026-03-25',
    writeToUserId: 'u4',
    receiveFromUserId: 'u2',
    sentAffirmationId: 'a3',
    receivedAffirmationId: 'a1',
  },
  {
    id: 'd3',
    date: '2026-03-24',
    writeToUserId: 'u3',
    receiveFromUserId: 'u4',
    sentAffirmationId: 'a4',
    receivedAffirmationId: 'a5',
  },
];

export const affirmations: Affirmation[] = [
  {
    id: 'a1',
    senderId: 'u2',
    receiverId: 'u1',
    content: 'I never told you this, but that night you stayed up helping me study completely changed how I thought about friendship. You didn\'t have to, and you never made me feel like I owed you anything.',
    createdAt: '2026-03-25T10:00:00Z',
    sender: users[1],
  },
  {
    id: 'a2',
    senderId: 'u3',
    receiverId: 'u1',
    content: 'You always know exactly when I need to hear something kind. That\'s rare and I don\'t want you to forget it.',
    createdAt: '2026-03-26T14:00:00Z',
    sender: users[2],
  },
  {
    id: 'a3',
    senderId: 'u1',
    receiverId: 'u4',
    content: 'You make every hard thing feel more manageable just by being there. Thank you for walking beside me through all of it.',
    contextMemoryId: 'm2',
    createdAt: '2026-03-25T09:00:00Z',
    sender: currentUser,
    receiver: users[3],
    memory: memories[1],
  },
  {
    id: 'a4',
    senderId: 'u1',
    receiverId: 'u3',
    content: 'I hope you know that your laugh is one of the best sounds in the world. It makes every room warmer.',
    createdAt: '2026-03-24T11:00:00Z',
    sender: currentUser,
    receiver: users[2],
  },
  {
    id: 'a5',
    senderId: 'u4',
    receiverId: 'u1',
    content: 'You showed up for me when no one else did. I think about that more than you know.',
    createdAt: '2026-03-24T16:00:00Z',
    sender: users[3],
  },
];
