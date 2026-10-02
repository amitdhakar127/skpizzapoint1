// Multi-tier Resilient Geolocation Service for SK Pizza Point
// Handles GPS Geolocation with auto-retry, IP-based location fallback, reverse-geocoding, and address search

import { LiveLocation } from '../types';

export interface LocationSearchResult {
  placeId: string;
  name: string;
  displayName: string;
  lat: number;
  lon: number;
}

// Default Restaurant Coordinates (SK Pizza Point - Badagoan Rd, Khureiri, Gwalior, Madhya Pradesh)
export const RESTAURANT_COORDINATES = {
  name: 'SK Pizza Point',
  latitude: 26.2155,
  longitude: 78.2218,
  address: 'Badagoan Rd, Khureiri, Gwalior, Madhya Pradesh 474006',
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

// Generate Google Maps Navigation URL
export function getGoogleMapsNavigationUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}

export function getGoogleMapsPinUrl(lat: number, lon: number): string {
  return `https://maps.google.com/?q=${lat},${lon}`;
}

// Reverse geocode lat/lon to human readable address
export async function reverseGeocodeCoords(lat: number, lon: number): Promise<{
  fullAddress: string;
  road: string;
  city: string;
  postcode: string;
}> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
      { headers: { 'Accept-Language': 'en,hi' } }
    );
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    if (data?.address) {
      const road = data.address.road || data.address.neighbourhood || data.address.suburb || '';
      const area = data.address.suburb || data.address.city_district || data.address.village || '';
      const city = data.address.city || data.address.town || data.address.state_district || '';
      const postcode = data.address.postcode || '';

      const roadText = [road, area].filter(Boolean).join(', ');
      const full = data.display_name || [roadText, city, postcode].filter(Boolean).join(', ');

      return {
        fullAddress: full,
        road: roadText,
        city,
        postcode,
      };
    }
  } catch {
    // Return fallback
  }

  return {
    fullAddress: `Location at ${lat.toFixed(5)}, ${lon.toFixed(5)}`,
    road: '',
    city: '',
    postcode: '',
  };
}

// Search location by query
export async function searchAddressQuery(query: string): Promise<LocationSearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query.trim()
      )}&countrycodes=in&limit=5&addressdetails=1`,
      { headers: { 'Accept-Language': 'en,hi' } }
    );
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

// IP-based Geolocation fallback when GPS is denied or blocked by browser/iframe
export async function getIpLocationFallback(): Promise<LiveLocation | null> {
  try {
    // Try ipwho.is (CORS-friendly, no API key needed, high reliability)
    const res = await fetch('https://ipwho.is/');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.latitude && data.longitude) {
        const lat = data.latitude;
        const lon = data.longitude;
        const addressText = [data.city, data.region, data.country].filter(Boolean).join(', ');
        return {
          latitude: lat,
          longitude: lon,
          accuracy: 1000, // IP accuracy ~1km
          addressText,
          googleMapsLink: getGoogleMapsPinUrl(lat, lon),
          updatedAt: new Date().toISOString(),
        };
      }
    }
  } catch {
    // Fallback to secondary IP provider
  }

  try {
    const res2 = await fetch('https://ipapi.co/json/');
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2 && data2.latitude && data2.longitude) {
        const lat = data2.latitude;
        const lon = data2.longitude;
        const addressText = [data2.city, data2.region, data2.country_name].filter(Boolean).join(', ');
        return {
          latitude: lat,
          longitude: lon,
          accuracy: 1500,
          addressText,
          googleMapsLink: getGoogleMapsPinUrl(lat, lon),
          updatedAt: new Date().toISOString(),
        };
      }
    }
  } catch {
    // Secondary failed
  }

  return null;
}

// Comprehensive Robust Location Acquirer
// 1. Tries high accuracy GPS
// 2. Tries normal accuracy GPS
// 3. Tries IP location fallback
export async function acquireLiveLocation(
  onProgress?: (msg: string) => void
): Promise<{ location: LiveLocation | null; source: 'gps' | 'ip' | 'manual'; error?: string }> {
  // Check if browser supports geolocation
  const hasGeo = typeof window !== 'undefined' && 'navigator' in window && 'geolocation' in navigator;

  if (hasGeo) {
    onProgress?.('Connecting to GPS...');

    // Attempt 1: High Accuracy GPS (8s timeout)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 5000,
        });
      });

      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const accuracy = Math.round(pos.coords.accuracy || 15);

      onProgress?.('Fetching address name...');
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
      console.warn('High-accuracy GPS attempt failed, trying standard accuracy...', gpsError);

      // Attempt 2: Standard Accuracy (15s timeout)
      if (gpsError?.code !== 1) {
        // Only if not explicitly denied by user
        try {
          onProgress?.('Locking device network location...');
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 15000,
              maximumAge: 30000,
            });
          });

          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const accuracy = Math.round(pos.coords.accuracy || 50);
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
          // Standard also failed
        }
      }
    }
  }

  // Attempt 3: IP Location Fallback
  onProgress?.('Checking location...');
  const ipLoc = await getIpLocationFallback();
  if (ipLoc) {
    // Check distance: if IP location is hundreds of kilometers away (e.g. Delhi ISP gateway),
    // do not force a wrong city on the customer.
    const distFromRest = calculateDistanceKm(
      RESTAURANT_COORDINATES.latitude,
      RESTAURANT_COORDINATES.longitude,
      ipLoc.latitude,
      ipLoc.longitude
    );

    // If within reasonable area (<80km), accept network location
    if (distFromRest < 80) {
      return {
        location: ipLoc,
        source: 'ip',
        error: 'Approximate network location detected. Please drag pin to your exact building.',
      };
    }
  }

  // Return default restaurant area if GPS unavailable
  return {
    location: null,
    source: 'manual',
    error: 'Please tap "GPS Pin" or click on the map to set your delivery doorstep.',
  };
}
