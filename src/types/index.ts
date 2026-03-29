export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  faxNumber: string;
  joinedAt: string;
}

export interface OrbitPerson {
  id: string;
  name: string;
  relationship: string;
  city: string;
  lastContact: string;
  avatar: string;
  accent: string;
  memory: string;
}

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  accent: string;
  paper: string;
}

export interface FontChoice {
  id: string;
  name: string;
  className: string;
  sample: string;
}

export interface OrbitNote {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  content: string;
  createdAt: string;
  templateId: string;
  fontId: string;
  stamp?: string;
  preview: string;
  status: 'incoming' | 'sent';
}

export interface SpinPrompt {
  id: string;
  copy: string;
}
