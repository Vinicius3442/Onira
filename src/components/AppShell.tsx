import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Moon,
  History,
  Sparkles,
  Cpu,
  User as UserIcon,
  Wrench,
  LogOut,
  BedDouble,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { OniraLogo } from './OniraLogo';
import { WaveBackdrop } from './WaveBackdrop';
import { ScrollProgressBar } from './RevealOnScroll';
import { AdminTag, UserAvatar } from './UserAvatar';
import { getGreetingByHour } from '../lib/colors';

interface AppShellProps {
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shell unificado da área autenticada ONIRA.
 * - Header desktop limpo em linha única (sem quebra de texto nem avatar achatado)
 * - Foto de perfil real + tag com chave de boca ao lado do nome para administradores
 * - CT-02 / RF04: O item "Administrador" só é renderizado quando `isAdmin === true`
 */
export const AppShell: React.FC<AppShellProps> = ({ title, subtitle, headerActions, children }) => {
  const { user, profile, avatarUrl, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Sonhador';

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-medium transition-all ${
      isActive
        ? 'border border-onira-lavender/35 bg-onira-purple/25 text-onira-offwhite shadow-[0_0_20px_-6px_rgba(118,101,232,0.7)]'
        : 'border border-transparent text-slate-400 hover:bg-onira-offwhite/[0.06] hover:text-onira-offwhite'
    }`;

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition-colors ${
      isActive ? 'text-onira-lavender' : 'text-slate-400'
    }`;

  return (
    <div className="relative min-h-screen pb-24 text-onira-offwhite md:pb-12">
      <ScrollProgressBar />
      <WaveBackdrop />

      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-onira-lavender/15 bg-onira-night/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          {/* Esquerda: Marca */}
          <Link
            to="/roteiro-do-sonho"
            className="shrink-0 transition-opacity hover:opacity-90 focus:outline-none"
          >
            <OniraLogo variant="compact" />
          </Link>

          {/* Centro: Navegação enxuta em linha única */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegação principal">
            <NavLink to="/roteiro-do-sonho" className={navLinkClass}>
              <Moon className="h-4 w-4 shrink-0" />
              Roteiro
            </NavLink>
            <NavLink to="/temas" className={navLinkClass}>
              <Sparkles className="h-4 w-4 shrink-0" />
              Temas
            </NavLink>
            <NavLink to="/historico" className={navLinkClass}>
              <History className="h-4 w-4 shrink-0" />
              Histórico
            </NavLink>
            <NavLink to="/dispositivo" className={navLinkClass}>
              <Cpu className="h-4 w-4 shrink-0" />
              Dispositivo
            </NavLink>
            <NavLink to="/perfil" className={navLinkClass}>
              <UserIcon className="h-4 w-4 shrink-0" />
              Perfil
            </NavLink>

            {/* CT-02 & RF04: Item Administrador estritamente oculto para usuários comuns */}
            {isAdmin && (
              <Link
                to="/admin"
                className="ml-1 inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-onira-lavender/35 bg-onira-purple/20 px-3 py-2 text-[13px] font-semibold text-onira-offwhite transition-all hover:border-onira-lavender/60 hover:bg-onira-purple/35 hover:text-white"
              >
                <Wrench className="h-3.5 w-3.5 shrink-0 text-onira-lavender" />
                Administrador
              </Link>
            )}
          </nav>

          {/* Direita: Perfil com foto real + badge Admin + Sair */}
          <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
            <Link
              to="/perfil"
              className="group flex shrink-0 items-center gap-2.5 rounded-full border border-onira-lavender/15 bg-onira-offwhite/[0.04] py-1 pr-3 pl-1 transition-all hover:border-onira-lavender/40 hover:bg-onira-offwhite/[0.08]"
              title="Abrir perfil e alterar foto"
            >
              <UserAvatar src={avatarUrl} name={displayName} size="sm" />
              <div className="hidden min-w-0 text-left sm:block">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="max-w-[120px] truncate text-xs font-semibold text-onira-offwhite">
                    {displayName}
                  </span>
                  {isAdmin && <AdminTag />}
                </div>
                <p className="whitespace-nowrap text-[10px] text-slate-400">
                  Dormir · <span className="text-onira-lavender">{profile?.habitual_sleep_time || '22:30'}</span>
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-rose-400/35 hover:bg-rose-500/12 hover:text-rose-200"
              title="Sair da conta"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Page Header & Content */}
      <main className="animate-page-enter mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="flex flex-wrap items-center gap-2 text-sm text-onira-lavender">
              <span>
                {getGreetingByHour()}, <span className="font-semibold text-onira-offwhite">{displayName}</span>
              </span>
              {isAdmin && <AdminTag />}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-onira-offwhite sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-onira-lavender/25 bg-onira-purple/15 px-3.5 py-1.5 text-xs font-medium text-onira-offwhite">
              <BedDouble className="h-3.5 w-3.5 text-onira-lavender" />
              Horário habitual: {profile?.habitual_sleep_time || '22:30'}
            </span>
            {headerActions}
          </div>
        </div>

        {children}
      </main>

      {/* Bottom Tab Bar (Mobile & Tablet) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-onira-lavender/15 bg-onira-night-deep/95 px-2 py-2 backdrop-blur-xl lg:hidden"
        aria-label="Navegação mobile"
      >
        <div className={`grid gap-1 ${isAdmin ? 'grid-cols-6' : 'grid-cols-5'}`}>
          <NavLink to="/roteiro-do-sonho" className={mobileLinkClass}>
            <Moon className="h-5 w-5" />
            Roteiro
          </NavLink>
          <NavLink to="/temas" className={mobileLinkClass}>
            <Sparkles className="h-5 w-5" />
            Temas
          </NavLink>
          <NavLink to="/historico" className={mobileLinkClass}>
            <History className="h-5 w-5" />
            Histórico
          </NavLink>
          <NavLink to="/dispositivo" className={mobileLinkClass}>
            <Cpu className="h-5 w-5" />
            Travesseiro
          </NavLink>
          <NavLink to="/perfil" className={mobileLinkClass}>
            <UserIcon className="h-5 w-5" />
            Perfil
          </NavLink>
          {isAdmin && (
            <Link
              to="/admin"
              className="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-semibold text-onira-lavender"
            >
              <Wrench className="h-5 w-5 text-onira-lavender" />
              Admin
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
};
