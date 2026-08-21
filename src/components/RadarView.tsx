import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radar, Fingerprint, Plus, Timer, WifiOff, Radio } from 'lucide-react';
import { User, Room } from '../types';

interface RadarViewProps {
  rooms: Room[];
  users: User[];
  onRoomSelect: (room: Room) => void;
  onDeployClick: () => void;
  onIdentityClick: () => void;
  userAlias: string;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

const CENTER_LAT = 34.0522;
const CENTER_LNG = -118.2437;
const COORDINATE_SCALE = 500000;

type FilterType = 'all' | 'popular' | 'expiring';

function useRadarSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(800);

  useEffect(() => {
    const update = () => {
      if (ref.current) {
        const { width, height } = ref.current.getBoundingClientRect();
        setSize(Math.min(width, height) * 0.85);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return { ref, size };
}

export const RadarView: React.FC<RadarViewProps> = ({
  rooms,
  users,
  onRoomSelect,
  onDeployClick,
  onIdentityClick,
  userAlias,
  connectionStatus
}) => {
  const [hoveredRoom, setHoveredRoom] = useState<Room | null>(null);
  const [hoveredUser, setHoveredUser] = useState<User | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const { ref: radarContainerRef, size: radarSize } = useRadarSize();

  const filteredRooms = useMemo(() => {
    switch (activeFilter) {
      case 'popular':
        return rooms.filter(r => r.population >= 5);
      case 'expiring':
        return rooms.filter(r => r.status === 'expiring');
      default:
        return rooms;
    }
  }, [rooms, activeFilter]);

  const formatTtl = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const scale = (radarSize / 800) * COORDINATE_SCALE;

  const getPos = (lat: number, lng: number) => {
    const x = (lng - CENTER_LNG) * scale;
    const y = (CENTER_LAT - lat) * scale;
    return {
      left: `calc(50% + ${x}px)`,
      top: `calc(50% + ${y}px)`
    };
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All Frequencies' },
    { key: 'popular', label: 'High Population' },
    { key: 'expiring', label: 'Ending Soon' },
  ];

  const handleRoomTap = (room: Room) => {
    if ('ontouchstart' in window) {
      if (selectedRoom?.id === room.id) {
        onRoomSelect(room);
        setSelectedRoom(null);
      } else {
        setSelectedRoom(room);
      }
    } else {
      onRoomSelect(room);
    }
  };

  return (
    <div className="relative h-screen w-screen flex flex-col overflow-hidden">
      <header className="absolute top-0 left-0 w-full z-30 flex items-center justify-between p-3 md:p-6">
        <div
          onClick={onIdentityClick}
          className="flex items-center gap-2 md:gap-3 cursor-pointer group pointer-events-auto"
        >
          <div className="w-8 h-8 md:w-10 md:h-10 border border-primary/30 flex items-center justify-center bg-surface group-hover:border-primary group-hover:shadow-neon-primary transition-all">
            <Fingerprint size={18} className="text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] md:text-xs font-mono text-primary tracking-widest uppercase">ID_MATRIX</span>
            <span className="text-xs md:text-sm font-mono text-text-main font-bold group-hover:text-primary transition-colors">{userAlias}</span>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 top-3 md:top-6 flex flex-col items-center">
          <h1 className="text-lg md:text-2xl font-bold text-primary tracking-widest uppercase flex items-center gap-2">
            <Radar size={20} className="md:w-6 md:h-6" />
            <span className="hidden sm:inline">Neon Radar</span>
            <span className="sm:hidden">NR</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {connectionStatus === 'connected' ? (
              <>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-neon-primary"></div>
                <span className="text-[10px] md:text-xs font-mono text-primary/80 uppercase tracking-widest hidden sm:inline">Scanning 100m Secure Zone</span>
                <span className="text-[10px] font-mono text-primary/80 uppercase tracking-widest sm:hidden">Online</span>
              </>
            ) : (
              <>
                <WifiOff size={14} className="text-danger" />
                <span className="text-[10px] md:text-xs font-mono text-danger uppercase tracking-widest animate-pulse">Signal Lost</span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={onDeployClick}
          className="flex items-center justify-center h-10 md:h-12 px-3 md:px-6 bg-primary text-background-dark font-sans font-bold text-xs md:text-sm tracking-widest uppercase hover:bg-[#10d45e] hover:shadow-neon-primary transition-all border border-primary pointer-events-auto"
        >
          <Plus size={16} className="mr-1 md:mr-2" />
          <span className="hidden sm:inline">Deploy</span>
          <span className="sm:hidden">New</span>
        </button>
      </header>

      <main ref={radarContainerRef} className="flex-1 relative flex items-center justify-center">
        <div
          className="relative rounded-full border border-muted/30 flex items-center justify-center"
          style={{ width: radarSize, height: radarSize }}
        >
          <div className="absolute w-full h-[1px] bg-muted/20"></div>
          <div className="absolute h-full w-[1px] bg-muted/20"></div>

          <div className="absolute rounded-full border border-muted/30" style={{ width: radarSize * 0.75, height: radarSize * 0.75 }}>
            <span className="absolute top-2 left-1/2 -translate-x-1/2 bg-background-dark px-1 text-[8px] md:text-[10px] font-mono text-muted">75M</span>
          </div>
          <div className="absolute rounded-full border border-muted/30" style={{ width: radarSize * 0.5, height: radarSize * 0.5 }}>
            <span className="absolute top-2 left-1/2 -translate-x-1/2 bg-background-dark px-1 text-[8px] md:text-[10px] font-mono text-muted">50M</span>
          </div>
          <div className="absolute rounded-full border border-primary/40 shadow-[inset_0_0_20px_rgba(19,236,106,0.1)]" style={{ width: radarSize * 0.25, height: radarSize * 0.25 }}>
            <span className="absolute top-2 left-1/2 -translate-x-1/2 bg-background-dark px-1 text-[8px] md:text-[10px] font-mono text-primary">25M</span>
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

          {/* Empty state */}
          {filteredRooms.length === 0 && rooms.length === 0 && (
            <div className="absolute z-30 flex flex-col items-center justify-center text-center pointer-events-none">
              <Radio size={40} className="text-muted/40 mb-3" />
              <p className="text-muted text-sm font-mono uppercase tracking-wider">No Active Frequencies</p>
              <p className="text-muted/60 text-xs font-mono mt-1">Deploy a new frequency to begin</p>
            </div>
          )}

          {filteredRooms.length === 0 && rooms.length > 0 && (
            <div className="absolute z-30 flex flex-col items-center justify-center text-center pointer-events-none">
              <p className="text-muted text-sm font-mono uppercase tracking-wider">No matches for filter</p>
            </div>
          )}

          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="absolute z-30 cursor-crosshair group -translate-x-1/2 -translate-y-1/2"
              style={getPos(room.lat, room.lng)}
              onMouseEnter={() => setHoveredRoom(room)}
              onMouseLeave={() => setHoveredRoom(null)}
              onClick={() => handleRoomTap(room)}
            >
              <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full transition-all duration-200 ${
                room.status === 'expiring' ? 'bg-danger shadow-neon-danger' : 'bg-accent shadow-neon-accent'
              } group-hover:scale-125 group-hover:bg-primary group-hover:shadow-neon-primary ${
                selectedRoom?.id === room.id ? 'scale-150 bg-primary shadow-neon-primary' : ''
              }`} />

              <AnimatePresence>
                {(hoveredRoom?.id === room.id || selectedRoom?.id === room.id) && (
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
                    {room.population >= room.maxPopulation && (
                      <div className="mt-2 text-[10px] font-mono text-danger uppercase">Room Full</div>
                    )}
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

      <aside className="absolute left-6 top-1/2 -translate-y-1/2 w-48 z-20 hidden md:block">
        <div className="flex flex-col gap-6">
          <div className="bg-surface/80 border border-muted/30 p-4 backdrop-blur-sm">
            <h2 className="font-mono text-xs text-primary uppercase tracking-widest mb-3 border-b border-muted/30 pb-2">Active Filters</h2>
            <ul className="flex flex-col gap-2 font-mono text-xs text-text-main">
              {filters.map(f => (
                <li
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`flex items-center justify-between cursor-pointer transition-colors ${
                    activeFilter === f.key ? 'text-primary' : 'text-muted hover:text-primary'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className={`w-2 h-2 ${activeFilter === f.key ? 'bg-primary shadow-neon-primary' : 'border border-muted'}`}></span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-1 font-mono text-[10px] text-muted opacity-50">
            <span>LAT: {CENTER_LAT}° N</span>
            <span>LNG: {CENTER_LNG}° W</span>
            <span>ALT: 71m</span>
            <span>RAD: 100m SECURE</span>
            <span className="text-primary mt-2">ACTIVE NODES: {users.length}</span>
            <span className="text-accent">FREQUENCIES: {rooms.length}</span>
          </div>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 md:hidden">
        <div className="bg-surface/90 backdrop-blur-sm border-t border-muted/30 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4 font-mono text-[10px] text-muted">
              <span className="text-primary">NODES: {users.length}</span>
              <span className="text-accent">FREQ: {rooms.length}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`flex-1 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors border ${
                  activeFilter === f.key
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'border-muted/30 text-muted'
                }`}
              >
                {f.key === 'all' ? 'All' : f.key === 'popular' ? 'Hot' : 'Ending'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
