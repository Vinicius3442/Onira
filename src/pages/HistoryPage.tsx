import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Clock,
  Sunrise,
  Sparkles,
  Calendar,
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  Loader2,
  RefreshCw,
  MessageSquareText,
  Moon,
  X,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatDuration, resolveColorHex } from '../lib/colors';
import type { DreamNight, NightStatus } from '../types/database';

export const HistoryPage: React.FC = () => {
  const { user } = useAuth();

  const [nights, setNights] = useState<DreamNight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | NightStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  // Modal de Avaliação Matinal (real, salvo no banco)
  const [evaluatingNight, setEvaluatingNight] = useState<DreamNight | null>(null);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [notesValue, setNotesValue] = useState('');
  const [savingEval, setSavingEval] = useState(false);

  const loadNights = useCallback(
    async (isManual = false) => {
      if (!user) return;
      if (isManual) setRefreshing(true);
      else setLoading(true);
      try {
        const { data, error } = await supabase
          .from('dream_nights')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error) {
          setNights((data || []) as DreamNight[]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user]
  );

  useEffect(() => {
    void loadNights(false);
  }, [loadNights]);

  // Métricas 100% reais calculadas das linhas do usuário
  const analytics = useMemo(() => {
    const total = nights.length;
    const completed = nights.filter((n) => n.status === 'Concluída').length;
    const avgDuration =
      total > 0 ? nights.reduce((acc, n) => acc + Number(n.duration_hours), 0) / total : 0;

    const rated = nights.filter((n) => typeof n.sleep_quality === 'number' && n.sleep_quality > 0);
    const avgRating =
      rated.length > 0
        ? rated.reduce((acc, n) => acc + Number(n.sleep_quality), 0) / rated.length
        : 0;

    const themeCounts = new Map<string, number>();
    for (const n of nights) {
      themeCounts.set(n.theme_name, (themeCounts.get(n.theme_name) || 0) + 1);
    }
    let favoriteTheme = '—';
    let topCount = 0;
    for (const [name, count] of themeCounts.entries()) {
      if (count > topCount) {
        topCount = count;
        favoriteTheme = name;
      }
    }

    const recentBars = [...nights].slice(0, 7).reverse();

    return { total, completed, avgDuration, avgRating, ratedCount: rated.length, favoriteTheme, recentBars };
  }, [nights]);

  const filteredNights = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return nights.filter((n) => {
      const matchesStatus = statusFilter === 'all' || n.status === statusFilter;
      const matchesQuery =
        !q ||
        n.theme_name.toLowerCase().includes(q) ||
        n.theme_light_color.toLowerCase().includes(q) ||
        (n.morning_notes || '').toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [nights, statusFilter, searchQuery]);

  const handleStatusChange = async (id: string, status: NightStatus) => {
    setBusyId(id);
    try {
      const { error } = await supabase.from('dream_nights').update({ status }).eq('id', id);
      if (!error) {
        setNights((prev) => prev.map((n) => (n.id === id ? { ...n, status } : n)));
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      const { error } = await supabase.from('dream_nights').delete().eq('id', id);
      if (!error) {
        setNights((prev) => prev.filter((n) => n.id !== id));
      }
    } finally {
      setBusyId(null);
    }
  };

  const openEvaluationModal = (night: DreamNight) => {
    setEvaluatingNight(night);
    setRatingValue(night.sleep_quality || 5);
    setNotesValue(night.morning_notes || '');
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingNight) return;
    setSavingEval(true);
    try {
      const trimmedNotes = notesValue.trim() || null;
      const { error } = await supabase
        .from('dream_nights')
        .update({
          status: 'Concluída',
          sleep_quality: ratingValue,
          morning_notes: trimmedNotes,
        })
        .eq('id', evaluatingNight.id);

      if (!error) {
        setNights((prev) =>
          prev.map((n) =>
            n.id === evaluatingNight.id
              ? { ...n, status: 'Concluída', sleep_quality: ratingValue, morning_notes: trimmedNotes }
              : n
          )
        );
        setEvaluatingNight(null);
      }
    } finally {
      setSavingEval(false);
    }
  };

  const statusBadge = (status: NightStatus) => {
    switch (status) {
      case 'Programada':
        return 'border-onira-lavender/35 bg-onira-purple/20 text-onira-offwhite';
      case 'Concluída':
        return 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200';
      case 'Cancelada':
        return 'border-slate-500/35 bg-slate-500/15 text-slate-300';
    }
  };

  const maxBarHours = Math.max(10, ...analytics.recentBars.map((b) => Number(b.duration_hours)));

  return (
    <AppShell
      title="Histórico e Relatórios"
      subtitle="Acompanhe todas as suas noites programadas, avalie a qualidade do seu despertar e visualize sua média real."
      headerActions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadNights(true)}
            disabled={refreshing}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <Link
            to="/roteiro-do-sonho"
            className="onira-gradient-btn rounded-full px-4 py-1.5 text-xs font-semibold text-white"
          >
            + Programar noite
          </Link>
        </div>
      }
    >
      {/* KPIs reais */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="onira-card onira-card-lift rounded-2xl p-4">
          <p className="text-[11px] font-semibold tracking-wider text-onira-lavender uppercase">Total registrado</p>
          <p className="mt-2 text-2xl font-bold text-onira-offwhite">{analytics.total}</p>
          <p className="mt-0.5 text-xs text-slate-400">{analytics.completed} concluídas</p>
        </div>
        <div className="onira-card onira-card-lift rounded-2xl p-4">
          <p className="text-[11px] font-semibold tracking-wider text-onira-lavender uppercase">Duração média</p>
          <p className="mt-2 text-2xl font-bold text-onira-offwhite">
            {analytics.avgDuration > 0 ? formatDuration(analytics.avgDuration) : '--'}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">média real planejada</p>
        </div>
        <div className="onira-card onira-card-lift rounded-2xl p-4">
          <p className="text-[11px] font-semibold tracking-wider text-amber-300 uppercase">Qualidade matinal</p>
          <p className="mt-2 text-2xl font-bold text-onira-offwhite">
            {analytics.avgRating > 0 ? `${analytics.avgRating.toFixed(1)}/5` : '--'}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {analytics.ratedCount > 0 ? `${analytics.ratedCount} avaliações reais` : 'Sem avaliações ainda'}
          </p>
        </div>
        <div className="onira-card onira-card-lift rounded-2xl p-4">
          <p className="text-[11px] font-semibold tracking-wider text-emerald-300 uppercase">Tema favorito</p>
          <p className="mt-2 truncate text-lg font-bold text-onira-offwhite">{analytics.favoriteTheme}</p>
          <p className="mt-0.5 text-xs text-slate-400">mais escolhido por você</p>
        </div>
      </div>

      {/* Gráfico real de duração das últimas 7 noites */}
      {analytics.recentBars.length > 0 && (
        <section className="onira-card mb-6 rounded-3xl p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] text-onira-lavender uppercase">Evolução real</p>
              <h2 className="mt-0.5 text-base font-bold text-onira-offwhite">Duração das últimas noites registradas</h2>
            </div>
            <span className="text-xs text-slate-400">Horas por noite</span>
          </div>

          <div className="grid grid-cols-7 items-end gap-2 pt-4 sm:gap-4" style={{ minHeight: '150px' }}>
            {analytics.recentBars.map((bar) => {
              const hex = bar.theme_light_hex || resolveColorHex(bar.theme_light_color);
              const pct = Math.max(12, Math.round((Number(bar.duration_hours) / maxBarHours) * 100));
              return (
                <div key={bar.id} className="flex flex-col items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-200">{bar.duration_hours}h</span>
                  <div className="flex h-28 w-full max-w-[44px] items-end rounded-xl bg-white/[0.04] p-1">
                    <div
                      className="w-full rounded-lg transition-all duration-500"
                      style={{
                        height: `${pct}%`,
                        background: `linear-gradient(180deg, ${hex} 0%, rgba(118,101,232,0.48) 100%)`,
                        boxShadow: `0 0 16px ${hex}44`,
                      }}
                      title={`${bar.theme_name} — ${bar.duration_hours}h`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(bar.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Filtros + Lista */}
      <section className="onira-card rounded-3xl p-5 sm:p-7">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar por tema, cor ou anotação..."
              className="onira-input w-full rounded-xl py-2.5 pr-4 pl-10 text-sm text-white placeholder:text-slate-500"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(['all', 'Programada', 'Concluída', 'Cancelada'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? 'border-onira-lavender bg-onira-purple/25 text-onira-offwhite'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {st === 'all' ? 'Todas' : st}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-onira-lavender" />
            Carregando histórico do banco...
          </div>
        ) : filteredNights.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 py-14 text-center">
            <Moon className="mx-auto h-8 w-8 text-onira-lavender/70" />
            <p className="mt-3 text-sm font-semibold text-white">Nenhuma noite encontrada com este filtro</p>
            <p className="mt-1 text-xs text-slate-400">
              Vá até o Roteiro do Sonho para programar uma nova noite.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNights.map((night) => {
              const hex = night.theme_light_hex || resolveColorHex(night.theme_light_color);
              const busy = busyId === night.id;
              return (
                <div
                  key={night.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
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
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge(
                              night.status
                            )}`}
                          >
                            {night.status}
                          </span>
                          {typeof night.sleep_quality === 'number' && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-200">
                              <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                              {night.sleep_quality}/5
                            </span>
                          )}
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-onira-lavender" />
                            {formatDuration(Number(night.duration_hours))}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Sunrise className="h-3.5 w-3.5 text-onira-purple" />
                            Despertar às <strong className="text-slate-200">{night.wake_up_time}</strong>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5 text-onira-lavender" />
                            Luz: {night.theme_light_color}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-500" />
                            {new Date(night.created_at).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {night.morning_notes && (
                          <p className="mt-2.5 flex items-start gap-1.5 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-slate-300">
                            <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-onira-lavender" />
                            <span>{night.morning_notes}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => openEvaluationModal(night)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-onira-lavender/35 bg-onira-purple/20 px-2.5 py-1.5 text-xs font-medium text-onira-offwhite hover:bg-onira-purple/35"
                      >
                        <Star className="h-3.5 w-3.5" />
                        {night.sleep_quality ? 'Editar avaliação' : 'Avaliar noite'}
                      </button>

                      {night.status === 'Programada' && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleStatusChange(night.id, 'Concluída')}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Concluir
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleStatusChange(night.id, 'Cancelada')}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-500/20"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Cancelar
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleDelete(night.id)}
                        className="cursor-pointer rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
                        title="Excluir noite"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal de Avaliação Matinal */}
      {evaluatingNight && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveEvaluation}
            className="onira-card animate-modal-pop w-full max-w-md space-y-5 rounded-3xl p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] text-onira-lavender uppercase">
                  Avaliação matinal
                </p>
                <h3 className="mt-1 text-lg font-bold text-white">{evaluatingNight.theme_name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEvaluatingNight(null)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-slate-300">Como foi seu descanso e despertar?</p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingValue(star)}
                    className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border transition-colors ${
                      star <= ratingValue
                        ? 'border-amber-400/50 bg-amber-500/20 text-amber-300'
                        : 'border-white/10 bg-white/5 text-slate-500 hover:text-slate-300'
                    }`}
                    aria-label={`Nota ${star} de 5`}
                  >
                    <Star className={`h-5 w-5 ${star <= ratingValue ? 'fill-amber-300' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="morning-notes" className="mb-1.5 block text-xs font-medium text-slate-300">
                Anotações do sonho / despertar (opcional)
              </label>
              <textarea
                id="morning-notes"
                rows={3}
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Ex.: Acordei disposto com o despertar suave e luz agradável."
                className="onira-input w-full rounded-xl p-3 text-sm text-white placeholder:text-slate-500"
              />
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEvaluatingNight(null)}
                className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingEval}
                className="onira-gradient-btn inline-flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                {savingEval && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Salvar avaliação
              </button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
};
