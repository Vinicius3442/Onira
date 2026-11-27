import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Moon,
  Clock,
  Sunrise,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Trash2,
  XCircle,
  RefreshCw,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { AppShell } from '../components/AppShell';
import { NeoPixelRing } from '../components/NeoPixelRing';
import { RevealOnScroll } from '../components/RevealOnScroll';
import { calculateBedtime, formatDuration, resolveColorHex } from '../lib/colors';
import type { DreamNight, DreamTheme, NightStatus } from '../types/database';

const DURATION_PRESETS = [6, 7, 8, 9];

export const DreamScriptPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedThemeId = searchParams.get('tema') || '';

  // Dados reais do Supabase
  const [themes, setThemes] = useState<DreamTheme[]>([]);
  const [nights, setNights] = useState<DreamNight[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Formulário Roteiro do Sonho (RF05 / CT-05)
  const [selectedThemeId, setSelectedThemeId] = useState(requestedThemeId);
  const [durationInput, setDurationInput] = useState('7');
  const [wakeUpTime, setWakeUpTime] = useState('06:30');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submittingNight, setSubmittingNight] = useState(false);
  const [updatingNightId, setUpdatingNightId] = useState<string | null>(null);

  const fetchAllData = useCallback(
    async (isManualRefresh = false) => {
      if (!user) return;
      if (isManualRefresh) setRefreshing(true);
      else setLoadingData(true);
      setLoadError(null);

      try {
        const [themesRes, nightsRes] = await Promise.all([
          supabase.from('dream_themes').select('*').order('name', { ascending: true }),
          supabase
            .from('dream_nights')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
        ]);

        if (themesRes.error) {
          setLoadError(
            `Erro ao carregar temas de sonho: ${themesRes.error.message}. Verifique se supabase/schema.sql foi executado.`
          );
        } else {
          const loadedThemes = (themesRes.data || []) as DreamTheme[];
          setThemes(loadedThemes);
          setSelectedThemeId((prev) => {
            if (requestedThemeId && loadedThemes.some((t) => t.id === requestedThemeId)) {
              return requestedThemeId;
            }
            if (prev && loadedThemes.some((t) => t.id === prev)) return prev;
            const praia = loadedThemes.find((t) => t.name.toLowerCase().includes('praia'));
            return praia?.id || loadedThemes[0]?.id || '';
          });
        }

        if (nightsRes.error) {
          setLoadError((prev) => prev || `Erro ao carregar noites programadas: ${nightsRes.error.message}`);
        } else {
          setNights((nightsRes.data || []) as DreamNight[]);
        }
      } finally {
        setLoadingData(false);
        setRefreshing(false);
      }
    },
    [user, requestedThemeId]
  );

  useEffect(() => {
    void fetchAllData(false);
  }, [fetchAllData]);

  const selectedTheme = useMemo(
    () => themes.find((t) => t.id === selectedThemeId) || null,
    [themes, selectedThemeId]
  );

  const parsedDuration = Number(durationInput.replace(',', '.'));
  const suggestedBedtime = useMemo(() => {
    if (Number.isNaN(parsedDuration) || parsedDuration < 1) return '--:--';
    return calculateBedtime(wakeUpTime, parsedDuration);
  }, [wakeUpTime, parsedDuration]);

  const stats = useMemo(() => {
    const scheduled = nights.filter((n) => n.status === 'Programada');
    const avgDuration =
      nights.length > 0
        ? nights.reduce((acc, item) => acc + Number(item.duration_hours), 0) / nights.length
        : 0;
    const nextNight = scheduled[0] || null;
    return {
      total: nights.length,
      scheduledCount: scheduled.length,
      avgDuration,
      nextNight,
    };
  }, [nights]);

  const handleScheduleNight = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!user) return;

    if (!selectedTheme) {
      setFormError('Selecione um tema de sonho antes de programar sua noite.');
      return;
    }

    const duration = Number(durationInput.replace(',', '.'));
    // CT-05: A plataforma recusa duração menor que 1 hora
    if (!durationInput.trim() || Number.isNaN(duration) || duration < 1) {
      setFormError('A duração mínima para programar uma noite é de 1 hora.');
      return;
    }

    if (duration > 24) {
      setFormError('A duração máxima permitida é de 24 horas.');
      return;
    }

    if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(wakeUpTime)) {
      setFormError('Informe um horário de despertar válido (ex.: 06:30).');
      return;
    }

    setSubmittingNight(true);
    try {
      const hex = selectedTheme.light_hex || resolveColorHex(selectedTheme.light_color);

      const { data, error } = await supabase
        .from('dream_nights')
        .insert({
          user_id: user.id,
          theme_id: selectedTheme.id,
          theme_name: selectedTheme.name,
          theme_light_color: selectedTheme.light_color,
          theme_light_hex: hex,
          duration_hours: Number(duration.toFixed(1)),
          wake_up_time: wakeUpTime,
          status: 'Programada',
        })
        .select('*')
        .single();

      if (error) {
        setFormError(`Não foi possível programar a noite: ${error.message}`);
        return;
      }

      if (data) {
        setNights((prev) => [data as DreamNight, ...prev]);
      }

      setFormSuccess(
        `Noite programada com sucesso! Tema "${selectedTheme.name}" (${selectedTheme.light_color}), duração de ${formatDuration(duration)} e despertar às ${wakeUpTime}.`
      );
    } finally {
      setSubmittingNight(false);
    }
  };

  const handleUpdateNightStatus = async (nightId: string, nextStatus: NightStatus) => {
    setUpdatingNightId(nightId);
    try {
      const { error } = await supabase
        .from('dream_nights')
        .update({ status: nextStatus })
        .eq('id', nightId);

      if (!error) {
        setNights((prev) =>
          prev.map((item) => (item.id === nightId ? { ...item, status: nextStatus } : item))
        );
      }
    } finally {
      setUpdatingNightId(null);
    }
  };

  const handleDeleteNight = async (nightId: string) => {
    setUpdatingNightId(nightId);
    try {
      const { error } = await supabase.from('dream_nights').delete().eq('id', nightId);
      if (!error) {
        setNights((prev) => prev.filter((item) => item.id !== nightId));
      }
    } finally {
      setUpdatingNightId(null);
    }
  };

  const activeHex = selectedTheme
    ? selectedTheme.light_hex || resolveColorHex(selectedTheme.light_color)
    : '#7665E8';

  const statusBadgeClass = (status: NightStatus) => {
    switch (status) {
      case 'Programada':
        return 'border-onira-lavender/35 bg-onira-purple/20 text-onira-offwhite';
      case 'Concluída':
        return 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200';
      case 'Cancelada':
        return 'border-slate-500/35 bg-slate-500/15 text-slate-300';
    }
  };

  return (
    <AppShell
      title="Roteiro do Sonho"
      subtitle="Escolha o tema, a duração e o horário de despertar suave para programar sua noite no Travesseiro ONIRA."
      headerActions={
        <button
          type="button"
          onClick={() => void fetchAllData(true)}
          disabled={refreshing}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Sincronizar
        </button>
      }
    >
      {loadError && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/35 bg-rose-500/12 p-4 text-sm text-rose-200">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
          <div>
            <p className="font-semibold text-white">Atenção ao banco de dados</p>
            <p className="mt-0.5">{loadError}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Métricas reais do usuário */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="onira-card onira-card-lift rounded-2xl p-4">
            <p className="text-[11px] font-semibold tracking-wider text-onira-lavender uppercase">Programadas</p>
            <p className="mt-2 text-2xl font-bold text-onira-offwhite">{stats.scheduledCount}</p>
            <p className="mt-0.5 text-xs text-slate-400">noites ativas</p>
          </div>
          <div className="onira-card onira-card-lift rounded-2xl p-4">
            <p className="text-[11px] font-semibold tracking-wider text-onira-lavender uppercase">Próximo despertar</p>
            <p className="mt-2 text-2xl font-bold text-onira-offwhite">
              {stats.nextNight ? stats.nextNight.wake_up_time : '--:--'}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-400">
              {stats.nextNight ? stats.nextNight.theme_name : 'Nenhuma agendada'}
            </p>
          </div>
          <div className="onira-card onira-card-lift rounded-2xl p-4">
            <p className="text-[11px] font-semibold tracking-wider text-emerald-300 uppercase">Média planejada</p>
            <p className="mt-2 text-2xl font-bold text-onira-offwhite">
              {stats.avgDuration > 0 ? formatDuration(stats.avgDuration) : '--'}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {stats.total} {stats.total === 1 ? 'registro real' : 'registros reais'}
            </p>
          </div>
          <Link to="/temas" className="onira-card onira-card-lift group rounded-2xl p-4 transition-colors hover:border-onira-lavender/45">
            <p className="text-[11px] font-semibold tracking-wider text-onira-lavender uppercase">Catálogo ativo</p>
            <p className="mt-2 text-2xl font-bold text-onira-offwhite">{themes.length}</p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-onira-lavender group-hover:text-onira-offwhite">
              Ver biblioteca <ArrowRight className="h-3 w-3" />
            </p>
          </Link>
        </div>

        {/* Grid principal: Formulário + Visualizador NeoPixel */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <form
            onSubmit={handleScheduleNight}
            className="onira-card rounded-3xl p-5 sm:p-7 lg:col-span-8"
            noValidate
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] text-onira-lavender uppercase">
                  Configuração da noite
                </p>
                <h2 className="mt-1 text-xl font-bold text-onira-offwhite">Escolha seu tema e despertar</h2>
              </div>
              <Sparkles className="h-5 w-5 text-onira-lavender" />
            </div>

            {formError && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-500/35 bg-rose-500/12 px-4 py-3 text-sm text-rose-200"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div
                role="status"
                className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-500/35 bg-emerald-500/12 px-4 py-3 text-sm text-emerald-100"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* Seleção de Tema */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="dream-theme-select" className="text-xs font-semibold text-slate-300">
                  Tema do sonho
                </label>
                <Link to="/temas" className="text-xs font-medium text-onira-lavender hover:text-onira-offwhite">
                  Explorar biblioteca completa →
                </Link>
              </div>
              <select
                id="dream-theme-select"
                value={selectedThemeId}
                onChange={(e) => setSelectedThemeId(e.target.value)}
                disabled={loadingData || themes.length === 0}
                className="onira-input w-full rounded-xl px-4 py-3 text-sm text-onira-offwhite"
              >
                {themes.length === 0 ? (
                  <option value="">Nenhum tema cadastrado no banco</option>
                ) : (
                  themes.map((theme) => (
                    <option key={theme.id} value={theme.id} className="bg-onira-surface text-onira-offwhite">
                      {theme.name} — Luz: {theme.light_color}
                    </option>
                  ))
                )}
              </select>

              {loadingData ? (
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin text-onira-lavender" />
                  Carregando temas de sonho do Supabase...
                </div>
              ) : themes.length === 0 ? (
                <p className="mt-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-xs text-amber-200">
                  Ainda não há temas cadastrados. Solicite a um administrador o cadastro de temas no painel.
                </p>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {themes.map((theme) => {
                    const isSelected = theme.id === selectedThemeId;
                    const hex = theme.light_hex || resolveColorHex(theme.light_color);
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setSelectedThemeId(theme.id)}
                        className={`group flex cursor-pointer flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 ${
                          isSelected
                            ? 'border-onira-lavender bg-onira-purple/20 shadow-[0_0_24px_rgba(118,101,232,0.32)]'
                            : 'border-white/10 bg-white/[0.025] hover:border-onira-lavender/40 hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-onira-offwhite">{theme.name}</span>
                          <span
                            className="mt-1 h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: hex, boxShadow: `0 0 10px ${hex}` }}
                          />
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-400">
                          {theme.description}
                        </p>
                        <div className="mt-3 flex items-center justify-between text-[11px]">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-2.5 py-0.5 text-slate-300">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: hex }} />
                            {theme.light_color}
                          </span>
                          {isSelected && <span className="font-semibold text-onira-lavender">Selecionado</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Duração e Despertar */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="dream-duration" className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Duração (em horas)
                </label>
                <div className="relative">
                  <Clock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="dream-duration"
                    type="number"
                    step="0.5"
                    value={durationInput}
                    onChange={(e) => setDurationInput(e.target.value)}
                    placeholder="Ex.: 7"
                    className="onira-input w-full rounded-xl py-3 pr-14 pl-10 text-sm text-white"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-xs text-slate-400">
                    horas
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {DURATION_PRESETS.map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setDurationInput(String(hrs))}
                      className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                        Number(durationInput) === hrs
                          ? 'border-onira-lavender bg-onira-purple/25 text-onira-offwhite'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {hrs}h
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="dream-wakeup" className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Horário de despertar suave
                </label>
                <div className="relative">
                  <Sunrise className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="dream-wakeup"
                    type="time"
                    required
                    value={wakeUpTime}
                    onChange={(e) => setWakeUpTime(e.target.value)}
                    className="onira-input w-full rounded-xl py-3 pr-4 pl-10 text-sm text-onira-offwhite"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Sugestão para deitar:{' '}
                  <span className="font-semibold text-onira-lavender">{suggestedBedtime}</span>
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingNight || themes.length === 0}
              className="onira-gradient-btn mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submittingNight ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gravando noite no banco...
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  Programar noite
                </>
              )}
            </button>
          </form>

          {/* Painel Lateral NeoPixel (altura compacta + sticky no desktop) */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:col-span-4">
            <div className="onira-card flex flex-col items-center gap-5 rounded-3xl p-6 text-center">
              <div className="w-full">
                <p className="text-[11px] font-bold tracking-[0.2em] text-onira-lavender uppercase">
                  Indução Luminosa ONIRA
                </p>
                <h3 className="mt-1 text-base font-bold text-onira-offwhite">Anel LED NeoPixel</h3>
              </div>

              <div className="py-1">
                <NeoPixelRing
                  colorHex={activeHex}
                  colorLabel={selectedTheme?.light_color || 'roxo tecnológico'}
                  themeName={selectedTheme?.name || 'Selecione um tema'}
                  size="lg"
                />
              </div>

              <div className="w-full space-y-2.5 rounded-2xl border border-white/10 bg-black/25 p-4 text-left text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Duração escolhida</span>
                  <span className="font-semibold text-onira-offwhite">
                    {!Number.isNaN(parsedDuration) && parsedDuration >= 1
                      ? formatDuration(parsedDuration)
                      : 'Inválida (< 1h)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Deitar sugerido</span>
                  <span className="font-semibold text-onira-lavender">{suggestedBedtime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Despertar suave</span>
                  <span className="font-semibold text-onira-offwhite">{wakeUpTime}</span>
                </div>
              </div>

              <Link
                to="/dispositivo"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-onira-lavender hover:text-onira-offwhite"
              >
                Ajustar brilho e despertar do travesseiro →
              </Link>
            </div>
          </div>
        </div>

        {/* Lista imediata de Noites Programadas (CT-05 passo 4) */}
        <RevealOnScroll>
        <section className="onira-card rounded-3xl p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] text-onira-lavender uppercase">
                Suas noites no banco
              </p>
              <h2 className="mt-1 text-lg font-bold text-onira-offwhite">Noites programadas</h2>
            </div>
            <Link to="/historico" className="text-xs font-semibold text-onira-lavender hover:text-onira-offwhite">
              Ver histórico e relatórios →
            </Link>
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-onira-lavender" />
              Carregando suas noites...
            </div>
          ) : nights.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center">
              <Moon className="mx-auto h-8 w-8 text-onira-lavender/70" />
              <p className="mt-3 text-sm font-semibold text-white">Nenhuma noite programada ainda</p>
              <p className="mt-1 text-xs text-slate-400">
                Escolha um tema acima, defina duração e horário de despertar e clique em{' '}
                <strong className="text-slate-200">Programar noite</strong>.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {nights.slice(0, 6).map((night) => {
                const hex = night.theme_light_hex || resolveColorHex(night.theme_light_color);
                const busy = updatingNightId === night.id;
                return (
                  <div
                    key={night.id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10"
                        style={{ backgroundColor: `${hex}22` }}
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-full"
                          style={{ backgroundColor: hex, boxShadow: `0 0 12px ${hex}` }}
                        />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-white">{night.theme_name}</h3>
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusBadgeClass(
                              night.status
                            )}`}
                          >
                            {night.status}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-onira-lavender" />
                            Duração:{' '}
                            <strong className="text-slate-200">
                              {formatDuration(Number(night.duration_hours))}
                            </strong>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Sunrise className="h-3.5 w-3.5 text-onira-purple" />
                            Despertar: <strong className="text-slate-200">{night.wake_up_time}</strong>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5 text-onira-lavender" />
                            Luz: {night.theme_light_color}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-500" />
                            {new Date(night.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {night.status === 'Programada' && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleUpdateNightStatus(night.id, 'Concluída')}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-200 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Concluir
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleUpdateNightStatus(night.id, 'Cancelada')}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Cancelar
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleDeleteNight(night.id)}
                        className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 transition-colors hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50"
                        aria-label="Excluir registro da noite"
                        title="Excluir registro"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        </RevealOnScroll>
      </div>
    </AppShell>
  );
};
