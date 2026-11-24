export interface ColorPreset {
  label: string;
  hex: string;
}

export const LIGHT_COLOR_PRESETS: ColorPreset[] = [
  { label: 'azul claro', hex: '#38BDF8' },
  { label: 'lilás', hex: '#C084FC' },
  { label: 'dourado suave', hex: '#F59E0B' },
  { label: 'verde esmeralda', hex: '#10B981' },
  { label: 'azul índigo', hex: '#6366F1' },
  { label: 'roxo profundo', hex: '#8B5CF6' },
  { label: 'rosa aurora', hex: '#F472B6' },
  { label: 'âmbar quente', hex: '#FB923C' },
  { label: 'ciano sereno', hex: '#22D3EE' },
  { label: 'branco lunar', hex: '#E2E8F0' },
];

const COLOR_DICTIONARY: Array<{ keywords: string[]; hex: string }> = [
  { keywords: ['azul claro', 'azul-claro', 'celeste', 'sky', 'ceu', 'céu'], hex: '#38BDF8' },
  { keywords: ['azul escuro', 'azul marinho', 'marinho', 'navy'], hex: '#1D4ED8' },
  { keywords: ['indigo', 'índigo'], hex: '#6366F1' },
  { keywords: ['azul', 'blue'], hex: '#3B82F6' },
  { keywords: ['lilas', 'lilás', 'lavanda', 'lavender'], hex: '#C084FC' },
  { keywords: ['violeta', 'violet'], hex: '#8B5CF6' },
  { keywords: ['roxo', 'purple', 'púrpura', 'purpura'], hex: '#9333EA' },
  { keywords: ['dourado', 'ouro', 'gold'], hex: '#F59E0B' },
  { keywords: ['ambar', 'âmbar', 'laranja', 'orange', 'pôr do sol', 'entardecer'], hex: '#FB923C' },
  { keywords: ['amarelo', 'yellow', 'sol'], hex: '#FACC15' },
  { keywords: ['esmeralda', 'emerald', 'menta', 'mint'], hex: '#10B981' },
  { keywords: ['verde claro', 'lima'], hex: '#4ADE80' },
  { keywords: ['verde', 'green', 'floresta'], hex: '#22C55E' },
  { keywords: ['ciano', 'cyan', 'turquesa', 'aqua'], hex: '#22D3EE' },
  { keywords: ['rosa', 'pink', 'magenta', 'aurora'], hex: '#F472B6' },
  { keywords: ['vermelho', 'red', 'coral', 'rubi'], hex: '#F43F5E' },
  { keywords: ['branco', 'white', 'lunar', 'prata', 'pérola'], hex: '#E2E8F0' },
];

export function resolveColorHex(colorName: string, fallback = '#8B5CF6'): string {
  const normalized = colorName.trim().toLowerCase();
  if (!normalized) return fallback;

  if (/^#[0-9a-f]{6}$/i.test(normalized)) {
    return normalized.toUpperCase();
  }

  for (const entry of COLOR_DICTIONARY) {
    if (entry.keywords.some((kw) => normalized.includes(kw))) {
      return entry.hex;
    }
  }

  return fallback;
}

export function calculateBedtime(wakeUpTime: string, durationHours: number): string {
  const [hStr, mStr] = wakeUpTime.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m) || Number.isNaN(durationHours)) {
    return '--:--';
  }
  const wakeMinutes = h * 60 + m;
  const durationMinutes = Math.round(durationHours * 60);
  const bedMinutes = ((wakeMinutes - durationMinutes) % 1440 + 1440) % 1440;
  const bedH = Math.floor(bedMinutes / 60);
  const bedM = bedMinutes % 60;
  return `${String(bedH).padStart(2, '0')}:${String(bedM).padStart(2, '0')}`;
}

export function getInitials(name?: string | null): string {
  if (!name) return 'ON';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ON';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function formatDuration(hours: number): string {
  const whole = Math.floor(hours);
  const mins = Math.round((hours - whole) * 60);
  if (mins === 0) return `${whole}h`;
  return `${whole}h ${mins}min`;
}

export function getGreetingByHour(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}
