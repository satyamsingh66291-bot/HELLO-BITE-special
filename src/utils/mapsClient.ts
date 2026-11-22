import { useState, useEffect } from 'react';

let cachedServerMapsKey: string | null = null;
let fetchPromise: Promise<string> | null = null;

export function dispatchGmpQuotaExceeded(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
}

export function isQuotaError(err: unknown): boolean {
  if (!err) return false;
  const text =
    typeof err === 'string'
      ? err
      : err instanceof Error
        ? `${err.name} ${err.message}`
        : JSON.stringify(err);
  return (
    text.includes('RESOURCE_EXHAUSTED') ||
    text.includes('OVER_QUERY_LIMIT') ||
    text.includes('OverQuotaMapError') ||
    text.includes('QuotaExceededError') ||
    text.includes('"quotaExceeded":true')
  );
}

/**
 * Resolves the Google Maps API key from Vite build env or backend /api/maps/config.
 */
export function useGoogleMapsApiKey(): {
  apiKey: string;
  loading: boolean;
} {
  const buildTimeKey =
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY) ||
    '';

  const [apiKey, setApiKey] = useState<string>(
    buildTimeKey || cachedServerMapsKey || ''
  );
  const [loading, setLoading] = useState<boolean>(
    !buildTimeKey && cachedServerMapsKey === null
  );

  useEffect(() => {
    if (buildTimeKey) {
      setApiKey(buildTimeKey);
      setLoading(false);
      return;
    }

    if (cachedServerMapsKey !== null) {
      setApiKey(cachedServerMapsKey);
      setLoading(false);
      return;
    }

    let cancelled = false;
    if (!fetchPromise) {
      fetchPromise = fetch('/api/maps/config')
        .then((r) => (r.ok ? r.json() : { apiKey: '' }))
        .then((data: { apiKey?: string }) => data.apiKey || '')
        .catch(() => '');
    }

    fetchPromise.then((key) => {
      cachedServerMapsKey = key;
      if (!cancelled) {
        setApiKey(key);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [buildTimeKey]);

  return { apiKey, loading };
}

export async function reverseGeocodeCoords(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const res = await fetch(
      `/api/maps/reverse-geocode?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`
    );
    const data = (await res.json()) as {
      ok?: boolean;
      quotaExceeded?: boolean;
      formattedAddress?: string;
      error?: string;
    };

    if (res.status === 429 || data.quotaExceeded || isQuotaError(data.error)) {
      dispatchGmpQuotaExceeded();
      return null;
    }

    if (!res.ok || !data.ok || !data.formattedAddress) {
      return null;
    }

    return data.formattedAddress;
  } catch (err) {
    if (isQuotaError(err)) {
      dispatchGmpQuotaExceeded();
    }
    return null;
  }
}

export async function computeRouteDistance(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number }
): Promise<{
  distanceKm: number;
  durationMinutes: number;
  encodedPolyline: string;
} | null> {
  try {
    const res = await fetch('/api/maps/route-distance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originLat: origin.lat,
        originLng: origin.lng,
        destLat: dest.lat,
        destLng: dest.lng,
      }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      quotaExceeded?: boolean;
      distanceKm?: number;
      durationMinutes?: number;
      encodedPolyline?: string;
      error?: string;
    };

    if (res.status === 429 || data.quotaExceeded || isQuotaError(data.error)) {
      dispatchGmpQuotaExceeded();
      return null;
    }

    if (!res.ok || !data.ok || typeof data.distanceKm !== 'number') {
      return null;
    }

    return {
      distanceKm: data.distanceKm,
      durationMinutes: data.durationMinutes || 20,
      encodedPolyline: data.encodedPolyline || '',
    };
  } catch (err) {
    if (isQuotaError(err)) {
      dispatchGmpQuotaExceeded();
    }
    return null;
  }
}
