export interface Friend {
  id: string
  name: string
  address: string
  avatarId: 1 | 2 | 3 | 5
}

export interface Receipt {
  id: string
  date: string
  to: string
  from: string
  prompt?: string
  content: string
  imageDataUrl?: string
  friendId: string
}
