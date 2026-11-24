import React from 'react';

interface NeoPixelRingProps {
  colorHex: string;
  colorLabel: string;
  themeName?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Representação visual do Anel de LEDs NeoPixel do Travesseiro ONIRA
 * refletindo em tempo real a cor da luz do tema de sonho selecionado.
 */
export const NeoPixelRing: React.FC<NeoPixelRingProps> = ({
  colorHex,
  colorLabel,
  themeName,
  size = 'md',
}) => {
  const dimensions =
    size === 'sm' ? 'h-16 w-16' : size === 'lg' ? 'h-36 w-36' : 'h-28 w-28';

  const ledCount = 12;
  const leds = Array.from({ length: ledCount }, (_, i) => {
    const angle = (i * 360) / ledCount - 90;
    const rad = (angle * Math.PI) / 180;
    const x = 60 + 44 * Math.cos(rad);
    const y = 60 + 44 * Math.sin(rad);
    return { x, y, i };
  });

  return (
    <div className="relative inline-flex flex-col items-center justify-center">
      <div className={`relative flex items-center justify-center ${dimensions}`}>
        {/* Aura luminosa do LED */}
        <div
          className="animate-neopixel absolute inset-1 rounded-full blur-xl transition-colors duration-500"
          style={{ backgroundColor: `${colorHex}45` }}
        />
        <svg viewBox="0 0 120 120" className="relative h-full w-full" aria-label={`Anel de luz NeoPixel na cor ${colorLabel}`}>
          <circle
            cx="60"
            cy="60"
            r="44"
            fill="rgba(12, 10, 28, 0.85)"
            stroke={`${colorHex}55`}
            strokeWidth="5"
          />
          <circle
            cx="60"
            cy="60"
            r="34"
            fill="none"
            stroke={`${colorHex}28`}
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          {leds.map((led) => (
            <circle
              key={led.i}
              cx={led.x}
              cy={led.y}
              r={size === 'sm' ? 3.4 : 4}
              fill={colorHex}
              style={{
                filter: `drop-shadow(0 0 4px ${colorHex})`,
                opacity: 0.72 + (led.i % 3) * 0.14,
              }}
            />
          ))}
          {/* Ícone central */}
          <path
            d="M62 46C55.8 47 51.3 52.4 51.7 58.7C52.1 65.6 57.9 70.8 64.7 70.4C68.1 70.2 71.1 68.6 73 66.2C71.3 66.7 69.5 66.9 67.6 66.6C61.5 65.7 57.2 60.1 58.1 54C58.6 50.8 60.1 48.1 62 46Z"
            fill="#F8FAFC"
          />
        </svg>
      </div>
      {themeName && (
        <div className="mt-2 text-center">
          <p className="text-xs font-medium text-slate-300">{themeName}</p>
          <span className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] text-slate-400">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: colorHex, boxShadow: `0 0 8px ${colorHex}` }}
            />
            Luz: {colorLabel}
          </span>
        </div>
      )}
    </div>
  );
};
