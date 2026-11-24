import React from 'react';

/**
 * Fundo sutil com ondas noturnas inspirado na identidade visual ONIRA (Onira- Logo.png).
 */
export const WaveBackdrop: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#080715]" aria-hidden="true">
      {/* Glows atmosféricos */}
      <div className="absolute -top-36 left-1/2 h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[130px]" />
      <div className="absolute right-[-120px] bottom-[-140px] h-[380px] w-[380px] rounded-full bg-sky-500/12 blur-[120px]" />
      <div className="absolute bottom-1/3 left-[-140px] h-[320px] w-[320px] rounded-full bg-indigo-600/15 blur-[120px]" />

      {/* Linhas onduladas sutis */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.13]"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        fill="none"
      >
        {Array.from({ length: 10 }).map((_, idx) => {
          const y = 70 + idx * 88;
          return (
            <path
              key={idx}
              d={`M-100 ${y} C 280 ${y - 65}, 560 ${y + 75}, 920 ${y - 35} C 1180 ${y - 100}, 1340 ${y + 55}, 1560 ${y - 20}`}
              stroke="#7C3AED"
              strokeWidth="1.4"
              strokeOpacity={0.35 + (idx % 3) * 0.12}
            />
          );
        })}
      </svg>
    </div>
  );
};
