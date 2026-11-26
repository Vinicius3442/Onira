import React, { useEffect, useRef, useState } from 'react';
import { formatDuration } from '../lib/colors';

function useCountUp(target: number, duration = 700): number {
  const [display, setDisplay] = useState(0);
  const prevTargetRef = useRef(0);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || duration <= 0) {
      setDisplay(target);
      prevTargetRef.current = target;
      return;
    }

    const startValue = prevTargetRef.current;
    const delta = target - startValue;
    if (delta === 0) {
      setDisplay(target);
      return;
    }

    let rafId = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease-out cubic: arranca rápido e desacelera suavemente no final
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(startValue + delta * eased);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
        prevTargetRef.current = target;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return display;
}

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 700,
  className = '',
}) => {
  const current = useCountUp(value, duration);
  return <span className={className}>{Math.round(current).toLocaleString('pt-BR')}</span>;
};

interface AnimatedDurationProps {
  hours: number;
  duration?: number;
  className?: string;
}

export const AnimatedDuration: React.FC<AnimatedDurationProps> = ({
  hours,
  duration = 750,
  className = '',
}) => {
  const current = useCountUp(hours, duration);
  if (hours <= 0) return <span className={className}>0h</span>;
  return <span className={className}>{formatDuration(current)}</span>;
};
