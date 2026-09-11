import React from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  compact?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ compact = false, className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative inline-flex items-center justify-center rounded-xl transition-all duration-200 active:scale-95 cursor-pointer select-none ${
        isDark
          ? 'bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 shadow-inner'
          : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 shadow-xs'
      } ${compact ? 'p-2' : 'px-3 py-1.5 gap-2'} ${className}`}
      title={
        isDark
          ? 'Dark Mode Active (Night Study Mode) • Click to switch to Light Mode'
          : 'Light Mode Active • Click to switch to Dark Mode (रात में पढ़ने के लिए डार्क मोड)'
      }
      aria-label="Toggle Night Study Theme"
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Moon className="w-4 h-4 text-amber-300 transition-transform rotate-0 scale-100" />
        ) : (
          <Sun className="w-4 h-4 text-amber-600 transition-transform rotate-0 scale-100" />
        )}
      </div>

      {!compact && (
        <span className="text-xs font-semibold whitespace-nowrap">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
    </button>
  );
};
