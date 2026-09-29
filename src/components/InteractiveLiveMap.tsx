// Interactive Live Map Component using Leaflet & OpenStreetMap
// Supports both 'picker' mode (drag/click to set customer location + search)
// and 'tracker' mode (shows Restaurant 🍕, Rider 🛵, Customer 📍 with live route line & distance)

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  Compass,
  Search,
  RotateCw,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
} from 'lucide-react';
import { LiveLocation } from '../types';
import {
  RESTAURANT_COORDINATES,
  calculateDistanceKm,
  estimateEtaMinutes,
  getGoogleMapsNavigationUrl,
  getGoogleMapsPinUrl,
  reverseGeocodeCoords,
  searchAddressQuery,
  LocationSearchResult,
} from '../lib/locationService';
import { ErrorBoundary } from './ErrorBoundary';

interface InteractiveLiveMapProps {
  mode: 'picker' | 'tracker' | 'admin-view';
  customerLocation?: LiveLocation | null;
  riderLocation?: LiveLocation | null;
  onLocationChange?: (location: LiveLocation) => void;
  height?: string;
  orderId?: string;
  orderStatus?: string;
}

const InteractiveLiveMapInternal: React.FC<InteractiveLiveMapProps> = ({
  mode,
  customerLocation,
  riderLocation,
  onLocationChange,
  height = '340px',
  orderId,
  orderStatus,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const restaurantMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const [mapInitError, setMapInitError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isLocatingDevice, setIsLocatingDevice] = useState(false);

  // Initial center
  const initialLat = customerLocation?.latitude || RESTAURANT_COORDINATES.latitude;
  const initialLon = customerLocation?.longitude || RESTAURANT_COORDINATES.longitude;

  // Custom Div Icons for 100% reliable rendering without asset 404s
  const createCustomerIcon = () =>
    L.divIcon({
      className: 'custom-customer-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
          <div style="background: #10B981; color: white; padding: 4px 8px; border-radius: 9999px; font-weight: 800; font-size: 10px; font-family: sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2px solid white; white-space: nowrap; margin-bottom: 2px;">
            📍 Delivery Point
          </div>
          <div style="width: 34px; height: 34px; background: #10B981; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5); display: flex; align-items: center; justify-content: center; font-size: 16px;">
            🏠
          </div>
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #10B981; margin-top: -2px;"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

  const createRestaurantIcon = () =>
    L.divIcon({
      className: 'custom-restaurant-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
          <div style="background: #D97706; color: white; padding: 4px 8px; border-radius: 9999px; font-weight: 800; font-size: 10px; font-family: sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2px solid white; white-space: nowrap; margin-bottom: 2px;">
            🍕 SK Pizza Kitchen
          </div>
          <div style="width: 36px; height: 36px; background: #F59E0B; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.5); display: flex; align-items: center; justify-content: center; font-size: 18px;">
            🍕
          </div>
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #F59E0B; margin-top: -2px;"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

  const createRiderIcon = (speed?: number | null) =>
    L.divIcon({
      className: 'custom-rider-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
          <div style="background: #3B82F6; color: white; padding: 4px 8px; border-radius: 9999px; font-weight: 800; font-size: 10px; font-family: sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2px solid white; white-space: nowrap; margin-bottom: 2px;">
            🛵 Rider ${speed ? `(${speed} km/h)` : '(Moving)'}
          </div>
          <div style="width: 36px; height: 36px; background: #2563EB; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.6); display: flex; align-items: center; justify-content: center; font-size: 18px; animation: pulse 2s infinite;">
            🛵
          </div>
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #2563EB; margin-top: -2px;"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

  // Initialize Map safely
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      // Clear any prior leaflet id left on the DOM node to prevent "Map container is already initialized"
      const container = mapContainerRef.current as any;
      if (container._leaflet_id) {
        delete container._leaflet_id;
      }

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLon],
        zoom: customerLocation ? 15 : 13,
        zoomControl: false,
        attributionControl: false,
      });

      // Clean OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Add Restaurant Marker
      const restMarker = L.marker(
        [RESTAURANT_COORDINATES.latitude, RESTAURANT_COORDINATES.longitude],
        { icon: createRestaurantIcon() }
      ).addTo(map);
      restMarker.bindPopup(`<b>SK Pizza Point</b><br/>${RESTAURANT_COORDINATES.address}`);
      restaurantMarkerRef.current = restMarker;

      // In Picker mode: allow clicking anywhere to set customer pin
      if (mode === 'picker') {
        map.on('click', async (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          handlePinMoved(lat, lng);
        });
      }

      mapInstanceRef.current = map;

      // Invalidate size shortly after mounting to fix any render glitches
      const t = setTimeout(() => {
        try {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        } catch {}
      }, 250);

      return () => {
        clearTimeout(t);
        try {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
          }
        } catch (cleanupErr) {
          console.warn('Map cleanup error:', cleanupErr);
          mapInstanceRef.current = null;
        }
        if (container?._leaflet_id) {
          delete container._leaflet_id;
        }
      };
    } catch (initErr) {
      console.error('Leaflet map initialization failed:', initErr);
      setMapInitError('Interactive map viewer fallback active');
    }
  }, []);

  // Update Customer Marker & Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    try {
      if (customerLocation && typeof customerLocation.latitude === 'number' && typeof customerLocation.longitude === 'number') {
        const lat = customerLocation.latitude;
        const lon = customerLocation.longitude;

        if (!customerMarkerRef.current) {
          const marker = L.marker([lat, lon], {
            icon: createCustomerIcon(),
            draggable: mode === 'picker',
          }).addTo(map);

          if (mode === 'picker') {
            marker.on('dragend', () => {
              const pos = marker.getLatLng();
              handlePinMoved(pos.lat, pos.lng);
            });
          }

          customerMarkerRef.current = marker;
        } else {
          customerMarkerRef.current.setLatLng([lat, lon]);
        }

        // Update route line between restaurant and customer
        const routePoints: [number, number][] = [
          [RESTAURANT_COORDINATES.latitude, RESTAURANT_COORDINATES.longitude],
        ];

        if (riderLocation && typeof riderLocation.latitude === 'number' && typeof riderLocation.longitude === 'number') {
          routePoints.push([riderLocation.latitude, riderLocation.longitude]);
        }
        routePoints.push([lat, lon]);

        if (routePolylineRef.current) {
          routePolylineRef.current.setLatLngs(routePoints);
        } else {
          routePolylineRef.current = L.polyline(routePoints, {
            color: '#F59E0B',
            weight: 4,
            opacity: 0.85,
            dashArray: '8, 8',
          }).addTo(map);
        }

        // Fit bounds safely to show both restaurant and customer if in tracker mode
        if (mode === 'tracker' || mode === 'admin-view') {
          const validLayers: L.Layer[] = [];
          if (restaurantMarkerRef.current) validLayers.push(restaurantMarkerRef.current);
          if (customerMarkerRef.current) validLayers.push(customerMarkerRef.current);
          if (riderMarkerRef.current) validLayers.push(riderMarkerRef.current);

          if (validLayers.length > 0) {
            const group = L.featureGroup(validLayers);
            const bounds = group.getBounds();
            if (bounds.isValid()) {
              map.fitBounds(bounds.pad(0.2), { maxZoom: 16, animate: false });
            }
          }
        }
      } else {
        if (customerMarkerRef.current) {
          customerMarkerRef.current.remove();
          customerMarkerRef.current = null;
        }
        if (routePolylineRef.current) {
          routePolylineRef.current.remove();
          routePolylineRef.current = null;
        }
      }
    } catch (updateErr) {
      console.warn('Customer marker update error:', updateErr);
    }
  }, [customerLocation, mode]);

  // Update Rider Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    try {
      if (riderLocation && typeof riderLocation.latitude === 'number' && typeof riderLocation.longitude === 'number') {
        if (!riderMarkerRef.current) {
          const marker = L.marker([riderLocation.latitude, riderLocation.longitude], {
            icon: createRiderIcon(riderLocation.speed),
          }).addTo(map);
          riderMarkerRef.current = marker;
        } else {
          riderMarkerRef.current.setLatLng([riderLocation.latitude, riderLocation.longitude]);
          riderMarkerRef.current.setIcon(createRiderIcon(riderLocation.speed));
        }
      } else if (riderMarkerRef.current) {
        riderMarkerRef.current.remove();
        riderMarkerRef.current = null;
      }
    } catch (riderErr) {
      console.warn('Rider marker update error:', riderErr);
    }
  }, [riderLocation]);

  // Helper when pin is moved/clicked
  const handlePinMoved = async (lat: number, lon: number) => {
    if (!onLocationChange) return;

    const address = await reverseGeocodeCoords(lat, lon);
    const newLoc: LiveLocation = {
      latitude: lat,
      longitude: lon,
      addressText: typeof address === 'string' ? address : address.fullAddress,
      updatedAt: new Date().toISOString(),
      googleMapsLink: getGoogleMapsPinUrl(lat, lon),
    };
    onLocationChange(newLoc);
  };

  // Locate current device GPS
  const handleLocateMe = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocatingDevice(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16);
        }
        if (onLocationChange) {
          const address = await reverseGeocodeCoords(latitude, longitude);
          onLocationChange({
            latitude,
            longitude,
            accuracy: Math.round(accuracy),
            addressText: typeof address === 'string' ? address : address.fullAddress,
            updatedAt: new Date().toISOString(),
            googleMapsLink: getGoogleMapsPinUrl(latitude, longitude),
          });
        }
        setIsLocatingDevice(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocatingDevice(false);
        alert('Could not access device GPS. Please check location permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Search address query
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchOpen(true);
    const results = await searchAddressQuery(searchQuery.trim());
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelectSearchResult = async (result: LocationSearchResult) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([result.lat, result.lon], 16);
    }
    if (onLocationChange) {
      onLocationChange({
        latitude: result.lat,
        longitude: result.lon,
        addressText: result.displayName,
        updatedAt: new Date().toISOString(),
        googleMapsLink: getGoogleMapsPinUrl(result.lat, result.lon),
      });
    }
    setSearchOpen(false);
    setSearchQuery(result.displayName.split(',')[0]);
  };

  const distanceKm = customerLocation
    ? calculateDistanceKm(
        RESTAURANT_COORDINATES.latitude,
        RESTAURANT_COORDINATES.longitude,
        customerLocation.latitude,
        customerLocation.longitude
      )
    : null;

  const etaMinutes = distanceKm !== null ? estimateEtaMinutes(distanceKm) : null;

  // Fallback UI if WebGL or Leaflet encounters an initialization error
  if (mapInitError) {
    return (
      <div
        style={{ height, minHeight: '220px' }}
        className="w-full rounded-2xl bg-neutral-900 border border-neutral-700 p-5 flex flex-col justify-between text-white"
      >
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <h4 className="font-black text-sm text-amber-400">Live GPS Navigation Route</h4>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-300">
            Direct GPS Active
          </span>
        </div>

        <div className="space-y-3 my-auto py-2">
          <div className="p-3 rounded-xl bg-neutral-800 border border-neutral-700 space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">
              📍 Customer Delivery Point
            </span>
            <p className="text-xs text-neutral-200">
              {customerLocation?.addressText || 'GPS Coordinates pinned'}
            </p>
            {customerLocation && (
              <p className="font-mono text-[11px] text-neutral-400">
                {customerLocation.latitude.toFixed(5)}, {customerLocation.longitude.toFixed(5)}
              </p>
            )}
          </div>

          <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/40 flex items-center justify-between text-xs">
            <span className="text-amber-200 font-bold">Kitchen: SK Pizza Point</span>
            {distanceKm !== null && (
              <span className="text-amber-300 font-extrabold">{distanceKm} km away • ~{etaMinutes} min</span>
            )}
          </div>
        </div>

        {customerLocation && (
          <a
            href={getGoogleMapsNavigationUrl(customerLocation.latitude, customerLocation.longitude)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <Navigation className="w-4 h-4" />
            <span>Open in Google Maps Navigation (रास्ता देखें)</span>
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-amber-300 shadow-md bg-neutral-100">
      {/* Picker Search Overlay */}
      {mode === 'picker' && (
        <div className="absolute top-3 left-3 right-3 z-[1000] space-y-1">
          <form onSubmit={handleSearchSubmit} className="flex gap-1.5 shadow-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search area, landmark or street in town..."
                className="w-full pl-9 pr-3 py-2 bg-white/95 backdrop-blur-md rounded-xl text-xs font-semibold text-neutral-800 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer shrink-0"
            >
              {isSearching ? '...' : 'Search'}
            </button>
          </form>

          {/* Search Results Dropdown */}
          {searchOpen && searchResults.length > 0 && (
            <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 max-h-48 overflow-y-auto divide-y divide-neutral-100 text-xs">
              {searchResults.map((r, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchResult(r)}
                  className="w-full p-2.5 text-left hover:bg-amber-50 transition-colors flex items-start gap-2 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span className="truncate text-neutral-700 font-medium">{r.displayName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Map Container Element */}
      <div ref={mapContainerRef} style={{ height, width: '100%', minHeight: '220px' }} className="z-0" />

      {/* Floating Map Controls */}
      <div className="absolute bottom-3 right-3 z-[1000] flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => {
            try {
              mapInstanceRef.current?.zoomIn();
            } catch {}
          }}
          className="w-8 h-8 rounded-xl bg-white text-neutral-800 shadow-md border border-neutral-200 flex items-center justify-center font-bold hover:bg-neutral-50 active:scale-95 cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            try {
              mapInstanceRef.current?.zoomOut();
            } catch {}
          }}
          className="w-8 h-8 rounded-xl bg-white text-neutral-800 shadow-md border border-neutral-200 flex items-center justify-center font-bold hover:bg-neutral-50 active:scale-95 cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {mode === 'picker' && (
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocatingDevice}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] shadow-md flex items-center gap-1 cursor-pointer active:scale-95"
            title="Locate device GPS"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLocatingDevice ? 'animate-spin' : ''}`} />
            <span>GPS Pin</span>
          </button>
        )}
      </div>

      {/* Live Distance & ETA Banner for Tracker & Admin modes */}
      {(mode === 'tracker' || mode === 'admin-view') && customerLocation && (
        <div className="absolute top-3 left-3 right-3 z-[1000] pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/90 text-white text-xs font-bold shadow-lg border border-amber-400/40 backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <Navigation className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {distanceKm !== null ? `${distanceKm} km from Kitchen` : 'Live Route Active'}
            </span>
            {etaMinutes !== null && (
              <span className="text-amber-300">• Est. Arrival ~{etaMinutes} mins</span>
            )}
          </div>
        </div>
      )}

      {/* Bottom Bar Info */}
      <div className="p-3 bg-white border-t border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-[#55473E] min-w-0">
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="truncate">
            {customerLocation?.addressText ||
              (mode === 'picker'
                ? '📍 Click or drag pin to select your exact delivery address'
                : 'Delivery address pinned')}
          </span>
        </div>

        {customerLocation && (
          <a
            href={getGoogleMapsNavigationUrl(customerLocation.latitude, customerLocation.longitude)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-[11px] inline-flex items-center gap-1 shrink-0 transition-colors shadow-xs"
          >
            <span>Google Maps Navigation</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};

export const InteractiveLiveMap: React.FC<InteractiveLiveMapProps> = (props) => {
  return (
    <ErrorBoundary
      fallbackTitle="Map Route Preview"
      fallbackMessage="Map rendering safely adjusted. Direct Google Maps navigation is available below."
    >
      <InteractiveLiveMapInternal {...props} />
    </ErrorBoundary>
  );
};
