/**
 * Generated from the _example reference module. See CLAUDE.md.
 *
 * Two layers of test, always:
 *
 *  1. SERVICE tests with a fake repo and a fake gateway. Fast, no I/O, and they
 *     are where the scope behaviour is actually asserted. The single most
 *     important assertion here is that the farmer id the repo is queried with
 *     comes from the resolved scope and from nowhere else — that is the whole
 *     security boundary of this endpoint.
 *
 *  2. ONE integration test against a real pool. It proves the SQL parses and
 *     the column names match the migrations. It soft-skips when there is no
 *     reachable database or the table has not been migrated yet, so the suite
 *     is green on a laptop with Docker stopped.
 *
 * Test names are descriptive rather than `BR-xx`-prefixed: weather is not a
 * rule in docs/rules.md, so inventing an id for it would be a lie the spec
 * drift checker would then have to be taught to ignore.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { AppError } from '../../http/problem.js';
import type { Executor } from '../../db/pool.js';
import type {
  WeatherCoordinates,
  WeatherGateway,
  WeatherSnapshot,
} from '../../weather/gateway.js';
import { createWeatherService } from './weather.service.js';
import type { FarmLocation, WeatherRepo } from './weather.repo.js';
import { aScope, databaseReady, describeIfDatabase, IDS } from '../../test/factories.js';

const OOTY: FarmLocation = {
  farmId: '11111111-1111-4111-8111-111111111111',
  farmName: 'Ithalar Upper Plot',
  village: 'Ithalar',
  latitude: 11.4102,
  longitude: 76.6952,
};

function aSnapshot(overrides: Partial<WeatherSnapshot> = {}): WeatherSnapshot {
  return {
    provider: 'openweathermap',
    observedAt: '2026-07-17T04:30:00.000Z',
    current: {
      temperatureC: 18.4,
      feelsLikeC: 18.9,
      condition: 'PARTLY_CLOUDY',
      humidityPct: 78,
      windKph: 9.2,
      precipitationChancePct: 20,
    },
    hourly: [{ at: '2026-07-17T04:30:00.000Z', temperatureC: 18.4, condition: 'PARTLY_CLOUDY' }],
    daily: [
      {
        date: '2026-07-17',
        minTempC: 13.1,
        maxTempC: 21.7,
        condition: 'PARTLY_CLOUDY',
        precipitationMm: 0,
      },
    ],
    ...overrides,
  };
}

interface RecordingRepo extends WeatherRepo {
  lastFarmerId: string | null;
}

/** Records the id the service looked the farm up by, so the test can assert
 * that it came from the scope. */
function fakeRepo(location: FarmLocation | null): RecordingRepo {
  const repo: RecordingRepo = {
    lastFarmerId: null,
    async findFarmLocation(_db: Executor, farmerId: string): Promise<FarmLocation | null> {
      repo.lastFarmerId = farmerId;
      return location;
    },
  };
  return repo;
}

interface RecordingGateway extends WeatherGateway {
  lastCoordinates: WeatherCoordinates | null;
}

function fakeGateway(
  snapshot: WeatherSnapshot | Error = aSnapshot(),
): RecordingGateway {
  const gateway: RecordingGateway = {
    provider: 'openweathermap',
    lastCoordinates: null,
    async fetchSnapshot(coordinates: WeatherCoordinates): Promise<WeatherSnapshot> {
      gateway.lastCoordinates = coordinates;
      if (snapshot instanceof Error) throw snapshot;
      return snapshot;
    },
  };
  return gateway;
}

const noopDb: Executor = {
  query: async () => {
    throw new Error('the fake repo should never reach the database');
  },
};

const farmerScope = aScope({
  level: ScopeLevel.OWN,
  permission: 'farmer.weather.view_own',
  roleCode: RoleCode.FARMER,
  farmerId: IDS.farmer,
  userId: IDS.userFarmer,
});

describe('weatherService.getMyFarmWeather', () => {
  it('looks the farm up by the farmer id on the resolved scope, never by an argument', async () => {
    const repo = fakeRepo(OOTY);
    const service = createWeatherService({ repo, gateway: fakeGateway(), db: noopDb });

    await service.getMyFarmWeather(farmerScope);

    // The service signature takes no id at all; this pins that the only id it
    // can possibly use is the one requirePermission resolved.
    expect(repo.lastFarmerId).toBe(IDS.farmer);
  });

  it('asks the gateway for the farm centroid, not for a client-supplied point', async () => {
    const gateway = fakeGateway();
    const service = createWeatherService({ repo: fakeRepo(OOTY), gateway, db: noopDb });

    await service.getMyFarmWeather(farmerScope);

    expect(gateway.lastCoordinates).toEqual({ latitude: 11.4102, longitude: 76.6952 });
  });

  it('returns the gateway snapshot merged with the farm location', async () => {
    const service = createWeatherService({
      repo: fakeRepo(OOTY),
      gateway: fakeGateway(),
      db: noopDb,
    });

    const result = await service.getMyFarmWeather(farmerScope);

    expect(result.provider).toBe('openweathermap');
    expect(result.observedAt).toBe('2026-07-17T04:30:00.000Z');
    expect(result.location).toEqual({
      farmName: 'Ithalar Upper Plot',
      village: 'Ithalar',
      latitude: 11.4102,
      longitude: 76.6952,
    });
    expect(result.current.condition).toBe('PARTLY_CLOUDY');
    expect(result.hourly).toHaveLength(1);
    expect(result.daily[0]?.date).toBe('2026-07-17');
  });

  it('carries a null village through rather than substituting the farm name', async () => {
    const service = createWeatherService({
      repo: fakeRepo({ ...OOTY, village: null }),
      gateway: fakeGateway(),
      db: noopDb,
    });

    const result = await service.getMyFarmWeather(farmerScope);

    // The client decides what to show when there is no village; the API does
    // not quietly invent one.
    expect(result.location.village).toBeNull();
  });

  it('raises NOT_FOUND when the farmer has no farm with a recorded centroid', async () => {
    const gateway = fakeGateway();
    const service = createWeatherService({ repo: fakeRepo(null), gateway, db: noopDb });

    const error = await service.getMyFarmWeather(farmerScope).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe('NOT_FOUND');
    expect((error as AppError).status).toBe(404);
    // No coordinates means nothing to ask the provider about: we must not burn
    // an upstream API call on a farm we cannot locate.
    expect(gateway.lastCoordinates).toBeNull();
  });

  it('fails closed with NOT_FOUND when the scope carries no farmer id', async () => {
    const repo = fakeRepo(OOTY);
    const service = createWeatherService({ repo, gateway: fakeGateway(), db: noopDb });

    // A non-farmer scope should be impossible — the grant is FARMER-only — but
    // if the grant is ever widened this must not fall through to somebody's
    // farm. NOT_FOUND, not FORBIDDEN: a 403 would confirm a row exists.
    const error = await service
      .getMyFarmWeather(aScope({ permission: 'farmer.weather.view_own' }))
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe('NOT_FOUND');
    expect(repo.lastFarmerId).toBeNull();
  });

  it('propagates a provider failure as-is rather than masking it as empty weather', async () => {
    const failure = new AppError('WEATHER_PROVIDER_ERROR', {
      detail: 'OpenWeatherMap request failed (503).',
    });
    const service = createWeatherService({
      repo: fakeRepo(OOTY),
      gateway: fakeGateway(failure),
      db: noopDb,
    });

    const error = await service.getMyFarmWeather(farmerScope).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe('WEATHER_PROVIDER_ERROR');
    expect((error as AppError).status).toBe(502);
  });
});

describeIfDatabase('weatherService (integration)', () => {
  let ready = false;

  beforeAll(async () => {
    ready = await databaseReady('farms');
    if (!ready) {
      console.warn(
        '[skip] no reachable `farms` table — run `docker compose up -d && pnpm db:migrate`',
      );
    }
  });

  afterAll(async () => {
    if (!ready) return;
    const { closePool } = await import('../../db/pool.js');
    await closePool();
  });

  it('runs the real farm-location query against Postgres', async () => {
    if (!ready) return;

    const { pool } = await import('../../db/pool.js');
    const { weatherRepo } = await import('./weather.repo.js');

    // A farmer id that does not exist is enough to prove the SQL parses and
    // every column name matches the migration; it must come back as null
    // rather than throwing.
    const location = await weatherRepo.findFarmLocation(
      pool,
      '00000000-0000-4000-8000-000000000000',
    );

    expect(location).toBeNull();
  });
});
