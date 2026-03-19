import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  ttl: number; // TTL in seconds
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

import fs from 'fs';

const CENTER_LAT = 34.0522;
const CENTER_LNG = -118.2437;

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

function saveData(file: string, data: any) {
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
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  const PORT = 3000;

  // TTL Countdown logic
  setInterval(() => {
    let changed = false;
    rooms = rooms.map(room => {
      const newTtl = Math.max(0, room.ttl - 1);
      const status: 'active' | 'expiring' = newTtl < 600 ? 'expiring' : 'active';
      if (room.ttl !== newTtl) changed = true;
      return { ...room, ttl: newTtl, status };
    }).filter(room => room.ttl > 0);
    
    if (changed) {
      io.emit('rooms:update', rooms);
      saveData(ROOMS_FILE, rooms);
    }
  }, 1000);

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    let currentRoomId: string | null = null;
    let userAlias: string = 'ANON_' + socket.id.substring(0, 4).toUpperCase();
    
    // Assign a random position within 100m (roughly 0.0009 degrees)
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

    socket.on('user:set-alias', (alias: string) => {
      userAlias = alias;
      if (users[socket.id]) {
        users[socket.id].alias = alias;
        if (currentRoomId) updateRoomMembers(currentRoomId);
        io.emit('users:update', Object.values(users));
      }
    });

    socket.on('user:set-status', (status: 'online' | 'away' | 'offline') => {
      if (users[socket.id]) {
        users[socket.id].status = status;
        if (currentRoomId) updateRoomMembers(currentRoomId);
        io.emit('users:update', Object.values(users));
      }
    });

    socket.on('room:join', (roomId: string) => {
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
      
      const room = rooms.find(r => r.id === roomId);
      if (room) {
        room.population++;
        io.emit('rooms:update', rooms);
        saveData(ROOMS_FILE, rooms);
      }

      // Send existing messages
      socket.emit('room:messages', messagesByRoom[roomId] || []);
      updateRoomMembers(roomId);
      
      // System message
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

    socket.on('message:send', ({ text, parentId }: { text: string, parentId?: string }) => {
      console.log(`[MESSAGE_SEND] from ${userAlias} in room ${currentRoomId}: ${text}`);
      if (!currentRoomId) {
        console.log(`[MESSAGE_SEND_FAILED] No current room ID for socket ${socket.id}`);
        return;
      }

      const newMessage: Message = {
        id: Date.now().toString(),
        senderId: socket.id,
        senderAlias: userAlias,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
        type: 'user',
        parentId,
        reactions: []
      };

      if (!messagesByRoom[currentRoomId]) messagesByRoom[currentRoomId] = [];
      messagesByRoom[currentRoomId].push(newMessage);
      io.to(currentRoomId).emit('message:new', newMessage);
      saveData(MESSAGES_FILE, messagesByRoom);
    });

    socket.on('message:react', ({ messageId, emoji }: { messageId: string, emoji: string }) => {
      if (!currentRoomId) return;

      const roomMessages = messagesByRoom[currentRoomId];
      if (!roomMessages) return;

      const msgIndex = roomMessages.findIndex(m => m.id === messageId);
      if (msgIndex === -1) return;

      const msg = roomMessages[msgIndex];
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

    socket.on('room:deploy', (topic: string) => {
      const newRoom: Room = {
        id: Date.now().toString(),
        topic,
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
