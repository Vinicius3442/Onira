import React from 'react';
import { User, Wrench } from 'lucide-react';
import { getInitials } from '../lib/colors';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-24 w-24 text-2xl',
};

/**
 * Avatar circular padronizado (nunca achata nem deforma).
 * Exibe a foto real salva no Supabase ou um fallback limpo com ícone/iniciais.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
}) => {
  const sizeClass = SIZE_MAP[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name ? `Foto de perfil de ${name}` : 'Foto de perfil'}
        className={`${sizeClass} aspect-square shrink-0 rounded-full object-cover ring-2 ring-onira-lavender/45 shadow-md shadow-onira-night/60 ${className}`}
      />
    );
  }

  const initials = getInitials(name);

  return (
    <div
      className={`${sizeClass} flex aspect-square shrink-0 items-center justify-center rounded-full border border-onira-lavender/40 bg-gradient-to-br from-onira-purple via-onira-purple-hover to-onira-night font-bold text-onira-offwhite shadow-md shadow-onira-night/60 ${className}`}
      aria-label={name || 'Avatar'}
    >
      {name ? initials : <User className="h-4 w-4" />}
    </div>
  );
};

interface AdminTagProps {
  compact?: boolean;
}

/**
 * Tag discreta com ícone de chave de boca para identificar administradores ao lado do nome.
 */
export const AdminTag: React.FC<AdminTagProps> = ({ compact = false }) => (
  <span
    className="inline-flex shrink-0 items-center gap-1 rounded-md border border-onira-lavender/40 bg-onira-purple/25 px-1.5 py-0.5 text-[10px] leading-none font-bold tracking-wide text-onira-offwhite uppercase"
    title="Conta Administrador"
  >
    <Wrench className="h-2.5 w-2.5 shrink-0 text-onira-lavender" />
    {!compact && <span>Admin</span>}
  </span>
);
