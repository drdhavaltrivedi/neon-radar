import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { RadarView } from './components/RadarView';
import { ChatView } from './components/ChatView';
import { DeployModal } from './components/DeployModal';
import { IdentityDrawer } from './components/IdentityDrawer';
import { Room, Message, User } from './types';

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
  const [userAlias, setUserAlias] = useState('USER_' + Math.random().toString(36).substring(2, 6).toUpperCase());

  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;
    socketRef.current = io(SOCKET_URL);
    const socket = socketRef.current;

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

    return () => {
      socket.disconnect();
    };
  }, []);

  // Sync activeRoom when rooms update
  useEffect(() => {
    if (activeRoom) {
      const updatedActive = rooms.find(r => r.id === activeRoom.id);
      if (updatedActive && JSON.stringify(updatedActive) !== JSON.stringify(activeRoom)) {
        setActiveRoom(updatedActive);
      }
    }
  }, [rooms, activeRoom]);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.emit('user:set-alias', userAlias);
    }
  }, [userAlias]);

  const handleRoomSelect = (room: Room) => {
    setActiveRoom(room);
    setView('chat');
    if (socketRef.current) {
      socketRef.current.emit('room:join', room.id);
    }
  };

  const handleBackToRadar = () => {
    setView('radar');
    setActiveRoom(null);
    setCurrentRoomMembers([]); // Reset members when leaving
  };

  const handleSendMessage = (text: string, parentId?: string) => {
    if (socketRef.current) {
      socketRef.current.emit('message:send', { text, parentId });
    }
  };

  const handleSetStatus = (status: 'online' | 'away' | 'offline') => {
    if (socketRef.current) {
      socketRef.current.emit('user:set-status', status);
    }
  };

  const handleReactToMessage = (messageId: string, emoji: string) => {
    if (socketRef.current) {
      socketRef.current.emit('message:react', { messageId, emoji });
    }
  };

  const handleScrambleAlias = () => {
    const randomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    setUserAlias(`USER_${randomId}`);
  };

  const handleDeployInitiate = (topic: string) => {
    if (socketRef.current) {
      socketRef.current.emit('room:deploy', topic);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className="scanline" />
      <div className="vignette" />
      
      {view === 'radar' ? (
        <RadarView 
          rooms={rooms}
          users={members}
          onRoomSelect={handleRoomSelect}
          onDeployClick={() => setIsDeployModalOpen(true)}
          onIdentityClick={() => setIsIdentityDrawerOpen(true)}
          userAlias={userAlias}
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
