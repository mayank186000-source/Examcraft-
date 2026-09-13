import { useState, useEffect, type CSSProperties } from 'react';

export type TimePeriod = 'day' | 'evening' | 'night';

export interface AmbientLightingConfig {
  hour: number;
  minute: number;
  timePeriod: TimePeriod;
  isNight: boolean;
  isDay: boolean;
  periodLabel: string;
  // Dynamic CSS classes for the 3 radial-gradient ambient auras in App.tsx
  auraTopClass: string;
  auraRightClass: string;
  auraBottomClass: string;
  // Radial-gradient style overrides for container
  meshStyle: CSSProperties;
  // Human readable time
  formattedTime: string;
}

function calculateLighting(date: Date): AmbientLightingConfig {
  const hour = date.getHours();
  const minute = date.getMinutes();

  const formattedTime = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Time periods:
  // Day: 06:00 - 17:59 (Bright, energetic palette: electric cyan, cobalt blue, vibrant emerald)
  // Evening: 18:00 - 20:59 (Golden hour: warm amber, sunset rose, radiant violet)
  // Night: 21:00 - 05:59 (Warmer, low-contrast mode: candlelight amber, soft warm stone, reduced contrast & eye strain)
  let timePeriod: TimePeriod = 'day';
  if (hour >= 21 || hour < 6) {
    timePeriod = 'night';
  } else if (hour >= 18) {
    timePeriod = 'evening';
  } else {
    timePeriod = 'day';
  }

  const isNight = timePeriod === 'night';
  const isDay = timePeriod === 'day';

  if (timePeriod === 'day') {
    return {
      hour,
      minute,
      timePeriod,
      isNight: false,
      isDay: true,
      periodLabel: 'Aurora Cosmic Space (Energetic)',
      // Northern Lights / Space Cosmic Auras (Aurora Cyan Glow, Cosmic Violet, Deep Space Teal)
      auraTopClass:
        'bg-cyan-500/18 dark:bg-cyan-400/22 w-[580px] h-[580px]',
      auraRightClass:
        'bg-violet-600/16 dark:bg-purple-500/22 w-[480px] h-[480px]',
      auraBottomClass:
        'bg-teal-500/15 dark:bg-teal-400/20 w-[420px] h-[420px]',
      meshStyle: {
        backgroundImage: `
          radial-gradient(at 10% 10%, rgba(6, 182, 212, 0.10) 0px, transparent 50%),
          radial-gradient(at 85% 15%, rgba(139, 92, 246, 0.09) 0px, transparent 50%),
          radial-gradient(at 50% 85%, rgba(20, 184, 166, 0.07) 0px, transparent 55%),
          radial-gradient(at 90% 80%, rgba(59, 130, 246, 0.07) 0px, transparent 50%)
        `,
        transition: 'background-image 1.5s ease-in-out',
      },
      formattedTime,
    };
  }

  if (timePeriod === 'evening') {
    return {
      hour,
      minute,
      timePeriod,
      isNight: false,
      isDay: false,
      periodLabel: 'Golden Twilight (Warm Transition)',
      // Warm golden hour sunset transition
      auraTopClass:
        'bg-amber-500/16 dark:bg-amber-600/22 w-[540px] h-[540px]',
      auraRightClass:
        'bg-rose-500/14 dark:bg-rose-600/20 w-[450px] h-[450px]',
      auraBottomClass:
        'bg-indigo-500/12 dark:bg-indigo-600/18 w-[400px] h-[400px]',
      meshStyle: {
        backgroundImage: `
          radial-gradient(at 0% 0%, rgba(245, 158, 11, 0.07) 0px, transparent 55%),
          radial-gradient(at 100% 10%, rgba(244, 63, 94, 0.06) 0px, transparent 50%),
          radial-gradient(at 50% 100%, rgba(99, 102, 241, 0.05) 0px, transparent 55%)
        `,
        transition: 'background-image 1.5s ease-in-out',
      },
      formattedTime,
    };
  }

  // Night: Warmer, low-contrast mode
  // Soft, candlelight amber and muted warm stone to minimize eye strain in dark environments
  return {
    hour,
    minute,
    timePeriod,
    isNight: true,
    isDay: false,
    periodLabel: 'Night Comfort (Warm Low-Contrast)',
    auraTopClass:
      'bg-amber-600/10 dark:bg-amber-700/15 w-[500px] h-[500px]',
    auraRightClass:
      'bg-orange-600/08 dark:bg-orange-700/12 w-[420px] h-[420px]',
    auraBottomClass:
      'bg-stone-600/08 dark:bg-stone-700/12 w-[380px] h-[380px]',
    meshStyle: {
      backgroundImage: `
        radial-gradient(at 0% 0%, rgba(217, 119, 6, 0.04) 0px, transparent 55%),
        radial-gradient(at 100% 10%, rgba(180, 83, 9, 0.035) 0px, transparent 50%),
        radial-gradient(at 50% 100%, rgba(120, 53, 15, 0.03) 0px, transparent 55%)
      `,
      transition: 'background-image 1.5s ease-in-out',
    },
    formattedTime,
  };
}

/**
 * useAmbientTimeLighting Hook
 * Detects local time and adapts the ambient radial lighting in App.tsx
 * from an energetic bright palette during the day to a warmer, low-contrast palette at night.
 */
export function useAmbientTimeLighting(): AmbientLightingConfig {
  const [config, setConfig] = useState<AmbientLightingConfig>(() =>
    calculateLighting(new Date())
  );

  useEffect(() => {
    // Check and update every 30 seconds
    const interval = setInterval(() => {
      setConfig(calculateLighting(new Date()));
    }, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setConfig(calculateLighting(new Date()));
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return config;
}
