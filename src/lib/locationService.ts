// Resilient Geolocation Service for SK Pizza Point
// Handles real device GPS Geolocation, Google Maps Links, Store Location, and reverse-geocoding

import { LiveLocation } from '../types';

export interface LocationSearchResult {
  placeId: string;
  name: string;
  displayName: string;
  lat: number;
  lon: number;
}

// Official Store Location
export const STORE_GOOGLE_MAPS_URL = 'https://maps.app.goo.gl/ahwPDzJqRtSEXVYb8?g_st=ac';

// Official Restaurant Coordinates (SK Pizza Point - Badagoan Rd, Khureiri, Gwalior, Madhya Pradesh)
export const RESTAURANT_COORDINATES = {
  name: 'SK Pizza Point',
  latitude: 26.230331,
  longitude: 78.263731,
  address: 'Badagoan Rd, Khureiri, Gwalior, Madhya Pradesh 474006',
  googleMapsUrl: STORE_GOOGLE_MAPS_URL,
};

// Haversine formula to compute distance in km
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

// Estimate delivery ETA in minutes (avg bike speed in town ~22 km/h + 3 min buffer)
export function estimateEtaMinutes(distanceKm: number): number {
  return Math.max(5, Math.round((distanceKm / 22) * 60) + 3);
}

// Generate Google Maps Navigation URL (Turn-by-turn directions)
export function getGoogleMapsNavigationUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}

// Generate Google Maps Pin URL
export function getGoogleMapsPinUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps?q=${lat},${lon}`;
}

// Reverse geocode lat/lon to human readable address with dual-service fallback
export async function reverseGeocodeCoords(lat: number, lon: number): Promise<{
  fullAddress: string;
  road: string;
  city: string;
  postcode: string;
}> {
  const fallback = {
    fullAddress: `Pinned GPS Location (${lat.toFixed(5)}, ${lon.toFixed(5)})`,
    road: '',
    city: 'Gwalior',
    postcode: '474006',
  };

  // Service 1: OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'en,hi' },
        signal: controller.signal,
      }
    );
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data?.address) {
        const road = data.address.road || data.address.neighbourhood || data.address.suburb || '';
        const area = data.address.suburb || data.address.city_district || data.address.village || '';
        const city = data.address.city || data.address.town || data.address.state_district || 'Gwalior';
        const postcode = data.address.postcode || '';

        const roadText = [road, area].filter(Boolean).join(', ');
        const full = data.display_name || [roadText, city, postcode].filter(Boolean).join(', ');

        if (full) {
          return {
            fullAddress: full,
            road: roadText || road || area,
            city,
            postcode,
          };
        }
      }
    }
  } catch {
    // Proceed to Service 2
  }

  // Service 2: BigDataCloud Client Reverse Geocode (Reliable, fast, no rate-limits)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      const locality = bdcData.locality || bdcData.city || '';
      const area = bdcData.principalSubdivision || '';
      const postcode = bdcData.postcode || '';
      const street = [bdcData.locality, bdcData.principalSubdivision].filter(Boolean).join(', ');

      return {
        fullAddress: [locality, area, bdcData.countryName].filter(Boolean).join(', ') || fallback.fullAddress,
        road: locality || street,
        city: bdcData.city || locality || 'Gwalior',
        postcode,
      };
    }
  } catch {
    // Return coordinate fallback
  }

  return fallback;
}

// Search location by query
export async function searchAddressQuery(query: string): Promise<LocationSearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query.trim()
      )}&countrycodes=in&limit=5&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'en,hi' },
        signal: controller.signal,
      }
    );
    clearTimeout(timer);

    if (!res.ok) return [];
    const list = await res.json();
    if (Array.isArray(list)) {
      return list.map((item) => ({
        placeId: String(item.place_id || Math.random()),
        name: item.name || item.display_name?.split(',')[0] || query,
        displayName: item.display_name || '',
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      }));
    }
  } catch {
    // Ignore search errors
  }
  return [];
}

// Robust Device Geolocation Acquirer
// Queries the actual device GPS using browser navigator.geolocation
// Never injects fake remote ISP IP locations!
export async function acquireLiveLocation(
  onProgress?: (msg: string) => void
): Promise<{ location: LiveLocation | null; source: 'gps' | 'manual'; error?: string }> {
  const hasGeo = typeof window !== 'undefined' && 'navigator' in window && 'geolocation' in navigator;

  if (!hasGeo) {
    return {
      location: null,
      source: 'manual',
      error: 'Geolocation is not supported by your browser. Please tap the map to set your location.',
    };
  }

  onProgress?.('Accessing Device GPS...');

  // Attempt 1: High Accuracy GPS (12s timeout)
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      });
    });

    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const accuracy = Math.round(pos.coords.accuracy || 10);

    onProgress?.('Resolving street address...');
    const rev = await reverseGeocodeCoords(lat, lon);

    return {
      location: {
        latitude: lat,
        longitude: lon,
        accuracy,
        addressText: rev.road || rev.fullAddress,
        googleMapsLink: getGoogleMapsPinUrl(lat, lon),
        updatedAt: new Date().toISOString(),
      },
      source: 'gps',
    };
  } catch (gpsError: any) {
    console.warn('High-accuracy GPS attempt failed, attempting standard accuracy...', gpsError);

    // If user explicitly denied, do not spam them with second prompt
    if (gpsError?.code === 1) {
      return {
        location: null,
        source: 'manual',
        error: 'Location permission was denied. Please allow location access in your browser or tap the map to pin your doorstep.',
      };
    }

    // Attempt 2: Standard Accuracy (10s timeout)
    try {
      onProgress?.('Acquiring network GPS coordinates...');
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 10000,
        });
      });

      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const accuracy = Math.round(pos.coords.accuracy || 30);
      const rev = await reverseGeocodeCoords(lat, lon);

      return {
        location: {
          latitude: lat,
          longitude: lon,
          accuracy,
          addressText: rev.road || rev.fullAddress,
          googleMapsLink: getGoogleMapsPinUrl(lat, lon),
          updatedAt: new Date().toISOString(),
        },
        source: 'gps',
      };
    } catch {
      // Both GPS attempts failed or timed out
      return {
        location: null,
        source: 'manual',
        error: 'Could not obtain GPS lock automatically. Please tap on the map to set your delivery pin.',
      };
    }
  }
}
