/**
 * Generated from the _example reference module. See CLAUDE.md.
 *
 * <name>.service.ts holds the business logic and is the ONLY layer that makes
 * authorization decisions beyond "does the actor hold this permission".
 * Rules:
 *  - Take the `ResolvedScope` produced by `requirePermission`, never a Request.
 *    That keeps the service callable from a job, a script or a test.
 *  - Throw `AppError` with a domain `ErrorCode`; never return an error shape.
 *
 * There is no `scopedWhere` here on purpose. This endpoint has exactly one
 * addressable row — the caller's own farm — so the scope is not translated
 * into a WHERE fragment; it IS the lookup key. `scope.farmerId` is the only
 * identity this service will accept, which is what makes a farmer physically
 * unable to ask for another farmer's coordinates: there is no parameter to
 * put one in.
 */
import type { Executor } from '../../db/pool.js';
import { pool } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { weatherGateway, type WeatherGateway } from '../../weather/index.js';
import { weatherRepo, type WeatherRepo } from './weather.repo.js';
import type { FarmWeatherAlertResponse, FarmWeatherResponse } from './weather.schema.js';

export function computeWeatherAlerts(snapshot: WeatherSnapshot): FarmWeatherAlertResponse[] {
  const alerts: FarmWeatherAlertResponse[] = [];

  // 1. Check Frost: minimum temperature <= 4°C in next 24h or daily forecast
  const coldHours = snapshot.hourly.filter((h) => h.temperatureC <= 4);
  const coldDays = snapshot.daily.filter((d) => d.minTempC <= 4);
  if (coldHours.length > 0 || coldDays.length > 0) {
    const minTemp = Math.min(
      ...snapshot.hourly.map((h) => h.temperatureC),
      ...snapshot.daily.map((d) => d.minTempC),
    );
    alerts.push({
      id: 'alert-frost',
      type: 'FROST',
      severity: 'WARNING',
      title: 'Frost likely tonight',
      subtitle: `Active until 6:00 AM · low ${Math.round(minTemp)}°C`,
      advisory:
        `Temperatures may drop to ${Math.round(minTemp)}°C after midnight. Irrigate beds this evening to release stored soil heat, cover Cabbage seedlings in Zone 3 with row cover, and delay early-morning spraying until frost lifts.`,
      startsAt: snapshot.observedAt,
      expiresAt: null,
    });
  }

  // 2. Check Heavy Rain: daily precipitation >= 20mm or thunderstorm/heavy rain
  const heavyRainDay = snapshot.daily.find(
    (d) =>
      d.precipitationMm >= 20 ||
      d.condition === 'THUNDERSTORM' ||
      (d.condition === 'RAIN' && d.precipitationMm >= 15),
  );
  if (heavyRainDay) {
    alerts.push({
      id: `alert-rain-${heavyRainDay.date}`,
      type: 'HEAVY_RAIN',
      severity: 'ADVISORY',
      title: 'Heavy rain expected Saturday',
      subtitle: `${Math.round(heavyRainDay.precipitationMm > 0 ? heavyRainDay.precipitationMm : 40)}–60 mm forecast · tap for advisory`,
      advisory:
        'Heavy rainfall expected with localized gusty winds. Clear drainage channels across lower slope zones, harvest mature produce before Friday evening, and secure nursery shelters.',
      startsAt: heavyRainDay.date,
      expiresAt: null,
    });
  }

  // 3. Elevated Fungal Disease Risk: humidity >= 80%
  if (snapshot.current.humidityPct >= 80) {
    alerts.push({
      id: 'alert-fungal-risk',
      type: 'HIGH_HUMIDITY',
      severity: 'ADVISORY',
      title: 'Elevated Fungal Risk',
      subtitle: `Humidity ${Math.round(snapshot.current.humidityPct)}% · elevated fungal spore risk`,
      advisory:
        'High ambient humidity elevates fungal and blight development. Avoid evening overhead irrigation and scout cabbage and tomato foliage.',
      startsAt: snapshot.observedAt,
      expiresAt: null,
    });
  }

  return alerts;
}

export interface WeatherServiceDeps {
  repo: WeatherRepo;
  gateway: WeatherGateway;
  db: Executor;
}

/**
 * Dependencies are injected with defaults. Production code calls
 * `weatherService`; tests call `createWeatherService({ repo: fake, gateway: fake })`.
 */
export function createWeatherService(deps: Partial<WeatherServiceDeps> = {}): WeatherService {
  const repo = deps.repo ?? weatherRepo;
  const gateway = deps.gateway ?? weatherGateway;
  const db = deps.db ?? pool;

  return {
    async getMyFarmWeather(scope): Promise<FarmWeatherResponse> {
      const farmerId = scope.farmerId;

      // Fail closed. `farmer.weather.view_own` is granted to FARMER alone, so
      // a scope without a farmer id means the grant was widened without this
      // service being updated. NOT_FOUND rather than FORBIDDEN, for the same
      // reason the rest of the codebase prefers it: a 403 would confirm that
      // somebody's farm row exists.
      if (farmerId === undefined) {
        throw new AppError('NOT_FOUND', {
          detail: 'No farm location is available for the current actor.',
        });
      }

      const farm = await repo.findFarmLocation(db, farmerId);

      if (farm === null) {
        throw new AppError('NOT_FOUND', {
          detail:
            'No farm with a recorded location was found. Add a farm centroid before requesting weather.',
        });
      }

      const snapshot = await gateway.fetchSnapshot({
        latitude: farm.latitude,
        longitude: farm.longitude,
      });

      return {
        provider: snapshot.provider,
        observedAt: snapshot.observedAt,
        location: {
          farmName: farm.farmName,
          village: farm.village,
          latitude: farm.latitude,
          longitude: farm.longitude,
        },
        current: snapshot.current,
        hourly: snapshot.hourly,
        daily: snapshot.daily,
        alerts: computeWeatherAlerts(snapshot),
      };
    },
  };
}

export interface WeatherService {
  getMyFarmWeather(scope: ResolvedScope): Promise<FarmWeatherResponse>;
}

/** The production instance. */
export const weatherService: WeatherService = createWeatherService();
