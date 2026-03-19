import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radar, Fingerprint, Plus, Timer } from 'lucide-react';
import { User, Room } from '../types';

interface RadarViewProps {
  rooms: Room[];
  users: User[];
  onRoomSelect: (room: Room) => void;
  onDeployClick: () => void;
  onIdentityClick: () => void;
  userAlias: string;
}

const CENTER_LAT = 34.0522;
const CENTER_LNG = -118.2437;
const COORDINATE_SCALE = 500000; // Adjust for fit in 800px container

export const RadarView: React.FC<RadarViewProps> = ({
  rooms,
  users,
  onRoomSelect,
  onDeployClick,
  onIdentityClick,
  userAlias
}) => {
  const [hoveredRoom, setHoveredRoom] = useState<Room | null>(null);
  const [hoveredUser, setHoveredUser] = useState<User | null>(null);

  const formatTtl = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPos = (lat: number, lng: number) => {
    const x = (lng - CENTER_LNG) * COORDINATE_SCALE;
    const y = (CENTER_LAT - lat) * COORDINATE_SCALE;
    return { 
      left: `calc(50% + ${x}px)`, 
      top: `calc(50% + ${y}px)` 
    };
  };

  return (
    <div className="relative h-screen w-screen flex flex-col overflow-hidden">
      <header className="absolute top-0 left-0 w-full z-30 flex items-center justify-between p-6">
        <div 
          onClick={onIdentityClick}
          className="flex items-center gap-3 cursor-pointer group pointer-events-auto"
        >
          <div className="w-10 h-10 border border-primary/30 flex items-center justify-center bg-surface group-hover:border-primary group-hover:shadow-neon-primary transition-all">
            <Fingerprint size={20} className="text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-mono text-primary tracking-widest uppercase">ID_MATRIX</span>
            <span className="text-sm font-mono text-text-main font-bold group-hover:text-primary transition-colors">{userAlias}</span>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 top-6 flex flex-col items-center">
          <h1 className="text-2xl font-bold text-primary tracking-widest uppercase flex items-center gap-2">
            <Radar size={24} />
            Neon Radar
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-neon-primary"></div>
            <span className="text-xs font-mono text-primary/80 uppercase tracking-widest">Scanning 100m Secure Zone</span>
          </div>
        </div>

        <button 
          onClick={onDeployClick}
          className="flex items-center justify-center h-12 px-6 bg-primary text-background-dark font-sans font-bold text-sm tracking-widest uppercase hover:bg-[#10d45e] hover:shadow-neon-primary transition-all border border-primary pointer-events-auto"
        >
          <Plus size={18} className="mr-2" />
          Deploy
        </button>
      </header>

      <main className="flex-1 relative flex items-center justify-center">
        <div className="relative w-[800px] h-[800px] rounded-full border border-muted/30 flex items-center justify-center">
          <div className="absolute w-full h-[1px] bg-muted/20"></div>
          <div className="absolute h-full w-[1px] bg-muted/20"></div>

          <div className="absolute w-[600px] h-[600px] rounded-full border border-muted/30">
            <span className="absolute top-2 left-1/2 -translate-x-1/2 bg-background-dark px-1 text-[10px] font-mono text-muted">75M</span>
          </div>
          <div className="absolute w-[400px] h-[400px] rounded-full border border-muted/30">
            <span className="absolute top-2 left-1/2 -translate-x-1/2 bg-background-dark px-1 text-[10px] font-mono text-muted">50M</span>
          </div>
          <div className="absolute w-[200px] h-[200px] rounded-full border border-primary/40 shadow-[inset_0_0_20px_rgba(19,236,106,0.1)]">
            <span className="absolute top-2 left-1/2 -translate-x-1/2 bg-background-dark px-1 text-[10px] font-mono text-primary">25M</span>
          </div>

          <motion.div 
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [1, 0.8, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute w-4 h-4 bg-primary rounded-full shadow-neon-primary z-20"
          >
            <div className="absolute inset-0 rounded-full border border-primary animate-ping"></div>
          </motion.div>

          <div className="absolute inset-0 rounded-full overflow-hidden z-10 pointer-events-none">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="w-full h-full origin-center"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0deg, rgba(19, 236, 106, 0.05) 270deg, rgba(19, 236, 106, 0.4) 360deg)'
              }}
            />
          </div>

          {rooms.map((room) => (
            <div 
              key={room.id}
              className="absolute z-30 cursor-crosshair group -translate-x-1/2 -translate-y-1/2"
              style={getPos(room.lat, room.lng)}
              onMouseEnter={() => setHoveredRoom(room)}
              onMouseLeave={() => setHoveredRoom(null)}
              onClick={() => onRoomSelect(room)}
            >
              <div className={`w-4 h-4 rounded-full transition-all duration-200 ${
                room.status === 'expiring' ? 'bg-danger shadow-neon-danger' : 'bg-accent shadow-neon-accent'
              } group-hover:scale-125 group-hover:bg-primary group-hover:shadow-neon-primary`} />
              
              <AnimatePresence>
                {hoveredRoom?.id === room.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: 10, x: '-50%' }}
                    className="absolute bottom-full left-1/2 mb-4 w-[240px] bg-surface border border-accent p-3 shadow-neon-accent z-40"
                  >
                    <div className="flex justify-between items-start border-b border-muted/30 pb-2 mb-2">
                      <span className="font-mono text-xs text-accent uppercase tracking-widest">Freq_{room.frequency}</span>
                      <span className="font-mono text-xs text-text-main">[{room.population}/{room.maxPopulation}]</span>
                    </div>
                    <h3 className="font-sans font-bold text-sm text-text-main truncate mb-2">{room.topic}</h3>
                    <div className={`flex items-center gap-2 font-mono text-xs ${room.status === 'expiring' ? 'text-danger animate-pulse' : 'text-muted'}`}>
                      <Timer size={14} />
                      <span>{formatTtl(room.ttl)} LEFT</span>
                    </div>
                    <div className={`absolute -bottom-[17px] left-1/2 -translate-x-1/2 w-[1px] h-4 ${room.status === 'expiring' ? 'bg-danger' : 'bg-accent'}`}></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {users.filter(u => u.alias !== userAlias).map((user) => (
            <div 
              key={user.id}
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 group"
              style={getPos(user.lat, user.lng)}
              onMouseEnter={() => setHoveredUser(user)}
              onMouseLeave={() => setHoveredUser(null)}
            >
              <div className="w-2 h-2 bg-primary/40 rounded-full border border-primary group-hover:bg-primary group-hover:scale-150 transition-all shadow-neon-primary">
                <div className="absolute inset-0 rounded-full border border-primary animate-ping opacity-30"></div>
              </div>

              <AnimatePresence>
                {hoveredUser?.id === user.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10, x: '-50%' }}
                    animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, scale: 0.9, y: 10, x: '-50%' }}
                    className="absolute bottom-full left-1/2 mb-2 px-3 py-1 bg-surface border border-primary shadow-neon-primary z-50 whitespace-nowrap"
                  >
                    <span className="font-mono text-xs text-primary">{user.alias}</span>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45"></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </main>

      <aside className="absolute left-6 top-1/2 -translate-y-1/2 w-48 z-20">
        <div className="flex flex-col gap-6">
          <div className="bg-surface/80 border border-muted/30 p-4 backdrop-blur-sm">
            <h2 className="font-mono text-xs text-primary uppercase tracking-widest mb-3 border-b border-muted/30 pb-2">Active Filters</h2>
            <ul className="flex flex-col gap-2 font-mono text-xs text-text-main">
              <li className="flex items-center justify-between cursor-pointer hover:text-primary transition-colors">
                <span>All Frequencies</span>
                <span className="w-2 h-2 bg-primary shadow-neon-primary"></span>
              </li>
              <li className="flex items-center justify-between cursor-pointer text-muted hover:text-primary transition-colors">
                <span>High Population</span>
                <span className="w-2 h-2 border border-muted"></span>
              </li>
              <li className="flex items-center justify-between cursor-pointer text-muted hover:text-primary transition-colors">
                <span>Ending Soon</span>
                <span className="w-2 h-2 border border-muted"></span>
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-1 font-mono text-[10px] text-muted opacity-50">
            <span>LAT: {CENTER_LAT}° N</span>
            <span>LNG: {CENTER_LNG}° W</span>
            <span>ALT: 71m</span>
            <span>RAD: 100m SECURE</span>
            <span className="text-primary mt-2">ACTIVE NODES: {users.length}</span>
          </div>
        </div>
      </aside>
    </div>
  );
};
