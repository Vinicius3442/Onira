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
import oniraPillowImg from '../assets/onira-pillow.png';

const PREVIEW_THEMES = [
  { name: 'Praia ao entardecer', color: 'dourado suave', hex: '#F59E0B' },
  { name: 'Aurora boreal', color: 'lavanda', hex: '#A78BFA' },
  { name: 'Céu estrelado', color: 'roxo tecnológico', hex: '#7665E8' },
  { name: 'Floresta serena', color: 'verde esmeralda', hex: '#10B981' },
];

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [previewIdx, setPreviewIdx] = useState(0);
  const currentPreview = PREVIEW_THEMES[previewIdx];

  return (
    <div className="relative min-h-screen text-onira-offwhite">
      <ScrollProgressBar />
      <WaveBackdrop />

      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-onira-lavender/15 bg-onira-night/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <OniraLogo variant="compact" />

          <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
            <a href="#produto" className="transition-colors hover:text-white">
              O Produto
            </a>
            <a href="#como-funciona" className="transition-colors hover:text-white">
              Como funciona
            </a>
            <a href="#hardware" className="transition-colors hover:text-white">
              Hardware IoT
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
            <span className="inline-flex items-center gap-2 rounded-full border border-onira-lavender/30 bg-onira-purple/15 px-3.5 py-1.5 text-xs font-semibold text-onira-offwhite">
              <Sparkles className="h-3.5 w-3.5 text-onira-lavender" />
              Dormire Tecnologia do Sono · Travesseiro Inteligente
            </span>

            <h1 className="mt-5 text-4xl leading-[1.1] font-extrabold tracking-tight text-onira-offwhite sm:text-5xl">
              Sonhe. Descanse.{' '}
              <span className="bg-gradient-to-r from-onira-purple via-onira-lavender to-onira-offwhite bg-clip-text text-transparent">
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
                  src={oniraPillowImg}
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
                    <p className="text-[11px] font-semibold tracking-wider text-onira-lavender uppercase">
                      Prévia do Anel NeoPixel
                    </p>
                    <p className="font-bold text-onira-offwhite">{currentPreview.name}</p>
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

      {/* Sobre o Produto & Funções */}
      <section id="produto" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <RevealOnScroll>
          <div className="onira-card rounded-[2rem] p-6 sm:p-10">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-5">
                <p className="text-xs font-bold tracking-[0.2em] text-onira-lavender uppercase">
                  O Produto · Dormire Tecnologia do Sono
                </p>
                <h2 className="mt-2 text-2xl font-bold text-onira-offwhite sm:text-3xl">
                  O que é o Travesseiro Inteligente ONIRA?
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  O <strong className="text-onira-offwhite">ONIRA</strong> combina ergonomia em espuma viscoelástica
                  de alta densidade com um núcleo eletrônico isolado de baixa tensão (<strong className="text-onira-offwhite">5V USB-C</strong>),
                  revestido por capa respirável e hipoalergênica.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  Diferente de pulseiras e aplicativos que apenas medem o sono de forma passiva, o ONIRA atua
                  ativamente no ambiente noturno: induz o relaxamento por cromoterapia suave, controla o conforto
                  térmico e conduz um despertar progressivo sem sustos.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-onira-lavender/20 bg-onira-night/60 p-3.5">
                    <p className="font-bold text-onira-lavender">Ergonomia + Segurança</p>
                    <p className="mt-1 text-slate-400">Espuma viscoelástica com compartimento eletrônico 5V isolado.</p>
                  </div>
                  <div className="rounded-xl border border-onira-lavender/20 bg-onira-night/60 p-3.5">
                    <p className="font-bold text-onira-lavender">Conectado à Nuvem</p>
                    <p className="mt-1 text-slate-400">Sincronizado com seu Roteiro do Sonho e histórico no Supabase.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:col-span-7">
                {[
                  {
                    icon: <Sparkles className="h-4 w-4 text-onira-lavender" />,
                    title: 'Indução Luminosa por Tema',
                    desc: 'O anel de 12 LEDs NeoPixel projeta a cor correspondente ao tema escolhido (ex.: Dourado, Lavanda, Esmeralda).',
                  },
                  {
                    icon: <Thermometer className="h-4 w-4 text-rose-300" />,
                    title: 'Controle Térmico Automático',
                    desc: 'O sensor NTC monitora o aquecimento em °C e ativa a microventilação ao ultrapassar o limite definido.',
                  },
                  {
                    icon: <SunMedium className="h-4 w-4 text-amber-300" />,
                    title: 'Adaptação à Luz do Quarto',
                    desc: 'O fotorresistor LDR mede a luminosidade ambiente (0–100%) e suaviza o brilho dos LEDs no escuro.',
                  },
                  {
                    icon: <Moon className="h-4 w-4 text-onira-purple" />,
                    title: 'Leitura da Fase do Sono',
                    desc: 'Acompanha a transição entre vigília, sono leve e sono profundo (0 a 100) para ajustar o ciclo noturno.',
                  },
                  {
                    icon: <Volume2 className="h-4 w-4 text-emerald-300" />,
                    title: 'Despertar Suave Progressivo',
                    desc: 'Combina aumento gradual de luz quente com tons suaves no buzzer no horário exato programado.',
                  },
                  {
                    icon: <CheckCircle2 className="h-4 w-4 text-onira-lavender" />,
                    title: 'Histórico & Avaliação Matinal',
                    desc: 'Permite avaliar cada noite (1 a 5 estrelas), registrar anotações e acompanhar sua média real de descanso.',
                  },
                ].map((fn) => (
                  <div
                    key={fn.title}
                    className="rounded-2xl border border-onira-lavender/15 bg-onira-offwhite/[0.03] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-onira-lavender/40 hover:bg-onira-offwhite/[0.06]"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-onira-purple/20">
                        {fn.icon}
                      </span>
                      <h3 className="text-sm font-bold text-onira-offwhite">{fn.title}</h3>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">{fn.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <RevealOnScroll className="max-w-2xl">
          <p className="text-xs font-bold tracking-[0.2em] text-onira-lavender uppercase">Experiência completa</p>
          <h2 className="mt-2 text-2xl font-bold text-onira-offwhite sm:text-3xl">
            Do planejamento da noite ao despertar restaurador
          </h2>
        </RevealOnScroll>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            {
              step: '01',
              title: 'Escolha seu Roteiro do Sonho',
              desc: 'Selecione o tema desejado na biblioteca gerenciada, defina a duração (mínimo 1h) e o horário ideal de despertar.',
              icon: <Moon className="h-5 w-5 text-onira-lavender" />,
            },
            {
              step: '02',
              title: 'Indução Luminosa e Conforto Térmico',
              desc: 'O anel de LEDs NeoPixel projeta a cor suave do tema escolhido enquanto os sensores acompanham temperatura e luz ambiente.',
              icon: <Sparkles className="h-5 w-5 text-onira-purple" />,
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
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-onira-lavender/15 bg-onira-offwhite/5">
                    {card.icon}
                  </div>
                  <span className="font-display text-xs font-bold tracking-widest text-slate-500">
                    ETAPA {card.step}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-onira-offwhite">{card.title}</h3>
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
                <p className="text-xs font-bold tracking-[0.2em] text-onira-lavender uppercase">
                  Hardware do Protótipo · IoT (ESP32 / Wokwi)
                </p>
                <h2 className="mt-2 text-2xl font-bold text-onira-offwhite sm:text-3xl">
                  Componentes e funcionamento do protótipo físico
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-400">
                  O protótipo eletrônico é controlado por um microcontrolador <strong className="text-onira-offwhite">ESP32</strong> com
                  leitura contínua de sensores ambientais/fisiológicos, display OLED de status e atuação automática em tempo real.
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-onira-lavender/25 bg-onira-purple/15 px-3.5 py-1.5 text-xs text-onira-offwhite">
                <Cpu className="h-3.5 w-3.5 text-onira-lavender" />
                ESP32 DevKit v1 · 5V USB-C
              </span>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  icon: <Moon className="h-5 w-5 text-onira-lavender" />,
                  pin: 'GPIO 34 · ADC',
                  title: 'Fase do Sono',
                  detail: 'Potenciômetro simulando o ciclo: 0–30 Acordado, 31–69 Sono Leve e 70–100 Sono Profundo.',
                },
                {
                  icon: <Thermometer className="h-5 w-5 text-rose-300" />,
                  pin: 'GPIO 35 · ADC',
                  title: 'Sensor NTC',
                  detail: 'Mede a temperatura do travesseiro em °C (equação Steinhart-Hart) com alerta acima de 27,5 °C.',
                },
                {
                  icon: <SunMedium className="h-5 w-5 text-amber-300" />,
                  pin: 'GPIO 32 · ADC',
                  title: 'Fotorresistor LDR',
                  detail: 'Lê a luminosidade do quarto (0 a 100%) e ajusta automaticamente o brilho do anel LED.',
                },
                {
                  icon: <Sparkles className="h-5 w-5 text-onira-purple" />,
                  pin: 'GPIO 13 · PWM',
                  title: 'Anel NeoPixel',
                  detail: '12 LEDs RGB com pulsação respiratória suave na cor do tema de sonho selecionado.',
                },
                {
                  icon: <Volume2 className="h-5 w-5 text-emerald-300" />,
                  pin: 'GPIO 14 & 27',
                  title: 'Buzzer + Ventilação',
                  detail: 'Buzzer para despertar suave progressivo e saída de ventilação para resfriamento térmico.',
                },
              ].map((item, idx) => (
                <RevealOnScroll key={item.title} delay={idx * 70}>
                  <div className="h-full rounded-2xl border border-onira-lavender/15 bg-onira-offwhite/[0.03] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-onira-lavender/40 hover:bg-onira-offwhite/[0.06]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-onira-offwhite/5">
                        {item.icon}
                      </div>
                      <span className="rounded-md border border-onira-lavender/20 bg-onira-night/80 px-2 py-0.5 font-mono text-[10px] text-onira-lavender">
                        {item.pin}
                      </span>
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-onira-offwhite">{item.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.detail}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>

            {/* Fluxo de funcionamento do hardware */}
            <div className="mt-7 rounded-2xl border border-onira-lavender/15 bg-onira-night/60 p-5">
              <p className="text-[11px] font-bold tracking-[0.18em] text-onira-lavender uppercase">
                Como o hardware funciona em ciclo contínuo
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    n: '1',
                    title: 'Leitura dos Sensores',
                    desc: 'O ESP32 amostra fase do sono (potenciômetro), temperatura (NTC) e luz ambiente (LDR) continuamente.',
                  },
                  {
                    n: '2',
                    title: 'Decisão Embarcada',
                    desc: 'Compara a temperatura com o limite seguro (27,5 °C) e calcula o brilho ideal dos LEDs conforme o escuro do quarto.',
                  },
                  {
                    n: '3',
                    title: 'Atuação Sensorial',
                    desc: 'Projeta a pulsação luminosa do tema no anel NeoPixel e liga a ventilação automática caso haja aquecimento.',
                  },
                  {
                    n: '4',
                    title: 'Despertar & Telemetria',
                    desc: 'No horário definido, inicia luz quente gradual + melodia suave no buzzer e atualiza o painel OLED/Serial.',
                  },
                ].map((step) => (
                  <div key={step.n} className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-onira-purple text-xs font-extrabold text-onira-offwhite">
                      {step.n}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-onira-offwhite">{step.title}</h4>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* Plataforma & Segurança */}
      <section id="plataforma" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <RevealOnScroll delay={0}>
            <div className="onira-card onira-card-lift h-full rounded-3xl p-7">
              <ShieldCheck className="h-7 w-7 text-onira-lavender" />
              <h3 className="mt-4 text-xl font-bold text-onira-offwhite">Autenticação e Controle de Acesso Real</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Senhas armazenadas com hash seguro pelo Supabase Auth, recuperação por e-mail com validação real de conta
                e área administrativa protegida por Row Level Security (RLS) no PostgreSQL.
              </p>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={110}>
            <div className="onira-card onira-card-lift h-full rounded-3xl p-7">
              <Wind className="h-7 w-7 text-onira-purple" />
              <h3 className="mt-4 text-xl font-bold text-onira-offwhite">Para adultos, hotéis e clínicas do sono</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Experiência responsiva pensada para uso noturno no celular e gestão completa do catálogo de temas pelo
                painel administrativo em computador.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-onira-lavender/15 bg-onira-night-deep py-8">
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
