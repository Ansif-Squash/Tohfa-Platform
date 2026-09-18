/**
 * OpenWeatherMap adapter — the only `WeatherGateway`.
 *
 * Calls OpenWeatherMap's free-tier REST API (current weather + 5-day/3-hour
 * forecast) and maps its documented response shape onto TOHFA's
 * `WeatherSnapshot` contract. See `gateway.ts` for the contract itself and
 * for why there is deliberately no mock/stub provider alongside this one.
 */
import { config } from '../config.js';
import { AppError } from '../http/problem.js';
import type {
  CurrentWeather,
  DailyWeather,
  HourlyWeather,
  WeatherCondition,
  WeatherCoordinates,
  WeatherGateway,
  WeatherSnapshot,
} from './gateway.js';

const CURRENT_WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

/** The subset of OWM's `weather[]` entry shape we read. */
interface OwmConditionRaw {
  id: number;
  main?: string;
  description?: string;
  icon?: string;
}

/** The subset of OWM's `GET /data/2.5/weather` response we read. */
interface OwmCurrentResponseRaw {
  weather: OwmConditionRaw[];
  main: { temp: number; feels_like: number; humidity: number };
  wind: { speed: number };
  /** Unix seconds. */
  dt: number;
  rain?: { '1h'?: number };
}

/** One entry of OWM's `GET /data/2.5/forecast` `list[]`. */
interface OwmForecastEntryRaw {
  /** Unix seconds. */
  dt: number;
  main: { temp: number; temp_min: number; temp_max: number };
  weather: OwmConditionRaw[];
  /** Probability of precipitation, 0..1. */
  pop?: number;
  rain?: { '3h'?: number };
}

/** The subset of OWM's `GET /data/2.5/forecast` response we read. */
interface OwmForecastResponseRaw {
  list: OwmForecastEntryRaw[];
  /** Location's UTC offset in SECONDS (not minutes, not ms). */
  city: { timezone: number };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Maps OpenWeatherMap's documented condition-code ranges (`weather[0].id`)
 * onto TOHFA's closed `WeatherCondition` set. Deliberately never throws on
 * an unrecognised code — a cosmetic icon mismatch is not worth failing the
 * whole forecast over, so unknown codes fail soft to `CLOUDY`.
 */
export function mapOwmCondition(id: number, icon: string | undefined): WeatherCondition {
  if (id >= 200 && id < 300) return 'THUNDERSTORM';
  if (id >= 300 && id < 400) return 'LIGHT_RAIN';
  if (id >= 500 && id < 600) {
    // 500 = "light rain", 520 = "light intensity shower rain". Every other
    // 5xx (moderate/heavy rain, shower rain, ragged shower rain, ...) is RAIN.
    if (id === 500 || id === 520) return 'LIGHT_RAIN';
    return 'RAIN';
  }
  if (id >= 600 && id < 700) {
    // TOHFA's taxonomy has no snow condition, and the Nilgiris does not get
    // snow — map any 6xx code to RAIN rather than inventing a state no
    // client can render.
    return 'RAIN';
  }
  if (id >= 700 && id < 800) return 'FOG'; // mist, smoke, haze, dust, fog, ...
  if (id === 800) {
    // OWM icon codes are suffixed 'd' (day) or 'n' (night).
    return icon?.endsWith('n') ? 'CLEAR_NIGHT' : 'CLEAR';
  }
  if (id === 801 || id === 802) return 'PARTLY_CLOUDY'; // few / scattered clouds
  if (id === 803 || id === 804) return 'CLOUDY'; // broken / overcast
  return 'CLOUDY'; // unrecognised code: fail soft, never throw
}

export class OpenWeatherMapGateway implements WeatherGateway {
  readonly provider = 'openweathermap' as const;
  private readonly apiKey: string;

  constructor(apiKey = config.OPENWEATHERMAP_API_KEY) {
    this.apiKey = apiKey;
  }

  async fetchSnapshot(coordinates: WeatherCoordinates): Promise<WeatherSnapshot> {
    if (!this.apiKey) {
      throw new AppError('WEATHER_PROVIDER_ERROR', {
        detail: 'OPENWEATHERMAP_API_KEY is not configured.',
      });
    }

    const currentUrl = this.buildUrl(CURRENT_WEATHER_URL, coordinates);
    const forecastUrl = this.buildUrl(FORECAST_URL, coordinates);

    let currentResponse: Awaited<ReturnType<typeof fetch>>;
    let forecastResponse: Awaited<ReturnType<typeof fetch>>;
    try {
      [currentResponse, forecastResponse] = await Promise.all([
        fetch(currentUrl),
        fetch(forecastUrl),
      ]);
    } catch (cause) {
      // Network failure. Deliberately no URL in the detail: both URLs carry
      // `appid=<key>` in the query string, and a thrown detail is exactly
      // the kind of thing that ends up in a log line.
      throw new AppError('WEATHER_PROVIDER_ERROR', {
        detail: 'Failed to reach the OpenWeatherMap API.',
        cause,
      });
    }

    if (!currentResponse.ok || !forecastResponse.ok) {
      // The status code is safe to surface to callers/logs; the request URL
      // is not (it contains the API key), so it is never included here.
      throw new AppError('WEATHER_PROVIDER_ERROR', {
        detail: `OpenWeatherMap request failed (current: ${currentResponse.status}, forecast: ${forecastResponse.status}).`,
      });
    }

    let current: OwmCurrentResponseRaw;
    let forecast: OwmForecastResponseRaw;
    try {
      [current, forecast] = await Promise.all([
        currentResponse.json() as Promise<OwmCurrentResponseRaw>,
        forecastResponse.json() as Promise<OwmForecastResponseRaw>,
      ]);
    } catch (cause) {
      throw new AppError('WEATHER_PROVIDER_ERROR', {
        detail: 'OpenWeatherMap response was not valid JSON.',
        cause,
      });
    }

    return this.mapSnapshot(current, forecast);
  }

  private buildUrl(base: string, coordinates: WeatherCoordinates): string {
    // URLSearchParams handles escaping for us — the API key is user-supplied
    // configuration and must never be concatenated into a template literal
    // unescaped.
    const params = new URLSearchParams({
      lat: String(coordinates.latitude),
      lon: String(coordinates.longitude),
      appid: this.apiKey,
      units: 'metric',
    });
    return `${base}?${params.toString()}`;
  }

  private mapSnapshot(
    current: OwmCurrentResponseRaw,
    forecast: OwmForecastResponseRaw,
  ): WeatherSnapshot {
    try {
      const currentCondition = current.weather?.[0];
      if (!currentCondition) {
        throw new Error('current response missing weather[0]');
      }
      if (!Array.isArray(forecast.list) || forecast.list.length === 0) {
        throw new Error('forecast response missing a non-empty list[]');
      }

      const observedAt = new Date(current.dt * 1000).toISOString();

      // `units=metric` only affects temperature fields — OWM always returns
      // wind speed in metres per second regardless of the `units` param.
      // This is the single easiest field in this whole adapter to get wrong.
      const windKph = round1(current.wind.speed * 3.6);

      // The current-weather endpoint has no `pop` (precipitation
      // probability) field at all. The nearest thing the free tier offers to
      // "chance of rain right now" is the first forecast list entry's `pop`.
      const precipitationChancePct = Math.round((forecast.list[0]?.pop ?? 0) * 100);

      const currentWeather: CurrentWeather = {
        temperatureC: round1(current.main.temp),
        feelsLikeC: round1(current.main.feels_like),
        condition: mapOwmCondition(currentCondition.id, currentCondition.icon),
        humidityPct: round1(current.main.humidity),
        windKph,
        precipitationChancePct,
      };

      const hourly: HourlyWeather[] = forecast.list.slice(0, 8).map((entry) => {
        const weather = entry.weather?.[0];
        if (!weather) {
          throw new Error('forecast list entry missing weather[0]');
        }
        return {
          at: new Date(entry.dt * 1000).toISOString(),
          temperatureC: round1(entry.main.temp),
          condition: mapOwmCondition(weather.id, weather.icon),
        };
      });

      const daily = this.buildDaily(current, currentCondition, forecast);

      return { provider: this.provider, observedAt, current: currentWeather, hourly, daily };
    } catch (cause) {
      throw new AppError('WEATHER_PROVIDER_ERROR', {
        detail: 'OpenWeatherMap response was missing an expected field.',
        cause,
      });
    }
  }

  private buildDaily(
    current: OwmCurrentResponseRaw,
    currentCondition: OwmConditionRaw,
    forecast: OwmForecastResponseRaw,
  ): DailyWeather[] {
    const offsetMs = forecast.city.timezone * 1000;

    // "Shift the UTC instant by the location's offset, then read it back
    // with UTC getters" is the standard trick for getting a correct local
    // calendar date/time-of-day without a timezone library.
    const localDateOf = (unixSeconds: number): string => {
      const shifted = new Date(unixSeconds * 1000 + offsetMs);
      const year = shifted.getUTCFullYear();
      const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
      const day = String(shifted.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    const localSecondsOfDay = (unixSeconds: number): number => {
      const shifted = new Date(unixSeconds * 1000 + offsetMs);
      return shifted.getUTCHours() * 3600 + shifted.getUTCMinutes() * 60 + shifted.getUTCSeconds();
    };

    const todayLocalDate = localDateOf(current.dt);

    interface DayAccumulator {
      minTempC: number;
      maxTempC: number;
      precipitationMm: number;
      /** The list[] entry closest to local noon, used for that day's headline condition. */
      noonCondition: OwmConditionRaw;
      noonDistanceSeconds: number;
    }

    const byDate = new Map<string, DayAccumulator>();

    for (const entry of forecast.list) {
      const weather = entry.weather?.[0];
      if (!weather) {
        throw new Error('forecast list entry missing weather[0]');
      }
      const date = localDateOf(entry.dt);
      const distanceFromNoon = Math.abs(localSecondsOfDay(entry.dt) - 12 * 3600);
      const rainMm = entry.rain?.['3h'] ?? 0;

      const existing = byDate.get(date);
      if (!existing) {
        byDate.set(date, {
          minTempC: entry.main.temp_min,
          maxTempC: entry.main.temp_max,
          precipitationMm: rainMm,
          noonCondition: weather,
          noonDistanceSeconds: distanceFromNoon,
        });
        continue;
      }

      existing.minTempC = Math.min(existing.minTempC, entry.main.temp_min);
      existing.maxTempC = Math.max(existing.maxTempC, entry.main.temp_max);
      existing.precipitationMm += rainMm;
      // A day is labelled by the reading closest to local noon, not
      // whichever 3-hour slot happened to arrive first — otherwise an early
      // 3am entry could label the whole day "clear night".
      if (distanceFromNoon < existing.noonDistanceSeconds) {
        existing.noonCondition = weather;
        existing.noonDistanceSeconds = distanceFromNoon;
      }
    }

    // OWM's forecast starts at the next 3-hour slot, so late in the evening
    // "today" can have no forecast entry at all yet. Guarantee daily[0] is
    // always the farm's local today by synthesising it from the CURRENT
    // reading whenever the grouped map has nothing for that date.
    if (!byDate.has(todayLocalDate)) {
      byDate.set(todayLocalDate, {
        minTempC: current.main.temp,
        maxTempC: current.main.temp,
        precipitationMm: current.rain?.['1h'] ?? 0,
        noonCondition: currentCondition,
        noonDistanceSeconds: 0,
      });
    }

    return [...byDate.entries()]
      // Drop any date earlier than today — a straggling forecast entry must
      // never push "today" out of daily[0].
      .filter(([date]) => date >= todayLocalDate)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .slice(0, 7)
      .map(([date, acc]) => ({
        date,
        minTempC: round1(acc.minTempC),
        maxTempC: round1(acc.maxTempC),
        condition: mapOwmCondition(acc.noonCondition.id, acc.noonCondition.icon),
        precipitationMm: round1(acc.precipitationMm),
      }));
  }
}

export const openWeatherMapGateway = new OpenWeatherMapGateway();
