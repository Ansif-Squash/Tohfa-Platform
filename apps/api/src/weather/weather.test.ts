import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../http/problem.js';
import { mapOwmCondition, OpenWeatherMapGateway } from './openweathermap.weather.js';

describe('mapOwmCondition', () => {
  it.each([
    [200, undefined, 'THUNDERSTORM'],
    [300, undefined, 'LIGHT_RAIN'],
    [500, undefined, 'LIGHT_RAIN'],
    [502, undefined, 'RAIN'],
    [741, undefined, 'FOG'],
    [800, '01d', 'CLEAR'],
    [800, '01n', 'CLEAR_NIGHT'],
    [801, '02d', 'PARTLY_CLOUDY'],
    [804, '04d', 'CLOUDY'],
    [999, undefined, 'CLOUDY'],
  ] as const)('maps id %s (icon %s) to %s', (id, icon, expected) => {
    expect(mapOwmCondition(id, icon)).toBe(expected);
  });
});

describe('OpenWeatherMapGateway', () => {
  const coordinates = { latitude: 11.4064, longitude: 76.6932 };
  const apiKey = 'test_owm_api_key_secret';

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function currentFixture(overrides: Record<string, unknown> = {}) {
    return {
      weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
      main: { temp: 22.4, feels_like: 23.1, humidity: 68 },
      wind: { speed: 5 }, // m/s -> should become 18 kph
      dt: 1768460400, // 2026-01-15T07:00:00Z == 12:30 IST
      ...overrides,
    };
  }

  function forecastFixture(overrides: Record<string, unknown> = {}) {
    // city.timezone = 19800s = +5:30 (IST). Entries span two local days.
    return {
      city: { timezone: 19800 },
      list: [
        {
          dt: 1768460400, // 2026-01-15 12:30 IST
          main: { temp: 22.0, temp_min: 20.0, temp_max: 23.0 },
          weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
          pop: 0.2,
        },
        {
          dt: 1768471200, // 2026-01-15 15:30 IST
          main: { temp: 24.0, temp_min: 21.0, temp_max: 24.0 },
          weather: [{ id: 500, main: 'Rain', description: 'light rain', icon: '10d' }],
          pop: 0.4,
          rain: { '3h': 1.2 },
        },
        {
          dt: 1768482000, // 2026-01-15 18:30 IST
          main: { temp: 19.0, temp_min: 18.0, temp_max: 19.0 },
          weather: [{ id: 801, main: 'Clouds', description: 'few clouds', icon: '02n' }],
          pop: 0.1,
        },
        {
          dt: 1768546800, // 2026-01-16 12:30 IST — next local day
          main: { temp: 25.0, temp_min: 22.0, temp_max: 26.0 },
          weather: [{ id: 804, main: 'Clouds', description: 'overcast clouds', icon: '04d' }],
          pop: 0.05,
          rain: { '3h': 0.5 },
        },
      ],
      ...overrides,
    };
  }

  function stubFetchSuccess(current: unknown, forecast: unknown) {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation((url: string) => {
      const body = url.includes('/data/2.5/weather') ? current : forecast;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(body),
      } as unknown as Response);
    });
  }

  it('requests both endpoints with lat/lon/appid/units=metric', async () => {
    stubFetchSuccess(currentFixture(), forecastFixture());
    const gateway = new OpenWeatherMapGateway(apiKey);

    await gateway.fetchSnapshot(coordinates);

    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const calledUrls = fetchMock.mock.calls.map(([url]) => String(url));

    const weatherUrl = calledUrls.find((url) => url.includes('/data/2.5/weather'));
    const forecastUrl = calledUrls.find((url) => url.includes('/data/2.5/forecast'));
    expect(weatherUrl).toBeDefined();
    expect(forecastUrl).toBeDefined();

    for (const url of [weatherUrl, forecastUrl]) {
      const parsed = new URL(url!);
      expect(parsed.searchParams.get('lat')).toBe(String(coordinates.latitude));
      expect(parsed.searchParams.get('lon')).toBe(String(coordinates.longitude));
      expect(parsed.searchParams.get('appid')).toBe(apiKey);
      expect(parsed.searchParams.get('units')).toBe('metric');
    }
  });

  it('converts wind speed from m/s to kph', async () => {
    stubFetchSuccess(currentFixture({ wind: { speed: 5 } }), forecastFixture());
    const gateway = new OpenWeatherMapGateway(apiKey);

    const snapshot = await gateway.fetchSnapshot(coordinates);

    expect(snapshot.current.windKph).toBe(18); // 5 * 3.6
  });

  it('maps current fields, and takes precipitationChancePct from the first forecast entry', async () => {
    stubFetchSuccess(currentFixture(), forecastFixture());
    const gateway = new OpenWeatherMapGateway(apiKey);

    const snapshot = await gateway.fetchSnapshot(coordinates);

    expect(snapshot.provider).toBe('openweathermap');
    expect(snapshot.current.temperatureC).toBe(22.4);
    expect(snapshot.current.feelsLikeC).toBe(23.1);
    expect(snapshot.current.humidityPct).toBe(68);
    expect(snapshot.current.condition).toBe('CLEAR');
    expect(snapshot.current.precipitationChancePct).toBe(20); // first list[].pop = 0.2
    expect(snapshot.observedAt).toBe(new Date(1768460400 * 1000).toISOString());
  });

  it('builds hourly from the first 8 forecast entries in order', async () => {
    stubFetchSuccess(currentFixture(), forecastFixture());
    const gateway = new OpenWeatherMapGateway(apiKey);

    const snapshot = await gateway.fetchSnapshot(coordinates);

    expect(snapshot.hourly).toHaveLength(4); // fixture only has 4 entries
    expect(snapshot.hourly[0]).toEqual({
      at: new Date(1768460400 * 1000).toISOString(),
      temperatureC: 22,
      condition: 'CLEAR',
    });
    expect(snapshot.hourly[1]?.condition).toBe('LIGHT_RAIN');
    // id 801 (few clouds) always maps to PARTLY_CLOUDY — 801/802 don't carry
    // a day/night distinction in our taxonomy, only 800 (clear) does.
    expect(snapshot.hourly[2]?.condition).toBe('PARTLY_CLOUDY');
  });

  it('groups daily by local (IST) calendar date, with daily[0] as today', async () => {
    stubFetchSuccess(currentFixture(), forecastFixture());
    const gateway = new OpenWeatherMapGateway(apiKey);

    const snapshot = await gateway.fetchSnapshot(coordinates);

    expect(snapshot.daily.length).toBeGreaterThanOrEqual(2);
    const [today, tomorrow] = snapshot.daily;

    expect(today?.date).toBe('2026-01-15');
    expect(today?.minTempC).toBe(18.0); // min of 20.0, 21.0, 18.0
    expect(today?.maxTempC).toBe(24.0); // max of 23.0, 24.0, 19.0
    expect(today?.precipitationMm).toBe(1.2); // only the second entry carries rain
    // Headline condition comes from the entry closest to local noon (12:30 IST entry, distance 0).
    expect(today?.condition).toBe('CLEAR');

    expect(tomorrow?.date).toBe('2026-01-16');
    expect(tomorrow?.minTempC).toBe(22.0);
    expect(tomorrow?.maxTempC).toBe(26.0);
    expect(tomorrow?.precipitationMm).toBe(0.5);
    expect(tomorrow?.condition).toBe('CLOUDY');
  });

  it('synthesises daily[0] from the current reading when the forecast has no entry for today', async () => {
    // Every forecast entry is "tomorrow" local-date-wise; today has nothing.
    const forecast = forecastFixture({
      list: [
        {
          dt: 1768546800, // 2026-01-16 12:30 IST
          main: { temp: 25.0, temp_min: 22.0, temp_max: 26.0 },
          weather: [{ id: 804, main: 'Clouds', description: 'overcast clouds', icon: '04d' }],
          pop: 0.05,
        },
      ],
    });
    const current = currentFixture({ rain: { '1h': 0.3 } });
    stubFetchSuccess(current, forecast);
    const gateway = new OpenWeatherMapGateway(apiKey);

    const snapshot = await gateway.fetchSnapshot(coordinates);

    expect(snapshot.daily[0]?.date).toBe('2026-01-15');
    expect(snapshot.daily[0]?.minTempC).toBe(22.4);
    expect(snapshot.daily[0]?.maxTempC).toBe(22.4);
    expect(snapshot.daily[0]?.precipitationMm).toBe(0.3);
    expect(snapshot.daily[0]?.condition).toBe('CLEAR');
    expect(snapshot.daily[1]?.date).toBe('2026-01-16');
  });

  it('rejects with WEATHER_PROVIDER_ERROR and never calls fetch when the api key is empty', async () => {
    const gateway = new OpenWeatherMapGateway('');

    await expect(gateway.fetchSnapshot(coordinates)).rejects.toBeInstanceOf(AppError);
    try {
      await gateway.fetchSnapshot(coordinates);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).code).toBe('WEATHER_PROVIDER_ERROR');
    }

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('rejects with WEATHER_PROVIDER_ERROR on a non-OK HTTP response, without leaking the api key', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({}),
    } as unknown as Response);
    const gateway = new OpenWeatherMapGateway(apiKey);

    try {
      await gateway.fetchSnapshot(coordinates);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appError = err as AppError;
      expect(appError.code).toBe('WEATHER_PROVIDER_ERROR');
      expect(appError.detail ?? '').not.toContain(apiKey);
      expect(appError.message ?? '').not.toContain(apiKey);
    }
  });

  it('rejects with WEATHER_PROVIDER_ERROR when fetch rejects (network down)', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));
    const gateway = new OpenWeatherMapGateway(apiKey);

    try {
      await gateway.fetchSnapshot(coordinates);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).code).toBe('WEATHER_PROVIDER_ERROR');
    }
  });

  it('rejects with WEATHER_PROVIDER_ERROR on malformed JSON (missing weather[0])', async () => {
    stubFetchSuccess({ main: { temp: 1, feels_like: 1, humidity: 1 }, wind: { speed: 1 }, dt: 1, weather: [] }, forecastFixture());
    const gateway = new OpenWeatherMapGateway(apiKey);

    try {
      await gateway.fetchSnapshot(coordinates);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).code).toBe('WEATHER_PROVIDER_ERROR');
    }
  });
});
