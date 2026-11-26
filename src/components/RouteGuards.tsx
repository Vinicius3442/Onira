import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { OniraLogo } from './OniraLogo';
import { WaveBackdrop } from './WaveBackdrop';

const FullScreenLoader: React.FC = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-[#080715] px-4 text-slate-200">
    <WaveBackdrop />
    <OniraLogo variant="compact" className="mb-6" />
    <div className="flex items-center gap-2.5 text-sm text-slate-400">
      <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
      Carregando sua experiência ONIRA...
    </div>
  </div>
);

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

export const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (user) return <Navigate to="/roteiro-do-sonho" replace />;

  return <>{children}</>;
};

/**
 * Proteção estrita da página de Administrador (RF04 / CT-04).
 * Usuários comuns são bloqueados antes mesmo de o componente Admin ser montado,
 * garantindo que nenhum dado administrativo seja consultado ou exibido.
 */
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading, profileLoading, isAdmin } = useAuth();

  if (loading || profileLoading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;

  if (!isAdmin) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10 text-slate-100">
        <WaveBackdrop />
        <div className="onira-card w-full max-w-md rounded-3xl p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/15 text-rose-400">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <span className="inline-block rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-rose-300 uppercase">
            Acesso Restrito · 403
          </span>
          <h1 className="mt-4 text-2xl font-bold text-white">Área exclusiva para administradores</h1>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-400">
            Sua conta (<span className="font-medium text-slate-200">{profile?.full_name || user.email}</span>) possui acesso de
            usuário comum. Nenhum dado administrativo está disponível para este perfil.
          </p>
          <div className="mt-7 flex flex-col gap-3">
            <Link
              to="/roteiro-do-sonho"
              className="onira-gradient-btn inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Roteiro do Sonho
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
