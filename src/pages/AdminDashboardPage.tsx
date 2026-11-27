import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Users,
  Moon,
  Cpu,
  Plus,
  Search,
  Pencil,
  Trash2,
  LogOut,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Menu,
  ArrowLeft,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { OniraLogo } from '../components/OniraLogo';
import { AdminActivityChart, AdminThemeDonutChart } from '../components/AdminCharts';
import { AdminTag, UserAvatar } from '../components/UserAvatar';
import { AnimatedCounter, AnimatedDuration } from '../components/AnimatedCounter';
import {
  LIGHT_COLOR_PRESETS,
  formatDuration,
  getInitials,
  resolveColorHex,
} from '../lib/colors';
import type {
  DeviceSettingsWithProfile,
  DreamNightWithProfile,
  DreamTheme,
  Profile,
} from '../types/database';

type AdminSection = 'overview' | 'themes' | 'users' | 'devices' | 'nights';

interface ThemeFormState {
  name: string;
  description: string;
  light_color: string;
  light_hex: string;
}

const EMPTY_FORM: ThemeFormState = {
  name: '',
  description: '',
  light_color: '',
  light_hex: '#7665E8',
};

export const AdminDashboardPage: React.FC = () => {
  const { profile, user, avatarUrl, signOut } = useAuth();
  const navigate = useNavigate();

  const [section, setSection] = useState<AdminSection>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dados 100% reais do Supabase
  const [themes, setThemes] = useState<DreamTheme[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [devices, setDevices] = useState<DeviceSettingsWithProfile[]>([]);
  const [nights, setNights] = useState<DreamNightWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Modal de Cadastro / Edição de Tema (RF04 / CT-04)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<DreamTheme | null>(null);
  const [formState, setFormState] = useState<ThemeFormState>(EMPTY_FORM);
  const [manualHexOverride, setManualHexOverride] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [savingTheme, setSavingTheme] = useState(false);

  // Modal de Confirmação de Exclusão
  const [deletingTheme, setDeletingTheme] = useState<DreamTheme | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const loadDashboardData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [themesRes, profilesRes, nightsRes, devicesRes] = await Promise.all([
        supabase.from('dream_themes').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase
          .from('dream_nights')
          .select('*, profiles(full_name, email)')
          .order('created_at', { ascending: false }),
        supabase
          .from('device_settings')
          .select('*, profiles(full_name, email)')
          .order('updated_at', { ascending: false }),
      ]);

      if (themesRes.error) {
        setBanner({ type: 'err', text: `Erro ao carregar temas: ${themesRes.error.message}` });
      } else {
        setThemes((themesRes.data || []) as DreamTheme[]);
      }

      if (!profilesRes.error) {
        setProfiles((profilesRes.data || []) as Profile[]);
      }

      if (!nightsRes.error) {
        setNights((nightsRes.data || []) as DreamNightWithProfile[]);
      }

      if (!devicesRes.error) {
        setDevices((devicesRes.data || []) as DeviceSettingsWithProfile[]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboardData(false);
  }, [loadDashboardData]);

  // Métricas reais dos 4 KPIs
  const avgSleepHours = useMemo(() => {
    if (nights.length === 0) return 0;
    return nights.reduce((acc, n) => acc + Number(n.duration_hours), 0) / nights.length;
  }, [nights]);

  const filteredThemes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return themes;
    return themes.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.light_color.toLowerCase().includes(q)
    );
  }, [themes, searchQuery]);

  const filteredProfiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) => p.full_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    );
  }, [profiles, searchQuery]);

  const openCreateModal = () => {
    setEditingTheme(null);
    setFormState(EMPTY_FORM);
    setManualHexOverride(false);
    setModalError(null);
    setModalOpen(true);
  };

  const openEditModal = (theme: DreamTheme) => {
    setEditingTheme(theme);
    setFormState({
      name: theme.name,
      description: theme.description,
      light_color: theme.light_color,
      light_hex: theme.light_hex || resolveColorHex(theme.light_color),
    });
    setManualHexOverride(false);
    setModalError(null);
    setModalOpen(true);
  };

  const handleLightColorTextChange = (value: string) => {
    setFormState((prev) => ({
      ...prev,
      light_color: value,
      light_hex: manualHexOverride ? prev.light_hex : resolveColorHex(value, prev.light_hex),
    }));
  };

  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const name = formState.name.trim();
    const description = formState.description.trim();
    const lightColor = formState.light_color.trim();

    // CT-04: Campos obrigatórios (nome, descrição e cor da luz) vazios são recusados
    if (!name) {
      setModalError('O campo Nome do tema é obrigatório.');
      return;
    }
    if (!description) {
      setModalError('O campo Descrição é obrigatório.');
      return;
    }
    if (!lightColor) {
      setModalError('O campo Cor da luz é obrigatório.');
      return;
    }

    const resolvedHex = /^#[0-9A-Fa-f]{6}$/.test(formState.light_hex)
      ? formState.light_hex.toUpperCase()
      : resolveColorHex(lightColor);

    setSavingTheme(true);
    try {
      if (editingTheme) {
        const { data, error } = await supabase
          .from('dream_themes')
          .update({
            name,
            description,
            light_color: lightColor,
            light_hex: resolvedHex,
          })
          .eq('id', editingTheme.id)
          .select('*')
          .single();

        if (error) {
          setModalError(`Erro ao editar tema: ${error.message}`);
          return;
        }

        if (data) {
          setThemes((prev) => prev.map((t) => (t.id === editingTheme.id ? (data as DreamTheme) : t)));
        }
        setBanner({ type: 'ok', text: `Tema "${name}" atualizado com sucesso!` });
      } else {
        const { data, error } = await supabase
          .from('dream_themes')
          .insert({
            name,
            description,
            light_color: lightColor,
            light_hex: resolvedHex,
            created_by: user?.id ?? null,
          })
          .select('*')
          .single();

        if (error) {
          setModalError(`Erro ao cadastrar tema: ${error.message}`);
          return;
        }

        if (data) {
          setThemes((prev) => [data as DreamTheme, ...prev]);
        }
        setBanner({ type: 'ok', text: `Tema "${name}" cadastrado e disponível no Roteiro do Sonho!` });
      }

      setModalOpen(false);
    } finally {
      setSavingTheme(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTheme) return;
    setDeletingBusy(true);
    try {
      const { error } = await supabase.from('dream_themes').delete().eq('id', deletingTheme.id);
      if (error) {
        setBanner({ type: 'err', text: `Erro ao excluir tema: ${error.message}` });
      } else {
        setThemes((prev) => prev.filter((t) => t.id !== deletingTheme.id));
        setBanner({
          type: 'ok',
          text: `Tema "${deletingTheme.name}" excluído do painel e da lista do Roteiro do Sonho.`,
        });
      }
      setDeletingTheme(null);
    } finally {
      setDeletingBusy(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const navItems: Array<{ key: AdminSection; label: string; icon: React.ReactNode; badge?: number }> = [
    { key: 'overview', label: 'Visão geral', icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: 'themes', label: 'Temas de Sonho', icon: <Sparkles className="h-4 w-4" />, badge: themes.length },
    { key: 'users', label: 'Usuários', icon: <Users className="h-4 w-4" />, badge: profiles.length },
    { key: 'devices', label: 'Dispositivos', icon: <Cpu className="h-4 w-4" />, badge: devices.length },
    { key: 'nights', label: 'Noites', icon: <Moon className="h-4 w-4" />, badge: nights.length },
  ];

  const renderThemesTable = (items: DreamTheme[]) => (
    <div className="rounded-2xl border border-onira-lavender/20 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-onira-offwhite p-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-[11px] font-bold tracking-[0.16em] text-onira-purple uppercase">Gerenciamento</p>
          <h2 className="mt-0.5 text-lg font-bold text-onira-night">Temas de Sonho</h2>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-onira-purple px-4 py-2.5 text-xs font-semibold text-onira-offwhite shadow-sm transition-colors hover:bg-onira-purple-hover"
        >
          <Plus className="h-4 w-4" />
          Novo tema
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-onira-purple" />
          Carregando temas do banco...
        </div>
      ) : items.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-slate-500">
          Nenhum tema encontrado. Clique em <strong>+ Novo tema</strong> para cadastrar.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-onira-offwhite bg-onira-offwhite/80 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                <th className="px-5 py-3">Tema</th>
                <th className="px-5 py-3">Descrição</th>
                <th className="px-5 py-3">Cor da luz</th>
                <th className="px-5 py-3">Cadastro</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-onira-offwhite">
              {items.map((theme) => {
                const hex = theme.light_hex || resolveColorHex(theme.light_color);
                return (
                  <tr key={theme.id} className="transition-colors hover:bg-onira-offwhite/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80"
                          style={{ backgroundColor: `${hex}22` }}
                        >
                          <span
                            className="h-3.5 w-3.5 rounded-full"
                            style={{ backgroundColor: hex, boxShadow: `0 0 8px ${hex}` }}
                          />
                        </span>
                        <span className="font-semibold text-onira-night">{theme.name}</span>
                      </div>
                    </td>
                    <td className="max-w-md px-5 py-4 text-slate-600">{theme.description}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 rounded-full border border-onira-lavender/25 bg-onira-offwhite px-3 py-1 text-xs font-medium text-onira-night">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hex }} />
                        {theme.light_color}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {new Date(theme.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(theme)}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-onira-lavender hover:bg-onira-offwhite hover:text-onira-purple"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTheme(theme)}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-onira-offwhite text-onira-night">
      {/* Backdrop Mobile Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-onira-night/60 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Dark Sidebar travada em 100% da altura da tela (sticky h-screen no desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col justify-between bg-onira-night px-4 py-5 text-onira-offwhite transition-transform duration-200 lg:sticky lg:top-0 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-0.5">
          <div className="flex items-center justify-between px-2">
            <OniraLogo variant="compact" theme="dark" />
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-7 border-t border-onira-lavender/15 pt-5 px-2">
            <p className="text-[10px] font-bold tracking-[0.2em] text-onira-lavender uppercase">Admin Console</p>
            <p className="mt-0.5 text-xs text-slate-400">Gestão inteligente do sono</p>
          </div>

          <nav className="mt-5 space-y-1">
            {navItems.map((item) => {
              const active = section === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setSection(item.key);
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'border border-onira-lavender/40 bg-onira-purple/25 text-onira-offwhite'
                      : 'text-slate-400 hover:bg-white/5 hover:text-onira-offwhite'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className={active ? 'text-onira-lavender' : 'text-slate-400'}>{item.icon}</span>
                    {item.label}
                  </span>
                  {typeof item.badge === 'number' && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        active ? 'bg-onira-purple text-onira-offwhite' : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-6 border-t border-onira-lavender/15 pt-5">
            <Link
              to="/roteiro-do-sonho"
              className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-medium text-onira-lavender transition-colors hover:bg-white/5 hover:text-onira-offwhite"
            >
              <ArrowLeft className="h-4 w-4" />
              Ir para Roteiro do Sonho
            </Link>
          </div>
        </div>

        {/* Rodapé Admin fixo na base da sidebar */}
        <div className="mt-3 shrink-0 border-t border-onira-lavender/15 pt-3.5">
          <div className="flex items-center justify-between gap-2 rounded-xl bg-onira-offwhite/[0.05] p-3">
            <Link to="/perfil" className="flex min-w-0 items-center gap-2.5 hover:opacity-90" title="Alterar foto no perfil">
              <UserAvatar src={avatarUrl} name={profile?.full_name} size="sm" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-xs font-semibold text-onira-offwhite">{profile?.full_name || 'Administrador'}</p>
                  <AdminTag compact />
                </div>
                <p className="truncate text-[10px] text-onira-lavender">Super administrador</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-500/15 hover:text-rose-300"
              title="Sair"
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-20 border-b border-onira-lavender/20 bg-white/90 px-4 py-4 backdrop-blur-md sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-onira-offwhite lg:hidden"
                aria-label="Abrir menu administrativo"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-[11px] font-bold tracking-[0.16em] text-onira-purple uppercase">
                  Painel Administrativo
                </p>
                <h1 className="text-xl font-extrabold text-onira-night sm:text-2xl">
                  {section === 'overview'
                    ? 'Visão geral'
                    : section === 'themes'
                      ? 'Temas de Sonho'
                      : section === 'users'
                        ? 'Usuários cadastrados'
                        : section === 'devices'
                          ? 'Dispositivos vinculados'
                          : 'Noites programadas'}
                </h1>
              </div>
            </div>

            <div className="flex w-full items-center gap-2.5 sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar no painel..."
                  className="w-full rounded-xl border border-onira-lavender/25 bg-onira-offwhite/70 py-2 pr-3 pl-9 text-sm text-onira-night placeholder:text-slate-400 focus:border-onira-purple focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => void loadDashboardData(true)}
                disabled={refreshing}
                className="cursor-pointer rounded-xl border border-onira-lavender/25 bg-white p-2.5 text-slate-600 hover:bg-onira-offwhite"
                title="Atualizar dados"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-onira-purple px-4 py-2.5 text-xs font-semibold text-onira-offwhite shadow-sm transition-colors hover:bg-onira-purple-hover"
              >
                <Plus className="h-4 w-4" />
                <span>Novo tema</span>
              </button>
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="animate-page-enter flex-1 space-y-6 p-4 sm:p-8">
          {banner && (
            <div
              role="status"
              className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${
                banner.type === 'ok'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-rose-200 bg-rose-50 text-rose-800'
              }`}
            >
              <span className="flex items-center gap-2">
                {banner.type === 'ok' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                )}
                {banner.text}
              </span>
              <button
                type="button"
                onClick={() => setBanner(null)}
                className="cursor-pointer rounded-lg p-1 hover:bg-black/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* KPI Cards (presentes na Visão Geral) */}
          {section === 'overview' && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="admin-card rounded-2xl border border-onira-lavender/20 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Usuários cadastrados</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-onira-offwhite text-onira-purple">
                      <Users className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 text-3xl font-extrabold text-onira-night">
                    <AnimatedCounter value={profiles.length} duration={650} />
                  </p>
                  <p className="mt-1 text-xs text-emerald-600">Sincronizado com Supabase Auth</p>
                </div>

                <div className="admin-card rounded-2xl border border-onira-lavender/20 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Temas de sonho</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-onira-offwhite text-onira-lavender">
                      <Sparkles className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 text-3xl font-extrabold text-onira-night">
                    <AnimatedCounter value={themes.length} duration={650} />
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Ativos no Roteiro do Sonho</p>
                </div>

                <div className="admin-card rounded-2xl border border-onira-lavender/20 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Noites programadas</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                      <Moon className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 text-3xl font-extrabold text-onira-night">
                    <AnimatedCounter value={nights.length} duration={750} />
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    <AnimatedCounter
                      value={nights.filter((n) => n.status === 'Programada').length}
                      duration={750}
                    />{' '}
                    com status Programada
                  </p>
                </div>

                <div className="admin-card rounded-2xl border border-onira-lavender/20 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Média de sono</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <Clock className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 text-3xl font-extrabold text-onira-night">
                    <AnimatedDuration hours={avgSleepHours} duration={750} />
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Média real das noites</p>
                </div>
              </div>

              {/* Gráficos reais */}
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
                <div className="rounded-2xl border border-onira-lavender/20 bg-white p-6 shadow-sm xl:col-span-8">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold tracking-[0.16em] text-slate-400 uppercase">Atividade</p>
                      <h2 className="mt-0.5 text-base font-bold text-onira-night">
                        Uso da plataforma (últimos 7 dias)
                      </h2>
                    </div>
                    <span className="rounded-lg border border-onira-lavender/25 bg-onira-offwhite px-3 py-1 text-xs font-medium text-onira-night">
                      Dados reais
                    </span>
                  </div>
                  <AdminActivityChart nights={nights} />
                </div>

                <div className="rounded-2xl border border-onira-lavender/20 bg-white p-6 shadow-sm xl:col-span-4">
                  <div className="mb-4">
                    <p className="text-[11px] font-bold tracking-[0.16em] text-slate-400 uppercase">Catálogo</p>
                    <h2 className="mt-0.5 text-base font-bold text-onira-night">Distribuição por tema</h2>
                  </div>
                  <AdminThemeDonutChart themes={themes} nights={nights} />
                </div>
              </div>

              {/* CRUD de Temas direto na Visão Geral */}
              {renderThemesTable(filteredThemes)}
            </>
          )}

          {/* SEÇÃO DEDICADA: TEMAS DE SONHO */}
          {section === 'themes' && renderThemesTable(filteredThemes)}

          {/* SEÇÃO DEDICADA: USUÁRIOS REAIS */}
          {section === 'users' && (
            <div className="rounded-2xl border border-onira-lavender/20 bg-white shadow-sm">
              <div className="border-b border-onira-offwhite p-5">
                <p className="text-[11px] font-bold tracking-[0.16em] text-onira-purple uppercase">Base de contas</p>
                <h2 className="mt-0.5 text-lg font-bold text-onira-night">
                  Usuários cadastrados ({filteredProfiles.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-onira-offwhite bg-onira-offwhite/80 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                      <th className="px-5 py-3">Usuário</th>
                      <th className="px-5 py-3">Horário habitual</th>
                      <th className="px-5 py-3">Perfil</th>
                      <th className="px-5 py-3">Cadastro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-onira-offwhite">
                    {filteredProfiles.map((p) => (
                      <tr key={p.id} className="hover:bg-onira-offwhite/60">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-onira-offwhite text-xs font-bold text-onira-purple">
                              {getInitials(p.full_name)}
                            </span>
                            <div>
                              <p className="font-semibold text-onira-night">{p.full_name}</p>
                              <p className="text-xs text-slate-500">{p.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-700">{p.habitual_sleep_time}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              p.role === 'admin'
                                ? 'bg-onira-purple/15 text-onira-purple'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {p.role === 'admin' ? 'Administrador' : 'Usuário'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">
                          {new Date(p.created_at).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SEÇÃO DEDICADA: DISPOSITIVOS VINCULADOS */}
          {section === 'devices' && (
            <div className="rounded-2xl border border-onira-lavender/20 bg-white shadow-sm">
              <div className="border-b border-onira-offwhite p-5">
                <p className="text-[11px] font-bold tracking-[0.16em] text-onira-purple uppercase">Hardware ONIRA</p>
                <h2 className="mt-0.5 text-lg font-bold text-onira-night">
                  Travesseiros configurados ({devices.length})
                </h2>
              </div>
              {devices.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-slate-500">
                  Nenhum usuário salvou configurações do dispositivo em <strong>/dispositivo</strong> ainda.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-onira-offwhite bg-onira-offwhite/80 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                        <th className="px-5 py-3">Usuário</th>
                        <th className="px-5 py-3">Dispositivo / Serial</th>
                        <th className="px-5 py-3">NeoPixel / Buzzer</th>
                        <th className="px-5 py-3">Limite NTC / Ventilação</th>
                        <th className="px-5 py-3">LDR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-onira-offwhite">
                      {devices.map((dev) => (
                        <tr key={dev.user_id} className="hover:bg-onira-offwhite/60">
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-onira-night">
                              {dev.profiles?.full_name || 'Usuário'}
                            </p>
                            <p className="text-xs text-slate-500">{dev.profiles?.email || '—'}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-onira-night">{dev.device_name}</p>
                            <p className="font-mono text-xs text-onira-purple">{dev.device_code}</p>
                          </td>
                          <td className="px-5 py-3.5 text-slate-700">
                            LED {dev.neopixel_brightness}% · Buzzer {dev.buzzer_volume}%
                          </td>
                          <td className="px-5 py-3.5 text-slate-700">
                            {Number(dev.max_temp_celsius).toFixed(1)} °C ·{' '}
                            <span className={dev.auto_ventilation ? 'font-semibold text-emerald-600' : 'text-slate-400'}>
                              {dev.auto_ventilation ? 'Ventilação ON' : 'OFF'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs font-medium text-slate-700">{dev.ldr_sensitivity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SEÇÃO DEDICADA: NOITES PROGRAMADAS */}
          {section === 'nights' && (
            <div className="rounded-2xl border border-onira-lavender/20 bg-white shadow-sm">
              <div className="border-b border-onira-offwhite p-5">
                <p className="text-[11px] font-bold tracking-[0.16em] text-onira-purple uppercase">Roteiros</p>
                <h2 className="mt-0.5 text-lg font-bold text-onira-night">
                  Noites programadas ({nights.length})
                </h2>
              </div>
              {nights.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-slate-500">
                  Nenhuma noite foi programada pelos usuários ainda.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-onira-offwhite bg-onira-offwhite/80 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                        <th className="px-5 py-3">Usuário</th>
                        <th className="px-5 py-3">Tema</th>
                        <th className="px-5 py-3">Duração</th>
                        <th className="px-5 py-3">Despertar</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-onira-offwhite">
                      {nights.map((night) => {
                        const hex = night.theme_light_hex || resolveColorHex(night.theme_light_color);
                        return (
                          <tr key={night.id} className="hover:bg-onira-offwhite/60">
                            <td className="px-5 py-3.5">
                              <p className="font-semibold text-onira-night">
                                {night.profiles?.full_name || 'Usuário'}
                              </p>
                              <p className="text-xs text-slate-500">{night.profiles?.email || '—'}</p>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="inline-flex items-center gap-2 font-medium text-onira-night">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hex }} />
                                {night.theme_name}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-slate-700">
                              {formatDuration(Number(night.duration_hours))}
                            </td>
                            <td className="px-5 py-3.5 font-medium text-onira-night">{night.wake_up_time}</td>
                            <td className="px-5 py-3.5">
                              <span className="inline-flex rounded-full bg-onira-offwhite px-2.5 py-0.5 text-xs font-semibold text-onira-purple">
                                {night.status}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-xs text-slate-500">
                              {new Date(night.created_at).toLocaleDateString('pt-BR')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MODAL: Cadastrar / Editar Tema de Sonho (RF04 / CT-04) */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-onira-night/65 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="theme-modal-title"
        >
          <div className="animate-modal-pop w-full max-w-lg rounded-3xl border border-onira-lavender/25 bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold tracking-[0.16em] text-onira-purple uppercase">
                  Catálogo de Sonhos
                </p>
                <h2 id="theme-modal-title" className="mt-1 text-xl font-bold text-onira-night">
                  {editingTheme ? 'Editar tema de sonho' : 'Cadastrar novo tema de sonho'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="cursor-pointer rounded-xl p-1.5 text-slate-400 hover:bg-onira-offwhite hover:text-onira-night"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTheme} className="mt-5 space-y-4" noValidate>
              {modalError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label htmlFor="theme-name" className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Nome do tema *
                </label>
                <input
                  id="theme-name"
                  type="text"
                  required
                  value={formState.name}
                  onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex.: Voo sobre montanhas"
                  className="w-full rounded-xl border border-onira-lavender/25 bg-onira-offwhite/70 px-3.5 py-2.5 text-sm text-onira-night focus:border-onira-purple focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="theme-description" className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Descrição *
                </label>
                <textarea
                  id="theme-description"
                  rows={3}
                  required
                  value={formState.description}
                  onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Ex.: planar ao amanhecer"
                  className="w-full rounded-xl border border-onira-lavender/25 bg-onira-offwhite/70 px-3.5 py-2.5 text-sm text-onira-night focus:border-onira-purple focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="theme-color" className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Cor da luz (NeoPixel) *
                </label>
                <div className="flex items-center gap-2.5">
                  <input
                    id="theme-color"
                    type="text"
                    required
                    value={formState.light_color}
                    onChange={(e) => handleLightColorTextChange(e.target.value)}
                    placeholder="Ex.: lavanda, roxo tecnológico, azul claro"
                    className="flex-1 rounded-xl border border-onira-lavender/25 bg-onira-offwhite/70 px-3.5 py-2.5 text-sm text-onira-night focus:border-onira-purple focus:bg-white focus:outline-none"
                  />
                  <label
                    className="relative flex h-10 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-slate-200"
                    style={{ backgroundColor: formState.light_hex }}
                    title="Ajustar tonalidade LED"
                  >
                    <input
                      type="color"
                      value={formState.light_hex}
                      onChange={(e) => {
                        setManualHexOverride(true);
                        setFormState((prev) => ({ ...prev, light_hex: e.target.value.toUpperCase() }));
                      }}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                </div>

                {/* Chips rápidos de cores */}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {LIGHT_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setManualHexOverride(false);
                        setFormState((prev) => ({
                          ...prev,
                          light_color: preset.label,
                          light_hex: preset.hex,
                        }));
                      }}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-onira-lavender/25 bg-onira-offwhite/80 px-2.5 py-1 text-[11px] font-medium text-onira-night transition-colors hover:border-onira-purple hover:bg-onira-offwhite"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: preset.hex }} />
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-onira-offwhite"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingTheme}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-onira-purple px-5 py-2.5 text-sm font-semibold text-onira-offwhite shadow-sm hover:bg-onira-purple-hover disabled:opacity-60"
                >
                  {savingTheme ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Salvar tema
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirmar Exclusão de Tema (CT-04 passo 5) */}
      {deletingTheme && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-onira-night/65 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="animate-modal-pop w-full max-w-md rounded-3xl border border-onira-lavender/25 bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-onira-night">Excluir tema de sonho?</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Tem certeza que deseja excluir o tema{' '}
              <strong className="text-slate-900">{deletingTheme.name}</strong>? Ele será removido do painel
              administrativo e da lista de temas do Roteiro do Sonho.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingTheme(null)}
                className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingBusy}
                onClick={() => void handleConfirmDelete()}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {deletingBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Confirmar exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
