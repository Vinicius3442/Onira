import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Moon,
  Sparkles,
  Thermometer,
  SunMedium,
  Volume2,
  ShieldCheck,
  Cpu,
  Wind,
  CheckCircle2,
} from 'lucide-react';
import { OniraLogo } from '../components/OniraLogo';
import { WaveBackdrop } from '../components/WaveBackdrop';
import { NeoPixelRing } from '../components/NeoPixelRing';
import { RevealOnScroll, ScrollProgressBar } from '../components/RevealOnScroll';
import { useAuth } from '../contexts/AuthContext';

const PREVIEW_THEMES = [
  { name: 'Praia ao entardecer', color: 'dourado suave', hex: '#F59E0B' },
  { name: 'Aurora boreal', color: 'lilás', hex: '#A855F7' },
  { name: 'Céu estrelado', color: 'azul índigo', hex: '#6366F1' },
  { name: 'Floresta serena', color: 'verde esmeralda', hex: '#10B981' },
];

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [previewIdx, setPreviewIdx] = useState(0);
  const currentPreview = PREVIEW_THEMES[previewIdx];

  return (
    <div className="relative min-h-screen text-slate-100">
      <ScrollProgressBar />
      <WaveBackdrop />

      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080715]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <OniraLogo variant="compact" />

          <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
            <a href="#como-funciona" className="transition-colors hover:text-white">
              Como funciona
            </a>
            <a href="#hardware" className="transition-colors hover:text-white">
              Sensores IoT
            </a>
            <a href="#plataforma" className="transition-colors hover:text-white">
              Plataforma
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            {user ? (
              <Link
                to="/roteiro-do-sonho"
                className="onira-gradient-btn inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white sm:text-sm"
              >
                Acessar plataforma
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 sm:text-sm"
                >
                  Entrar
                </Link>
                <Link
                  to="/cadastro"
                  className="onira-gradient-btn inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white sm:text-sm"
                >
                  Criar conta
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="animate-page-enter mx-auto max-w-6xl px-4 pt-12 pb-16 sm:px-6 sm:pt-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3.5 py-1.5 text-xs font-semibold text-violet-200">
              <Sparkles className="h-3.5 w-3.5 text-sky-300" />
              Dormire Tecnologia do Sono · Travesseiro Inteligente
            </span>

            <h1 className="mt-5 text-4xl leading-[1.1] font-extrabold tracking-tight text-white sm:text-5xl">
              Sonhe. Descanse.{' '}
              <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-sky-300 bg-clip-text text-transparent">
                Viva melhor.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300">
              O <strong className="text-white">ONIRA</strong> vai além do monitoramento passivo: ele conduz sua
              experiência noturna através de temas de sonho com iluminação suave NeoPixel, controla aquecimento e
              desperta você sem sustos.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to={user ? '/roteiro-do-sonho' : '/cadastro'}
                className="onira-gradient-btn inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white"
              >
                {user ? 'Ir para Roteiro do Sonho' : 'Começar minha jornada'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10"
              >
                Já possuo conta
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6 text-xs">
              <div>
                <p className="font-bold text-white">Roteiro Real</p>
                <p className="mt-1 text-slate-400">Tema, duração e despertar salvos no Supabase</p>
              </div>
              <div>
                <p className="font-bold text-white">Luz NeoPixel</p>
                <p className="mt-1 text-slate-400">Indução luminosa alinhada ao tema escolhido</p>
              </div>
              <div>
                <p className="font-bold text-white">Despertar Suave</p>
                <p className="mt-1 text-slate-400">Buzzer progressivo respeitando seu ritmo</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="onira-card onira-card-lift group relative overflow-hidden rounded-[2rem] p-4 sm:p-5">
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <img
                  src="/images/onira-pillow.png"
                  alt="Travesseiro inteligente ONIRA em quarto aconchegante"
                  className="h-64 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 sm:h-80"
                />
              </div>

              {/* Interação rápida com o Anel NeoPixel */}
              <div className="mt-4 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 sm:flex-row">
                <div className="flex items-center gap-4">
                  <NeoPixelRing
                    colorHex={currentPreview.hex}
                    colorLabel={currentPreview.color}
                    size="sm"
                  />
                  <div>
                    <p className="text-[11px] font-semibold tracking-wider text-violet-300 uppercase">
                      Prévia do Anel NeoPixel
                    </p>
                    <p className="font-bold text-white">{currentPreview.name}</p>
                    <p className="text-xs text-slate-400">Cor da luz: {currentPreview.color}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {PREVIEW_THEMES.map((item, idx) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setPreviewIdx(idx)}
                      className={`h-7 w-7 cursor-pointer rounded-full border-2 transition-transform ${
                        previewIdx === idx ? 'scale-110 border-white' : 'border-transparent opacity-65 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: item.hex }}
                      aria-label={`Visualizar cor do tema ${item.name}`}
                      title={item.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <RevealOnScroll className="max-w-2xl">
          <p className="text-xs font-bold tracking-[0.2em] text-violet-400 uppercase">Experiência completa</p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            Do planejamento da noite ao despertar restaurador
          </h2>
        </RevealOnScroll>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            {
              step: '01',
              title: 'Escolha seu Roteiro do Sonho',
              desc: 'Selecione o tema desejado na biblioteca gerenciada, defina a duração (mínimo 1h) e o horário ideal de despertar.',
              icon: <Moon className="h-5 w-5 text-violet-300" />,
            },
            {
              step: '02',
              title: 'Indução Luminosa e Conforto Térmico',
              desc: 'O anel de LEDs NeoPixel projeta a cor suave do tema escolhido enquanto os sensores acompanham temperatura e luz ambiente.',
              icon: <Sparkles className="h-5 w-5 text-sky-300" />,
            },
            {
              step: '03',
              title: 'Despertar Suave e Histórico Real',
              desc: 'O buzzer conduz um despertar gradual no horário programado e você registra sua evolução no histórico pessoal.',
              icon: <CheckCircle2 className="h-5 w-5 text-emerald-300" />,
            },
          ].map((card, idx) => (
            <RevealOnScroll key={card.step} delay={idx * 100}>
              <div className="onira-card onira-card-lift h-full rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    {card.icon}
                  </div>
                  <span className="font-display text-xs font-bold tracking-widest text-slate-500">
                    ETAPA {card.step}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{card.desc}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* Arquitetura IoT (do catálogo Dormire) */}
      <section id="hardware" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <RevealOnScroll>
          <div className="onira-card rounded-[2rem] p-6 sm:p-10">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold tracking-[0.2em] text-sky-400 uppercase">Produto físico · IoT</p>
                <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                  Componentes do Travesseiro Inteligente
                </h2>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-slate-300">
                <Cpu className="h-3.5 w-3.5 text-violet-400" />
                ESP32 + Sensores integrados
              </span>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  icon: <Moon className="h-5 w-5 text-violet-300" />,
                  title: 'Fase do Sono',
                  detail: 'Potenciômetro (0 acordado a 100 sono profundo)',
                },
                {
                  icon: <Thermometer className="h-5 w-5 text-rose-300" />,
                  title: 'Sensor NTC',
                  detail: 'Temperatura do travesseiro em °C com alerta térmico',
                },
                {
                  icon: <SunMedium className="h-5 w-5 text-amber-300" />,
                  title: 'Fotorresistor LDR',
                  detail: 'Luminosidade do quarto de 0 a 100%',
                },
                {
                  icon: <Sparkles className="h-5 w-5 text-sky-300" />,
                  title: 'Anel NeoPixel',
                  detail: 'Luz de indução suave na cor do tema escolhido',
                },
                {
                  icon: <Volume2 className="h-5 w-5 text-emerald-300" />,
                  title: 'Buzzer + Ventilação',
                  detail: 'Despertar suave e resfriamento automático',
                },
              ].map((item, idx) => (
                <RevealOnScroll key={item.title} delay={idx * 70}>
                  <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/35 hover:bg-white/[0.06]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                      {item.icon}
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-white">{item.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.detail}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* Plataforma & Segurança */}
      <section id="plataforma" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <RevealOnScroll delay={0}>
            <div className="onira-card onira-card-lift h-full rounded-3xl p-7">
              <ShieldCheck className="h-7 w-7 text-violet-400" />
              <h3 className="mt-4 text-xl font-bold text-white">Autenticação e Controle de Acesso Real</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Senhas armazenadas com hash seguro pelo Supabase Auth, recuperação por e-mail com validação real de conta
                e área administrativa protegida por Row Level Security (RLS) no PostgreSQL.
              </p>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={110}>
            <div className="onira-card onira-card-lift h-full rounded-3xl p-7">
              <Wind className="h-7 w-7 text-sky-400" />
              <h3 className="mt-4 text-xl font-bold text-white">Para adultos, hotéis e clínicas do sono</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Experiência responsiva pensada para uso noturno no celular e gestão completa do catálogo de temas pelo
                painel administrativo em computador.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#060511] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-slate-400 sm:flex-row sm:px-6">
          <OniraLogo variant="compact" />
          <p>
            ONIRA · Dormire Tecnologia do Sono · Projeto Integrador Fábrica do Futuro (SENAI-SP)
          </p>
        </div>
      </footer>
    </div>
  );
};
