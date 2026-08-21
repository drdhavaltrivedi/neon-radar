import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const BOOT_LINES = [
  '> INITIALIZING NEON_RADAR v2.1.7',
  '> LOADING FREQUENCY SCANNER...',
  '> CALIBRATING PROXIMITY GRID [100m]',
  '> SOCKET HANDSHAKE ESTABLISHED',
  '> ENCRYPTION LAYER: ACTIVE',
  '> ALL SYSTEMS NOMINAL',
];

interface BootScreenProps {
  onComplete: () => void;
}

export const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  const [visibleLines, setVisibleLines] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (visibleLines < BOOT_LINES.length) {
      const delay = 120 + Math.random() * 180;
      const timer = setTimeout(() => setVisibleLines(v => v + 1), delay);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setDone(true), 400);
      return () => clearTimeout(timer);
    }
  }, [visibleLines]);

  useEffect(() => {
    if (done) {
      const timer = setTimeout(onComplete, 500);
      return () => clearTimeout(timer);
    }
  }, [done, onComplete]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[200] bg-background-dark flex items-center justify-center"
        >
          <div className="w-full max-w-lg px-8">
            <div className="font-mono text-xs md:text-sm space-y-1.5">
              {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className={
                    i === BOOT_LINES.length - 1
                      ? 'text-primary font-bold'
                      : 'text-muted'
                  }
                >
                  {line}
                </motion.div>
              ))}
              {visibleLines < BOOT_LINES.length && (
                <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
              )}
            </div>
            {visibleLines >= BOOT_LINES.length && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-6 h-[2px] bg-primary origin-left shadow-neon-primary"
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
