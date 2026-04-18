export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  faxNumber: string;
  joinedAt: string;
  accent?: string;
  city?: string;
  relationship?: string;
  stampImage?: string;
  memory?: string;
}

export interface OrbitPerson {
  id: string;
  name: string;
  email?: string;
  relationship: string;
  city: string;
  lastContact: string;
  avatar: string;
  stampImage: string;
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

export interface ReceiptTextBlock {
  id: string;
  type: 'text';
  text: string;
  fontId: string;
  size: number;
}

export interface ReceiptWordArtBlock {
  id: string;
  type: 'word-art';
  text: string;
  fontId: string;
  size: number;
  weight: 'bold' | 'black';
  transform: 'none' | 'uppercase';
}

export interface ReceiptImageBlock {
  id: string;
  type: 'image';
  src: string;
  name: string;
}

export type ReceiptBlock = ReceiptTextBlock | ReceiptWordArtBlock | ReceiptImageBlock;

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
  promptLabel?: string;
  receiptBlocks?: ReceiptBlock[];
  imageName?: string;
  audioName?: string;
  signatureName?: string;
  status: 'incoming' | 'sent';
}

export interface SpinPrompt {
  id: string;
  copy: string;
}

export interface PromptChoice {
  id: string;
  text: string;
  type: 'prompt' | 'open';
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'declined';
}
