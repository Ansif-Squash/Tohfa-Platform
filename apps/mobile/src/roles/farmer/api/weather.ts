import { api } from './client';

export type WeatherCondition =
  | 'CLEAR'
  | 'CLEAR_NIGHT'
  | 'PARTLY_CLOUDY'
  | 'CLOUDY'
  | 'FOG'
  | 'LIGHT_RAIN'
  | 'RAIN'
  | 'THUNDERSTORM';

export interface FarmWeatherLocation {
  farmName: string;
  village: string | null;
  latitude: number;
  longitude: number;
}

export interface FarmWeatherCurrent {
  temperatureC: number;
  feelsLikeC: number;
  condition: WeatherCondition;
  humidityPct: number;
  windKph: number;
  precipitationChancePct: number;
}

export interface FarmWeatherHourly {
  /** ISO 8601 UTC instant, 3-hour steps, next 24h. */
  at: string;
  temperatureC: number;
  condition: WeatherCondition;
}

export interface FarmWeatherDaily {
  /** 'YYYY-MM-DD' */
  date: string;
  minTempC: number;
  maxTempC: number;
  condition: WeatherCondition;
  precipitationMm: number;
}

export interface FarmWeatherAlert {
  id: string;
  type: 'FROST' | 'HEAVY_RAIN' | 'HEAT_WAVE' | 'HIGH_WINDS' | 'HIGH_HUMIDITY';
  severity: 'WARNING' | 'ADVISORY' | 'WATCH';
  title: string;
  subtitle: string;
  advisory: string;
  startsAt: string;
  expiresAt: string | null;
}

export interface FarmWeather {
  provider: 'mock' | 'openweathermap';
  /** ISO 8601 UTC instant. */
  observedAt: string;
  location: FarmWeatherLocation;
  current: FarmWeatherCurrent;
  /** Up to 8 entries. */
  hourly: FarmWeatherHourly[];
  /** Up to 7 entries, first entry is today. */
  daily: FarmWeatherDaily[];
  alerts?: FarmWeatherAlert[];
}

/**
 * Fetch the current farm's weather snapshot (current conditions, next-24h
 * hourly steps, 7-day daily outlook).
 * x-permission: farmer.weather.view_own
 */
export async function getFarmWeather(signal?: AbortSignal): Promise<FarmWeather> {
  return api.get<FarmWeather>('/farmers/me/weather', signal);
}
