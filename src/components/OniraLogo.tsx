import React from 'react';

interface OniraLogoProps {
  variant?: 'full' | 'compact' | 'mark';
  theme?: 'dark' | 'light';
  showTagline?: boolean;
  className?: string;
}

/**
 * Logo oficial ONIRA em SVG vetorial.
 * Mantém a base da identidade visual (tipografia geométrica espaçada com estrela
 * de 4 pontas integrada à letra "A") combinada ao emblema orbital lunar dos protótipos.
 */
export const OniraLogo: React.FC<OniraLogoProps> = ({
  variant = 'compact',
  theme = 'dark',
  showTagline = false,
  className = '',
}) => {
  const textFill = theme === 'dark' ? '#F5F3FA' : '#10152F';
  const taglineFill = theme === 'dark' ? '#A78BFA' : '#7665E8';
  const moonFill = theme === 'dark' ? '#F5F3FA' : '#10152F';
  const uid = React.useId().replace(/:/g, '');

  const emblem = (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={variant === 'full' ? 'h-11 w-11 shrink-0' : 'h-8 w-8 shrink-0'}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`onira-ring-${uid}`} x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="55%" stopColor="#7665E8" />
          <stop offset="100%" stopColor={theme === 'dark' ? '#F5F3FA' : '#A78BFA'} />
        </linearGradient>
      </defs>
      <circle
        cx="32"
        cy="32"
        r="25"
        stroke={`url(#onira-ring-${uid})`}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="118 36"
      />
      <circle cx="49" cy="14" r="3" fill="#A78BFA" />
      <path
        d="M35.2 19.5C29.1 20.5 24.8 25.9 25.2 32.1C25.6 38.9 31.3 44.1 38.1 43.7C41.4 43.5 44.4 41.9 46.3 39.5C44.6 40 42.8 40.2 40.9 39.9C34.8 39 30.6 33.4 31.5 27.3C32 24.2 33.4 21.5 35.2 19.5Z"
        fill={moonFill}
      />
      <path
        d="M42.2 19.5L43.4 22.8L46.7 24L43.4 25.2L42.2 28.5L41 25.2L37.7 24L41 22.8L42.2 19.5Z"
        fill="#A78BFA"
      />
    </svg>
  );

  if (variant === 'mark') {
    return <span className={`inline-flex items-center ${className}`}>{emblem}</span>;
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {emblem}
      <div className="flex flex-col">
        {/* Wordmark geométrico fiel à base de Onira- Logo.png com estrela na letra A */}
        <svg
          viewBox="0 0 248 42"
          fill="none"
          className={variant === 'full' ? 'h-6 w-auto sm:h-7' : 'h-4 w-auto sm:h-[18px]'}
          role="img"
          aria-label="ONIRA"
        >
          {/* O */}
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M22 0C9.85 0 0 9.4 0 21C0 32.6 9.85 42 22 42C34.15 42 44 32.6 44 21C44 9.4 34.15 0 22 0ZM22 8.2C14.7 8.2 9 13.9 9 21C9 28.1 14.7 33.8 22 33.8C29.3 33.8 35 28.1 35 21C35 13.9 29.3 8.2 22 8.2Z"
            fill={textFill}
          />
          {/* N */}
          <path d="M62 41V1H70.4L91.2 27.2V1H99.8V41H91.7L70.6 14.4V41H62Z" fill={textFill} />
          {/* I */}
          <path d="M120 41V1H129V41H120Z" fill={textFill} />
          {/* R */}
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M149 41V1H168.5C178.4 1 184.5 6.4 184.5 14.4C184.5 20.5 181 24.8 175.1 26.5L185.8 41H175.4L165.8 27.6H158V41H149ZM158 8.8V20H167.7C172.8 20 175.6 17.9 175.6 14.4C175.6 10.9 172.8 8.8 167.7 8.8H158Z"
            fill={textFill}
          />
          {/* A com estrela de 4 pontas no centro */}
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M218.5 1H227.7L246.5 41H236.8L233.2 33H212.8L209.2 41H199.8L218.5 1ZM223 11.4L219.2 21.2L209.5 24.6L219.2 28L223 37.8L226.8 28L236.5 24.6L226.8 21.2L223 11.4Z"
            fill={textFill}
          />
        </svg>
        {showTagline && (
          <span
            className="mt-1 text-[9px] font-semibold tracking-[0.26em] uppercase"
            style={{ color: taglineFill }}
          >
            SONHE. DESCANSE. VIVA MELHOR.
          </span>
        )}
      </div>
    </div>
  );
};
