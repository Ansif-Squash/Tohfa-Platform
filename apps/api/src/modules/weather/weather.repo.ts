/**
 * Generated from the _example reference module. See CLAUDE.md.
 *
 * <name>.repo.ts is the ONLY place that writes SQL for this module.
 * Rules:
 *  - Every function takes an `Executor` first so the service can compose calls
 *    inside one transaction (`withTransaction`).
 *  - Values are always positional params (`$1`), never string-interpolated.
 *  - Rows are mapped to the domain shape HERE, so snake_case never escapes
 *    this file.
 *  - No authorization decisions live here — the repo applies the filter it is
 *    handed; deciding what that filter is, is the service's job.
 *
 * This is the first read path over `farms` in the API. Note the table comment
 * on `farms` in db/migrations/0003: nothing in it — name, village, centroid or
 * boundary — may appear in a CUSTOMER-facing response (BR-16). Everything this
 * repo returns is farm-identifying, so it is only ever reachable through a
 * permission the CUSTOMER role is denied.
 */
import type { Executor } from '../../db/pool.js';

/** Raw row shape as it comes out of Postgres. Never leaves this file. */
interface FarmLocationRow {
  id: string;
  name: string;
  village: string | null;
  centroid_lat: string | null;
  centroid_lng: string | null;
}

/** A farm that has a usable centroid. Latitude/longitude are plain numbers:
 * coordinates are not money, so the `Money` branded-string rule (root
 * CLAUDE.md §2.2) deliberately does not apply. */
export interface FarmLocation {
  farmId: string;
  farmName: string;
  village: string | null;
  latitude: number;
  longitude: number;
}

function toFarmLocation(row: FarmLocationRow): FarmLocation | null {
  // The `farms_centroid_pair_chk` constraint guarantees both columns are set
  // or both are null, but the SELECT already filters nulls out; this is belt
  // and braces so a future query change cannot produce NaN coordinates.
  if (row.centroid_lat === null || row.centroid_lng === null) return null;

  return {
    farmId: row.id,
    farmName: row.name,
    village: row.village,
    // centroid_lat/lng are NUMERIC, which pg hands us as strings on purpose.
    latitude: Number(row.centroid_lat),
    longitude: Number(row.centroid_lng),
  };
}

/**
 * The repository interface. The service depends on THIS, not on the concrete
 * implementation, which is what makes `weather.test.ts` able to run with a
 * plain object stub and no database.
 */
export interface WeatherRepo {
  /**
   * The farm whose coordinates stand in for "the farmer's location": their
   * primary farm when one is flagged, otherwise their oldest farm. Farms with
   * no recorded centroid are skipped rather than returned with null
   * coordinates — a farm we cannot locate is not a usable weather origin.
   */
  findFarmLocation(db: Executor, farmerId: string): Promise<FarmLocation | null>;
}

export const weatherRepo: WeatherRepo = {
  async findFarmLocation(db, farmerId): Promise<FarmLocation | null> {
    const result = await db.query<FarmLocationRow>(
      `SELECT f.id, f.name, f.village, f.centroid_lat, f.centroid_lng
         FROM farms f
        WHERE f.farmer_id = $1
          AND f.deleted_at IS NULL
          AND f.centroid_lat IS NOT NULL
          AND f.centroid_lng IS NOT NULL
        ORDER BY f.is_primary DESC, f.created_at ASC
        LIMIT 1`,
      [farmerId],
    );

    const row = result.rows[0];
    return row === undefined ? null : toFarmLocation(row);
  },
};
