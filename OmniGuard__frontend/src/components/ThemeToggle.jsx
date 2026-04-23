import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-xl bg-white/5 border border-white/10 hover:border-brand-primary/50 transition-colors group overflow-hidden"
      aria-label="Toggle Theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ y: 20, opacity: 0, rotate: 45 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -20, opacity: 0, rotate: -45 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="text-brand-primary"
        >
          {theme === 'dark' ? (
            <Moon size={20} className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          ) : (
            <Sun size={20} className="drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* Subtle hover glow effect */}
      <div className="absolute inset-0 bg-brand-primary/0 group-hover:bg-brand-primary/5 transition-colors pointer-events-none" />
    </button>
  );
}
