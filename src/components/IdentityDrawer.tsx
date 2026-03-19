import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RefreshCw, Zap, MapPin, Activity } from 'lucide-react';

interface IdentityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alias: string;
  onScramble: () => void;
  onAliasChange: (alias: string) => void;
  activeUsers: number;
}

export const IdentityDrawer: React.FC<IdentityDrawerProps> = ({
  isOpen,
  onClose,
  alias,
  onScramble,
  onAliasChange,
  activeUsers
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-[320px] bg-surface border-r border-primary/30 z-50 flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.8)]"
          >
            <header className="flex items-center justify-between border-b border-muted/50 px-6 py-4">
              <div className="flex items-center gap-3 text-primary">
                <Zap size={20} fill="currentColor" />
                <h2 className="font-sans font-bold text-lg tracking-widest uppercase">Identity Matrix</h2>
              </div>
              <button onClick={onClose} className="text-muted hover:text-text-main transition-colors">
                <X size={24} />
              </button>
            </header>

            <div className="flex-1 flex flex-col p-6 overflow-y-auto">
              <div className="mb-8">
                <p className="text-muted text-xs mb-2 uppercase tracking-wider font-mono">Current Alias:</p>
                <div className="bg-background-dark border border-primary/20 p-4 relative group">
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary"></div>
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary"></div>
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary"></div>
                  <input
                    type="text"
                    value={alias}
                    onChange={(e) => onAliasChange(e.target.value.toUpperCase())}
                    className="w-full bg-transparent border-none text-primary text-center font-sans font-bold text-3xl focus:outline-none tracking-widest uppercase placeholder:text-primary/20"
                    placeholder="ENTER ALIAS..."
                    maxLength={12}
                  />
                </div>
              </div>

              <div className="mb-10">
                <button 
                  onClick={onScramble}
                  className="w-full flex items-center justify-center gap-2 border border-accent text-accent py-3 px-4 font-sans font-bold text-sm tracking-widest uppercase hover:bg-accent/10 transition-colors shadow-[inset_0_0_10px_rgba(0,255,255,0.1)] hover:shadow-[inset_0_0_15px_rgba(0,255,255,0.2)]"
                >
                  <RefreshCw size={18} />
                  [Scramble Identity]
                </button>
                <p className="text-muted text-[10px] text-center mt-2 font-mono uppercase">Change your public designation in the neon matrix.</p>
              </div>

              <hr className="border-muted/30 mb-8" />

              <div>
                <p className="text-muted text-xs mb-4 uppercase tracking-wider font-mono">Local Telemetry:</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-main text-sm font-mono">Signal Strength</span>
                  <span className="text-primary text-sm font-bold font-mono">MAX</span>
                </div>
                
                <div className="flex items-end gap-1 h-8 mb-6">
                  <div className="w-full bg-primary h-[20%]"></div>
                  <div className="w-full bg-primary h-[40%]"></div>
                  <div className="w-full bg-primary h-[60%]"></div>
                  <div className="w-full bg-primary h-[80%] shadow-neon-primary"></div>
                  <div className="w-full bg-primary h-[100%]"></div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-main text-sm font-mono">Active Nodes (100m)</span>
                  <span className="text-accent text-sm font-bold font-mono">{activeUsers}</span>
                </div>
                <div className="w-full h-1 bg-muted/30 relative">
                  <div 
                    className="absolute top-0 left-0 h-full bg-accent shadow-neon-accent transition-all duration-500" 
                    style={{ width: `${Math.min(100, (activeUsers / 32) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-auto pt-8 text-center text-muted font-mono text-[8px] uppercase tracking-widest opacity-30">
                Connection established via ephemeral tunnel protocol. Message history securely logged for this device.
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
