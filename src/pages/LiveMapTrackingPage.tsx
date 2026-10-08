import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  ArrowLeft,
  Navigation,
  Compass,
  Phone,
  MessageCircle,
  ExternalLink,
  RotateCw,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  Crosshair,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { useApp, normalizeOrder, isOrderLocked } from '../context/AppContext';
import { Order, LiveLocation } from '../types';
import { rtdb } from '../lib/firebase';
import { ref, onValue, off, get } from 'firebase/database';
import {
  RESTAURANT_COORDINATES,
  calculateDistanceKm,
  estimateEtaMinutes,
  getGoogleMapsNavigationUrl,
  STORE_GOOGLE_MAPS_URL,
} from '../lib/locationService';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface LiveMapTrackingPageProps {
  orderIdParam?: string;
}

const LiveMapTrackingPageInternal: React.FC<LiveMapTrackingPageProps> = ({ orderIdParam }) => {
  const {
    myOrders,
    activeOrder,
    navigate,
    formatPrice,
    settings,
    showToast,
    updateOrderLocation,
  } = useApp();

  // Extract clean order ID
  const cleanIdFromUrl = () => {
    if (orderIdParam) return orderIdParam.trim();
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const match = hash.match(/(?:live-track|track)[-/]([A-Za-z0-9_-]+)/i);
      if (match && match[1]) return match[1];
      const direct = hash.replace(/^#\/?(?:live-track-|track-)?/, '').replace(/^\/?track\//, '');
      if (direct && !direct.includes('/')) return direct;
    }
    return '';
  };

  const [targetId, setTargetId] = useState<string>(cleanIdFromUrl);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [adminLiveLoc, setAdminLiveLoc] = useState<LiveLocation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCenteringGps, setIsCenteringGps] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);
  const restaurantMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Auto-detect targetId if not passed
  useEffect(() => {
    const fromUrl = cleanIdFromUrl();
    if (fromUrl) {
      setTargetId(fromUrl);
    } else if (activeOrder && activeOrder.id) {
      setTargetId(activeOrder.id);
    } else if (myOrders && myOrders.length > 0) {
      setTargetId(myOrders[0].id);
    }
  }, [orderIdParam, activeOrder, myOrders]);

  // Real-time listener for this order from Firebase RTDB
  useEffect(() => {
    if (!targetId) {
      setIsLoading(false);
      return;
    }

    // 1. Try local cache first for instant display
    const localMatch = (myOrders || []).find(
      (o) => o && o.id && o.id.toUpperCase() === targetId.toUpperCase()
    );
    if (localMatch) {
      setCurrentOrder(localMatch);
    }

    if (!rtdb) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const orderRef = ref(rtdb, `orders/${targetId}`);
    const unsubscribeOrder = onValue(
      orderRef,
      (snapshot) => {
        setIsLoading(false);
        if (snapshot.exists()) {
          const normalized = normalizeOrder(snapshot.val());
          if (normalized) {
            setCurrentOrder(normalized);
          }
        }
      },
      () => {
        setIsLoading(false);
      }
    );

    // Also listen to system/adminLiveLocation as live fallback for delivery boy
    const adminLocRef = ref(rtdb, 'system/adminLiveLocation');
    const unsubscribeAdminLoc = onValue(adminLocRef, (snap) => {
      if (snap.exists()) {
        const val = snap.val() as LiveLocation;
        if (val && typeof val.latitude === 'number' && typeof val.longitude === 'number') {
          setAdminLiveLoc(val);
        }
      }
    });

    return () => {
      off(orderRef);
      off(adminLocRef);
    };
  }, [targetId, myOrders]);

  // Rider coordinates (from order or fallback to system admin location)
  const riderLoc: LiveLocation | null =
    currentOrder?.deliveryRiderLocation || adminLiveLoc || null;

  // Customer coordinates (from order or restaurant fallback)
  const customerLoc: LiveLocation | null = currentOrder?.customerLocation || null;

  // Has the order been picked up?
  // Only activate live map if status is 'Out for delivery' / 'Ready for Pickup', and not past 10m completion lock
  const isCompletedLocked = isOrderLocked(currentOrder);
  const isPickedUp =
    !isCompletedLocked &&
    (currentOrder?.status === 'Out for delivery' ||
     currentOrder?.status === 'Ready for Pickup');

  // Distance and ETA
  const distanceKm =
    customerLoc && riderLoc
      ? calculateDistanceKm(
          customerLoc.latitude,
          customerLoc.longitude,
          riderLoc.latitude,
          riderLoc.longitude
        )
      : null;

  const etaMinutes = distanceKm !== null ? estimateEtaMinutes(distanceKm) : null;

  // DivIcons for crisp styling
  const createCustomerIcon = () =>
    L.divIcon({
      className: 'live-map-customer-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
          <div style="background: #10B981; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: 800; font-size: 11px; font-family: sans-serif; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4); border: 2px solid white; white-space: nowrap; margin-bottom: 3px;">
            📍 You (Delivery Point)
          </div>
          <div style="width: 38px; height: 38px; background: #10B981; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 14px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; font-size: 18px;">
            🏠
          </div>
          <div style="width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 9px solid #10B981; margin-top: -2px;"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

  const createRiderIcon = (speed?: number | null) =>
    L.divIcon({
      className: 'live-map-rider-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
          <div style="background: #2563EB; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: 800; font-size: 11px; font-family: sans-serif; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4); border: 2px solid white; white-space: nowrap; margin-bottom: 3px;">
            🛵 Delivery Boy ${speed ? `(${speed} km/h)` : '(Live)'}
          </div>
          <div style="width: 42px; height: 42px; background: #1D4ED8; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.3); display: flex; align-items: center; justify-content: center; font-size: 22px;">
            🛵
          </div>
          <div style="width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 9px solid #1D4ED8; margin-top: -2px;"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

  const createRestaurantIcon = () =>
    L.divIcon({
      className: 'live-map-kitchen-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
          <div style="background: #D97706; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: 800; font-size: 11px; font-family: sans-serif; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.4); border: 2px solid white; white-space: nowrap; margin-bottom: 3px;">
            🍕 SK Pizza Kitchen
          </div>
          <div style="width: 38px; height: 38px; background: #F59E0B; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 18px;">
            🍕
          </div>
          <div style="width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 9px solid #F59E0B; margin-top: -2px;"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

  // Initialize Leaflet Map only when order is picked up
  useEffect(() => {
    if (!isPickedUp || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      const container = mapContainerRef.current as any;
      if (container._leaflet_id) {
        delete container._leaflet_id;
      }

      const initialLat = riderLoc?.latitude || customerLoc?.latitude || RESTAURANT_COORDINATES.latitude;
      const initialLon = riderLoc?.longitude || customerLoc?.longitude || RESTAURANT_COORDINATES.longitude;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLon],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Restaurant Pin
      const restMarker = L.marker(
        [RESTAURANT_COORDINATES.latitude, RESTAURANT_COORDINATES.longitude],
        { icon: createRestaurantIcon() }
      ).addTo(map);
      restaurantMarkerRef.current = restMarker;

      mapInstanceRef.current = map;

      const timer = setTimeout(() => {
        try {
          map.invalidateSize();
        } catch {}
      }, 300);

      return () => {
        clearTimeout(timer);
        try {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
          }
        } catch {}
        if (container?._leaflet_id) {
          delete container._leaflet_id;
        }
      };
    } catch (err) {
      console.warn('Map initialization error:', err);
    }
  }, [isPickedUp]);

  // Update Customer Marker & Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isPickedUp) return;

    try {
      if (customerLoc && typeof customerLoc.latitude === 'number' && typeof customerLoc.longitude === 'number') {
        const lat = customerLoc.latitude;
        const lon = customerLoc.longitude;

        if (!customerMarkerRef.current) {
          customerMarkerRef.current = L.marker([lat, lon], {
            icon: createCustomerIcon(),
          }).addTo(map);
        } else {
          customerMarkerRef.current.setLatLng([lat, lon]);
        }
      }

      // Update Rider Marker
      if (riderLoc && typeof riderLoc.latitude === 'number' && typeof riderLoc.longitude === 'number') {
        const rLat = riderLoc.latitude;
        const rLon = riderLoc.longitude;

        if (!riderMarkerRef.current) {
          riderMarkerRef.current = L.marker([rLat, rLon], {
            icon: createRiderIcon(riderLoc.speed),
          }).addTo(map);
        } else {
          riderMarkerRef.current.setLatLng([rLat, rLon]);
          riderMarkerRef.current.setIcon(createRiderIcon(riderLoc.speed));
        }
      }

      // Route line
      const points: [number, number][] = [];
      if (riderLoc) {
        points.push([riderLoc.latitude, riderLoc.longitude]);
      } else {
        points.push([RESTAURANT_COORDINATES.latitude, RESTAURANT_COORDINATES.longitude]);
      }

      if (customerLoc) {
        points.push([customerLoc.latitude, customerLoc.longitude]);
      }

      if (points.length >= 2) {
        if (routePolylineRef.current) {
          routePolylineRef.current.setLatLngs(points);
        } else {
          routePolylineRef.current = L.polyline(points, {
            color: '#2563EB',
            weight: 5,
            opacity: 0.85,
            dashArray: '8, 8',
          }).addTo(map);
        }

        // Fit bounds smoothly to show both markers
        const bounds = L.latLngBounds(points);
        if (bounds.isValid()) {
          map.fitBounds(bounds.pad(0.25), { maxZoom: 16 });
        }
      }
    } catch (err) {
      console.warn('Map markers update error:', err);
    }
  }, [customerLoc, riderLoc, isPickedUp]);

  // "You Location" GPS Button (Google Maps Style crosshairs)
  // When clicked, fetches user device GPS, updates customer pin, and flies map to their location!
  const handleLocateMe = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      showToast('GPS geolocation not supported on this device', 'error');
      return;
    }

    setIsCenteringGps(true);
    showToast('Locating your GPS position...', 'info');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsCenteringGps(false);
        const { latitude, longitude, accuracy } = pos.coords;

        // Smoothly fly camera to user GPS
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 17, {
            animate: true,
            duration: 1.2,
          });
        }

        // Update local and order location
        const updatedLoc: LiveLocation = {
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          addressText: currentOrder?.deliveryAddress || 'Current GPS Location',
          updatedAt: new Date().toISOString(),
          googleMapsLink: `https://maps.google.com/?q=${latitude},${longitude}`,
        };

        if (currentOrder) {
          updateOrderLocation(currentOrder.id, updatedLoc, false);
        }

        showToast('✓ Located your current GPS position!', 'success');
      },
      (err) => {
        setIsCenteringGps(false);
        showToast(`Could not access GPS: ${err.message}`, 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const itemsList = currentOrder?.items || [];
  const customerPhone = currentOrder?.customerPhone || '';
  const storePhone = settings.whatsAppNumber || '+919617142439';

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-4 sm:py-8 px-2 sm:px-4 flex flex-col items-center">
      {/* 4:6 Aspect Ratio Container: Clean, Modern, Screen-Full Responsive */}
      <div className="w-full max-w-[500px] min-h-[85vh] bg-white rounded-3xl sm:rounded-[36px] border-2 border-amber-300 shadow-2xl flex flex-col overflow-hidden relative">
        {/* Top App Header */}
        <div className="bg-[#181411] text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-neutral-800">
          <button
            type="button"
            onClick={() => navigate('/my-orders')}
            className="p-2 -ml-1 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Orders</span>
          </button>

          <div className="text-center">
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 block">
              LIVE GPS TRACKER
            </span>
            <h2 className="text-sm sm:text-base font-black font-mono tracking-tight">
              #{currentOrder ? currentOrder.id : targetId || 'TRACK'}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 -mr-1 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors text-xs font-bold cursor-pointer"
          >
            Home
          </button>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="p-12 text-center space-y-3 flex-1 flex flex-col items-center justify-center">
            <RotateCw className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-xs font-bold text-[#55473E]">Connecting to kitchen & delivery radar...</p>
          </div>
        )}

        {/* Order Not Found */}
        {!isLoading && !currentOrder && (
          <div className="p-8 text-center space-y-4 flex-1 flex flex-col items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-amber-300 mx-auto" />
            <h3 className="font-black text-base text-[#1E1915]">Order Not Found</h3>
            <p className="text-xs text-[#6B5B4F] max-w-xs">
              Please check your Order ID or select from your recent orders list.
            </p>
            <button
              type="button"
              onClick={() => navigate('/my-orders')}
              className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-md"
            >
              Go to My Orders
            </button>
          </div>
        )}

        {/* ORDER FOUND: Condition 1 - NOT PICKED UP YET */}
        {!isLoading && currentOrder && !isPickedUp && (
          <div className="p-5 sm:p-6 space-y-5 flex-1 flex flex-col justify-between overflow-y-auto">
            {/* Status Notice Banner */}
            <div className="p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 text-center space-y-3 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center mx-auto shadow-md ring-6 ring-amber-200/70 animate-bounce">
                <span className="text-2xl">🍕</span>
              </div>
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-950">
                  {currentOrder.status === 'Preparing' ? '🍕 Order Accepted & Baking' : '📝 Order Received'}
                </span>
                <h3 className="text-lg font-black text-amber-950">
                  {currentOrder.status === 'Preparing'
                    ? 'Baking Fresh Mozzarella Pizza in Oven'
                    : 'Order In Process'}
                </h3>
                <p className="text-xs text-[#55473E] font-medium max-w-xs mx-auto">
                  Aapka order kitchen me prepare ho raha hai. Jaise hi delivery boy ise pickup karega, yahan <strong>Live GPS Map</strong> automatically start ho jayega!
                </p>
              </div>
            </div>

            {/* Stepper */}
            <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
              <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-950 border border-emerald-300">
                <div className="text-base mb-0.5">📝</div>
                <div>Received</div>
                <div className="text-emerald-700 font-black">✓ Done</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 ring-2 ring-amber-400 font-black shadow-xs">
                <div className="text-base mb-0.5 animate-pulse">🍕</div>
                <div>Preparing</div>
                <div className="text-[9px] uppercase">Active</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-neutral-100 text-neutral-400 border border-neutral-200">
                <div className="text-base mb-0.5">🛵</div>
                <div>Pickup</div>
                <div className="text-[9px]">Map Ready</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-neutral-100 text-neutral-400 border border-neutral-200">
                <div className="text-base mb-0.5">✅</div>
                <div>Delivered</div>
                <div className="text-[9px]">Wait</div>
              </div>
            </div>

            {/* Order Items Snapshot */}
            <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                <span className="font-black text-[#1E1915]">Order Items Summary:</span>
                <span className="font-black text-amber-900">{formatPrice(currentOrder.finalTotal)}</span>
              </div>
              <div className="divide-y divide-amber-50 text-[11px] text-[#55473E]">
                {itemsList.map((it, idx) => (
                  <div key={idx} className="py-1.5 flex justify-between">
                    <span>
                      {it.quantity}x {it.productName} ({it.size})
                    </span>
                    <span className="font-bold">₹{it.totalPrice}</span>
                  </div>
                ))}
              </div>
              {currentOrder.deliveryAddress && (
                <div className="pt-2 border-t border-amber-100 flex items-start gap-1.5 text-[11px] text-[#6B5B4F]">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{currentOrder.deliveryAddress}</span>
                </div>
              )}
            </div>

            {/* Direct Support Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <a
                href={`tel:${storePhone}`}
                className="py-2.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Kitchen</span>
              </a>

              <a
                href={`https://wa.me/${storePhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Namaste SK Pizza Point! I want an update regarding my order #${currentOrder.id}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Help</span>
              </a>
            </div>
          </div>
        )}

        {/* ORDER FOUND: Condition 2 - ORDER PICKED UP (FULL INTERACTIVE LIVE MAP ACTIVE) */}
        {!isLoading && currentOrder && isPickedUp && (
          <div className="flex-1 flex flex-col relative overflow-hidden">
            {/* Top Floating Radar Pill */}
            <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between pointer-events-none">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 text-white text-xs font-black shadow-lg border border-amber-400/50 backdrop-blur-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span>
                  {distanceKm !== null ? `🛵 ${distanceKm} km away` : '🛵 Out For Delivery'}
                </span>
                {etaMinutes !== null && (
                  <span className="text-amber-300 font-bold">• ETA ~{etaMinutes} min</span>
                )}
              </div>

              <div className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black shadow-md border border-white uppercase">
                {currentOrder.status}
              </div>
            </div>

            {/* Map Container View */}
            <div
              ref={mapContainerRef}
              className="w-full flex-1 min-h-[360px] bg-neutral-100 z-0"
              style={{ minHeight: '380px' }}
            />

            {/* Floating Controls Overlay on Map (Google Maps Style) */}
            <div className="absolute top-16 right-3 z-[1000] flex flex-col gap-2">
              {/* "You Location" / GPS Button */}
              <button
                type="button"
                onClick={handleLocateMe}
                disabled={isCenteringGps}
                className="w-10 h-10 rounded-2xl bg-white text-slate-950 shadow-xl border-2 border-emerald-500 flex items-center justify-center font-black hover:bg-emerald-50 active:scale-90 transition-transform cursor-pointer"
                title="Google Maps style: Center on You Location GPS"
              >
                <Crosshair
                  className={`w-5 h-5 text-emerald-600 ${isCenteringGps ? 'animate-spin' : ''}`}
                />
              </button>

              <button
                type="button"
                onClick={() => {
                  try {
                    mapInstanceRef.current?.zoomIn();
                  } catch {}
                }}
                className="w-9 h-9 rounded-xl bg-white text-neutral-800 shadow-md border border-neutral-300 flex items-center justify-center font-bold hover:bg-neutral-50 active:scale-95 cursor-pointer"
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
                className="w-9 h-9 rounded-xl bg-white text-neutral-800 shadow-md border border-neutral-300 flex items-center justify-center font-bold hover:bg-neutral-50 active:scale-95 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>

            {/* Floating Bottom Card / Sheet */}
            <div className="bg-white border-t-2 border-amber-300 p-4 sm:p-5 space-y-3 shrink-0 shadow-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    🛵
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-[#1E1915]">
                      Delivery Partner on the Way!
                    </h4>
                    <p className="text-[11px] text-[#6B5B4F]">
                      {currentOrder.items.map((i) => i.productName).join(', ')}
                    </p>
                  </div>
                </div>

                <span className="font-mono text-sm font-black text-amber-950">
                  {formatPrice(currentOrder.finalTotal)}
                </span>
              </div>

              {/* Delivery Address */}
              {currentOrder.deliveryAddress && (
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-1.5 text-xs text-[#55473E]">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="truncate">
                    {currentOrder.deliveryAddress}
                    {currentOrder.city ? `, ${currentOrder.city}` : ''}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-xs font-bold">
                <a
                  href={`tel:${storePhone}`}
                  className="py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-1 shadow-xs transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Store</span>
                </a>

                <a
                  href={`https://wa.me/${storePhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Namaste! I am tracking order #${currentOrder.id}. Please connect with delivery rider.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center gap-1 shadow-xs transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                {customerLoc ? (
                  <a
                    href={getGoogleMapsNavigationUrl(customerLoc.latitude, customerLoc.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-1 shadow-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Google Maps</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={handleLocateMe}
                    className="py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-1 shadow-xs transition-colors"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>My GPS</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const LiveMapTrackingPage: React.FC<LiveMapTrackingPageProps> = (props) => {
  return (
    <ErrorBoundary
      fallbackTitle="Live Map Tracker Safe Mode"
      fallbackMessage="Unable to render the live tracking radar right now. Your pizza order is safe and being prepared."
    >
      <LiveMapTrackingPageInternal {...props} />
    </ErrorBoundary>
  );
};
