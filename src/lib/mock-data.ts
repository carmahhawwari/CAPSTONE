import type { FontChoice, NoteTemplate, OrbitNote, OrbitPerson, SpinPrompt, User } from '@/types';

export const currentUser: User = {
  id: 'user-orbit',
  name: 'Maya',
  email: 'maya@orbit.app',
  avatar: 'M',
  faxNumber: 'ORB-2048',
  joinedAt: '2026-01-12T08:00:00Z',
};

export const orbitCandidates: OrbitPerson[] = [
  {
    id: 'p1',
    name: 'Lina',
    relationship: 'College roommate',
    city: 'Chicago',
    lastContact: '4 months ago',
    avatar: 'L',
    accent: '#EE8B68',
    memory: 'Still sends weather screenshots when it snows.',
  },
  {
    id: 'p2',
    name: 'Nikhil',
    relationship: 'High school best friend',
    city: 'Seattle',
    lastContact: '2 months ago',
    avatar: 'N',
    accent: '#6B78D6',
    memory: 'Knows the exact diner order from every road trip.',
  },
  {
    id: 'p3',
    name: 'Tala',
    relationship: 'Cousin',
    city: 'Amman',
    lastContact: '3 weeks ago',
    avatar: 'T',
    accent: '#5A8D76',
    memory: 'Always mails back recipes with extra notes in the margins.',
  },
  {
    id: 'p4',
    name: 'Jonah',
    relationship: 'Former lab partner',
    city: 'Boston',
    lastContact: '6 months ago',
    avatar: 'J',
    accent: '#C9833E',
    memory: 'Once stayed late just to help re-run the whole experiment.',
  },
  {
    id: 'p5',
    name: 'Rayan',
    relationship: 'Sibling',
    city: 'San Diego',
    lastContact: '1 month ago',
    avatar: 'R',
    accent: '#B3687D',
    memory: 'Still leaves voicemails instead of texting when it matters.',
  },
  {
    id: 'p6',
    name: 'Sofia',
    relationship: 'Study abroad friend',
    city: 'Lisbon',
    lastContact: '7 months ago',
    avatar: 'S',
    accent: '#9475D5',
    memory: 'Turned every wrong turn into a better afternoon.',
  },
  {
    id: 'p7',
    name: 'Ajji',
    relationship: 'Grandmother',
    city: 'Fremont',
    lastContact: '2 weeks ago',
    avatar: 'A',
    accent: '#B68A52',
    memory: 'Keeps every card in the same tin by the phone.',
  },
  {
    id: 'p8',
    name: 'Mina',
    relationship: 'Old coworker',
    city: 'New York',
    lastContact: '5 months ago',
    avatar: 'M',
    accent: '#4D7F93',
    memory: 'Sent tea to the office after the toughest launch week.',
  },
];

export const starterOrbitIds = ['p1', 'p2', 'p3', 'p5', 'p7'];

export const stationeryTemplates: NoteTemplate[] = [
  {
    id: 'lined',
    name: 'Lined notecard',
    description: 'Soft ruled lines and a little structure.',
    accent: '#E0B085',
    paper: 'template-lined',
  },
  {
    id: 'postcard',
    name: 'Postcard',
    description: 'A bold top margin, like something mailed from somewhere sunny.',
    accent: '#D5856E',
    paper: 'template-postcard',
  },
  {
    id: 'plain',
    name: 'Plain paper',
    description: 'Clean, airy, and unhurried.',
    accent: '#B9A97A',
    paper: 'template-plain',
  },
];

export const fontOptions: FontChoice[] = [
  {
    id: 'soft',
    name: 'Soft pen',
    className: 'font-soft',
    sample: 'A gentle handwritten note',
  },
  {
    id: 'diary',
    name: 'Diary',
    className: 'font-diary',
    sample: 'For something quietly personal',
  },
  {
    id: 'type',
    name: 'Typewriter',
    className: 'font-type',
    sample: 'Warm, mechanical, and crisp',
  },
  {
    id: 'letter',
    name: 'Letterpress',
    className: 'font-letter',
    sample: 'Classic, grounded, and clear',
  },
];

export const stampOptions = ['★', '✿', '☀', '♥', '✦', '☾'];

export const spinPrompts: SpinPrompt[] = [
  { id: 'sp1', copy: "You've been meaning to reach out. We'll handle the choice." },
  { id: 'sp2', copy: 'No occasion needed. Showing up is enough.' },
  { id: 'sp3', copy: 'Small note. Big feeling. One person at a time.' },
  { id: 'sp4', copy: 'Let the wheel decide who gets a little warmth today.' },
];

export const incomingNotes: OrbitNote[] = [
  {
    id: 'n1',
    senderId: 'p2',
    senderName: 'Nikhil',
    recipientId: currentUser.id,
    recipientName: currentUser.name,
    content:
      "I still think about that awful summer playlist you made and how somehow it became the soundtrack for one of my favorite weeks. You make ordinary days stick.",
    createdAt: '2026-03-26T19:10:00Z',
    templateId: 'plain',
    fontId: 'type',
    stamp: '★',
    preview: 'You make ordinary days stick.',
    status: 'incoming',
  },
  {
    id: 'n2',
    senderId: 'p7',
    senderName: 'Ajji',
    recipientId: currentUser.id,
    recipientName: currentUser.name,
    content:
      'I like imagining your apartment when I fold laundry. It makes me feel close to you in the middle of ordinary things.',
    createdAt: '2026-03-24T11:45:00Z',
    templateId: 'lined',
    fontId: 'letter',
    stamp: '♥',
    preview: 'It makes me feel close to you in ordinary things.',
    status: 'incoming',
  },
  {
    id: 'n3',
    senderId: 'p1',
    senderName: 'Lina',
    recipientId: currentUser.id,
    recipientName: currentUser.name,
    content:
      'Thank you for being the person I can send a photo of soup to and somehow feel more understood.',
    createdAt: '2026-03-22T09:30:00Z',
    templateId: 'postcard',
    fontId: 'soft',
    stamp: '✿',
    preview: 'The person I can send a photo of soup to.',
    status: 'incoming',
  },
];

export const starterSentNotes: OrbitNote[] = [
  {
    id: 's1',
    senderId: currentUser.id,
    senderName: currentUser.name,
    recipientId: 'p5',
    recipientName: 'Rayan',
    content: 'You make hard weeks feel less loud. I never say that enough.',
    createdAt: '2026-03-21T08:15:00Z',
    templateId: 'lined',
    fontId: 'diary',
    stamp: '☀',
    preview: 'You make hard weeks feel less loud.',
    status: 'sent',
  },
];

export const orbitFacts = [
  'Each person gets a shareable Orbit fax number later. That flow is stubbed for now.',
  'The wheel only lets you re-spin once. Surrender is part of the product.',
  'Inbox notes print slowly on purpose. The waiting is part of the meaning.',
];
