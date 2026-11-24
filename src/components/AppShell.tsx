import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Moon,
  History,
  Sparkles,
  Cpu,
  User as UserIcon,
  Shield,
  LogOut,
  BedDouble,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { OniraLogo } from './OniraLogo';
import { WaveBackdrop } from './WaveBackdrop';
import { getGreetingByHour, getInitials } from '../lib/colors';

interface AppShellProps {
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shell unificado da área autenticada ONIRA.
 * - Desktop: Top navigation bar com todas as páginas reais da plataforma
 * - Mobile: Bottom tab bar fiel ao protótipo `Tela mobile home`
 * - CT-02 / RF04: O item "Administrador" só é renderizado quando `isAdmin === true`
 */
export const AppShell: React.FC<AppShellProps> = ({ title, subtitle, headerActions, children }) => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Sonhador';

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-violet-500/20 text-white'
        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
    }`;

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition-colors ${
      isActive ? 'text-violet-300' : 'text-slate-500'
    }`;

  return (
    <div className="relative min-h-screen pb-24 text-slate-100 md:pb-12">
      <WaveBackdrop />

      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080715]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-5">
            <Link to="/roteiro-do-sonho" className="focus:outline-none">
              <OniraLogo variant="compact" />
            </Link>

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegação principal">
              <NavLink to="/roteiro-do-sonho" className={navLinkClass}>
                <Moon className="h-4 w-4" />
                Roteiro do Sonho
              </NavLink>
              <NavLink to="/temas" className={navLinkClass}>
                <Sparkles className="h-4 w-4" />
                Biblioteca
              </NavLink>
              <NavLink to="/historico" className={navLinkClass}>
                <History className="h-4 w-4" />
                Histórico
              </NavLink>
              <NavLink to="/dispositivo" className={navLinkClass}>
                <Cpu className="h-4 w-4" />
                Dispositivo
              </NavLink>
              <NavLink to="/perfil" className={navLinkClass}>
                <UserIcon className="h-4 w-4" />
                Perfil
              </NavLink>

              {/* CT-02 & RF04: Item Administrador estritamente oculto para usuários comuns */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="ml-1 inline-flex items-center gap-1.5 rounded-xl border border-violet-400/30 bg-violet-500/15 px-3.5 py-2 text-sm font-semibold text-violet-200 transition-colors hover:bg-violet-500/25"
                >
                  <Shield className="h-4 w-4" />
                  Administrador
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-white">{displayName}</p>
              <p className="text-[11px] text-slate-400">
                Dormir habitual:{' '}
                <span className="text-violet-300">{profile?.habitual_sleep_time || '22:30'}</span>
              </p>
            </div>

            <Link
              to="/perfil"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/35 bg-gradient-to-br from-violet-600 to-purple-500 text-xs font-bold text-white shadow-lg shadow-violet-600/25"
              title={displayName}
            >
              {getInitials(displayName)}
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-200"
              title="Sair da conta"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Page Header & Content */}
      <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-violet-300">
              {getGreetingByHour()}, <span className="font-semibold text-white">{displayName}</span>
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/25 bg-violet-500/10 px-3.5 py-1.5 text-xs font-medium text-violet-200">
              <BedDouble className="h-3.5 w-3.5 text-violet-400" />
              Horário habitual: {profile?.habitual_sleep_time || '22:30'}
            </span>
            {headerActions}
          </div>
        </div>

        {children}
      </main>

      {/* Bottom Tab Bar (Mobile & Tablet) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0D0B1F]/95 px-2 py-2 backdrop-blur-xl lg:hidden"
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
              className="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-semibold text-violet-400"
            >
              <Shield className="h-5 w-5" />
              Admin
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
};
