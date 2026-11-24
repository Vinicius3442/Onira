import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Clock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';

export const RegisterPage: React.FC = () => {
  const { signUp, signOut } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [habitualSleepTime, setHabitualSleepTime] = useState('22:30');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    email: string;
    fullName: string;
    sleepTime: string;
    requiresConfirmation: boolean;
    hasSession: boolean;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) {
      setError('Informe seu nome completo (mínimo 2 caracteres).');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Informe um endereço de e-mail válido.');
      return;
    }

    if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(habitualSleepTime)) {
      setError('Informe um horário habitual de dormir válido (ex.: 22:30).');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não conferem.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await signUp({
        fullName,
        email,
        password,
        habitualSleepTime,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccessInfo({
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        sleepTime: habitualSleepTime,
        requiresConfirmation: result.requiresEmailConfirmation,
        hasSession: result.hasSession,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoToLogin = async () => {
    if (successInfo?.hasSession) {
      await signOut();
    }
    navigate('/login');
  };

  return (
    <AuthLayout
      eyebrow="Comece sua jornada"
      titlePrimary="Seu sono,"
      titleHighlight="mais inteligente."
      subtitle="Crie sua conta ONIRA e personalize seus roteiros de sonhos e horários de descanso."
      footer={
        <>
          Já possui uma conta?{' '}
          <Link to="/login" className="font-semibold text-violet-400 transition-colors hover:text-violet-300">
            Entrar
          </Link>
        </>
      }
    >
      {successInfo ? (
        <div className="space-y-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white">Cadastro realizado com sucesso!</h2>
              <p className="mt-1 text-sm leading-relaxed text-emerald-100/90">
                Bem-vindo(a), <span className="font-semibold">{successInfo.fullName}</span>. Sua conta foi salva no
                banco de dados com horário habitual de dormir às{' '}
                <span className="font-semibold">{successInfo.sleepTime}</span> e senha protegida por hash.
              </p>
              {successInfo.requiresConfirmation && (
                <p className="mt-2 text-xs text-amber-200">
                  Verifique a caixa de entrada de <strong>{successInfo.email}</strong> para confirmar seu e-mail antes
                  de entrar.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            {successInfo.hasSession && (
              <button
                type="button"
                onClick={() => navigate('/roteiro-do-sonho')}
                className="onira-gradient-btn flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white"
              >
                Acessar Roteiro do Sonho
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleGoToLogin}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10"
            >
              Ir para Login
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-rose-500/35 bg-rose-500/12 px-4 py-3 text-sm text-rose-200"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="register-name" className="mb-1.5 block text-xs font-medium text-slate-300">
              Nome completo
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Como podemos chamar você?"
                className="onira-input w-full rounded-xl py-2.5 pr-4 pl-10 text-sm text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="register-email" className="mb-1.5 block text-xs font-medium text-slate-300">
              E-mail
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                className="onira-input w-full rounded-xl py-2.5 pr-4 pl-10 text-sm text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="register-sleep-time" className="mb-1.5 block text-xs font-medium text-slate-300">
              Horário habitual de dormir
            </label>
            <div className="relative">
              <Clock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="register-sleep-time"
                type="time"
                required
                value={habitualSleepTime}
                onChange={(e) => setHabitualSleepTime(e.target.value)}
                className="onira-input w-full rounded-xl py-2.5 pr-4 pl-10 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label htmlFor="register-password" className="mb-1.5 block text-xs font-medium text-slate-300">
                Senha
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="onira-input w-full rounded-xl py-2.5 pr-10 pl-10 text-sm text-white placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-200"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="register-confirm-password" className="mb-1.5 block text-xs font-medium text-slate-300">
                Confirmar senha
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className="onira-input w-full rounded-xl py-2.5 pr-10 pl-10 text-sm text-white placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-200"
                  aria-label={showConfirmPassword ? 'Ocultar confirmação' : 'Mostrar confirmação'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="onira-gradient-btn mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-65"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Cadastrando...
              </>
            ) : (
              <>
                Cadastrar
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      )}
    </AuthLayout>
  );
};
