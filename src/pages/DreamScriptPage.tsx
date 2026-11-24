import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  LogOut,
  Shield,
  History,
  User as UserIcon,
  RefreshCw,
  Loader2,
  BedDouble,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { OniraLogo } from '../components/OniraLogo';
import { WaveBackdrop } from '../components/WaveBackdrop';
import { NeoPixelRing } from '../components/NeoPixelRing';
import {
  calculateBedtime,
  formatDuration,
  getGreetingByHour,
  getInitials,
  resolveColorHex,
} from '../lib/colors';
import type { DreamNight, DreamTheme, NightStatus } from '../types/database';

type TabKey = 'roteiro' | 'historico' | 'perfil';

const DURATION_PRESETS = [6, 7, 8, 9];

export const DreamScriptPage: React.FC = () => {
  const { user, profile, isAdmin, signOut, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabKey>('roteiro');

  // Dados reais do Supabase
  const [themes, setThemes] = useState<DreamTheme[]>([]);
  const [nights, setNights] = useState<DreamNight[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Formulário Roteiro do Sonho (RF05 / CT-05)
  const [selectedThemeId, setSelectedThemeId] = useState('');
  const [durationInput, setDurationInput] = useState('7');
  const [wakeUpTime, setWakeUpTime] = useState('06:30');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submittingNight, setSubmittingNight] = useState(false);
  const [updatingNightId, setUpdatingNightId] = useState<string | null>(null);

  // Formulário Perfil
  const [editName, setEditName] = useState(profile?.full_name || '');
  const [editSleepTime, setEditSleepTime] = useState(profile?.habitual_sleep_time || '22:30');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setEditName(profile.full_name);
      setEditSleepTime(profile.habitual_sleep_time);
    }
  }, [profile]);

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
    [user]
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

  // Métricas reais calculadas a partir das noites gravadas no banco
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFeedback(null);

    if (editName.trim().length < 2) {
      setProfileFeedback({ type: 'err', text: 'Informe um nome com pelo menos 2 caracteres.' });
      return;
    }

    if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(editSleepTime)) {
      setProfileFeedback({ type: 'err', text: 'Informe um horário habitual de dormir válido.' });
      return;
    }

    setProfileSaving(true);
    try {
      const result = await updateProfile({
        fullName: editName,
        habitualSleepTime: editSleepTime,
      });
      if (result.error) {
        setProfileFeedback({ type: 'err', text: result.error });
      } else {
        setProfileFeedback({ type: 'ok', text: 'Perfil atualizado com sucesso no banco de dados!' });
      }
    } finally {
      setProfileSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Sonhador';
  const activeHex = selectedTheme
    ? selectedTheme.light_hex || resolveColorHex(selectedTheme.light_color)
    : '#8B5CF6';

  const statusBadgeClass = (status: NightStatus) => {
    switch (status) {
      case 'Programada':
        return 'border-violet-400/35 bg-violet-500/15 text-violet-200';
      case 'Concluída':
        return 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200';
      case 'Cancelada':
        return 'border-slate-500/35 bg-slate-500/15 text-slate-300';
    }
  };

  return (
    <div className="relative min-h-screen pb-24 text-slate-100 md:pb-12">
      <WaveBackdrop />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080715]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-6">
            <Link to="/roteiro-do-sonho" className="focus:outline-none">
              <OniraLogo variant="compact" />
            </Link>

            <nav className="hidden items-center gap-1 md:flex" aria-label="Navegação principal">
              <button
                type="button"
                onClick={() => setActiveTab('roteiro')}
                className={`cursor-pointer rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'roteiro'
                    ? 'bg-violet-500/20 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                Roteiro do Sonho
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('historico')}
                className={`cursor-pointer rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'historico'
                    ? 'bg-violet-500/20 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                Histórico ({nights.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('perfil')}
                className={`cursor-pointer rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'perfil'
                    ? 'bg-violet-500/20 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                Meu Perfil
              </button>

              {/* CT-02 & RF04: Item Administrador só aparece no menu para usuários admin */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-violet-400/30 bg-violet-500/15 px-3.5 py-2 text-sm font-semibold text-violet-200 transition-colors hover:bg-violet-500/25"
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
                Dormir habitual: <span className="text-violet-300">{profile?.habitual_sleep_time || '22:30'}</span>
              </p>
            </div>

            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/35 bg-gradient-to-br from-violet-600 to-purple-500 text-xs font-bold text-white shadow-lg shadow-violet-600/25"
              title={displayName}
            >
              {getInitials(displayName)}
            </div>

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

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
        {/* Saudação principal (CT-02 identifica o usuário logado claramente) */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-violet-300">
              {getGreetingByHour()}, <span className="font-semibold text-white">{displayName}</span>
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {activeTab === 'roteiro'
                ? 'Roteiro do Sonho'
                : activeTab === 'historico'
                  ? 'Histórico das Noites'
                  : 'Configurações do Perfil'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/25 bg-violet-500/10 px-3.5 py-1.5 text-xs font-medium text-violet-200">
              <BedDouble className="h-3.5 w-3.5 text-violet-400" />
              Horário habitual: {profile?.habitual_sleep_time || '22:30'}
            </span>
            <button
              type="button"
              onClick={() => void fetchAllData(true)}
              disabled={refreshing}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Sincronizar
            </button>
          </div>
        </div>

        {loadError && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/35 bg-rose-500/12 p-4 text-sm text-rose-200">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
            <div>
              <p className="font-semibold text-white">Atenção ao banco de dados</p>
              <p className="mt-0.5">{loadError}</p>
            </div>
          </div>
        )}

        {/* TAB 1: ROTEIRO DO SONHO (RF05 / CT-05) */}
        {activeTab === 'roteiro' && (
          <div className="space-y-6">
            {/* Resumo superior (inspirado no card principal de Tela mobile home, com dados 100% reais) */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <div className="onira-card rounded-2xl p-4">
                <p className="text-[11px] font-semibold tracking-wider text-violet-300 uppercase">Programadas</p>
                <p className="mt-2 text-2xl font-bold text-white">{stats.scheduledCount}</p>
                <p className="mt-0.5 text-xs text-slate-400">noites ativas</p>
              </div>
              <div className="onira-card rounded-2xl p-4">
                <p className="text-[11px] font-semibold tracking-wider text-sky-300 uppercase">Próximo despertar</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {stats.nextNight ? stats.nextNight.wake_up_time : '--:--'}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-400">
                  {stats.nextNight ? stats.nextNight.theme_name : 'Nenhuma agendada'}
                </p>
              </div>
              <div className="onira-card rounded-2xl p-4">
                <p className="text-[11px] font-semibold tracking-wider text-emerald-300 uppercase">Média planejada</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {stats.avgDuration > 0 ? formatDuration(stats.avgDuration) : '--'}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {stats.total} {stats.total === 1 ? 'registro real' : 'registros reais'}
                </p>
              </div>
              <div className="onira-card rounded-2xl p-4">
                <p className="text-[11px] font-semibold tracking-wider text-purple-300 uppercase">Catálogo ativo</p>
                <p className="mt-2 text-2xl font-bold text-white">{themes.length}</p>
                <p className="mt-0.5 text-xs text-slate-400">temas disponíveis</p>
              </div>
            </div>

            {/* Grid principal: Formulário + Visualizador NeoPixel */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <form
                onSubmit={handleScheduleNight}
                className="onira-card rounded-3xl p-5 sm:p-7 lg:col-span-8"
                noValidate
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold tracking-[0.2em] text-violet-400 uppercase">
                      Configuração da noite
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-white">Escolha seu tema e despertar</h2>
                  </div>
                  <Sparkles className="h-5 w-5 text-violet-400" />
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

                {/* Seleção de Tema (Dropdown + Cards sincronizados) */}
                <div className="mt-6">
                  <label htmlFor="dream-theme-select" className="mb-2 block text-xs font-semibold text-slate-300">
                    Tema do sonho
                  </label>
                  <select
                    id="dream-theme-select"
                    value={selectedThemeId}
                    onChange={(e) => setSelectedThemeId(e.target.value)}
                    disabled={loadingData || themes.length === 0}
                    className="onira-input w-full rounded-xl px-4 py-3 text-sm text-white"
                  >
                    {themes.length === 0 ? (
                      <option value="">Nenhum tema cadastrado no banco</option>
                    ) : (
                      themes.map((theme) => (
                        <option key={theme.id} value={theme.id} className="bg-[#121027] text-white">
                          {theme.name} — Luz: {theme.light_color}
                        </option>
                      ))
                    )}
                  </select>

                  {/* Grade interativa de temas do banco */}
                  {loadingData ? (
                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
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
                            className={`group flex cursor-pointer flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                              isSelected
                                ? 'border-violet-400 bg-violet-500/15 shadow-[0_0_24px_rgba(139,92,246,0.22)]'
                                : 'border-white/10 bg-white/[0.025] hover:border-violet-400/40 hover:bg-white/[0.05]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-white">{theme.name}</span>
                              <span
                                className="mt-1 h-3 w-3 shrink-0 rounded-full"
                                style={{
                                  backgroundColor: hex,
                                  boxShadow: `0 0 10px ${hex}`,
                                }}
                              />
                            </div>
                            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-400">
                              {theme.description}
                            </p>
                            <div className="mt-3 flex items-center justify-between text-[11px]">
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-2.5 py-0.5 text-slate-300">
                                <span
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{ backgroundColor: hex }}
                                />
                                {theme.light_color}
                              </span>
                              {isSelected && <span className="font-semibold text-violet-300">Selecionado</span>}
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
                              ? 'border-violet-400 bg-violet-500/20 text-white'
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
                        className="onira-input w-full rounded-xl py-3 pr-4 pl-10 text-sm text-white"
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Sugestão para deitar:{' '}
                      <span className="font-semibold text-violet-300">{suggestedBedtime}</span>
                    </p>
                  </div>
                </div>

                {/* Botão principal CT-05 */}
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

              {/* Painel Lateral: Prévia do Anel NeoPixel do Travesseiro */}
              <div className="flex flex-col gap-6 lg:col-span-4">
                <div className="onira-card flex flex-1 flex-col items-center justify-between rounded-3xl p-6 text-center">
                  <div className="w-full">
                    <p className="text-[11px] font-bold tracking-[0.2em] text-violet-400 uppercase">
                      Indução Luminosa ONIRA
                    </p>
                    <h3 className="mt-1 text-base font-bold text-white">Anel LED NeoPixel</h3>
                  </div>

                  <div className="my-6">
                    <NeoPixelRing
                      colorHex={activeHex}
                      colorLabel={selectedTheme?.light_color || 'violeta'}
                      themeName={selectedTheme?.name || 'Selecione um tema'}
                      size="lg"
                    />
                  </div>

                  <div className="w-full space-y-2.5 rounded-2xl border border-white/10 bg-black/25 p-4 text-left text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Duração escolhida</span>
                      <span className="font-semibold text-white">
                        {!Number.isNaN(parsedDuration) && parsedDuration >= 1
                          ? formatDuration(parsedDuration)
                          : 'Inválida (< 1h)'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Deitar sugerido</span>
                      <span className="font-semibold text-violet-300">{suggestedBedtime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Despertar suave</span>
                      <span className="font-semibold text-sky-300">{wakeUpTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista imediata de Noites Programadas (CT-05 passo 4: Conferir a noite programada na lista) */}
            <section className="onira-card rounded-3xl p-5 sm:p-7">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.2em] text-violet-400 uppercase">
                    Suas noites no banco
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-white">Noites programadas</h2>
                </div>
                {nights.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('historico')}
                    className="cursor-pointer text-xs font-semibold text-violet-300 hover:text-violet-200"
                  >
                    Ver histórico completo →
                  </button>
                )}
              </div>

              {loadingData ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                  Carregando suas noites...
                </div>
              ) : nights.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center">
                  <Moon className="mx-auto h-8 w-8 text-violet-400/70" />
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
                                <Clock className="h-3.5 w-3.5 text-violet-400" />
                                Duração: <strong className="text-slate-200">{formatDuration(Number(night.duration_hours))}</strong>
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Sunrise className="h-3.5 w-3.5 text-sky-400" />
                                Despertar: <strong className="text-slate-200">{night.wake_up_time}</strong>
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
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
                                title="Marcar noite como concluída"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Concluir
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void handleUpdateNightStatus(night.id, 'Cancelada')}
                                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
                                title="Cancelar noite programada"
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
          </div>
        )}

        {/* TAB 2: HISTÓRICO COMPLETO */}
        {activeTab === 'historico' && (
          <section className="onira-card rounded-3xl p-5 sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Total de <strong className="text-white">{nights.length}</strong> noites registradas na sua conta.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('roteiro')}
                className="onira-gradient-btn cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold text-white"
              >
                + Nova noite
              </button>
            </div>

            {nights.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 py-14 text-center text-sm text-slate-400">
                Você ainda não programou nenhuma noite.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                      <th className="py-3 pr-4">Tema</th>
                      <th className="px-4 py-3">Cor da luz</th>
                      <th className="px-4 py-3">Duração</th>
                      <th className="px-4 py-3">Despertar</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Criada em</th>
                      <th className="py-3 pl-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {nights.map((night) => {
                      const hex = night.theme_light_hex || resolveColorHex(night.theme_light_color);
                      return (
                        <tr key={night.id} className="hover:bg-white/[0.02]">
                          <td className="py-3.5 pr-4 font-semibold text-white">{night.theme_name}</td>
                          <td className="px-4 py-3.5 text-slate-300">
                            <span className="inline-flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: hex, boxShadow: `0 0 8px ${hex}` }}
                              />
                              {night.theme_light_color}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-200">{formatDuration(Number(night.duration_hours))}</td>
                          <td className="px-4 py-3.5 font-medium text-sky-300">{night.wake_up_time}</td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(
                                night.status
                              )}`}
                            >
                              {night.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-400">
                            {new Date(night.created_at).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3.5 pl-4 text-right">
                            <button
                              type="button"
                              onClick={() => void handleDeleteNight(night.id)}
                              className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/15 hover:text-rose-300"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* TAB 3: PERFIL DO USUÁRIO */}
        {activeTab === 'perfil' && (
          <div className="mx-auto max-w-xl">
            <form onSubmit={handleSaveProfile} className="onira-card space-y-5 rounded-3xl p-6 sm:p-8">
              <div className="flex items-center gap-4 border-b border-white/10 pb-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 text-lg font-bold text-white">
                  {getInitials(displayName)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{displayName}</h2>
                  <p className="text-xs text-slate-400">{profile?.email || user?.email}</p>
                  <span className="mt-1.5 inline-block rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-violet-200">
                    {isAdmin ? 'Administrador' : 'Usuário ONIRA'}
                  </span>
                </div>
              </div>

              {profileFeedback && (
                <div
                  className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
                    profileFeedback.type === 'ok'
                      ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-100'
                      : 'border-rose-500/35 bg-rose-500/12 text-rose-200'
                  }`}
                >
                  {profileFeedback.type === 'ok' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  )}
                  {profileFeedback.text}
                </div>
              )}

              <div>
                <label htmlFor="profile-name" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Nome completo
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="onira-input w-full rounded-xl px-4 py-3 text-sm text-white"
                />
              </div>

              <div>
                <label htmlFor="profile-sleep" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Horário habitual de dormir
                </label>
                <input
                  id="profile-sleep"
                  type="time"
                  value={editSleepTime}
                  onChange={(e) => setEditSleepTime(e.target.value)}
                  className="onira-input w-full rounded-xl px-4 py-3 text-sm text-white"
                />
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="onira-gradient-btn flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Salvar alterações
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Bottom Tab Bar Mobile (alinhada ao protótipo Tela mobile home) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0D0B1F]/95 px-2 py-2 backdrop-blur-xl md:hidden"
        aria-label="Navegação mobile"
      >
        <div className={`grid gap-1 ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <button
            type="button"
            onClick={() => setActiveTab('roteiro')}
            className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium ${
              activeTab === 'roteiro' ? 'text-violet-300' : 'text-slate-500'
            }`}
          >
            <Moon className="h-5 w-5" />
            Roteiro
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('historico')}
            className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium ${
              activeTab === 'historico' ? 'text-violet-300' : 'text-slate-500'
            }`}
          >
            <History className="h-5 w-5" />
            Histórico
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('perfil')}
            className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium ${
              activeTab === 'perfil' ? 'text-violet-300' : 'text-slate-500'
            }`}
          >
            <UserIcon className="h-5 w-5" />
            Perfil
          </button>
          {isAdmin && (
            <Link
              to="/admin"
              className="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold text-violet-400"
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
