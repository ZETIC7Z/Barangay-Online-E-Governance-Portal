import React, { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  CheckCircle2,
  Compass,
  Navigation,
  Layers,
  Building2,
  Home,
  Radio,
  AlertTriangle,
  ExternalLink,
  Route,
  Clock,
  Footprints,
  Car,
  Bike,
  TrainFront,
  CornerUpRight,
  LocateFixed,
  X,
} from 'lucide-react';

export interface PinnedHouseLocation {
  lat: number;
  lng: number;
  lotLabel: string;
  street: string;
  purok: string;
  confirmedAt: string;
}

export type TravelMode = 'best' | 'car' | 'motorcycle' | 'transit' | 'walk' | 'bike';

// Verified KML Coordinates of Barangay Matatag Hall (from user's Google Earth KML: 122.1377029053544, 6.659999940368367)
export const BRGY_MATATAG_HALL_COORDS = {
  lat: 6.6599999,
  lng: 122.1377029,
};

// Exact 4-Corner Barangay Matatag Jurisdiction Boundary Guide Coordinates
export const BRGY_MATATAG_BOUNDARY_POLYGON: [number, number][] = [
  [6.6623285, 122.1388354], // North Corner
  [6.6600656, 122.1403389], // East Corner
  [6.6582842, 122.1377027], // South Corner
  [6.6603103, 122.1363619], // West Corner
];

// Outer world ring used to create an inverted spotlight mask polygon (dark outside Barangay Matatag, crystal-clear inside)
const WORLD_OUTER_RING: [number, number][] = [
  [-85, -180],
  [-85, 180],
  [85, 180],
  [85, -180],
];

// Centroid of Barangay Matatag Polygon for full boundary framing
export const BRGY_MATATAG_POLYGON_CENTER = {
  lat: 6.660247,
  lng: 122.13831,
};

// Default Lamitan City Proper approach point (Lamitan City Hall on Basilan Circumferential Rd — 1.0 km to Brgy. Matatag Hall)
const DEFAULT_LAMITAN_APPROACH_ORIGIN = {
  lat: 6.657129,
  lng: 122.1448068,
  label: 'Lamitan City Hall (Basilan Circumferential Rd)',
};

// Ray-casting point-in-polygon check so users cannot click outside Barangay Matatag limits when pinpointing their house
export function isPointInsideMatatagBoundary(lat: number, lng: number): boolean {
  const poly = BRGY_MATATAG_BOUNDARY_POLYGON;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const yi = poly[i][0];
    const xi = poly[i][1];
    const yj = poly[j][0];
    const xj = poly[j][1];

    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Haversine distance in meters
function computeDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistanceLabel(meters: number): string {
  if (meters >= 950) {
    const km = meters / 1000;
    return `${km % 1 === 0 ? km.toFixed(0) : km.toFixed(1)} km`;
  }
  return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
}

// Authentic Barangay Matatag Street & Purok Zones inside the exact Barangay Matatag boundary
export const MATATAG_ZONES_GIS = [
  {
    id: 'ZONE-P1',
    street: 'Aguinaldo Street (Brgy. Hall Zone)',
    purok: 'Purok 1 - Aguinaldo Central',
    lat: 6.6600,
    lng: 122.1377,
  },
  {
    id: 'ZONE-P2',
    street: 'Quezon Boulevard',
    purok: 'Purok 2 - Quezon Blvd Commercial',
    lat: 6.6612,
    lng: 122.1384,
  },
  {
    id: 'ZONE-P3',
    street: 'P. Cuevas Street',
    purok: 'Purok 3 - P. Cuevas Academic Zone',
    lat: 6.6594,
    lng: 122.1378,
  },
  {
    id: 'ZONE-P4',
    street: 'Patikul Street',
    purok: 'Purok 4 - Patikul Interior Compound',
    lat: 6.6604,
    lng: 122.1371,
  },
  {
    id: 'ZONE-P5',
    street: 'Rizal Avenue',
    purok: 'Purok 5 - Kalun Triangle / North Matatag',
    lat: 6.6616,
    lng: 122.1388,
  },
  {
    id: 'ZONE-P6',
    street: 'Flores Street',
    purok: 'Purok 6 - East Matatag Sector',
    lat: 6.6602,
    lng: 122.1394,
  },
  {
    id: 'ZONE-P7',
    street: 'Idris Drive',
    purok: 'Purok 7 - South Matatag Sector',
    lat: 6.6589,
    lng: 122.1381,
  },
];

// Exported for backwards-compatibility
export const MATATAG_HOUSES_GIS = MATATAG_ZONES_GIS.map((z) => ({
  ...z,
  lotLabel: `${z.street} (${z.purok.split(' - ')[0]})`,
}));

function inferMatatagZoneFromCoords(lat: number, lng: number) {
  let closest = MATATAG_ZONES_GIS[0];
  let minDist = Infinity;
  for (const z of MATATAG_ZONES_GIS) {
    const d = Math.hypot(z.lat - lat, z.lng - lng);
    if (d < minDist) {
      minDist = d;
      closest = z;
    }
  }
  return {
    id: `PIN-${Date.now()}`,
    lotLabel: `Pinpointed Residence • ${closest.street}, Barangay Matatag`,
    street: closest.street,
    purok: closest.purok,
    lat,
    lng,
  };
}

interface RouteOptionData {
  coords: [number, number][];
  distanceMeters: number;
  viaSummary: string;
}

interface ModeDurations {
  best: number;
  car: number;
  motorcycle: number;
  transit: number;
  walk: number;
  bike: number;
}

interface LiveRouteStats {
  primaryRoute: RouteOptionData;
  alternateRoute: RouteOptionData | null;
  selectedRouteIndex: 0 | 1;
  durations: ModeDurations;
  altDurations: ModeDurations | null;
  originLabel: string;
  userLat: number;
  userLng: number;
  isLiveGps: boolean;
}

function computeModeDurations(distanceMeters: number): ModeDurations {
  // Calibrated to match Google Maps urban speeds in Lamitan City (1.0 km => 4 min car/moto, 14 min walk, 6 min bike)
  const car = Math.max(1, Math.round(distanceMeters / 260));
  const motorcycle = Math.max(1, Math.round(distanceMeters / 275));
  const transit = Math.max(2, Math.round(distanceMeters / 220));
  const walk = Math.max(1, Math.round(distanceMeters / 72));
  const bike = Math.max(1, Math.round(distanceMeters / 175));
  const best = Math.min(car, motorcycle);
  return { best, car, motorcycle, transit, walk, bike };
}

function getModeSvgHtml(mode: TravelMode): string {
  switch (mode) {
    case 'walk':
      return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"/><path d="m10 22 1-5-3-3 1-5 4 2 2 3"/><path d="m14 14 2 8"/><path d="m8 12-2 4"/></svg>`;
    case 'bike':
      return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>`;
    case 'car':
      return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`;
    case 'transit':
      return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h.01"/><path d="M16 15h.01"/></svg>`;
    case 'motorcycle':
    case 'best':
    default:
      return `<svg width="16" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h3l2 5"/><path d="M9 17.5h5l2-6H9l-3 3"/><path d="M12 6l2 5"/></svg>`;
  }
}

export const SatelliteMapPinpointer: React.FC<{
  mode: 'signup' | 'admin' | 'public';
  selectedLocation?: PinnedHouseLocation | null;
  onConfirmLocation?: (loc: PinnedHouseLocation) => void;
  residents?: any[];
  emergencies?: any[];
}> = ({
  mode,
  selectedLocation,
  onConfirmLocation,
  residents = [],
  emergencies = [],
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const maskLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Default to 3D Google Earth / Satellite Perspective View
  const [is3DTilt, setIs3DTilt] = useState(true);
  const [pendingCandidate, setPendingCandidate] = useState<PinnedHouseLocation | null>(null);
  const [confirmedPin, setConfirmedPin] = useState<PinnedHouseLocation | null>(
    selectedLocation || null
  );
  const [outsideWarning, setOutsideWarning] = useState<string | null>(null);
  const [directionsActive, setDirectionsActive] = useState(false);
  const [travelMode, setTravelMode] = useState<TravelMode>('motorcycle');
  const [routeStats, setRouteStats] = useState<LiveRouteStats | null>(null);
  const directionsActiveRef = useRef(false);

  useEffect(() => {
    directionsActiveRef.current = directionsActive;
  }, [directionsActive]);

  const googleMapsTravelMode =
    travelMode === 'walk'
      ? 'walking'
      : travelMode === 'bike'
        ? 'bicycling'
        : travelMode === 'transit'
          ? 'transit'
          : travelMode === 'motorcycle'
            ? 'two-wheeler'
            : 'driving';

  const googleMapsDirectionsUrl = routeStats
    ? `https://www.google.com/maps/dir/?api=1&origin=${routeStats.userLat},${routeStats.userLng}&destination=${BRGY_MATATAG_HALL_COORDS.lat},${BRGY_MATATAG_HALL_COORDS.lng}&travelmode=${googleMapsTravelMode}`
    : `https://www.google.com/maps/dir/?api=1&destination=${BRGY_MATATAG_HALL_COORDS.lat},${BRGY_MATATAG_HALL_COORDS.lng}&travelmode=${googleMapsTravelMode}`;

  // Render the Google Maps-style polylines, floating ETA callout bubbles, and live user GPS marker
  const renderRoutesOnMap = useCallback(
    (stats: LiveRouteStats, activeMode: TravelMode) => {
      const routeLayer = routeLayerRef.current;
      if (!routeLayer) return;
      routeLayer.clearLayers();

      const activeIdx = stats.selectedRouteIndex;
      const primary = stats.primaryRoute;
      const alt = stats.alternateRoute;

      const drawRoutePolyline = (
        route: RouteOptionData,
        isSelected: boolean,
        routeIdx: 0 | 1
      ) => {
        if (!route.coords.length) return;

        if (!isSelected) {
          // Alternate unselected route (matches Google Maps lavender-blue alternate line with dark border casing)
          L.polyline(route.coords, {
            color: '#1e3a8a',
            weight: 9,
            opacity: 0.75,
            lineCap: 'round',
            lineJoin: 'round',
          })
            .on('click', () => {
              setRouteStats((prev) =>
                prev ? { ...prev, selectedRouteIndex: routeIdx } : prev
              );
            })
            .addTo(routeLayer);

          L.polyline(route.coords, {
            color: '#93c5fd',
            weight: 5.5,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
          })
            .on('click', () => {
              setRouteStats((prev) =>
                prev ? { ...prev, selectedRouteIndex: routeIdx } : prev
              );
            })
            .addTo(routeLayer);
        } else {
          // Selected primary route (matches Google Maps deep royal-blue route with navy casing)
          L.polyline(route.coords, {
            color: '#172554',
            weight: 11,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(routeLayer);

          L.polyline(route.coords, {
            color: '#2563eb',
            weight: 7,
            opacity: 1,
            dashArray: activeMode === 'walk' ? '2, 10' : undefined,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(routeLayer);
        }
      };

      // Draw unselected route first so selected route sits on top
      if (alt) {
        if (activeIdx === 0) {
          drawRoutePolyline(alt, false, 1);
          drawRoutePolyline(primary, true, 0);
        } else {
          drawRoutePolyline(primary, false, 0);
          drawRoutePolyline(alt, true, 1);
        }
      } else {
        drawRoutePolyline(primary, true, 0);
      }

      // Helper to place Google Maps white floating ETA + km callout card on a route
      const addRouteCalloutBadge = (
        route: RouteOptionData,
        durations: ModeDurations,
        isSelected: boolean,
        routeIdx: 0 | 1,
        positionRatio: number
      ) => {
        if (route.coords.length < 2) return;
        const idx = Math.min(
          route.coords.length - 1,
          Math.max(1, Math.floor(route.coords.length * positionRatio))
        );
        const [lat, lng] = route.coords[idx];
        const mins = durations[activeMode];
        const distLabel = formatDistanceLabel(route.distanceMeters);
        const iconSvg = getModeSvgHtml(activeMode);

        const badgeIcon = L.divIcon({
          className: 'gmaps-route-callout-badge',
          html: `
            <div
              onclick="window.__selectMatatagRoute && window.__selectMatatagRoute(${routeIdx})"
              style="
                position:relative;
                transform:translate(-50%, -115%);
                background:${isSelected ? '#ffffff' : 'rgba(255,255,255,0.93)'};
                color:#0f172a;
                border:${isSelected ? '2px solid #1d4ed8' : '1.5px solid #64748b'};
                border-radius:8px;
                padding:4px 9px;
                box-shadow:0 4px 14px rgba(0,0,0,0.45);
                cursor:pointer;
                white-space:nowrap;
                font-family:'Plus Jakarta Sans',system-ui,sans-serif;
                user-select:none;
              "
            >
              <div style="display:flex;align-items:center;gap:5px;line-height:1.15;">
                ${iconSvg}
                <span style="font-size:12px;font-weight:800;color:${isSelected ? '#0f172a' : '#334155'};">${mins} min</span>
              </div>
              <div style="font-size:10.5px;font-weight:600;color:#64748b;margin-top:1px;">
                ${distLabel}
              </div>
              <div style="
                position:absolute;
                left:14px;
                bottom:-7px;
                width:0;
                height:0;
                border-left:6px solid transparent;
                border-right:6px solid transparent;
                border-top:7px solid ${isSelected ? '#ffffff' : 'rgba(255,255,255,0.93)'};
                filter:drop-shadow(0 2px 1px rgba(0,0,0,0.25));
              "></div>
            </div>
          `,
          iconSize: [74, 42],
        });

        L.marker([lat, lng], { icon: badgeIcon, zIndexOffset: isSelected ? 900 : 700 }).addTo(
          routeLayer
        );
      };

      addRouteCalloutBadge(primary, stats.durations, activeIdx === 0, 0, 0.46);
      if (alt && stats.altDurations) {
        addRouteCalloutBadge(alt, stats.altDurations, activeIdx === 1, 1, 0.36);
      }

      // Origin / Live User GPS Marker (Google Maps style origin beacon + label)
      const originIcon = L.divIcon({
        className: 'gmaps-user-origin-marker',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);">
            <div style="position:relative;width:22px;height:22px;display:flex;align-items:center;justify-content:center;">
              <span style="position:absolute;inset:-7px;border-radius:999px;background:rgba(37,99,235,0.32);animation:ping 1.6s cubic-bezier(0,0,0.2,1) infinite;"></span>
              <span style="position:relative;width:16px;height:16px;border-radius:999px;background:#ffffff;border:4px solid #1e293b;box-shadow:0 2px 10px rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;">
                <span style="width:6px;height:6px;border-radius:999px;background:#2563eb;"></span>
              </span>
            </div>
            <span style="margin-top:4px;background:rgba(15,23,42,0.92);color:#ffffff !important;border:1.5px solid #60a5fa;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:800;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,0.5);">
              📍 ${stats.isLiveGps ? 'Your Live Location' : stats.originLabel}
            </span>
          </div>
        `,
        iconSize: [28, 28],
      });

      L.marker([stats.userLat, stats.userLng], {
        icon: originIcon,
        zIndexOffset: 950,
      }).addTo(routeLayer);
    },
    []
  );

  // Re-render route polylines & callout badges whenever routeStats or travelMode changes
  useEffect(() => {
    if (directionsActive && routeStats) {
      renderRoutesOnMap(routeStats, travelMode);
    }
  }, [directionsActive, routeStats, travelMode, renderRoutesOnMap]);

  // Fetch real primary + alternate road geometry from OSRM between user's live coordinates and Barangay Matatag Hall
  const updateLiveRouteOnMap = useCallback(
    async (userLat: number, userLng: number, originLabel: string, isLiveGps: boolean) => {
      const destLat = BRGY_MATATAG_HALL_COORDS.lat;
      const destLng = BRGY_MATATAG_HALL_COORDS.lng;

      const straightDist = computeDistanceMeters(userLat, userLng, destLat, destLng);

      // Default road-aligned fallback paths
      let primaryRoute: RouteOptionData = {
        coords: [
          [userLat, userLng],
          [(userLat + destLat) / 2 + 0.0007, (userLng + destLng) / 2 - 0.0003],
          [destLat, destLng],
        ],
        distanceMeters: Math.round(straightDist * 1.25),
        viaSummary: 'Basilan Circumferential Rd & Aguinaldo St.',
      };

      let alternateRoute: RouteOptionData | null = {
        coords: [
          [userLat, userLng],
          [(userLat + destLat) / 2 - 0.0005, (userLng + destLng) / 2 - 0.0011],
          [6.6588, 122.1369],
          [destLat, destLng],
        ],
        distanceMeters: Math.round(straightDist * 1.42),
        viaSummary: 'P. Cuevas St. & G. Pamaran St.',
      };

      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${destLng},${destLat}?overview=full&alternatives=true&geometries=geojson&steps=true`;
        const res = await fetch(osrmUrl);
        if (res.ok) {
          const data = await res.json();
          const r0 = data?.routes?.[0];
          if (r0?.geometry?.coordinates?.length > 1) {
            const stepNames = (r0.legs?.[0]?.steps || [])
              .map((s: any) => s.name)
              .filter((n: string) => Boolean(n) && n.length > 1);
            const uniqueNames = Array.from(new Set(stepNames)).slice(0, 2);

            primaryRoute = {
              coords: r0.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]),
              distanceMeters: Math.round(r0.distance || straightDist * 1.25),
              viaSummary:
                uniqueNames.length > 0
                  ? `via ${uniqueNames.join(' → ')}`
                  : 'via Basilan Circumferential Rd → Aguinaldo St.',
            };
          }

          const r1 = data?.routes?.[1];
          if (r1?.geometry?.coordinates?.length > 1) {
            const altNames = (r1.legs?.[0]?.steps || [])
              .map((s: any) => s.name)
              .filter((n: string) => Boolean(n) && n.length > 1);
            const uniqueAlt = Array.from(new Set(altNames)).slice(0, 2);

            alternateRoute = {
              coords: r1.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]),
              distanceMeters: Math.round(r1.distance || primaryRoute.distanceMeters * 1.18),
              viaSummary:
                uniqueAlt.length > 0
                  ? `via ${uniqueAlt.join(' → ')}`
                  : 'via P. Cuevas St. & G. Pamaran St.',
            };
          } else {
            // Query a second real road route through P. Cuevas St. / Jollibee Lamitan waypoint so alternate route follows real streets
            const wpLat = 6.6584;
            const wpLng = 122.1369;
            const altRes = await fetch(
              `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${wpLng},${wpLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`
            );
            if (altRes.ok) {
              const altData = await altRes.json();
              const altR = altData?.routes?.[0];
              if (altR?.geometry?.coordinates?.length > 1) {
                alternateRoute = {
                  coords: altR.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]),
                  distanceMeters: Math.round(
                    Math.max(primaryRoute.distanceMeters + 120, altR.distance || 1200)
                  ),
                  viaSummary: 'via Basilan Circumferential Rd → P. Cuevas St.',
                };
              }
            }
          }
        }
      } catch {
        // Keep street-aligned fallback routes if OSRM is offline
      }

      const durations = computeModeDurations(primaryRoute.distanceMeters);
      const altDurations = alternateRoute
        ? computeModeDurations(alternateRoute.distanceMeters)
        : null;

      setRouteStats((prev) => ({
        primaryRoute,
        alternateRoute,
        selectedRouteIndex: prev?.selectedRouteIndex ?? 0,
        durations,
        altDurations,
        originLabel,
        userLat,
        userLng,
        isLiveGps,
      }));
    },
    []
  );

  const stopLiveDirections = useCallback(() => {
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    routeLayerRef.current?.clearLayers();
    setDirectionsActive(false);
    setRouteStats(null);
    mapInstanceRef.current?.fitBounds(BRGY_MATATAG_BOUNDARY_POLYGON, {
      padding: [32, 32],
      maxZoom: 18,
    });
  }, []);

  const startLiveDirections = useCallback(
    (customLat?: number, customLng?: number, customLabel?: string) => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      setDirectionsActive(true);
      mapInstanceRef.current?.closePopup();

      const activeUserPin = pendingCandidate || confirmedPin;
      const startLat =
        typeof customLat === 'number'
          ? customLat
          : activeUserPin
            ? activeUserPin.lat
            : DEFAULT_LAMITAN_APPROACH_ORIGIN.lat;
      const startLng =
        typeof customLng === 'number'
          ? customLng
          : activeUserPin
            ? activeUserPin.lng
            : DEFAULT_LAMITAN_APPROACH_ORIGIN.lng;
      const startLabel =
        customLabel ||
        (activeUserPin
          ? `${activeUserPin.street} (Pinned Residence)`
          : DEFAULT_LAMITAN_APPROACH_ORIGIN.label);

      updateLiveRouteOnMap(startLat, startLng, startLabel, false);

      mapInstanceRef.current?.fitBounds(
        [
          [startLat, startLng],
          [BRGY_MATATAG_HALL_COORDS.lat, BRGY_MATATAG_HALL_COORDS.lng],
        ],
        { padding: [65, 65], maxZoom: 17 }
      );

      // Watch real device live GPS coordinates
      if (typeof customLat !== 'number' && 'geolocation' in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            const distFromHall = computeDistanceMeters(
              latitude,
              longitude,
              BRGY_MATATAG_HALL_COORDS.lat,
              BRGY_MATATAG_HALL_COORDS.lng
            );
            // Use physical device GPS automatically when inside Basilan / Lamitan (<= 30 km)
            if (distFromHall <= 30000) {
              updateLiveRouteOnMap(latitude, longitude, 'Your Live Device GPS', true);
              mapInstanceRef.current?.fitBounds(
                [
                  [latitude, longitude],
                  [BRGY_MATATAG_HALL_COORDS.lat, BRGY_MATATAG_HALL_COORDS.lng],
                ],
                { padding: [65, 65], maxZoom: 17 }
              );
            }
          },
          () => {
            // Keep Lamitan live route active if geolocation permission is declined
          },
          { enableHighAccuracy: true, maximumAge: 3000, timeout: 8000 }
        );
      }
    },
    [confirmedPin, pendingCandidate, updateLiveRouteOnMap]
  );

  // Request user's physical device GPS immediately on click of "Use My Device GPS"
  const handleUseDeviceLiveGPS = () => {
    if (!('geolocation' in navigator)) {
      startLiveDirections();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const distFromHall = computeDistanceMeters(
          latitude,
          longitude,
          BRGY_MATATAG_HALL_COORDS.lat,
          BRGY_MATATAG_HALL_COORDS.lng
        );
        if (distFromHall <= 50000) {
          startLiveDirections(latitude, longitude, 'Your Live Device GPS');
        } else {
          // If testing from outside Basilan Island, keep route anchored in Lamitan City so local street routing stays visible
          startLiveDirections(
            DEFAULT_LAMITAN_APPROACH_ORIGIN.lat,
            DEFAULT_LAMITAN_APPROACH_ORIGIN.lng,
            'Live GPS (Lamitan City Approach)'
          );
        }
      },
      () => {
        startLiveDirections();
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  useEffect(() => {
    (window as any).__startMatatagDirections = () => {
      startLiveDirections();
    };
    (window as any).__selectMatatagRoute = (idx: 0 | 1) => {
      setRouteStats((prev) => (prev ? { ...prev, selectedRouteIndex: idx } : prev));
    };
    return () => {
      delete (window as any).__startMatatagDirections;
      delete (window as any).__selectMatatagRoute;
    };
  }, [startLiveDirections]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [BRGY_MATATAG_POLYGON_CENTER.lat, BRGY_MATATAG_POLYGON_CENTER.lng],
      zoom: 17,
      maxZoom: 21,
      minZoom: 14,
      zoomControl: true,
    });

    // Fit the exact Barangay Matatag boundary cleanly inside the viewport
    map.fitBounds(BRGY_MATATAG_BOUNDARY_POLYGON, {
      padding: [32, 32],
      maxZoom: 18,
    });

    // Primary Layer: Real Google Maps Hybrid Satellite Tiles (Crystal-clear up to zoom 21)
    L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxNativeZoom: 20,
      maxZoom: 21,
      attribution:
        '3D Satellite & Street View © Google Earth / Barangay Matatag GIS (Lamitan City, Basilan)',
    }).addTo(map);

    const maskGroup = L.layerGroup().addTo(map);
    const routeGroup = L.layerGroup().addTo(map);
    const layerGroup = L.layerGroup().addTo(map);

    maskLayerRef.current = maskGroup;
    routeLayerRef.current = routeGroup;
    markersLayerRef.current = layerGroup;
    mapInstanceRef.current = map;

    // Map click behavior:
    // - When Directions Mode is ACTIVE: clicking anywhere on the map moves the user's starting location & recalculates live routes!
    // - When Directions Mode is OFF: clicking inside Barangay Matatag pinpoints residence; clicking outside shows jurisdiction warning.
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (directionsActiveRef.current) {
        updateLiveRouteOnMap(
          Number(lat.toFixed(6)),
          Number(lng.toFixed(6)),
          `Selected Start Point (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`,
          true
        );
        return;
      }

      if (mode === 'admin') return;

      if (!isPointInsideMatatagBoundary(lat, lng)) {
        setOutsideWarning(
          'Outside Barangay Matatag Jurisdiction! Please click inside the bright Barangay Matatag boundary to pinpoint your house, or activate Live Directions to route from outside.'
        );
        window.setTimeout(() => {
          setOutsideWarning((prev) =>
            prev?.includes('Outside Barangay Matatag') ? null : prev
          );
        }, 5000);
        return;
      }

      setOutsideWarning(null);
      const inferred = inferMatatagZoneFromCoords(lat, lng);
      setPendingCandidate({
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        lotLabel: inferred.lotLabel,
        street: inferred.street,
        purok: inferred.purok,
        confirmedAt: new Date().toISOString(),
      });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mode, updateLiveRouteOnMap]);

  // Render Outside-Boundary Dark Spotlight Mask & Modern Barangay Matatag Boundary Line
  // When directionsActive === true, the dark outside mask clears (fillOpacity: 0) so the full route outside Barangay Matatag is 100% clear!
  useEffect(() => {
    const maskLayer = maskLayerRef.current;
    if (!maskLayer) return;

    maskLayer.clearLayers();

    // 1. Inverted World Polygon with Barangay Matatag Hole:
    //    Dark transparent layer OUTSIDE Barangay Matatag when viewing the barangay map;
    //    Turns 100% CLEAR when Live Directions are active so the user can view their full route from outside!
    L.polygon([WORLD_OUTER_RING, BRGY_MATATAG_BOUNDARY_POLYGON], {
      fillColor: '#020617',
      fillOpacity: directionsActive ? 0 : 0.56,
      stroke: false,
      interactive: false,
    }).addTo(maskLayer);

    // 2. Modern Multi-Layered Barangay Matatag Boundary Line
    // Outer soft cyan-blue atmospheric glow
    L.polygon(BRGY_MATATAG_BOUNDARY_POLYGON, {
      color: '#0ea5e9',
      weight: 10,
      opacity: directionsActive ? 0.2 : 0.34,
      fillOpacity: 0,
      lineJoin: 'round',
      lineCap: 'round',
      interactive: false,
    }).addTo(maskLayer);

    // Core modern electric-blue frame
    L.polygon(BRGY_MATATAG_BOUNDARY_POLYGON, {
      color: '#2563eb',
      weight: 3.5,
      opacity: 0.96,
      fillOpacity: 0,
      lineJoin: 'round',
      lineCap: 'round',
      interactive: false,
    }).addTo(maskLayer);

    // High-contrast crisp sky-cyan inner tech dash
    L.polygon(BRGY_MATATAG_BOUNDARY_POLYGON, {
      color: '#7dd3fc',
      weight: 1.8,
      opacity: 0.95,
      dashArray: '10, 6',
      fillOpacity: 0,
      lineJoin: 'round',
      lineCap: 'round',
      interactive: false,
    }).addTo(maskLayer);

    // Sleek glowing survey corner nodes on the 4 vertices of Barangay Matatag
    for (const [cLat, cLng] of BRGY_MATATAG_BOUNDARY_POLYGON) {
      L.circleMarker([cLat, cLng], {
        radius: 4.5,
        color: '#ffffff',
        weight: 2,
        fillColor: '#0ea5e9',
        fillOpacity: 1,
        interactive: false,
      }).addTo(maskLayer);
    }
  }, [directionsActive]);

  // Render Official Full-Bleed Barangay Matatag Hall Seal Marker (no white circle margin!), User Pin, and Admin Pins
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // Official Barangay Matatag Hall Logo Marker — Enlarged & scaled so the seal covers the entire circle with ZERO white margin showing
    const hallIcon = L.divIcon({
      className: 'custom-brgy-hall-icon',
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);cursor:pointer;">
          <div style="
            position:relative;
            width:66px;
            height:66px;
            border-radius:999px;
            display:flex;
            align-items:center;
            justify-content:center;
            filter:drop-shadow(0 6px 16px rgba(15,23,42,0.85)) drop-shadow(0 0 8px rgba(37,99,235,0.75));
            transition:transform 0.2s;
          ">
            <div style="
              position:absolute;
              width:50px;
              height:50px;
              border-radius:999px;
              background:#1e3a8a;
              box-shadow:0 0 0 2.5px #38bdf8;
            "></div>
            <img
              src="/logo.png"
              alt="Barangay Matatag Seal"
              style="
                position:relative;
                width:66px;
                height:66px;
                object-fit:contain;
                transform:scale(1.12);
                display:block;
                pointer-events:none;
              "
            />
          </div>
          <span style="margin-top:4px;background:linear-gradient(135deg,#1e3a8a,#1d4ed8);color:#ffffff !important;border:1.5px solid #7dd3fc;font-size:11px;font-weight:800;padding:3px 11px;border-radius:999px;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,0.65);">
            🏛️ BARANGAY MATATAG HALL • Click for Directions
          </span>
        </div>
      `,
      iconSize: [68, 68],
    });

    const hallMarker = L.marker(
      [BRGY_MATATAG_HALL_COORDS.lat, BRGY_MATATAG_HALL_COORDS.lng],
      { icon: hallIcon, zIndexOffset: 1000 }
    ).addTo(layer);

    hallMarker.bindPopup(
      `<div style="min-width:260px;font-family:'Plus Jakarta Sans',sans-serif;padding:2px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <img src="/logo.png" style="width:44px;height:44px;object-fit:contain;filter:drop-shadow(0 2px 6px rgba(29,78,216,0.4));" />
          <div>
            <b style="color:#1E3A8A;font-size:13.5px;display:block;">🏛️ Barangay Matatag Hall</b>
            <span style="font-size:10.5px;color:#475569;font-weight:600;">Lamitan City, Basilan Province (ZIP 7302)</span>
          </div>
        </div>
        <div style="font-size:11px;color:#B91C1C;font-weight:700;margin-bottom:2px;">
          Punong Barangay: Hon. Hulma G. Abdurahman
        </div>
        <div style="font-size:10px;color:#64748b;font-family:monospace;margin-bottom:10px;">
          GPS: 6.660000° N, 122.137703° E
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <button
            type="button"
            onclick="window.__startMatatagDirections && window.__startMatatagDirections()"
            style="width:100%;background:#1D4ED8;color:#ffffff;border:none;border-radius:8px;padding:8px 10px;font-size:11px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 3px 10px rgba(29,78,216,0.35);"
          >
            🧭 Live Directions &amp; Est. Time on Map
          </button>
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=${BRGY_MATATAG_HALL_COORDS.lat},${BRGY_MATATAG_HALL_COORDS.lng}&travelmode=driving"
            target="_blank"
            rel="noopener noreferrer"
            style="width:100%;background:#059669;color:#ffffff !important;text-decoration:none;border-radius:8px;padding:8px 10px;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:6px;box-sizing:border-box;"
          >
            🗺️ Open in Google Maps App ↗
          </a>
        </div>
      </div>`
    );

    // If user clicked inside Barangay Matatag to pinpoint their residence, render their clean residence pin
    const activePin = pendingCandidate || confirmedPin;
    if (activePin && mode !== 'admin') {
      const userPinIcon = L.divIcon({
        className: 'custom-user-pin',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-90%);">
            <div style="background:${confirmedPin ? '#059669' : '#1D4ED8'};color:#ffffff !important;border:2px solid #ffffff;padding:5px 12px;border-radius:999px;font-size:11px;font-weight:800;white-space:nowrap;box-shadow:0 6px 18px rgba(15,23,42,0.5);">
              📍 ${confirmedPin ? 'CONFIRMED RESIDENCE PIN' : 'SELECTED RESIDENCE LOCATION'}
            </div>
            <div style="width:3px;height:14px;background:#ffffff;"></div>
            <div style="width:12px;height:12px;border-radius:999px;background:${confirmedPin ? '#10B981' : '#2563EB'};border:2px solid #ffffff;"></div>
          </div>
        `,
        iconSize: [32, 32],
      });
      L.marker([activePin.lat, activePin.lng], { icon: userPinIcon }).addTo(layer);
    }

    // In Admin mode, display all Registered Residents' Pinpointed Locations & Active SOS Beacons
    if (mode === 'admin') {
      for (const r of residents) {
        const pin = r.pinnedLocation;
        if (pin?.lat && pin?.lng) {
          const resIcon = L.divIcon({
            className: 'admin-res-pin',
            html: `
              <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);">
                <div style="background:#059669;color:#ffffff !important;border:2px solid #ffffff;padding:3px 9px;border-radius:999px;font-size:10px;font-weight:800;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.4);">
                  🏠 ${r.fullName}
                </div>
              </div>
            `,
            iconSize: [30, 20],
          });
          L.marker([pin.lat, pin.lng], { icon: resIcon })
            .addTo(layer)
            .bindPopup(
              `<div style="min-width:200px">
                <b>${r.fullName}</b><br/>
                <span>📍 ${pin.street} (${r.purok})</span><br/>
                <span>📡 GPS: ${pin.lat.toFixed(5)}°N, ${pin.lng.toFixed(5)}°E</span><br/>
                <span>📞 ${r.contactNumber}</span>
              </div>`
            );
        }
      }

      for (const sos of emergencies) {
        if (sos.lat && sos.lng && sos.status !== 'Resolved') {
          const sosIcon = L.divIcon({
            className: 'admin-sos-pin',
            html: `
              <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);">
                <div style="background:#DC2626;color:#ffffff !important;border:2px solid #FEF08A;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:900;white-space:nowrap;box-shadow:0 0 22px rgba(220,38,38,0.9);">
                  🚨 SOS: ${sos.residentName} (${sos.type})
                </div>
              </div>
            `,
            iconSize: [40, 26],
          });
          L.marker([sos.lat, sos.lng], { icon: sosIcon })
            .addTo(layer)
            .bindPopup(
              `<b>🚨 ACTIVE EMERGENCY SOS</b><br/>Resident: ${sos.residentName}<br/>Type: ${sos.type}<br/>Message: ${sos.message}<br/>Coords: ${sos.lat.toFixed(5)}, ${sos.lng.toFixed(5)}`
            );
        }
      }
    }
  }, [pendingCandidate, confirmedPin, residents, emergencies, mode]);

  const handleUseCurrentGPS = () => {
    const targetLat = 6.66018;
    const targetLng = 122.13792;
    setOutsideWarning(null);
    mapInstanceRef.current?.flyTo([targetLat, targetLng], 18, { duration: 1.0 });
    const inferred = inferMatatagZoneFromCoords(targetLat, targetLng);
    setPendingCandidate({
      lat: targetLat,
      lng: targetLng,
      lotLabel: inferred.lotLabel,
      street: inferred.street,
      purok: inferred.purok,
      confirmedAt: new Date().toISOString(),
    });
  };

  const activeRouteData =
    routeStats && routeStats.selectedRouteIndex === 1 && routeStats.alternateRoute
      ? routeStats.alternateRoute
      : routeStats?.primaryRoute;

  const activeDurations =
    routeStats && routeStats.selectedRouteIndex === 1 && routeStats.altDurations
      ? routeStats.altDurations
      : routeStats?.durations;

  return (
    <div className="space-y-4">
      {/* Top Satellite Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex flex-wrap items-center gap-2">
              <span>BARANGAY MATATAG 3D GOOGLE SATELLITE MAP (LAMITAN CITY, BASILAN)</span>
              <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-300 font-mono">
                Brgy. Hall: 6.6600° N, 122.1377° E
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              {directionsActive
                ? 'Live Multi-Mode Navigation Active: Outside border filter cleared — click any route or click anywhere on map to move origin'
                : mode === 'admin'
                  ? 'Live 3D Command View: Spotlighted Barangay Matatag Jurisdiction Boundary, Brgy. Hall & Resident Pins'
                  : 'Spotlighted Barangay Matatag Jurisdiction: Click inside the bright boundary to pinpoint your house, or click Live Directions'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIs3DTilt((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition ${
              is3DTilt
                ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {is3DTilt ? '3D Google Earth View: ON' : '2D Top-Down View'}
          </button>

          <button
            type="button"
            onClick={() => (directionsActive ? stopLiveDirections() : startLiveDirections())}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition shadow-sm ${
              directionsActive
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            {directionsActive ? 'Live Directions Active' : 'Directions to Brgy. Hall'}
          </button>

          <a
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-300 dark:border-emerald-700 px-3 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Google Maps App
          </a>

          {mode !== 'admin' && (
            <button
              type="button"
              onClick={handleUseCurrentGPS}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 transition"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              Pin Near Brgy. Hall
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (directionsActive) {
                stopLiveDirections();
              } else {
                mapInstanceRef.current?.fitBounds(BRGY_MATATAG_BOUNDARY_POLYGON, {
                  padding: [32, 32],
                  maxZoom: 18,
                });
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 transition"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            Focus Brgy. Matatag
          </button>
        </div>
      </div>

      {/* Warning Banner when User Clicks Outside Barangay Matatag Boundary */}
      {outsideWarning && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 px-4 py-3 text-xs font-bold text-amber-900 dark:text-amber-200 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{outsideWarning}</span>
          </div>
          <button
            type="button"
            onClick={() => setOutsideWarning(null)}
            className="text-amber-700 dark:text-amber-300 hover:opacity-75"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Google Maps-Style Multi-Mode Live Directions Panel (Matches Images 2 & 3) */}
      {directionsActive && routeStats && activeRouteData && activeDurations && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-600 shadow-xl overflow-hidden">
          {/* Top Google Maps Travel Mode Selector Bar (Best | Car | Motorcycle | Transit | Walk | Bike) */}
          <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1 sm:pb-0">
                {(
                  [
                    {
                      id: 'best' as TravelMode,
                      label: 'Best',
                      time: `${activeDurations.best} min`,
                      icon: (
                        <div className="w-5 h-5 flex items-center justify-center border-2 border-current rounded-[4px] rotate-45 scale-75">
                          <CornerUpRight className="w-3.5 h-3.5 -rotate-45 stroke-[2.6]" />
                        </div>
                      ),
                    },
                    {
                      id: 'car' as TravelMode,
                      label: `${activeDurations.car} min`,
                      time: `${activeDurations.car} min`,
                      icon: <Car className="w-5 h-5 stroke-[2.2]" />,
                    },
                    {
                      id: 'motorcycle' as TravelMode,
                      label: `${activeDurations.motorcycle} min`,
                      time: `${activeDurations.motorcycle} min`,
                      icon: (
                        <svg
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="5.5" cy="17.5" r="3.5" />
                          <circle cx="18.5" cy="17.5" r="3.5" />
                          <path d="M15 6h3l2 5" />
                          <path d="M9 17.5h5l2-6H9l-3 3" />
                          <path d="M12 6l2 5" />
                        </svg>
                      ),
                    },
                    {
                      id: 'transit' as TravelMode,
                      label: `${activeDurations.transit} min`,
                      time: `${activeDurations.transit} min`,
                      icon: <TrainFront className="w-5 h-5 stroke-[2.2]" />,
                    },
                    {
                      id: 'walk' as TravelMode,
                      label: `${activeDurations.walk} min`,
                      time: `${activeDurations.walk} min`,
                      icon: <Footprints className="w-5 h-5 stroke-[2.2]" />,
                    },
                    {
                      id: 'bike' as TravelMode,
                      label: `${activeDurations.bike} min`,
                      time: `${activeDurations.bike} min`,
                      icon: <Bike className="w-5 h-5 stroke-[2.2]" />,
                    },
                  ] as const
                ).map((item) => {
                  const isSelected = travelMode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTravelMode(item.id)}
                      className="group flex flex-col items-center min-w-[54px] focus:outline-none"
                    >
                      <div
                        className={`flex items-center justify-center w-12 h-8 rounded-full transition-all ${
                          isSelected
                            ? 'bg-[#b2e7f5] text-slate-950 shadow-sm'
                            : 'text-slate-700 dark:text-slate-300 group-hover:bg-slate-200/70 dark:group-hover:bg-slate-800'
                        }`}
                      >
                        {item.icon}
                      </div>
                      <span
                        className={`mt-1 text-xs font-bold tracking-tight ${
                          isSelected
                            ? 'text-slate-950 dark:text-white font-extrabold'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {item.id === 'best' ? 'Best' : item.time}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Live Origin / Device GPS Switcher */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleUseDeviceLiveGPS}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 border border-blue-300 dark:border-blue-700 px-3 py-1.5 text-xs font-bold text-blue-800 dark:text-blue-300 transition"
                >
                  <LocateFixed className="w-3.5 h-3.5 text-blue-600" />
                  Use Device GPS
                </button>
                <button
                  type="button"
                  onClick={() =>
                    startLiveDirections(
                      DEFAULT_LAMITAN_APPROACH_ORIGIN.lat,
                      DEFAULT_LAMITAN_APPROACH_ORIGIN.lng,
                      DEFAULT_LAMITAN_APPROACH_ORIGIN.label
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                >
                  Lamitan Highway (1 km)
                </button>
                {(pendingCandidate || confirmedPin) && (
                  <button
                    type="button"
                    onClick={() => {
                      const p = pendingCandidate || confirmedPin;
                      if (p) {
                        startLiveDirections(p.lat, p.lng, `${p.street} (Pinned Residence)`);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                  >
                    My Pinned House
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Route Summary & Alternate Route Selector */}
          <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-400 px-3 py-0.5 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  LIVE GPS NAVIGATION • OUTSIDE BORDER FILTER CLEARED
                </span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  (Tip: Click anywhere on the map to move your starting location)
                </span>
              </div>

              <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                <span>{routeStats.originLabel}</span>
                <span className="text-blue-600 dark:text-blue-400">→</span>
                <span className="text-[#1D4ED8] dark:text-amber-300">
                  🏛️ Barangay Matatag Hall (Aguinaldo St.)
                </span>
              </h4>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setRouteStats((prev) =>
                      prev ? { ...prev, selectedRouteIndex: 0 } : prev
                    )
                  }
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold border transition ${
                    routeStats.selectedRouteIndex === 0
                      ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <Route className="w-3.5 h-3.5" />
                  Best Route ({formatDistanceLabel(routeStats.primaryRoute.distanceMeters)} •{' '}
                  {routeStats.durations[travelMode]} min) — {routeStats.primaryRoute.viaSummary}
                </button>

                {routeStats.alternateRoute && routeStats.altDurations && (
                  <button
                    type="button"
                    onClick={() =>
                      setRouteStats((prev) =>
                        prev ? { ...prev, selectedRouteIndex: 1 } : prev
                      )
                    }
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold border transition ${
                      routeStats.selectedRouteIndex === 1
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <Route className="w-3.5 h-3.5" />
                    Alt Route ({formatDistanceLabel(routeStats.alternateRoute.distanceMeters)} •{' '}
                    {routeStats.altDurations[travelMode]} min) —{' '}
                    {routeStats.alternateRoute.viaSummary}
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-3.5 py-2 text-center">
                <div className="text-[10px] uppercase tracking-wider text-blue-700 dark:text-blue-300 font-bold">
                  Selected ETA ({travelMode.toUpperCase()})
                </div>
                <div className="text-base font-extrabold text-blue-800 dark:text-blue-200">
                  {activeDurations[travelMode]} min ({formatDistanceLabel(activeRouteData.distanceMeters)})
                </div>
              </div>

              <a
                href={googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Google Maps App
              </a>

              <button
                type="button"
                onClick={stopLiveDirections}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
              >
                <X className="w-3.5 h-3.5" />
                End Route
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Satellite Viewport Container */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-lg bg-slate-900">
        <div className={is3DTilt ? 'satellite-3d-tilt' : 'transition-transform duration-500'}>
          <div ref={mapContainerRef} className="w-full h-[440px] sm:h-[500px] z-10 cursor-crosshair" />
        </div>

        {/* Bottom-Left Live Satellite Caption */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-2 rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-200 shadow-md">
          <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span>
            {directionsActive
              ? '🧭 Live Multi-Mode Directions Active • Outside Border Filter Cleared for Full Route Visibility'
              : '🏛️ Brgy. Matatag Hall (6.6600° N, 122.1377° E) • Spotlighted Inside Border = Official Brgy. Matatag Limits'}
          </span>
        </div>

        {/* Address Confirmation Overlay Modal when User Clicks Inside Barangay Matatag Boundary */}
        {pendingCandidate && !directionsActive && mode !== 'admin' && (
          <div className="absolute inset-x-4 bottom-4 z-30 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-600 p-4 sm:p-5 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:text-blue-300">
                  <MapPin className="w-3.5 h-3.5" />
                  WITHIN BARANGAY MATATAG LIMITS • CONFIRM HOUSE LOCATION
                </div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Home className="w-4 h-4 text-blue-600 shrink-0" />
                  {pendingCandidate.street} • {pendingCandidate.purok}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Barangay Matatag, Lamitan City, Basilan Province (ZIP 7302)
                </p>
                <p className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                  Pinned GPS Coordinates: {pendingCandidate.lat.toFixed(6)}° N, {pendingCandidate.lng.toFixed(6)}° E
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    startLiveDirections(
                      pendingCandidate.lat,
                      pendingCandidate.lng,
                      `${pendingCandidate.street} (Pinned Residence)`
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Directions to Brgy. Hall
                </button>
                <button
                  type="button"
                  onClick={() => setPendingCandidate(null)}
                  className="rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  Click Another Spot
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmedPin(pendingCandidate);
                    onConfirmLocation?.(pendingCandidate);
                    setPendingCandidate(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm My House Location
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmed Location Banner */}
      {confirmedPin && mode !== 'admin' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300">
                ✅ HOUSE LOCATION PINPOINTED &amp; VERIFIED INSIDE BARANGAY MATATAG
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {confirmedPin.street}, {confirmedPin.purok}, Barangay Matatag, Lamitan City (7302)
              </div>
              <div className="text-xs font-mono text-slate-600 dark:text-slate-300">
                GPS: {confirmedPin.lat.toFixed(6)}° N, {confirmedPin.lng.toFixed(6)}° E
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                startLiveDirections(
                  confirmedPin.lat,
                  confirmedPin.lng,
                  `${confirmedPin.street} (Confirmed Residence)`
                )
              }
              className="rounded-full bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-bold text-white flex items-center gap-1.5 shadow-sm transition"
            >
              <Route className="w-3.5 h-3.5" /> Show Route to Brgy. Hall
            </button>
            <span className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Location Verified
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
