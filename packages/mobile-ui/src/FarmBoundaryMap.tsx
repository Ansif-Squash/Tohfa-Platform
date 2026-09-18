import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Feature, Point } from 'geojson';
import { useTheme } from './theme';

let Mapbox: any = null;
let Camera: any = null;
let FillLayer: any = null;
let LineLayer: any = null;
let locationManager: any = null;
let MapView: any = null;
let PointAnnotation: any = null;
let requestAndroidLocationPermissions: any = null;
let ShapeSource: any = null;
export type MapboxLocation = any;

let isMapboxAvailable = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rnMapbox = require('@rnmapbox/maps');
  Mapbox = rnMapbox.default || rnMapbox;
  Camera = rnMapbox.Camera;
  FillLayer = rnMapbox.FillLayer;
  LineLayer = rnMapbox.LineLayer;
  locationManager = rnMapbox.locationManager;
  MapView = rnMapbox.MapView;
  PointAnnotation = rnMapbox.PointAnnotation;
  requestAndroidLocationPermissions = rnMapbox.requestAndroidLocationPermissions;
  ShapeSource = rnMapbox.ShapeSource;
  if (Mapbox && typeof Mapbox.setAccessToken === 'function') {
    isMapboxAvailable = true;
  }
} catch {
  isMapboxAvailable = false;
}

/**
 * PLACEHOLDER — Mapbox access token.
 *
 * TOHFA does not have a Mapbox account yet, so this is an obviously-fake
 * value (same convention as `GOOGLE_WEB_CLIENT_ID` in
 * apps/mobile/src/roles/farmer/native/socialSignIn.ts). Neither the map tiles
 * nor the geocoding search below can work until a human replaces this with a
 * real Mapbox public token (`pk.…`) from https://account.mapbox.com/access-tokens/.
 * That is a known follow-up, not a bug in this component.
 *
 * It lives here, next to the component, rather than under a farmer-specific
 * `native/` config file: unlike the Google/Facebook OAuth client IDs (which
 * are genuinely per-role, farmer-only login providers), a Mapbox token is not
 * tied to any one role — the same token would back a future customer
 * delivery map or admin farm-audit map just as well. This component is the
 * one place in the codebase that talks to Mapbox, so the token lives beside
 * it instead of being duplicated per role.
 */
const MAPBOX_ACCESS_TOKEN =
  (typeof process !== 'undefined' && process.env && process.env.MAPBOX_ACCESS_TOKEN) || '';

let mapboxConfigured = false;

/** Idempotent — safe to call from every mount of every map on screen. */
function ensureMapboxConfigured(): void {
  if (!MAPBOX_ACCESS_TOKEN || mapboxConfigured || !isMapboxAvailable) return;
  try {
    Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);
    mapboxConfigured = true;
  } catch {
    isMapboxAvailable = false;
  }
}

/** [longitude, latitude] — the GeoJSON coordinate order, not [lat, lng]. */
export type LngLat = [number, number];

export type FarmBoundaryMapMode = 'view' | 'draw' | 'edit';

export interface FarmBoundaryMapHandle {
  /** Enters draw mode. Taps on the map append a new vertex. No-op if `readOnly`. */
  startDrawing: () => void;
  /** Enters edit mode. Existing vertices become drag handles. No-op if `readOnly` or fewer than 3 vertices. */
  startEditing: () => void;
  /** Returns to view mode (stops drawing/editing). */
  finish: () => void;
  /** Removes the most recently added vertex. */
  undo: () => void;
  /** Removes every vertex, back to an empty boundary. */
  clear: () => void;
  /** Re-centers the camera on the device's current GPS position. */
  locateMe: () => Promise<void>;
  /**
   * Geocodes free-text via Mapbox's own Geocoding API and recenters the
   * camera on the first match. Resolves `true` if a match was found.
   */
  search: (query: string) => Promise<boolean>;
}

export interface FarmBoundaryMapProps {
  /** [lng, lat] to center on first render, or `null` to use the device's GPS location. */
  initialCenter?: LngLat | null;
  /** GeoJSON ring — [[lng, lat], ...] — or `null`/empty to start a fresh boundary. */
  initialPolygon?: LngLat[] | null;
  /** Called with the current ring every time a vertex is added, dragged, undone, or cleared. */
  onPolygonChange: (coordinates: LngLat[]) => void;
  /** Renders the boundary and satellite map with no draw/edit interaction and no search bar. */
  readOnly?: boolean;
  /** Placeholder text for the built-in place-name search bar. Caller supplies this via `t()`. */
  searchPlaceholder: string;
  /** Fires whenever draw/edit/view mode changes, so the caller's own buttons can reflect it. */
  onModeChange?: (mode: FarmBoundaryMapMode) => void;
  testID?: string;
}

// Nilgiris — used only as a last-resort camera center when the caller passes
// no `initialCenter` AND device GPS is unavailable/denied. Not a business
// threshold, just a sane default so the map never renders centered on
// [0, 0] (Null Island).
const FALLBACK_CENTER: LngLat = [76.6932, 11.4064];
const DEFAULT_ZOOM = 17;

function ringsEqual(a: LngLat, b: LngLat): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

/** GeoJSON polygons must close (first point === last point); vertex state below is kept open. */
function closeRing(points: LngLat[]): LngLat[] {
  if (points.length < 3) return points;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return ringsEqual(first, last) ? points : [...points, first];
}

function openRing(points: LngLat[]): LngLat[] {
  if (points.length < 2) return points;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return ringsEqual(first, last) ? points.slice(0, -1) : points;
}

/**
 * Real, GPS-grounded satellite map + polygon boundary editor for Farmer
 * Mobile's Farm Location step (registration Step 3) and FMB Sketch screen.
 * Replaces the fake hand-drawn `react-native-svg` canvases that used to
 * stand in for both.
 *
 * Deliberately lives in @tohfa/mobile-ui rather than under
 * `roles/farmer/components/` — apps/mobile/CLAUDE.md forbids a role-local
 * `components/` directory (enforced by
 * src/tests/cross_role_import_guard.test.ts) precisely so shared UI comes
 * from this package. Farm-boundary mapping is farmer-authored today, but the
 * component itself is generic map+polygon UI with no farmer-only data or
 * logic baked in (no farmerId, no farm name) — it only ever sees the
 * coordinates it's given.
 */
export const FarmBoundaryMap = forwardRef<FarmBoundaryMapHandle, FarmBoundaryMapProps>(
  function FarmBoundaryMap(
    {
      initialCenter = null,
      initialPolygon = null,
      onPolygonChange,
      readOnly = false,
      searchPlaceholder,
      onModeChange,
      testID,
    },
    ref,
  ) {
    ensureMapboxConfigured();
    const theme = useTheme();
    const cameraRef = useRef<any>(null);

    const [vertices, setVertices] = useState<LngLat[]>(() =>
      initialPolygon && initialPolygon.length >= 3 ? openRing(initialPolygon) : [],
    );
    const [mode, setModeState] = useState<FarmBoundaryMapMode>('view');
    const [initialCameraCenter] = useState<LngLat>(initialCenter ?? FALLBACK_CENTER);
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);

    const setMode = useCallback(
      (next: FarmBoundaryMapMode) => {
        setModeState(next);
        onModeChange?.(next);
      },
      [onModeChange],
    );

    const emit = useCallback(
      (next: LngLat[]) => {
        setVertices(next);
        onPolygonChange(next.length >= 3 ? closeRing(next) : next);
      },
      [onPolygonChange],
    );

    // No `initialCenter` supplied -> best-effort device GPS fix on mount.
    // Falls back to FALLBACK_CENTER (already the initial camera position)
    // on permission denial or an unavailable location, silently — this is a
    // convenience recenter, not a required capability.
    useEffect(() => {
      if (initialCenter) return;
      let cancelled = false;
      (async () => {
        try {
          if (Platform.OS === 'android') {
            const granted = await requestAndroidLocationPermissions();
            if (!granted || cancelled) return;
          }
          locationManager.start();
          const location = await locationManager.getLastKnownLocation();
          if (!cancelled && location?.coords) {
            cameraRef.current?.setCamera({
              centerCoordinate: [location.coords.longitude, location.coords.latitude],
              zoomLevel: DEFAULT_ZOOM,
              animationDuration: 0,
            });
          }
        } catch {
          // Best-effort only — map stays centered on FALLBACK_CENTER.
        }
      })();
      return () => {
        cancelled = true;
      };
      // Only ever runs once per mount — `initialCenter` is treated as the
      // value at mount time, matching the "or null to use device GPS" prop contract.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleMapPress = useCallback(
      (feature: Feature) => {
        if (readOnly || mode !== 'draw') return;
        if (feature.geometry.type !== 'Point') return;
        const [lng, lat] = (feature.geometry as Point).coordinates as LngLat;
        emit([...vertices, [lng, lat]]);
      },
      [emit, mode, readOnly, vertices],
    );

    const handleVertexDragEnd = useCallback(
      (index: number, feature: Feature) => {
        if (feature.geometry.type !== 'Point') return;
        const [lng, lat] = (feature.geometry as Point).coordinates as LngLat;
        const next = vertices.slice();
        next[index] = [lng, lat];
        emit(next);
      },
      [emit, vertices],
    );

    const undo = useCallback(() => {
      emit(vertices.slice(0, -1));
    }, [emit, vertices]);

    const clear = useCallback(() => {
      emit([]);
    }, [emit]);

    const locateMe = useCallback(async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await requestAndroidLocationPermissions();
          if (!granted) return;
        }
        locationManager.start();
        const location: MapboxLocation | null = await locationManager.getLastKnownLocation();
        if (location?.coords) {
          cameraRef.current?.setCamera({
            centerCoordinate: [location.coords.longitude, location.coords.latitude],
            zoomLevel: DEFAULT_ZOOM,
            animationDuration: 600,
          });
        }
      } catch {
        // Best-effort — leave the camera where it was.
      }
    }, []);

    const runSearch = useCallback(
      async (rawQuery: string): Promise<boolean> => {
        const trimmed = rawQuery.trim();
        if (!trimmed) return false;
        setSearching(true);
        try {
          const url =
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json` +
            `?access_token=${encodeURIComponent(MAPBOX_ACCESS_TOKEN)}&limit=1`;
          const response = await fetch(url);
          if (!response.ok) return false;
          const body = (await response.json()) as { features?: Array<{ center?: number[] }> };
          const center = body.features?.[0]?.center;
          if (Array.isArray(center) && center.length === 2) {
            const [lng, lat] = center as LngLat;
            cameraRef.current?.flyTo([lng, lat], 800);
            return true;
          }
          return false;
        } catch {
          return false;
        } finally {
          setSearching(false);
        }
      },
      [],
    );

    useImperativeHandle(
      ref,
      () => ({
        startDrawing: () => {
          if (readOnly) return;
          setMode('draw');
        },
        startEditing: () => {
          if (readOnly || vertices.length < 3) return;
          setMode('edit');
        },
        finish: () => setMode('view'),
        undo,
        clear,
        locateMe,
        search: runSearch,
      }),
      [clear, locateMe, readOnly, runSearch, setMode, undo, vertices.length],
    );

    const boundaryShape = useMemo(() => {
      if (vertices.length < 3) return null;
      return {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'Polygon' as const,
          coordinates: [closeRing(vertices)],
        },
      };
    }, [vertices]);

    if (!isMapboxAvailable) {
      return (
        <View style={[styles.container, styles.fallbackContainer]} testID={testID}>
          <View style={styles.fallbackBox}>
            <Text style={styles.fallbackTitle}>Interactive Farm Map</Text>
            <Text style={styles.fallbackText}>
              Satellite boundary marking requires Mapbox native SDK linking in the current build.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container} testID={testID}>
        <MapView
          style={styles.map}
          styleURL={Mapbox.StyleURL.SatelliteStreet}
          onPress={handleMapPress}
          scaleBarEnabled={false}
          testID={testID ? `${testID}.map` : undefined}
        >
          <Camera
            ref={cameraRef}
            defaultSettings={{ centerCoordinate: initialCameraCenter, zoomLevel: DEFAULT_ZOOM }}
          />

          {boundaryShape ? (
            <ShapeSource id="farmBoundarySource" shape={boundaryShape}>
              <FillLayer
                id="farmBoundaryFill"
                style={{ fillColor: theme.colors.primary, fillOpacity: 0.18 }}
              />
              <LineLayer
                id="farmBoundaryLine"
                style={{
                  lineColor: theme.colors.primary,
                  lineWidth: 3,
                  lineJoin: 'round',
                  lineCap: 'round',
                }}
              />
            </ShapeSource>
          ) : null}

          {/* Draggable vertices in edit mode */}
          {mode === 'edit'
            ? vertices.map((vertex, index) => (
                <PointAnnotation
                  key={`vertex-${index}`}
                  id={`vertex-${index}`}
                  coordinate={vertex}
                  draggable
                  onDragEnd={(payload: Feature<Point>) => handleVertexDragEnd(index, payload)}
                >
                  <View
                    style={[
                      styles.vertexHandle,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.primary,
                      },
                    ]}
                  />
                </PointAnnotation>
              ))
            : null}
        </MapView>

        {/* Place-name geocoding search bar */}
        {!readOnly ? (
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.md,
                paddingHorizontal: theme.spacing.sm,
              },
            ]}
          >
            <TextInput
              style={[
                styles.searchInput,
                {
                  color: theme.colors.onSurface,
                  fontSize: theme.typography.bodySmall,
                },
              ]}
              placeholder={searchPlaceholder}
              placeholderTextColor={theme.colors.onSurfaceVariant ?? theme.colors.textMuted ?? theme.colors.onSurface}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => {
                void runSearch(query);
              }}
              returnKeyType="search"
              accessibilityLabel={searchPlaceholder}
              testID={testID ? `${testID}.search` : undefined}
            />
            {searching ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
          </View>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  vertexHandle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
  },
  searchBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    height: '100%',
  },
  fallbackContainer: {
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fallbackBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  fallbackTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  fallbackText: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
