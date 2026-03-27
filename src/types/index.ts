export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  createdAt: string;
}

export interface Affirmation {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  contextMemoryId?: string;
  createdAt: string;
  sender?: User;
  receiver?: User;
  memory?: Memory;
}

export interface Memory {
  id: string;
  userId: string;
  sharedWithUserId?: string;
  title: string;
  description: string;
  date: string;
  location?: string;
  tags: string[];
  createdAt: string;
}

export interface Prompt {
  id: string;
  text: string;
}

export interface DailyAssignment {
  id: string;
  date: string;
  writeToUserId: string;
  receiveFromUserId: string;
  sentAffirmationId?: string;
  receivedAffirmationId?: string;
}
