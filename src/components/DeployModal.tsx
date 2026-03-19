import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Radio, Timer, ArrowRight } from 'lucide-react';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInitiate: (topic: string) => void;
}

export const DeployModal: React.FC<DeployModalProps> = ({
  isOpen,
  onClose,
  onInitiate
}) => {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onInitiate(topic);
      setTopic('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background-dark/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-[400px] bg-surface border border-primary flex flex-col font-sans shadow-[0_0_20px_rgba(19,236,106,0.2)]"
          >
            <div className="px-6 pt-6 pb-4 border-b border-muted/30 flex justify-between items-center">
              <h2 className="text-primary text-lg font-bold tracking-widest uppercase flex items-center gap-2">
                <Radio size={20} />
                Deploy Frequency
              </h2>
              <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-muted uppercase tracking-wider" htmlFor="topic-input">
                  Designation Protocol
                </label>
                <div className="relative group">
                  <input
                    id="topic-input"
                    autoFocus
                    autoComplete="off"
                    maxLength={32}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value.toUpperCase())}
                    className="w-full bg-background-dark border border-muted text-text-main text-xl font-sans px-4 py-4 focus:outline-none focus:border-primary focus:shadow-neon-primary placeholder:text-muted/30 transition-all uppercase"
                    placeholder="ENTER TOPIC..."
                  />
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary transition-all duration-300 group-focus-within:w-full"></div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] font-mono text-muted/70 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block"></span>
                    SECURE CHANNEL
                  </span>
                  <span className="text-xs font-mono text-text-main">
                    [{topic.length}/32]
                  </span>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 p-3 flex items-start gap-3">
                <p className="text-xs font-mono text-text-main/80 leading-relaxed">
                  Frequency will auto-destruct in <span className="text-primary font-bold">59:59</span>. Transmissions are entirely ephemeral.
                </p>
              </div>

              <button
                type="submit"
                disabled={!topic.trim()}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-background-dark font-sans font-bold text-lg py-4 tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(19,236,106,0.3)] hover:shadow-[0_0_25px_rgba(19,236,106,0.6)] flex justify-center items-center gap-2 group"
              >
                INITIATE_
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-primary"></div>
            <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-primary"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-primary"></div>
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-primary"></div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
