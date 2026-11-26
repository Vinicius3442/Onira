import React from 'react';
import type { DreamNightWithProfile, DreamTheme } from '../types/database';
import { resolveColorHex } from '../lib/colors';
import { AnimatedCounter } from './AnimatedCounter';

interface ActivityChartProps {
  nights: DreamNightWithProfile[];
}

/**
 * Gráfico de atividade dos últimos 7 dias calculado 100% a partir de registros reais em `dream_nights`.
 */
export const AdminActivityChart: React.FC<ActivityChartProps> = ({ nights }) => {
  const days = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - idx));
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
    const count = nights.filter((n) => n.created_at.slice(0, 10) === key).length;
    return { key, label, count };
  });

  const maxVal = Math.max(4, ...days.map((d) => d.count));
  const width = 560;
  const height = 180;
  const padX = 28;
  const padY = 20;

  const points = days.map((d, i) => {
    const x = padX + (i * (width - padX * 2)) / (days.length - 1);
    const y = height - padY - (d.count / maxVal) * (height - padY * 2);
    return { ...d, x, y };
  });

  const linePath = points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');

  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(height - padY).toFixed(1)} L ${points[0].x.toFixed(1)} ${(height - padY).toFixed(1)} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height + 24}`} className="h-52 w-full overflow-visible">
        <defs>
          <linearGradient id="adminAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Grid horizontal */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = height - padY - ratio * (height - padY * 2);
          const val = Math.round(ratio * maxVal);
          return (
            <g key={idx}>
              <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#E2E8F0" strokeDasharray="4 4" />
              <text x={4} y={y + 4} fill="#94A3B8" fontSize="10">
                {val}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill="url(#adminAreaGrad)" />
        <path d={linePath} fill="none" stroke="#7C3AED" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((pt) => (
          <g key={pt.key}>
            <circle cx={pt.x} cy={pt.y} r="4.5" fill="#FFFFFF" stroke="#7C3AED" strokeWidth="2.5" />
            <text x={pt.x} y={height + 12} textAnchor="middle" fill="#64748B" fontSize="10.5">
              {pt.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

interface ThemeDonutChartProps {
  themes: DreamTheme[];
  nights: DreamNightWithProfile[];
}

/**
 * Gráfico de distribuição real de uso por tema de sonho (ou catálogo atual quando não há noites).
 */
export const AdminThemeDonutChart: React.FC<ThemeDonutChartProps> = ({ themes, nights }) => {
  const hasNights = nights.length > 0;

  const slices = hasNights
    ? (() => {
        const counts = new Map<string, { name: string; count: number; hex: string }>();
        for (const night of nights) {
          const existing = counts.get(night.theme_name);
          if (existing) {
            existing.count += 1;
          } else {
            counts.set(night.theme_name, {
              name: night.theme_name,
              count: 1,
              hex: night.theme_light_hex || resolveColorHex(night.theme_light_color),
            });
          }
        }
        return Array.from(counts.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      })()
    : themes.slice(0, 5).map((t) => ({
        name: t.name,
        count: 1,
        hex: t.light_hex || resolveColorHex(t.light_color),
      }));

  const total = slices.reduce((acc, s) => acc + s.count, 0) || 1;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-44 w-44 items-center justify-center">
        <svg viewBox="0 0 150 150" className="h-full w-full -rotate-90">
          <circle cx="75" cy="75" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="16" />
          {slices.map((slice) => {
            const fraction = slice.count / total;
            const dash = fraction * circumference;
            const offset = -accumulated * circumference;
            accumulated += fraction;
            return (
              <circle
                key={slice.name}
                cx="75"
                cy="75"
                r={radius}
                fill="none"
                stroke={slice.hex}
                strokeWidth="16"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={offset}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <AnimatedCounter
            value={hasNights ? nights.length : themes.length}
            duration={750}
            className="text-2xl font-extrabold text-slate-900"
          />
          <span className="text-[11px] font-medium text-slate-500">
            {hasNights ? 'noites' : 'temas'}
          </span>
        </div>
      </div>

      <div className="mt-4 grid w-full grid-cols-1 gap-2">
        {slices.length === 0 ? (
          <p className="text-center text-xs text-slate-400">Nenhum tema cadastrado ainda.</p>
        ) : (
          slices.map((slice) => {
            const pct = Math.round((slice.count / total) * 100);
            return (
              <div key={slice.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 truncate text-slate-600">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: slice.hex }}
                  />
                  <span className="truncate font-medium text-slate-700">{slice.name}</span>
                </span>
                <span className="ml-2 shrink-0 font-semibold text-slate-900">
                  {hasNights ? `${slice.count} (${pct}%)` : 'Ativo'}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
