import React, { useEffect, useRef, useState } from 'react';
import {
  User,
  Clock,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Calendar,
  Camera,
  Trash2,
  Upload,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { AdminTag, UserAvatar } from '../components/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { compressAvatarFile } from '../lib/avatar';

export const ProfilePage: React.FC = () => {
  const { user, profile, avatarUrl, isAdmin, updateProfile, updateAvatar } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [sleepTime, setSleepTime] = useState(profile?.habitual_sleep_time || '22:30');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setSleepTime(profile.habitual_sleep_time);
    }
  }, [profile]);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setAvatarMsg(null);
    setAvatarBusy(true);
    try {
      const compressed = await compressAvatarFile(file);
      const res = await updateAvatar(compressed);
      if (res.error) {
        setAvatarMsg({ type: 'err', text: res.error });
      } else {
        setAvatarMsg({ type: 'ok', text: 'Foto de perfil salva no Supabase!' });
      }
    } catch (err) {
      setAvatarMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Erro ao processar a foto selecionada.',
      });
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarMsg(null);
    setAvatarBusy(true);
    try {
      const res = await updateAvatar(null);
      if (res.error) {
        setAvatarMsg({ type: 'err', text: res.error });
      } else {
        setAvatarMsg({ type: 'ok', text: 'Foto de perfil removida.' });
      }
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    if (fullName.trim().length < 2) {
      setProfileMsg({ type: 'err', text: 'Informe seu nome completo (mínimo 2 caracteres).' });
      return;
    }

    if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(sleepTime)) {
      setProfileMsg({ type: 'err', text: 'Informe um horário habitual de dormir válido.' });
      return;
    }

    setSavingProfile(true);
    try {
      const res = await updateProfile({ fullName, habitualSleepTime: sleepTime });
      if (res.error) {
        setProfileMsg({ type: 'err', text: res.error });
      } else {
        setProfileMsg({ type: 'ok', text: 'Dados pessoais atualizados com sucesso no banco!' });
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'err', text: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'err', text: 'As senhas digitadas não conferem.' });
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordMsg({ type: 'err', text: `Erro ao alterar senha: ${error.message}` });
      } else {
        setNewPassword('');
        setConfirmPassword('');
        setPasswordMsg({ type: 'ok', text: 'Senha alterada com sucesso e gravada com hash seguro!' });
      }
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <AppShell
      title="Meu Perfil e Rotina"
      subtitle="Personalize sua foto de perfil, seus dados cadastrais, horário habitual de dormir e segurança da conta ONIRA."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Card de Foto de Perfil e Resumo da Conta */}
        <div className="onira-card rounded-3xl p-6 lg:col-span-4">
          <div className="flex flex-col items-center text-center">
            {/* Avatar interativo com upload */}
            <div className="group relative">
              <UserAvatar src={avatarUrl} name={profile?.full_name} size="xl" />
              <button
                type="button"
                disabled={avatarBusy}
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-0 bottom-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-[#121027] bg-violet-600 text-white shadow-lg transition-transform hover:scale-110 hover:bg-violet-500 disabled:opacity-60"
                title="Alterar foto de perfil"
                aria-label="Alterar foto de perfil"
              >
                {avatarBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarFileChange}
                className="hidden"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <h2 className="text-lg font-bold text-white">{profile?.full_name || 'Usuário ONIRA'}</h2>
              {isAdmin && <AdminTag />}
            </div>

            <p className="mt-0.5 text-xs text-slate-400">
              {isAdmin ? 'Conta com privilégios de administração' : 'Conta pessoal ONIRA'}
            </p>

            {/* Controles da foto */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={avatarBusy}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-violet-400/35 bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-200 transition-colors hover:bg-violet-500/25 disabled:opacity-60"
              >
                <Upload className="h-3.5 w-3.5" />
                {avatarUrl ? 'Trocar foto' : 'Adicionar foto'}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  disabled={avatarBusy}
                  onClick={() => void handleRemoveAvatar()}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-rose-400/35 hover:bg-rose-500/12 hover:text-rose-200 disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover
                </button>
              )}
            </div>

            {avatarMsg && (
              <p
                className={`mt-3 w-full rounded-xl border px-3 py-2 text-xs ${
                  avatarMsg.type === 'ok'
                    ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-200'
                    : 'border-rose-500/35 bg-rose-500/12 text-rose-200'
                }`}
              >
                {avatarMsg.text}
              </p>
            )}
          </div>

          <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-xs text-slate-300">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-slate-400">
                <Mail className="h-3.5 w-3.5 text-violet-400" />
                E-mail
              </span>
              <span className="truncate font-medium text-white">{profile?.email || user?.email}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-slate-400">
                <Clock className="h-3.5 w-3.5 text-sky-400" />
                Dormir habitual
              </span>
              <span className="font-semibold text-violet-300">{profile?.habitual_sleep_time || '22:30'}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-slate-400">
                <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                Membro desde
              </span>
              <span className="font-medium text-slate-200">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Formulários */}
        <div className="space-y-6 lg:col-span-8">
          <form onSubmit={handleProfileSubmit} className="onira-card space-y-4 rounded-3xl p-6">
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] text-violet-400 uppercase">Dados pessoais</p>
              <h3 className="mt-0.5 text-lg font-bold text-white">Informações e Rotina de Sono</h3>
            </div>

            {profileMsg && (
              <div
                className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
                  profileMsg.type === 'ok'
                    ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-100'
                    : 'border-rose-500/35 bg-rose-500/12 text-rose-200'
                }`}
              >
                {profileMsg.type === 'ok' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                )}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="prof-name" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Nome completo
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="prof-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="onira-input w-full rounded-xl py-2.5 pr-4 pl-10 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="prof-sleep" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Horário habitual de dormir
                </label>
                <div className="relative">
                  <Clock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="prof-sleep"
                    type="time"
                    value={sleepTime}
                    onChange={(e) => setSleepTime(e.target.value)}
                    className="onira-input w-full rounded-xl py-2.5 pr-4 pl-10 text-sm text-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="onira-gradient-btn inline-flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar dados
            </button>
          </form>

          <form onSubmit={handlePasswordSubmit} className="onira-card space-y-4 rounded-3xl p-6">
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] text-sky-400 uppercase">Segurança</p>
              <h3 className="mt-0.5 text-lg font-bold text-white">Alterar senha</h3>
            </div>

            {passwordMsg && (
              <div
                className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
                  passwordMsg.type === 'ok'
                    ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-100'
                    : 'border-rose-500/35 bg-rose-500/12 text-rose-200'
                }`}
              >
                {passwordMsg.type === 'ok' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="prof-new-pass" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Nova senha
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="prof-new-pass"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="onira-input w-full rounded-xl py-2.5 pr-4 pl-10 text-sm text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="prof-conf-pass" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="prof-conf-pass"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="onira-input w-full rounded-xl py-2.5 pr-4 pl-10 text-sm text-white placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-violet-400/35 bg-violet-500/15 px-5 py-2.5 text-sm font-semibold text-violet-200 transition-colors hover:bg-violet-500/25 disabled:opacity-60"
            >
              {savingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
              Atualizar senha
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
};
