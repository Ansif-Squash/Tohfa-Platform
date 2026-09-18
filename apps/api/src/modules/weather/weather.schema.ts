/**
 * Generated from the _example reference module. See CLAUDE.md.
 *
 * <name>.schema.ts holds ONLY Zod schemas and the types inferred from them.
 * Rules:
 *  - Request schemas are the single source of truth for input types.
 *  - Response schemas exist so the shape stays in step with docs/openapi.yaml.
 *  - Never put SQL, HTTP or business logic in this file.
 *
 * `GET /v1/farmers/me/weather` takes no parameters at all — the location comes
 * from the caller's own farm record, never from the query string. That is the
 * point: a `?lat=&lng=` would let one farmer ask about another's land.
 *
 * Temperatures, wind and rainfall are plain numbers. They are measurements,
 * not money, so the `Money` branded-string rule (root CLAUDE.md §2.2) does not
 * apply here.
 */
import { z } from 'zod';

/** Provider-neutral taxonomy. Mirrors `WeatherCondition` in src/weather/gateway.ts
 * and the `WeatherCondition` enum in docs/openapi.yaml. */
export const weatherConditions = [
  'CLEAR',
  'CLEAR_NIGHT',
  'PARTLY_CLOUDY',
  'CLOUDY',
  'FOG',
  'LIGHT_RAIN',
  'RAIN',
  'THUNDERSTORM',
] as const;
export type WeatherConditionCode = (typeof weatherConditions)[number];

export const weatherProviders = ['openweathermap'] as const;

export const farmWeatherLocationResponse = z.object({
  farmName: z.string(),
  village: z.string().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const farmWeatherCurrentResponse = z.object({
  temperatureC: z.number(),
  feelsLikeC: z.number(),
  condition: z.enum(weatherConditions),
  humidityPct: z.number().min(0).max(100),
  windKph: z.number().min(0),
  precipitationChancePct: z.number().min(0).max(100),
});

export const farmWeatherHourlyResponse = z.object({
  at: z.string(),
  temperatureC: z.number(),
  condition: z.enum(weatherConditions),
});

export const farmWeatherDailyResponse = z.object({
  date: z.string(),
  minTempC: z.number(),
  maxTempC: z.number(),
  condition: z.enum(weatherConditions),
  precipitationMm: z.number().min(0),
});

export const farmWeatherAlertResponse = z.object({
  id: z.string(),
  type: z.enum(['FROST', 'HEAVY_RAIN', 'HEAT_WAVE', 'HIGH_WINDS', 'HIGH_HUMIDITY']),
  severity: z.enum(['WARNING', 'ADVISORY', 'WATCH']),
  title: z.string(),
  subtitle: z.string(),
  advisory: z.string(),
  startsAt: z.string(),
  expiresAt: z.string().nullable(),
});
export type FarmWeatherAlertResponse = z.infer<typeof farmWeatherAlertResponse>;

/** Wire representation of one weather snapshot. Keep aligned with the
 * `FarmWeather` schema in docs/openapi.yaml — the mobile client's
 * `apps/mobile/src/roles/farmer/api/weather.ts` consumes it field for field. */
export const farmWeatherResponse = z.object({
  provider: z.enum(weatherProviders),
  observedAt: z.string(),
  location: farmWeatherLocationResponse,
  current: farmWeatherCurrentResponse,
  hourly: z.array(farmWeatherHourlyResponse),
  daily: z.array(farmWeatherDailyResponse),
  alerts: z.array(farmWeatherAlertResponse).default([]),
});
export type FarmWeatherResponse = z.infer<typeof farmWeatherResponse>;
