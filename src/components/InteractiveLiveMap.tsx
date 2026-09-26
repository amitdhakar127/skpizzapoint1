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
  Maximize2,
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

interface InteractiveLiveMapProps {
  mode: 'picker' | 'tracker' | 'admin-view';
  customerLocation?: LiveLocation | null;
  riderLocation?: LiveLocation | null;
  onLocationChange?: (location: LiveLocation) => void;
  height?: string;
  orderId?: string;
  orderStatus?: string;
}

export const InteractiveLiveMap: React.FC<InteractiveLiveMapProps> = ({
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

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

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
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(t);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Customer Marker & Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (customerLocation) {
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

      if (riderLocation) {
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

      // Fit bounds to show both restaurant and customer if in tracker mode
      if (mode === 'tracker' || mode === 'admin-view') {
        const group = L.featureGroup([
          restaurantMarkerRef.current!,
          customerMarkerRef.current!,
          ...(riderMarkerRef.current ? [riderMarkerRef.current] : []),
        ]);
        map.fitBounds(group.getBounds().pad(0.2));
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
  }, [customerLocation, mode]);

  // Update Rider Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (riderLocation) {
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
  }, [riderLocation]);

  // Helper when pin is moved/clicked
  const handlePinMoved = async (lat: number, lon: number) => {
    const rev = await reverseGeocodeCoords(lat, lon);
    const updatedLoc: LiveLocation = {
      latitude: lat,
      longitude: lon,
      accuracy: 10,
      addressText: rev.road || rev.fullAddress,
      googleMapsLink: getGoogleMapsPinUrl(lat, lon),
      updatedAt: new Date().toISOString(),
    };

    onLocationChange?.(updatedLoc);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([lat, lon]);
    }
  };

  // Search Address Handle
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchAddressQuery(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
    setSearchOpen(true);
  };

  const handleSelectSearchResult = (res: LocationSearchResult) => {
    handlePinMoved(res.lat, res.lon);
    setSearchOpen(false);
    setSearchQuery(res.name);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([res.lat, res.lon], 16);
    }
  };

  // Locate current device button
  const handleLocateMe = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return;
    setIsLocatingDevice(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingDevice(false);
        handlePinMoved(pos.coords.latitude, pos.coords.longitude);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([pos.coords.latitude, pos.coords.longitude], 16);
        }
      },
      () => {
        setIsLocatingDevice(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Calculations
  const distanceKm = customerLocation
    ? calculateDistanceKm(
        RESTAURANT_COORDINATES.latitude,
        RESTAURANT_COORDINATES.longitude,
        customerLocation.latitude,
        customerLocation.longitude
      )
    : null;

  const etaMinutes = distanceKm !== null ? estimateEtaMinutes(distanceKm) : null;

  return (
    <div className="relative rounded-2xl overflow-hidden border-2 border-amber-300/80 shadow-md bg-neutral-100">
      {/* Search Bar in Picker Mode */}
      {mode === 'picker' && (
        <div className="absolute top-3 left-3 right-3 z-[1000] space-y-1">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center shadow-lg">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!searchOpen) setSearchOpen(true);
              }}
              placeholder="Search colony, street, or landmark (e.g. Sector 14, Main Road)..."
              className="w-full pl-9 pr-24 py-2.5 rounded-xl bg-white border border-amber-300 text-xs font-semibold text-[#1E1915] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />

            <div className="absolute right-1.5 flex items-center gap-1">
              <button
                type="submit"
                disabled={isSearching}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] shadow-xs cursor-pointer"
              >
                {isSearching ? 'Searching...' : 'Find'}
              </button>
            </div>
          </form>

          {/* Search Results Dropdown */}
          {searchOpen && searchResults.length > 0 && (
            <div className="bg-white rounded-xl border border-amber-200 shadow-xl max-h-48 overflow-y-auto divide-y divide-amber-100 text-xs">
              {searchResults.map((res) => (
                <button
                  key={res.placeId}
                  type="button"
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full text-left p-2.5 hover:bg-amber-50 transition-colors flex items-start gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#1E1915]">{res.name}</strong>
                    <span className="text-[10px] text-[#6B5B4F] line-clamp-1">{res.displayName}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Map Container Element */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} className="z-0" />

      {/* Floating Map Controls */}
      <div className="absolute bottom-3 right-3 z-[1000] flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="w-8 h-8 rounded-xl bg-white text-neutral-800 shadow-md border border-neutral-200 flex items-center justify-center font-bold hover:bg-neutral-50 active:scale-95 cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomOut()}
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
