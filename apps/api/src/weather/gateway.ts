/**
 * Weather provider abstraction.
 *
 * A single `WeatherGateway` interface with one real implementation,
 * `openweathermap`. The farmer app's dashboard and field-work screens read a
 * `WeatherSnapshot` through this contract only — they never talk to
 * OpenWeatherMap directly, so adding a second provider later touches this
 * package and nothing else. There is deliberately no mock/stub provider: the
 * product decision was that this endpoint is only ever real data, not a
 * fake-data mode that could silently ship. Tests stub `fetch` directly
 * instead (see `weather.test.ts`).
 *
 * All numeric fields below are plain `number`, not the branded `Money` type.
 * The `Money`-as-integer-paise rule in the root CLAUDE.md exists to stop
 * floating-point drift in currency arithmetic; a temperature or a wind speed
 * is never summed, split, or reconciled against a ledger, so ordinary
 * floating-point numbers are correct here. Do not "fix" this by wrapping
 * these fields in a branded type.
 */

/**
 * Closed set of conditions the three client apps know how to render an icon
 * for. Every provider adapter must map its own vocabulary down to this set —
 * see `mapOwmCondition` in `openweathermap.weather.ts` for the OpenWeatherMap
 * mapping.
 */
export type WeatherCondition =
  | 'CLEAR'
  | 'CLEAR_NIGHT'
  | 'PARTLY_CLOUDY'
  | 'CLOUDY'
  | 'FOG'
  | 'LIGHT_RAIN'
  | 'RAIN'
  | 'THUNDERSTORM';

export type WeatherProvider = 'openweathermap';

export interface WeatherCoordinates {
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  temperatureC: number;
  feelsLikeC: number;
  condition: WeatherCondition;
  humidityPct: number;
  windKph: number;
  precipitationChancePct: number;
}

export interface HourlyWeather {
  /** ISO 8601 UTC instant. 3-hour steps. */
  at: string;
  temperatureC: number;
  condition: WeatherCondition;
}

export interface DailyWeather {
  /** 'YYYY-MM-DD' in the farm's local calendar. */
  date: string;
  minTempC: number;
  maxTempC: number;
  condition: WeatherCondition;
  precipitationMm: number;
}

export interface WeatherSnapshot {
  provider: WeatherProvider;
  /** ISO 8601 UTC instant the observation was taken. */
  observedAt: string;
  current: CurrentWeather;
  /** Up to 8 entries (next 24h in 3-hour steps). */
  hourly: HourlyWeather[];
  /** Up to 7 entries. `daily[0]` is always the farm's local today. */
  daily: DailyWeather[];
}

export interface WeatherGateway {
  readonly provider: WeatherProvider;
  fetchSnapshot(coordinates: WeatherCoordinates): Promise<WeatherSnapshot>;
}
