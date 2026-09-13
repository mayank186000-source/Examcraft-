import React from 'react';

interface CardFrontAuraProps {
  /** Optional custom border glow color tone: 'blue' | 'emerald' | 'amber' | 'purple' */
  accent?: 'blue' | 'emerald' | 'amber' | 'purple';
  /** Whether to show the floating corner micro-particles */
  showParticles?: boolean;
  /** Subtle border lighting pulse */
  showBorderBeam?: boolean;
  className?: string;
}

export const CardFrontAura: React.FC<CardFrontAuraProps> = ({
  accent = 'blue',
  showParticles = true,
  showBorderBeam = true,
  className = '',
}) => {
  const accentColors = {
    blue: {
      border: 'border-blue-500/30 dark:border-blue-400/40',
      p1: 'bg-blue-400 shadow-blue-400/80',
      p2: 'bg-cyan-400 shadow-cyan-400/80',
      p3: 'bg-emerald-400 shadow-emerald-400/80',
      glow: 'from-blue-500/10 via-transparent to-indigo-500/10',
    },
    emerald: {
      border: 'border-emerald-500/30 dark:border-emerald-400/40',
      p1: 'bg-emerald-400 shadow-emerald-400/80',
      p2: 'bg-teal-400 shadow-teal-400/80',
      p3: 'bg-amber-400 shadow-amber-400/80',
      glow: 'from-emerald-500/10 via-transparent to-teal-500/10',
    },
    amber: {
      border: 'border-amber-500/30 dark:border-amber-400/40',
      p1: 'bg-amber-400 shadow-amber-400/80',
      p2: 'bg-orange-400 shadow-orange-400/80',
      p3: 'bg-yellow-300 shadow-yellow-300/80',
      glow: 'from-amber-500/10 via-transparent to-orange-500/10',
    },
    purple: {
      border: 'border-purple-500/30 dark:border-purple-400/40',
      p1: 'bg-purple-400 shadow-purple-400/80',
      p2: 'bg-indigo-400 shadow-indigo-400/80',
      p3: 'bg-pink-400 shadow-pink-400/80',
      glow: 'from-purple-500/10 via-transparent to-indigo-500/10',
    },
  }[accent];

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit] z-0 select-none ${className}`}
      aria-hidden="true"
    >
      {/* 1. Subtle Animated Gradient Corner Auras */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${accentColors.glow} opacity-60 dark:opacity-40 transition-opacity`}
      />

      {/* 2. Soft Perimeter Border Glow */}
      {showBorderBeam && (
        <div
          className={`absolute inset-0 rounded-[inherit] border ${accentColors.border} card-border-glow`}
        />
      )}

      {/* 3. Floating Micro-Particles on the Card Face */}
      {showParticles && (
        <>
          {/* Top-Right Micro Spark */}
          <div
            className={`absolute top-4 right-8 w-1.5 h-1.5 rounded-full ${accentColors.p1} shadow-xs card-particle-1`}
          />
          {/* Bottom-Left Micro Spark */}
          <div
            className={`absolute bottom-6 left-8 w-2 h-2 rounded-full ${accentColors.p2} shadow-xs card-particle-2`}
          />
          {/* Mid-Floating Micro Dot */}
          <div
            className={`absolute top-1/2 right-1/4 w-1 h-1 rounded-full ${accentColors.p3} shadow-xs card-particle-1`}
            style={{ animationDelay: '1.5s' }}
          />
        </>
      )}
    </div>
  );
};
