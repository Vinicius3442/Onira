import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { OniraLogo } from './OniraLogo';
import { WaveBackdrop } from './WaveBackdrop';
import oniraPillowImg from '../assets/onira-pillow.png';

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
  const pillowImageSrc = oniraPillowImg;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
      <WaveBackdrop />

      <div className="animate-page-enter grid w-full max-w-5xl grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
        {/* Painel visual lateral (visível no desktop) */}
        <div className="onira-card relative hidden flex-col justify-between overflow-hidden rounded-[2rem] p-9 lg:col-span-6 lg:flex">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-onira-purple/20 via-transparent to-onira-lavender/12" />

          <div className="relative z-10">
            <Link to="/" className="inline-block transition-opacity hover:opacity-90">
              <OniraLogo variant="full" showTagline />
            </Link>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-slate-300">
              Conduza seus sonhos com iluminação inteligente NeoPixel e acorde de forma suave todos os dias com o{' '}
              <span className="font-semibold text-onira-offwhite">Travesseiro Inteligente ONIRA</span> da Dormire Tecnologia do
              Sono.
            </p>
          </div>

          <div className="group relative z-10 my-6 overflow-hidden rounded-2xl border border-onira-lavender/15 bg-onira-night-deep shadow-xl">
            <img
              src={pillowImageSrc}
              alt="Travesseiro inteligente ONIRA em quarto aconchegante"
              className="h-60 w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-onira-night via-onira-night/75 to-transparent p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-onira-offwhite">
                <Sparkles className="h-3.5 w-3.5 text-onira-lavender" />
                Indução luminosa personalizada + despertar suave
              </div>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-onira-lavender/15 bg-onira-offwhite/[0.03] p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-onira-lavender/40 hover:bg-onira-offwhite/[0.06]">
              <p className="font-semibold text-onira-offwhite">Roteiro do Sonho</p>
              <p className="mt-1 text-slate-400">Escolha tema, duração e despertar sob medida.</p>
            </div>
            <div className="rounded-xl border border-onira-lavender/15 bg-onira-offwhite/[0.03] p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-onira-purple/50 hover:bg-onira-offwhite/[0.06]">
              <p className="font-semibold text-onira-offwhite">Banco Real & Seguro</p>
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

            {/* Banner compacto do produto em telas menores que 1024px (mobile / janela dividida) */}
            <div className="relative mt-5 overflow-hidden rounded-2xl border border-onira-lavender/15 bg-onira-night-deep shadow-lg lg:hidden">
              <img
                src={pillowImageSrc}
                alt="Travesseiro inteligente ONIRA em quarto aconchegante"
                className="h-36 w-full object-cover object-center"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-onira-night via-onira-night/70 to-transparent px-3.5 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-onira-offwhite">
                  <Sparkles className="h-3 w-3 shrink-0 text-onira-lavender" />
                  Travesseiro Inteligente ONIRA
                </div>
              </div>
            </div>

            {/* Eyebrow & Título */}
            <div className="mt-6 lg:mt-8">
              <p className="text-[11px] font-bold tracking-[0.2em] text-onira-lavender uppercase">{eyebrow}</p>
              <h1 className="mt-2 text-3xl leading-tight font-bold tracking-tight text-onira-offwhite sm:text-[32px]">
                {titlePrimary}
                <br />
                <span className="bg-gradient-to-r from-onira-purple via-onira-lavender to-onira-offwhite bg-clip-text text-transparent">
                  {titleHighlight}
                </span>
              </h1>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{subtitle}</p>
            </div>

            {/* Formulário */}
            <div className="mt-7">{children}</div>
          </div>

          <div className="mt-7 border-t border-onira-lavender/15 pt-5">
            <div className="text-center text-sm text-slate-400">{footer}</div>
            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-onira-lavender/80" />
              Seus dados de sono são protegidos com criptografia
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
