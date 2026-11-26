import React, { useEffect, useRef, useState } from 'react';

interface RevealOnScrollProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Anima suavemente cards e seções conforme entram na área visível durante a rolagem.
 */
export const RevealOnScroll: React.FC<RevealOnScrollProps> = ({
  children,
  delay = 0,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal-transition ${visible ? 'reveal-visible' : 'reveal-hidden'} ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * Barra luminosa fina no topo da página acompanhando o progresso da rolagem.
 */
export const ScrollProgressBar: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) {
        setProgress(0);
        return;
      }
      setProgress(Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)));
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px] bg-transparent" aria-hidden="true">
      <div
        className="h-full bg-gradient-to-r from-violet-500 via-purple-400 to-sky-400 shadow-[0_0_12px_rgba(139,92,246,0.85)] transition-[width] duration-100 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};
