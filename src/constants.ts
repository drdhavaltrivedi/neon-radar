import { Room, Message } from './types';

export const MOCK_ROOMS: Room[] = [
  {
    id: '1',
    topic: 'Neon Nights',
    frequency: '104.5',
    population: 12,
    maxPopulation: 50,
    ttl: 2535,
    distance: 28,
    bearing: 'NW',
    status: 'active',
    lat: 34.0522,
    lng: -118.2437
  },
  {
    id: '2',
    topic: 'Campus Quad',
    frequency: '98.2',
    population: 4,
    maxPopulation: 20,
    ttl: 930,
    distance: 75,
    bearing: 'NE',
    status: 'active',
    lat: 34.0532,
    lng: -118.2427
  },
  {
    id: '3',
    topic: 'Main St Meetup',
    frequency: '101.1',
    population: 18,
    maxPopulation: 20,
    ttl: 225,
    distance: 85,
    bearing: 'SE',
    status: 'expiring',
    lat: 34.0512,
    lng: -118.2447
  }
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    senderId: 'user_f4a9',
    senderAlias: 'User_F4A9',
    text: 'Anyone near the food trucks?',
    timestamp: '14:02:44',
    type: 'user'
  },
  {
    id: '2',
    senderId: 'system',
    senderAlias: 'SYSTEM',
    text: 'User_B29C entered the radius.',
    timestamp: '14:03:12',
    type: 'system'
  },
  {
    id: '3',
    senderId: 'user_b29c',
    senderAlias: 'User_B29C',
    text: "Yeah, I'm by the taco stand. Line is huge.",
    timestamp: '14:03:45',
    type: 'user'
  },
  {
    id: '4',
    senderId: 'user_f4a9',
    senderAlias: 'User_F4A9',
    text: "Grab me a spot? I'm walking over from the library now.",
    timestamp: '14:04:10',
    type: 'user'
  },
  {
    id: '5',
    senderId: 'system',
    senderAlias: 'SYSTEM',
    text: 'T-Minus 5 minutes to auto-destruct.',
    timestamp: '14:05:00',
    type: 'system'
  }
];
