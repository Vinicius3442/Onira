import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { supabase } from '../lib/supabase';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Informe um endereço de e-mail válido.');
      return;
    }

    setSubmitting(true);
    try {
      // RF03 / CT-03: Verifica no banco real se o e-mail existe antes de enviar as instruções
      const { data: emailExists, error: rpcError } = await supabase.rpc('check_email_exists', {
        p_email: normalizedEmail,
      });

      if (rpcError) {
        setError(
          'Não foi possível verificar o e-mail no banco de dados. Verifique se o script supabase/schema.sql foi executado.'
        );
        return;
      }

      if (!emailExists) {
        setError('E-mail não encontrado em nossa plataforma. Verifique o endereço informado.');
        return;
      }

      // Envia o link real de recuperação de senha via Supabase Auth
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/atualizar-senha`,
      });

      if (resetError) {
        const msg = resetError.message.toLowerCase();
        if (msg.includes('rate limit') || msg.includes('seconds')) {
          setError('Limite temporário de envios atingido no Supabase. Aguarde alguns instantes e tente novamente.');
        } else {
          setError(`Erro ao enviar instruções de redefinição: ${resetError.message}`);
        }
        return;
      }

      setSuccessMessage(
        `Instruções de redefinição enviadas para ${normalizedEmail}. Verifique sua caixa de entrada e clique no link seguro para criar uma nova senha.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Recuperação de acesso"
      titlePrimary="Vamos redefinir"
      titleHighlight="sua senha."
      subtitle="Informe o e-mail cadastrado. Conferimos sua conta e enviamos um link seguro para você criar uma nova senha."
      footer={
        <>
          Lembrou sua senha?{' '}
          <Link to="/login" className="font-semibold text-violet-400 transition-colors hover:text-violet-300">
            Voltar ao login
          </Link>
        </>
      }
    >
      {/* Emblema visual central fiel ao protótipo 03 REDEFINIÇÃO DE SENHA */}
      <div className="mb-6 flex justify-center">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-violet-500/20" />
          <div className="absolute inset-3 rounded-full border border-violet-400/30 bg-violet-500/10" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/40 bg-[#1B163B] text-violet-300 shadow-[0_0_25px_rgba(139,92,246,0.35)]">
            <Mail className="h-5 w-5" />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-rose-500/35 bg-rose-500/12 px-4 py-3 text-sm text-rose-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-xl border border-emerald-500/35 bg-emerald-500/12 px-4 py-3.5 text-sm text-emerald-100"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        <div>
          <label htmlFor="reset-email" className="mb-1.5 block text-xs font-medium text-slate-300">
            E-mail cadastrado
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              className="onira-input w-full rounded-xl py-3 pr-4 pl-10 text-sm text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="onira-gradient-btn flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-65"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando e enviando...
            </>
          ) : (
            <>
              Enviar link de recuperação
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-xs text-slate-400">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
          <div>
            <p className="font-semibold text-slate-200">Link protegido</p>
            <p className="mt-0.5 leading-relaxed">
              O link enviado pelo Supabase expira automaticamente por segurança e só pode ser utilizado uma vez.
            </p>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
};
