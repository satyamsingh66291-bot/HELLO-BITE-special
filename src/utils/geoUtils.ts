export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface ZoneValidationResult {
  isInServiceZone: boolean;
  distanceToGopalganjKm: number;
  distanceToSiwanKm: number;
  closestDistrict: 'Gopalganj' | 'Siwan';
  closestDistanceKm: number;
  message: string;
}

export interface DynamicDeliveryCalculation {
  baseFee: number;
  perKmRate: number;
  distanceKm: number;
  calculatedFee: number;
  nearestHubName: string;
  nearestDistrict: 'Gopalganj' | 'Siwan';
  isServiceable: boolean;
  estimatedMinutes: string;
  displayBreakdown: string;
}

// Fixed coordinates for delivery hubs
export const GOPALGANJ_COORDS = { lat: 26.4687, lng: 84.4442, name: 'Gopalganj Central Kitchen' };
export const SIWAN_COORDS = { lat: 26.2243, lng: 84.3596, name: 'Siwan Express Hub' };

// Maximum operational delivery radius per district (in Kilometers)
export const MAX_DELIVERY_RADIUS_KM = 35;

/**
 * Haversine formula to compute great-circle distance between two GPS points
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export interface KitchenHubConfig {
  name?: string;
  lat: number;
  lng: number;
}

/**
 * Validate whether a coordinate falls inside active delivery radius from kitchen hubs
 */
export function validateDeliveryZone(
  coords: GeoCoordinates,
  customHub?: KitchenHubConfig | null
): ZoneValidationResult {
  const primaryHub = customHub && Number.isFinite(customHub.lat) && Number.isFinite(customHub.lng)
    ? { lat: customHub.lat, lng: customHub.lng, name: customHub.name || GOPALGANJ_COORDS.name }
    : GOPALGANJ_COORDS;

  const distGopalganj = calculateDistanceKm(
    coords.latitude,
    coords.longitude,
    primaryHub.lat,
    primaryHub.lng
  );

  const distSiwan = calculateDistanceKm(
    coords.latitude,
    coords.longitude,
    SIWAN_COORDS.lat,
    SIWAN_COORDS.lng
  );

  const useCustomDirect = Boolean(customHub && Number.isFinite(customHub.lat) && Number.isFinite(customHub.lng));
  const closestDistrict: 'Gopalganj' | 'Siwan' = useCustomDirect
    ? 'Gopalganj'
    : (distGopalganj <= distSiwan ? 'Gopalganj' : 'Siwan');
  const closestDistanceKm = useCustomDirect ? distGopalganj : Math.min(distGopalganj, distSiwan);
  const isInServiceZone = closestDistanceKm <= MAX_DELIVERY_RADIUS_KM;

  let message = '';
  if (isInServiceZone) {
    message = `Location verified within ${primaryHub.name} delivery zone (~${closestDistanceKm} km from kitchen).`;
  } else {
    message = `Location is ~${closestDistanceKm} km away from ${primaryHub.name}. HELLO BITE delivers up to ${MAX_DELIVERY_RADIUS_KM} km from the kitchen.`;
  }

  return {
    isInServiceZone,
    distanceToGopalganjKm: distGopalganj,
    distanceToSiwanKm: distSiwan,
    closestDistrict,
    closestDistanceKm,
    message
  };
}

/**
 * Dynamic Per-Kilometer Delivery Pricing (Kitchen Hub Distance Model)
 * - Minimum base fee covers first 2.0 km
 * - Beyond 2.0 km: incremental per-km charge configured by kitchen admin
 */
export function calculateDynamicDeliveryPricing(
  coords: GeoCoordinates,
  baseFee: number = 20,
  perKmRate: number = 8,
  customHub?: KitchenHubConfig | null,
  overrideDistanceKm?: number | null
): DynamicDeliveryCalculation {
  const validation = validateDeliveryZone(coords, customHub);
  const distanceKm =
    typeof overrideDistanceKm === 'number' && Number.isFinite(overrideDistanceKm) && overrideDistanceKm > 0
      ? Math.round(overrideDistanceKm * 10) / 10
      : validation.closestDistanceKm;
  const nearestDistrict = validation.closestDistrict;
  const nearestHubName =
    customHub?.name?.trim() ||
    (nearestDistrict === 'Gopalganj' ? GOPALGANJ_COORDS.name : SIWAN_COORDS.name);

  if (distanceKm > MAX_DELIVERY_RADIUS_KM) {
    return {
      baseFee,
      perKmRate,
      distanceKm,
      calculatedFee: Math.max(99, baseFee + Math.ceil((distanceKm - 2) * perKmRate)),
      nearestHubName,
      nearestDistrict,
      isServiceable: false,
      estimatedMinutes: 'Out of Area',
      displayBreakdown: `Location is ${distanceKm} km away (outside ${MAX_DELIVERY_RADIUS_KM} km delivery zone)`
    };
  }

  let calculatedFee = baseFee;
  let breakdown = `Base ₹${baseFee} (up to 2 km)`;

  if (distanceKm > 2.0) {
    const extraKm = distanceKm - 2.0;
    const extraCharge = Math.ceil(extraKm * perKmRate);
    calculatedFee = baseFee + extraCharge;
    breakdown = `₹${baseFee} base + ₹${extraCharge} (${extraKm.toFixed(1)} km × ₹${perKmRate}/km)`;
  }

  const minTime = Math.max(15, Math.round(18 + distanceKm * 2.5));
  const maxTime = minTime + 10;
  const estimatedMinutes = `${minTime}-${maxTime} mins`;

  return {
    baseFee,
    perKmRate,
    distanceKm,
    calculatedFee,
    nearestHubName,
    nearestDistrict,
    isServiceable: true,
    estimatedMinutes,
    displayBreakdown: breakdown
  };
}

/**
 * Resolve locality display name from coordinates in Gopalganj & Siwan
 */
export function getLocalityFromCoords(coords: GeoCoordinates): {
  areaName: string;
  district: 'Gopalganj' | 'Siwan';
  fullLabel: string;
} {
  const validation = validateDeliveryZone(coords);
  const district = validation.closestDistrict;
  const dist = validation.closestDistanceKm;

  if (district === 'Gopalganj') {
    if (dist < 3) return { areaName: 'Gopalganj Town (Main Market)', district, fullLabel: 'Main Market, Gopalganj' };
    if (dist < 8) return { areaName: 'Thawe Road Sector', district, fullLabel: 'Thawe Road, Gopalganj' };
    if (dist < 15) return { areaName: 'Barauli / Sasamusa Sector', district, fullLabel: 'Barauli Sector, Gopalganj' };
    return { areaName: `Gopalganj Zone (~${dist} km)`, district, fullLabel: `Gopalganj (~${dist} km)` };
  } else {
    if (dist < 3) return { areaName: 'Siwan Town (Station Rd)', district, fullLabel: 'Station Road, Siwan' };
    if (dist < 8) return { areaName: 'Mairwa / Hospital Road', district, fullLabel: 'Hospital Road, Siwan' };
    if (dist < 15) return { areaName: 'Maharajganj Link', district, fullLabel: 'Maharajganj Link, Siwan' };
    return { areaName: `Siwan Zone (~${dist} km)`, district, fullLabel: `Siwan (~${dist} km)` };
  }
}
