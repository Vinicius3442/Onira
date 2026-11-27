import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, ArrowRight, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { NeoPixelRing } from '../components/NeoPixelRing';
import { RevealOnScroll } from '../components/RevealOnScroll';
import { supabase } from '../lib/supabase';
import { resolveColorHex } from '../lib/colors';
import type { DreamTheme } from '../types/database';

export const ThemesLibraryPage: React.FC = () => {
  const navigate = useNavigate();

  const [themes, setThemes] = useState<DreamTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('all');

  const loadThemes = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('dream_themes')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) {
        setError(`Não foi possível carregar a biblioteca de temas: ${fetchError.message}`);
      } else {
        setThemes((data || []) as DreamTheme[]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadThemes(false);
  }, [loadThemes]);

  const uniqueColors = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of themes) {
      const key = t.light_color.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, t.light_hex || resolveColorHex(t.light_color));
      }
    }
    return Array.from(map.entries()).map(([label, hex]) => ({ label, hex }));
  }, [themes]);

  const filteredThemes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return themes.filter((t) => {
      const matchesColor =
        selectedColor === 'all' || t.light_color.trim().toLowerCase() === selectedColor;
      const matchesQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.light_color.toLowerCase().includes(q);
      return matchesColor && matchesQuery;
    });
  }, [themes, query, selectedColor]);

  return (
    <AppShell
      title="Biblioteca de Temas de Sonho"
      subtitle="Explore os roteiros cadastrados no catálogo ONIRA e visualize a indução luminosa NeoPixel de cada experiência."
      headerActions={
        <button
          type="button"
          onClick={() => void loadThemes(true)}
          disabled={refreshing}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar catálogo
        </button>
      }
    >
      {error && (
        <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-rose-500/35 bg-rose-500/12 p-4 text-sm text-rose-200">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filtros */}
      <div className="onira-card mb-6 rounded-3xl p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, descrição ou cor da luz..."
              className="onira-input w-full rounded-xl py-2.5 pr-4 pl-10 text-sm text-white placeholder:text-slate-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedColor('all')}
              className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                selectedColor === 'all'
                  ? 'border-onira-lavender bg-onira-purple/25 text-onira-offwhite'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              Todas as cores ({themes.length})
            </button>
            {uniqueColors.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => setSelectedColor(c.label)}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  selectedColor === c.label
                    ? 'border-onira-lavender bg-onira-purple/25 text-onira-offwhite'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.hex }} />
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grade de Temas */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-onira-lavender" />
          Carregando temas do Supabase...
        </div>
      ) : filteredThemes.length === 0 ? (
        <div className="onira-card rounded-3xl px-6 py-16 text-center">
          <Sparkles className="mx-auto h-9 w-9 text-onira-lavender/70" />
          <p className="mt-3 text-base font-semibold text-white">Nenhum tema encontrado</p>
          <p className="mt-1 text-xs text-slate-400">
            Ajuste os filtros de busca ou aguarde novos temas serem adicionados pelo administrador.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredThemes.map((theme, idx) => {
            const hex = theme.light_hex || resolveColorHex(theme.light_color);
            return (
              <RevealOnScroll key={theme.id} delay={idx * 70}>
              <article
                className="onira-card onira-card-lift flex h-full flex-col justify-between rounded-3xl p-6"
              >
                <div>
                  <div className="flex justify-center py-3">
                    <NeoPixelRing colorHex={hex} colorLabel={theme.light_color} size="md" />
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-lg font-bold text-white">{theme.name}</h2>
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-0.5 text-[11px] text-slate-300">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: hex }} />
                        {theme.light_color}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{theme.description}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/roteiro-do-sonho?tema=${theme.id}`)}
                  className="onira-gradient-btn mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold text-white"
                >
                  Usar no Roteiro do Sonho
                  <ArrowRight className="h-4 w-4" />
                </button>
              </article>
              </RevealOnScroll>
            );
          })}
        </div>
      )}
    </AppShell>
  );
};
