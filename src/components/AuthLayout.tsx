import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { OniraLogo } from './OniraLogo';
import { WaveBackdrop } from './WaveBackdrop';

interface AuthLayoutProps {
  eyebrow: string;
  titlePrimary: string;
  titleHighlight: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

/**
 * Layout responsivo de Autenticação (Mobile 390px + Split showcase em Desktop).
 * Sem ícones decorativos soltos no topo que pareçam botões.
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({
  eyebrow,
  titlePrimary,
  titleHighlight,
  subtitle,
  children,
  footer,
}) => {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
      <WaveBackdrop />

      <div className="animate-page-enter grid w-full max-w-5xl grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
        {/* Painel visual lateral (visível no desktop) */}
        <div className="onira-card relative hidden flex-col justify-between overflow-hidden rounded-[2rem] p-9 lg:col-span-6 lg:flex">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/15 via-transparent to-sky-500/10" />

          <div className="relative z-10">
            <Link to="/" className="inline-block transition-opacity hover:opacity-90">
              <OniraLogo variant="full" showTagline />
            </Link>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-slate-300">
              Conduza seus sonhos com iluminação inteligente NeoPixel e acorde de forma suave todos os dias com o{' '}
              <span className="font-semibold text-white">Travesseiro Inteligente ONIRA</span> da Dormire Tecnologia do
              Sono.
            </p>
          </div>

          <div className="group relative z-10 my-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0A0818] shadow-xl">
            <img
              src="/images/onira-pillow.png"
              alt="Travesseiro inteligente ONIRA em quarto aconchegante"
              className="h-60 w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#080715] via-[#080715]/75 to-transparent p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-violet-200">
                <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                Indução luminosa personalizada + despertar suave
              </div>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-400/35 hover:bg-white/[0.06]">
              <p className="font-semibold text-white">Roteiro do Sonho</p>
              <p className="mt-1 text-slate-400">Escolha tema, duração e despertar sob medida.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-400/35 hover:bg-white/[0.06]">
              <p className="font-semibold text-white">Banco Real & Seguro</p>
              <p className="mt-1 text-slate-400">Autenticação Supabase com senhas protegidas por hash.</p>
            </div>
          </div>
        </div>

        {/* Cartão principal de autenticação */}
        <div className="onira-card mx-auto flex w-full max-w-[430px] flex-col justify-between rounded-[2rem] p-6 sm:p-8 lg:col-span-6 lg:max-w-none">
          <div>
            {/* Top header limpo apenas com a marca clicável para início */}
            <div className="flex items-center justify-between">
              <Link to="/" className="inline-block transition-opacity hover:opacity-90" title="Voltar para o início">
                <OniraLogo variant="compact" />
              </Link>
            </div>

            {/* Eyebrow & Título */}
            <div className="mt-8">
              <p className="text-[11px] font-bold tracking-[0.2em] text-violet-400 uppercase">{eyebrow}</p>
              <h1 className="mt-2 text-3xl leading-tight font-bold tracking-tight text-white sm:text-[32px]">
                {titlePrimary}
                <br />
                <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-sky-300 bg-clip-text text-transparent">
                  {titleHighlight}
                </span>
              </h1>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{subtitle}</p>
            </div>

            {/* Formulário */}
            <div className="mt-7">{children}</div>
          </div>

          <div className="mt-7 border-t border-white/10 pt-5">
            <div className="text-center text-sm text-slate-400">{footer}</div>
            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-violet-400/80" />
              Seus dados de sono são protegidos com criptografia
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
