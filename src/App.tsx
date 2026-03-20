import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { RadarView } from './components/RadarView';
import { ChatView } from './components/ChatView';
import { DeployModal } from './components/DeployModal';
import { IdentityDrawer } from './components/IdentityDrawer';
import { Room, Message, User } from './types';

function getStoredAlias(): string {
  try {
    const stored = localStorage.getItem('neon-radar:alias');
    if (stored && stored.trim()) return stored;
  } catch {}
  return 'USER_' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

export default function App() {
  const socketRef = useRef<Socket | null>(null);
  const [view, setView] = useState<'radar' | 'chat'>('radar');
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [currentRoomMembers, setCurrentRoomMembers] = useState<User[]>([]);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isIdentityDrawerOpen, setIsIdentityDrawerOpen] = useState(false);
  const [userAlias, setUserAlias] = useState(getStoredAlias);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;
    socketRef.current = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    const socket = socketRef.current;

    socket.on('connect', () => {
      setConnectionStatus('connected');
      setErrorMessage(null);
      // Re-send alias on reconnect
      socket.emit('user:set-alias', userAlias);
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('rooms:update', (updatedRooms: Room[]) => {
      setRooms(updatedRooms);
    });

    socket.on('users:update', (updatedUsers: User[]) => {
      setMembers(updatedUsers);
    });

    socket.on('room:messages', (roomMessages: Message[]) => {
      setMessages(roomMessages);
    });

    socket.on('room:members', (roomMembers: User[]) => {
      setCurrentRoomMembers(roomMembers);
    });

    socket.on('message:new', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('message:update', (updatedMessage: Message) => {
      setMessages(prev => prev.map(m => m.id === updatedMessage.id ? updatedMessage : m));
    });

    socket.on('room:deployed', (newRoom: Room) => {
      handleRoomSelect(newRoom);
      setIsDeployModalOpen(false);
    });

    socket.on('message:error', (data: { message: string }) => {
      setErrorMessage(data.message);
      setTimeout(() => setErrorMessage(null), 3000);
    });

    socket.on('room:error', (data: { message: string }) => {
      setErrorMessage(data.message);
      setTimeout(() => setErrorMessage(null), 3000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Sync activeRoom when rooms update
  useEffect(() => {
    if (activeRoom) {
      const updatedActive = rooms.find(r => r.id === activeRoom.id);
      if (updatedActive) {
        setActiveRoom(updatedActive);
      } else {
        // Room expired — go back to radar
        setView('radar');
        setActiveRoom(null);
        setCurrentRoomMembers([]);
      }
    }
  }, [rooms]);

  // Persist alias to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('neon-radar:alias', userAlias);
    } catch {}
    if (socketRef.current) {
      socketRef.current.emit('user:set-alias', userAlias);
    }
  }, [userAlias]);

  const handleRoomSelect = useCallback((room: Room) => {
    setActiveRoom(room);
    setView('chat');
    if (socketRef.current) {
      socketRef.current.emit('room:join', room.id);
    }
  }, []);

  const handleBackToRadar = useCallback(() => {
    setView('radar');
    setActiveRoom(null);
    setCurrentRoomMembers([]);
  }, []);

  const handleSendMessage = useCallback((text: string, parentId?: string) => {
    if (socketRef.current) {
      socketRef.current.emit('message:send', { text, parentId });
    }
  }, []);

  const handleSetStatus = useCallback((status: 'online' | 'away' | 'offline') => {
    if (socketRef.current) {
      socketRef.current.emit('user:set-status', status);
    }
  }, []);

  const handleReactToMessage = useCallback((messageId: string, emoji: string) => {
    if (socketRef.current) {
      socketRef.current.emit('message:react', { messageId, emoji });
    }
  }, []);

  const handleScrambleAlias = useCallback(() => {
    const randomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    setUserAlias(`USER_${randomId}`);
  }, []);

  const handleDeployInitiate = useCallback((topic: string) => {
    if (socketRef.current) {
      socketRef.current.emit('room:deploy', topic);
    }
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className="scanline" />
      <div className="vignette" />

      {/* Connection Status Banner */}
      {connectionStatus === 'disconnected' && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-danger/90 text-white text-center py-2 text-sm font-mono uppercase tracking-wider animate-pulse">
          Signal Lost — Attempting Reconnection...
        </div>
      )}

      {/* Error Toast */}
      {errorMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-danger/90 border border-danger text-white px-6 py-3 rounded font-mono text-sm shadow-neon-danger">
          {errorMessage}
        </div>
      )}

      {view === 'radar' ? (
        <RadarView
          rooms={rooms}
          users={members}
          onRoomSelect={handleRoomSelect}
          onDeployClick={() => setIsDeployModalOpen(true)}
          onIdentityClick={() => setIsIdentityDrawerOpen(true)}
          userAlias={userAlias}
          connectionStatus={connectionStatus}
        />
      ) : (
        activeRoom && (
          <ChatView
            room={activeRoom}
            rooms={rooms}
            messages={messages}
            members={currentRoomMembers}
            onBack={handleBackToRadar}
            onSendMessage={handleSendMessage}
            onSetStatus={handleSetStatus}
            onReactToMessage={handleReactToMessage}
            userAlias={userAlias}
            onScramble={handleScrambleAlias}
            onRoomSelect={handleRoomSelect}
            onDeployClick={() => setIsDeployModalOpen(true)}
            connectionStatus={connectionStatus}
          />
        )
      )}

      <DeployModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        onInitiate={handleDeployInitiate}
      />

      <IdentityDrawer
        isOpen={isIdentityDrawerOpen}
        onClose={() => setIsIdentityDrawerOpen(false)}
        alias={userAlias}
        onScramble={handleScrambleAlias}
        onAliasChange={setUserAlias}
        activeUsers={members.length}
      />
    </div>
  );
}
