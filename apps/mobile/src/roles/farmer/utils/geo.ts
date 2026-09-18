/**
 * Geodesic and coordinate utilities for Farmer Mobile FMB boundary mapping.
 */

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface PolygonMetrics {
  areaSquareMeters: number;
  areaAcres: number;
  areaHectares: number;
  centroid: LatLng;
}

const SQ_METERS_PER_ACRE = 4046.8564224;
const SQ_METERS_PER_HECTARE = 10000.0;
const EARTH_RADIUS_METERS = 6371000.0;

/**
 * Calculates polygon area (in acres and hectares) and centroid
 * from GeoJSON Polygon coordinates: [[lng, lat], [lng, lat], ...].
 */
export function calculatePolygonMetrics(ring: number[][]): PolygonMetrics {
  if (!Array.isArray(ring) || ring.length < 3) {
    return {
      areaSquareMeters: 0,
      areaAcres: 0,
      areaHectares: 0,
      centroid: { latitude: 0, longitude: 0 },
    };
  }

  const points = ring.filter(
    (pt) => Array.isArray(pt) && pt.length >= 2 && !isNaN(pt[0]!) && !isNaN(pt[1]!),
  );

  if (points.length < 3) {
    return {
      areaSquareMeters: 0,
      areaAcres: 0,
      areaHectares: 0,
      centroid: { latitude: 0, longitude: 0 },
    };
  }

  let sumLat = 0;
  let sumLng = 0;
  const isClosed = points[0]![0] === points[points.length - 1]![0] && points[0]![1] === points[points.length - 1]![1];
  const uniquePoints = isClosed ? points.slice(0, -1) : points;
  const count = uniquePoints.length;

  for (const pt of uniquePoints) {
    sumLng += pt[0]!;
    sumLat += pt[1]!;
  }

  const centroidLat = sumLat / count;
  const centroidLng = sumLng / count;

  const lat0Rad = (centroidLat * Math.PI) / 180.0;
  const metersPerDegLat = (Math.PI / 180.0) * EARTH_RADIUS_METERS;
  const metersPerDegLng = metersPerDegLat * Math.cos(lat0Rad);

  const projected: Array<[number, number]> = points.map((pt) => [
    (pt[0]! - centroidLng) * metersPerDegLng,
    (pt[1]! - centroidLat) * metersPerDegLat,
  ]);

  let areaSum = 0;
  for (let i = 0; i < projected.length - 1; i++) {
    const [x1, y1] = projected[i]!;
    const [x2, y2] = projected[i + 1]!;
    areaSum += x1 * y2 - x2 * y1;
  }
  const first = projected[0]!;
  const last = projected[projected.length - 1]!;
  if (first[0] !== last[0] || first[1] !== last[1]) {
    areaSum += last[0] * first[1] - first[0] * last[1];
  }

  const areaSquareMeters = Math.abs(areaSum) / 2.0;
  const areaAcres = Math.round((areaSquareMeters / SQ_METERS_PER_ACRE) * 100) / 100;
  const areaHectares = Math.round((areaSquareMeters / SQ_METERS_PER_HECTARE) * 100) / 100;

  return {
    areaSquareMeters: Math.round(areaSquareMeters * 100) / 100,
    areaAcres,
    areaHectares,
    centroid: {
      latitude: Math.round(centroidLat * 1000000) / 1000000,
      longitude: Math.round(centroidLng * 1000000) / 1000000,
    },
  };
}
