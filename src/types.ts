
export interface User {
  id: string;
  alias: string;
  status: 'online' | 'away' | 'offline';
  roomId: string | null;
  lat: number;
  lng: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderAlias: string;
  text: string;
  timestamp: string;
  type: 'user' | 'system';
  parentId?: string;
  reactions?: { emoji: string; count: number; userIds: string[] }[];
}

export interface Room {
  id: string;
  topic: string;
  frequency: string;
  population: number;
  maxPopulation: number;
  ttl: number; // Time to live in seconds
  distance: number; // in meters
  bearing: string; // e.g., 'NW'
  status: 'active' | 'expiring';
  lat: number;
  lng: number;
}

export interface NotificationSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  mutedChannels: string[]; // Room IDs
}
