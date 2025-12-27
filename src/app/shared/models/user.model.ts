export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'admin' | 'moderator';
  friends?: number[];  // Array of friend IDs
  groups?: number[];   // Array of group IDs
  bio?: string;
  location?: string;
  status?: 'online' | 'away' | 'offline';
  lastSeen?: Date;
}