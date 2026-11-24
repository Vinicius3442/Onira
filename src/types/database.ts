export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  habitual_sleep_time: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface DreamTheme {
  id: string;
  name: string;
  description: string;
  light_color: string;
  light_hex: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type NightStatus = 'Programada' | 'Concluída' | 'Cancelada';

export interface DreamNight {
  id: string;
  user_id: string;
  theme_id: string | null;
  theme_name: string;
  theme_light_color: string;
  theme_light_hex: string;
  duration_hours: number;
  wake_up_time: string;
  status: NightStatus;
  sleep_quality: number | null;
  morning_notes: string | null;
  scheduled_for: string;
  created_at: string;
}

export interface DreamNightWithProfile extends DreamNight {
  profiles?: {
    full_name: string;
    email: string;
  } | null;
}

export type LdrSensitivity = 'Baixa' | 'Média' | 'Alta';

export interface DeviceSettings {
  user_id: string;
  device_code: string;
  device_name: string;
  neopixel_brightness: number;
  buzzer_volume: number;
  max_temp_celsius: number;
  auto_ventilation: boolean;
  ldr_sensitivity: LdrSensitivity;
  created_at: string;
  updated_at: string;
}

export interface DeviceSettingsWithProfile extends DeviceSettings {
  profiles?: {
    full_name: string;
    email: string;
  } | null;
}
