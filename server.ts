import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Constants ---
const CENTER_LAT = 34.0522;
const CENTER_LNG = -118.2437;
const MAX_MESSAGE_LENGTH = 500;
const MAX_ALIAS_LENGTH = 16;
const MAX_TOPIC_LENGTH = 32;
const MAX_MESSAGES_PER_ROOM = 200;
const ALLOWED_EMOJIS = ['👍', '❤️', '🔥', '😂', '😮', '😢', '💯', '⚡'];

// --- Rate Limiting ---
const rateLimits: Record<string, { count: number; resetAt: number }[]> = {};

function isRateLimited(socketId: string, action: string, maxPerWindow: number, windowMs: number): boolean {
  const key = `${socketId}:${action}`;
  const now = Date.now();

  if (!rateLimits[key]) rateLimits[key] = [];

  // Remove expired entries
  rateLimits[key] = rateLimits[key].filter(entry => entry.resetAt > now);

  if (rateLimits[key].length >= maxPerWindow) return true;

  rateLimits[key].push({ count: 1, resetAt: now + windowMs });
  return false;
}

// --- Input Sanitization ---
function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

function isValidAlias(alias: unknown): alias is string {
  return typeof alias === 'string' && alias.trim().length > 0 && alias.length <= MAX_ALIAS_LENGTH;
}

function isValidStatus(status: unknown): status is 'online' | 'away' | 'offline' {
  return status === 'online' || status === 'away' || status === 'offline';
}

// --- Interfaces ---
interface Reaction {
  emoji: string;
  count: number;
  userIds: string[];
}

interface Message {
  id: string;
  senderId: string;
  senderAlias: string;
  text: string;
  timestamp: string;
  type: 'user' | 'system';
  parentId?: string;
  reactions?: Reaction[];
}

interface Room {
  id: string;
  topic: string;
  frequency: string;
  population: number;
  maxPopulation: number;
  ttl: number;
  distance: number;
  bearing: string;
  status: 'active' | 'expiring';
  lat: number;
  lng: number;
}

interface UserStatus {
  id: string;
  alias: string;
  status: 'online' | 'away' | 'offline';
  roomId: string | null;
}

// --- Persistence ---
const ROOMS_FILE = path.join(__dirname, 'data', 'rooms.json');
const MESSAGES_FILE = path.join(__dirname, 'data', 'messages.json');

function loadData<T>(file: string, defaultValue: T): T {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (e) {
    console.error(`Error loading data from ${file}:`, e);
  }
  return defaultValue;
}

function saveData<T>(file: string, data: T): void {
  try {
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`Error saving data to ${file}:`, e);
  }
}

let rooms: Room[] = loadData(ROOMS_FILE, []);
const messagesByRoom: Record<string, Message[]> = loadData(MESSAGES_FILE, {});
const users: Record<string, UserStatus & { lat: number; lng: number }> = {};

async function startServer() {
  const app = express();

  app.use(cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'matrix_active',
      node_env: process.env.NODE_ENV,
      port: process.env.PORT,
      uptime: process.uptime(),
      rooms: rooms.length,
      users: Object.keys(users).length
    });
  });

  const PORT = Number(process.env.PORT) || 3000;

  // TTL Countdown logic
  setInterval(() => {
    let changed = false;
    const prevLength = rooms.length;

    rooms = rooms.map(room => {
      const newTtl = Math.max(0, room.ttl - 1);
      const status: 'active' | 'expiring' = newTtl < 600 ? 'expiring' : 'active';
      if (room.ttl !== newTtl) changed = true;
      return { ...room, ttl: newTtl, status };
    }).filter(room => room.ttl > 0);

    // Clean up messages for expired rooms
    if (rooms.length < prevLength) {
      const activeRoomIds = new Set(rooms.map(r => r.id));
      for (const roomId of Object.keys(messagesByRoom)) {
        if (!activeRoomIds.has(roomId)) {
          delete messagesByRoom[roomId];
        }
      }
      saveData(MESSAGES_FILE, messagesByRoom);
    }

    if (changed) {
      io.emit('rooms:update', rooms);
      saveData(ROOMS_FILE, rooms);
    }
  }, 1000);

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    let currentRoomId: string | null = null;
    let userAlias: string = 'ANON_' + socket.id.substring(0, 4).toUpperCase();

    const lat = CENTER_LAT + (Math.random() - 0.5) * 0.0015;
    const lng = CENTER_LNG + (Math.random() - 0.5) * 0.0015;

    users[socket.id] = {
      id: socket.id,
      alias: userAlias,
      status: 'online',
      roomId: null,
      lat,
      lng
    };

    socket.emit('rooms:update', rooms);
    io.emit('users:update', Object.values(users));

    const updateRoomMembers = (roomId: string) => {
      const members = Object.values(users).filter(u => u.roomId === roomId);
      io.to(roomId).emit('room:members', members);
    };

    socket.on('user:set-alias', (alias: unknown) => {
      if (!isValidAlias(alias)) return;
      if (isRateLimited(socket.id, 'alias', 5, 10000)) return;

      const sanitized = sanitizeText(alias);
      if (!sanitized) return;

      userAlias = sanitized;
      if (users[socket.id]) {
        users[socket.id].alias = sanitized;
        if (currentRoomId) updateRoomMembers(currentRoomId);
        io.emit('users:update', Object.values(users));
      }
    });

    socket.on('user:set-status', (status: unknown) => {
      if (!isValidStatus(status)) return;
      if (users[socket.id]) {
        users[socket.id].status = status;
        if (currentRoomId) updateRoomMembers(currentRoomId);
        io.emit('users:update', Object.values(users));
      }
    });

    socket.on('room:join', (roomId: unknown) => {
      if (typeof roomId !== 'string' || !roomId) return;

      const room = rooms.find(r => r.id === roomId);
      if (!room) return;

      if (room.population >= room.maxPopulation) {
        socket.emit('room:error', { message: 'Room is at maximum capacity' });
        return;
      }

      if (currentRoomId) {
        socket.leave(currentRoomId);
        const prevRoom = rooms.find(r => r.id === currentRoomId);
        if (prevRoom) prevRoom.population = Math.max(0, prevRoom.population - 1);
        const oldRoomId = currentRoomId;
        if (users[socket.id]) users[socket.id].roomId = null;
        updateRoomMembers(oldRoomId);
      }

      socket.join(roomId);
      currentRoomId = roomId;
      if (users[socket.id]) users[socket.id].roomId = roomId;

      room.population++;
      io.emit('rooms:update', rooms);
      saveData(ROOMS_FILE, rooms);

      socket.emit('room:messages', messagesByRoom[roomId] || []);
      updateRoomMembers(roomId);

      const systemMsg: Message = {
        id: 'sys_' + Date.now(),
        senderId: 'system',
        senderAlias: 'SYSTEM',
        text: `${userAlias} entered the radius.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
        type: 'system'
      };

      if (!messagesByRoom[roomId]) messagesByRoom[roomId] = [];
      messagesByRoom[roomId].push(systemMsg);
      io.to(roomId).emit('message:new', systemMsg);
      saveData(MESSAGES_FILE, messagesByRoom);
    });

    socket.on('message:send', (payload: unknown) => {
      if (!currentRoomId) return;
      if (typeof payload !== 'object' || payload === null) return;

      const { text, parentId } = payload as { text: unknown; parentId?: unknown };
      if (typeof text !== 'string' || !text.trim()) return;
      if (text.length > MAX_MESSAGE_LENGTH) return;
      if (parentId !== undefined && typeof parentId !== 'string') return;

      // Rate limit: 10 messages per 10 seconds
      if (isRateLimited(socket.id, 'message', 10, 10000)) {
        socket.emit('message:error', { message: 'Slow down! You are sending messages too quickly.' });
        return;
      }

      const sanitizedText = sanitizeText(text);
      if (!sanitizedText) return;

      const newMessage: Message = {
        id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6),
        senderId: socket.id,
        senderAlias: userAlias,
        text: sanitizedText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
        type: 'user',
        parentId: parentId as string | undefined,
        reactions: []
      };

      if (!messagesByRoom[currentRoomId]) messagesByRoom[currentRoomId] = [];
      messagesByRoom[currentRoomId].push(newMessage);

      // Cap message history per room
      if (messagesByRoom[currentRoomId].length > MAX_MESSAGES_PER_ROOM) {
        messagesByRoom[currentRoomId] = messagesByRoom[currentRoomId].slice(-MAX_MESSAGES_PER_ROOM);
      }

      io.to(currentRoomId).emit('message:new', newMessage);
      saveData(MESSAGES_FILE, messagesByRoom);
    });

    socket.on('message:react', (payload: unknown) => {
      if (!currentRoomId) return;
      if (typeof payload !== 'object' || payload === null) return;

      const { messageId, emoji } = payload as { messageId: unknown; emoji: unknown };
      if (typeof messageId !== 'string' || typeof emoji !== 'string') return;
      if (!ALLOWED_EMOJIS.includes(emoji)) return;

      if (isRateLimited(socket.id, 'react', 20, 10000)) return;

      const roomMessages = messagesByRoom[currentRoomId];
      if (!roomMessages) return;

      const msg = roomMessages.find(m => m.id === messageId);
      if (!msg) return;

      const reactions = msg.reactions || [];
      const existingReactionIndex = reactions.findIndex(r => r.emoji === emoji);

      if (existingReactionIndex > -1) {
        const reaction = reactions[existingReactionIndex];
        const userIndex = reaction.userIds.indexOf(socket.id);

        if (userIndex > -1) {
          reaction.userIds.splice(userIndex, 1);
          reaction.count--;
          if (reaction.count === 0) {
            reactions.splice(existingReactionIndex, 1);
          }
        } else {
          reaction.userIds.push(socket.id);
          reaction.count++;
        }
      } else {
        reactions.push({ emoji, count: 1, userIds: [socket.id] });
      }

      msg.reactions = reactions;
      io.to(currentRoomId).emit('message:update', msg);
      saveData(MESSAGES_FILE, messagesByRoom);
    });

    socket.on('room:deploy', (topic: unknown) => {
      if (typeof topic !== 'string' || !topic.trim()) return;
      if (topic.length > MAX_TOPIC_LENGTH) return;

      // Rate limit: 3 rooms per 60 seconds
      if (isRateLimited(socket.id, 'deploy', 3, 60000)) {
        socket.emit('room:error', { message: 'You are deploying rooms too quickly. Wait a moment.' });
        return;
      }

      const sanitizedTopic = sanitizeText(topic);
      if (!sanitizedTopic) return;

      const newRoom: Room = {
        id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6),
        topic: sanitizedTopic,
        frequency: (Math.random() * 20 + 90).toFixed(1),
        population: 0,
        maxPopulation: 32,
        ttl: 3600,
        distance: Math.random() * 90 + 10,
        bearing: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
        status: 'active',
        lat: CENTER_LAT + (Math.random() - 0.5) * 0.001,
        lng: CENTER_LNG + (Math.random() - 0.5) * 0.001
      };

      rooms.push(newRoom);
      io.emit('rooms:update', rooms);
      socket.emit('room:deployed', newRoom);
      saveData(ROOMS_FILE, rooms);
    });

    socket.on('disconnect', () => {
      if (currentRoomId) {
        const room = rooms.find(r => r.id === currentRoomId);
        if (room) {
          room.population = Math.max(0, room.population - 1);
          io.emit('rooms:update', rooms);
        }
        const oldRoomId = currentRoomId;
        delete users[socket.id];
        updateRoomMembers(oldRoomId);
        io.emit('users:update', Object.values(users));
      } else {
        delete users[socket.id];
        io.emit('users:update', Object.values(users));
      }

      // Clean up rate limit entries for this socket
      for (const key of Object.keys(rateLimits)) {
        if (key.startsWith(socket.id + ':')) {
          delete rateLimits[key];
        }
      }

      console.log('User disconnected:', socket.id);
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
