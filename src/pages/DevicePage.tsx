import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Thermometer,
  SunMedium,
  Volume2,
  Sparkles,
  Wind,
  Moon,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wifi,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { NeoPixelRing } from '../components/NeoPixelRing';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { LdrSensitivity } from '../types/database';
import oniraPillowImg from '../assets/onira-pillow.png';

export const DevicePage: React.FC = () => {
  const { user } = useAuth();

  const [deviceCode, setDeviceCode] = useState('ONR-2026-001');
  const [deviceName, setDeviceName] = useState('Travesseiro ONIRA Principal');
  const [neopixelBrightness, setNeopixelBrightness] = useState(65);
  const [buzzerVolume, setBuzzerVolume] = useState(50);
  const [maxTempCelsius, setMaxTempCelsius] = useState(27.5);
  const [autoVentilation, setAutoVentilation] = useState(true);
  const [ldrSensitivity, setLdrSensitivity] = useState<LdrSensitivity>('Média');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('device_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!active) return;
        if (!error && data) {
          setDeviceCode(data.device_code);
          setDeviceName(data.device_name);
          setNeopixelBrightness(Number(data.neopixel_brightness));
          setBuzzerVolume(Number(data.buzzer_volume));
          setMaxTempCelsius(Number(data.max_temp_celsius));
          setAutoVentilation(Boolean(data.auto_ventilation));
          setLdrSensitivity(data.ldr_sensitivity as LdrSensitivity);
          setLastSyncedAt(data.updated_at);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadSettings();
    return () => {
      active = false;
    };
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFeedback(null);

    if (deviceCode.trim().length < 3 || deviceName.trim().length < 2) {
      setFeedback({ type: 'err', text: 'Informe um código de série (mín. 3 caracteres) e nome válidos.' });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('device_settings')
        .upsert(
          {
            user_id: user.id,
            device_code: deviceCode.trim().toUpperCase(),
            device_name: deviceName.trim(),
            neopixel_brightness: neopixelBrightness,
            buzzer_volume: buzzerVolume,
            max_temp_celsius: maxTempCelsius,
            auto_ventilation: autoVentilation,
            ldr_sensitivity: ldrSensitivity,
          },
          { onConflict: 'user_id' }
        )
        .select('updated_at')
        .single();

      if (error) {
        setFeedback({
          type: 'err',
          text: `Erro ao salvar configurações no Supabase: ${error.message}. Confirme se o schema.sql atualizado foi executado.`,
        });
        return;
      }

      if (data?.updated_at) setLastSyncedAt(data.updated_at);
      setFeedback({
        type: 'ok',
        text: 'Preferências do seu Travesseiro ONIRA gravadas com sucesso no banco de dados!',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      title="Meu Travesseiro ONIRA"
      subtitle="Configure os parâmetros reais do seu dispositivo inteligente (NeoPixel, Buzzer, NTC e LDR) salvos na sua conta."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Formulário de Configurações Reais do Hardware */}
        <form onSubmit={handleSave} className="onira-card space-y-6 rounded-3xl p-6 sm:p-7 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] text-onira-lavender uppercase">
                Parâmetros do Dispositivo
              </p>
              <h2 className="mt-1 text-lg font-bold text-onira-offwhite">Vínculo e Calibração</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <Wifi className="h-3.5 w-3.5" />
              {lastSyncedAt ? 'Sincronizado na nuvem' : 'Pronto para vincular'}
            </span>
          </div>

          {feedback && (
            <div
              role="status"
              className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${
                feedback.type === 'ok'
                  ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-100'
                  : 'border-rose-500/35 bg-rose-500/12 text-rose-200'
              }`}
            >
              {feedback.type === 'ok' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-onira-lavender" />
              Carregando configurações salvas...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="device-code" className="mb-1.5 block text-xs font-medium text-slate-300">
                    Código de série do travesseiro
                  </label>
                  <input
                    id="device-code"
                    type="text"
                    value={deviceCode}
                    onChange={(e) => setDeviceCode(e.target.value)}
                    placeholder="Ex.: ONR-2026-001"
                    className="onira-input w-full rounded-xl px-4 py-2.5 text-sm text-white uppercase"
                  />
                </div>
                <div>
                  <label htmlFor="device-name" className="mb-1.5 block text-xs font-medium text-slate-300">
                    Apelido do dispositivo
                  </label>
                  <input
                    id="device-name"
                    type="text"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="Ex.: Quarto Principal"
                    className="onira-input w-full rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>
              </div>

              {/* Intensidade NeoPixel */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-2 font-semibold text-onira-offwhite">
                    <Sparkles className="h-4 w-4 text-onira-lavender" />
                    Intensidade do Anel NeoPixel
                  </span>
                  <span className="font-bold text-onira-lavender">{neopixelBrightness}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={neopixelBrightness}
                  onChange={(e) => setNeopixelBrightness(Number(e.target.value))}
                  className="mt-3 w-full accent-onira-purple"
                />
              </div>

              {/* Volume Buzzer */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-2 font-semibold text-onira-offwhite">
                    <Volume2 className="h-4 w-4 text-onira-purple" />
                    Volume do Despertar Suave (Buzzer)
                  </span>
                  <span className="font-bold text-onira-lavender">{buzzerVolume}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={buzzerVolume}
                  onChange={(e) => setBuzzerVolume(Number(e.target.value))}
                  className="mt-3 w-full accent-onira-lavender"
                />
              </div>

              {/* Temperatura NTC & Ventilação */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-2 font-semibold text-onira-offwhite">
                    <Thermometer className="h-4 w-4 text-rose-400" />
                    Limite de aquecimento NTC (ativa ventilação)
                  </span>
                  <span className="font-bold text-rose-300">{maxTempCelsius.toFixed(1)} °C</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={34}
                  step={0.5}
                  value={maxTempCelsius}
                  onChange={(e) => setMaxTempCelsius(Number(e.target.value))}
                  className="w-full accent-rose-400"
                />
                <label className="flex cursor-pointer items-center justify-between pt-1 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-2">
                    <Wind className="h-4 w-4 text-emerald-400" />
                    Ativar ventilação automática em aquecimento excessivo
                  </span>
                  <input
                    type="checkbox"
                    checked={autoVentilation}
                    onChange={(e) => setAutoVentilation(e.target.checked)}
                    className="h-4 w-4 accent-onira-purple"
                  />
                </label>
              </div>

              {/* Sensibilidade LDR */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="mb-2.5 flex items-center gap-2 text-xs font-semibold text-onira-offwhite">
                  <SunMedium className="h-4 w-4 text-amber-400" />
                  Sensibilidade do Fotorresistor (LDR — luz do quarto)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(['Baixa', 'Média', 'Alta'] as LdrSensitivity[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setLdrSensitivity(level)}
                      className={`cursor-pointer rounded-xl border py-2 text-xs font-semibold transition-colors ${
                        ldrSensitivity === level
                          ? 'border-onira-lavender bg-onira-purple/25 text-onira-offwhite'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="onira-gradient-btn flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar configurações do travesseiro
              </button>
            </>
          )}
        </form>

        {/* Cartão do Produto + Arquitetura de Sensores */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          <div className="onira-card overflow-hidden rounded-3xl p-5">
            <img
              src={oniraPillowImg}
              alt="Travesseiro inteligente ONIRA"
              className="h-48 w-full rounded-2xl object-cover"
            />
            <div className="mt-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-onira-lavender">{deviceCode}</p>
                <h3 className="text-base font-bold text-onira-offwhite">{deviceName}</h3>
                <p className="mt-1 text-xs text-slate-400">
                  {lastSyncedAt
                    ? `Última gravação: ${new Date(lastSyncedAt).toLocaleString('pt-BR')}`
                    : 'Salve suas preferências para vincular ao perfil.'}
                </p>
              </div>
              <div style={{ opacity: Math.max(0.25, neopixelBrightness / 100) }}>
                <NeoPixelRing colorHex="#7665E8" colorLabel={`${neopixelBrightness}%`} size="sm" />
              </div>
            </div>
          </div>

          <div className="onira-card rounded-3xl p-5">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-onira-lavender" />
              <h3 className="text-sm font-bold text-onira-offwhite">Arquitetura de Hardware (ESP32 / Wokwi)</h3>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
              Conforme o escopo do projeto, esta versão web gerencia suas preferências reais no Supabase sem simular
              telemetria falsa de sensores. Os 5 módulos físicos previstos são:
            </p>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2.5">
                <Moon className="h-4 w-4 shrink-0 text-onira-lavender" />
                <span><strong>Potenciômetro (GPIO 34):</strong> simula a fase do sono (0 acordado a 100 sono profundo)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Thermometer className="h-4 w-4 shrink-0 text-rose-400" />
                <span><strong>Sensor NTC (GPIO 35):</strong> mede a temperatura do travesseiro em °C e dispara alerta térmico</span>
              </li>
              <li className="flex items-center gap-2.5">
                <SunMedium className="h-4 w-4 shrink-0 text-amber-400" />
                <span><strong>Fotorresistor LDR (GPIO 32):</strong> mede a luminosidade do quarto (0 a 100%) para regular o brilho</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 shrink-0 text-onira-purple" />
                <span><strong>Anel NeoPixel 12 LEDs (GPIO 13):</strong> projeta a luz suave na cor do tema escolhido</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Volume2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span><strong>Buzzer (GPIO 14) + Ventilação (GPIO 27):</strong> despertar suave progressivo e resfriamento automático</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
