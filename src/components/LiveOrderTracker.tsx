import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Clock,
  CheckCircle2,
  Check,
  AlertCircle,
  ExternalLink,
  Radio,
  Phone,
  RotateCw,
  Compass,
  Calendar,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Order, OrderStatus, LiveLocation } from '../types';
import { useApp } from '../context/AppContext';
import { InteractiveLiveMap } from './InteractiveLiveMap';
import { ErrorBoundary } from './ErrorBoundary';

interface LiveOrderTrackerProps {
  order: Order;
  isAdminView?: boolean;
}

// Haversine formula to compute distance in km between two GPS coordinates
function computeDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in km
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

const LiveOrderTrackerInternal: React.FC<LiveOrderTrackerProps> = ({ order, isAdminView = false }) => {
  const { updateOrderLocation, showToast } = useApp();
  const [isWatchingRider, setIsWatchingRider] = useState(false);
  const [isUpdatingCustomerLoc, setIsUpdatingCustomerLoc] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const customerLoc = order.customerLocation;
  const riderLoc = order.deliveryRiderLocation;

  // Calculate real-time distance and estimated ETA if both coordinates exist
  const distanceKm =
    customerLoc && riderLoc
      ? computeDistanceKm(
          customerLoc.latitude,
          customerLoc.longitude,
          riderLoc.latitude,
          riderLoc.longitude
        )
      : null;

  // Rough bike delivery speed ~20 km/h in Indian town streets + 2 mins buffer
  const etaMinutes = distanceKm !== null ? Math.max(2, Math.round((distanceKm / 20) * 60) + 2) : null;

  // Toggle delivery rider live GPS sharing from device
  const toggleRiderLiveGps = () => {
    if (isWatchingRider) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsWatchingRider(false);
      showToast('🛵 Rider live GPS broadcast paused.', 'info');
    } else {
      if (!('geolocation' in navigator)) {
        showToast('Geolocation is not supported by your device browser', 'error');
        return;
      }

      showToast('Starting high-accuracy GPS tracking for delivery...', 'info');
      setIsWatchingRider(true);

      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const loc: LiveLocation = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
            heading: pos.coords.heading,
            speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : null, // km/h
            updatedAt: new Date().toISOString(),
          };
          updateOrderLocation(order.id, loc, true);
        },
        (err) => {
          console.warn('Rider geolocation error:', err);
          showToast(`GPS Access: ${err.message}`, 'error');
          setIsWatchingRider(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 15000,
        }
      );
      watchIdRef.current = id;
      showToast('🟢 Live Rider Location Broadcasting to Customer!', 'success');
    }
  };

  // Allow customer to refresh / share their exact live GPS
  const handleUpdateCustomerLocation = () => {
    if (!('geolocation' in navigator)) {
      showToast('Geolocation not supported by device', 'error');
      return;
    }

    setIsUpdatingCustomerLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: LiveLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          updatedAt: new Date().toISOString(),
          googleMapsLink: `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`,
        };
        updateOrderLocation(order.id, loc, false);
        setIsUpdatingCustomerLoc(false);
        showToast('✓ Your exact live GPS location updated for the rider!', 'success');
      },
      (err) => {
        setIsUpdatingCustomerLoc(false);
        showToast(`Could not get location: ${err.message}`, 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Status timeline steps
  const steps: { key: OrderStatus; label: string; icon: string }[] = [
    { key: 'Pending', label: 'Order Received', icon: '📝' },
    { key: 'Preparing', label: 'Kitchen Preparing', icon: '🍕' },
    { key: 'Out for delivery', label: 'Out for Delivery', icon: '🛵' },
    { key: 'Delivered', label: 'Delivered Fresh', icon: '🎉' },
  ];

  const getStepStatus = (stepKey: OrderStatus) => {
    const current = order.status;
    const rank: Record<string, number> = {
      Draft: 0,
      'Awaiting WhatsApp submission': 0,
      Pending: 1,
      Received: 1,
      'Confirmed by restaurant': 1,
      Preparing: 2,
      Ready: 2,
      'Out for delivery': 3,
      Delivered: 4,
      Completed: 4,
      Cancelled: -1,
    };

    const currentRank = rank[current] ?? 1;
    const stepRank = rank[stepKey] ?? 1;

    if (current === 'Cancelled') return 'cancelled';
    if (currentRank > stepRank) return 'completed';
    if (currentRank === stepRank) return 'active';
    return 'pending';
  };

  const isDelivery = order.orderType === 'delivery';

  return (
    <div className="bg-white rounded-3xl border border-amber-200/90 shadow-lg p-5 sm:p-7 space-y-6">
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h3 className="text-base sm:text-lg font-black text-[#1E1915]">
              Real-Time Order & Delivery Tracker
            </h3>
          </div>
          <p className="text-xs text-[#6B5B4F] mt-0.5">
            Order #{order.id} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
            {order.status}
          </span>
          {order.paymentStatus && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-neutral-100 text-[#55473E]">
              {order.paymentStatus}
            </span>
          )}
        </div>
      </div>

      {/* COMPLETED BANNER: Big Round Green Circle with Green Writing & Permanent Date/Time */}
      {(order.status === 'Delivered' || order.status === 'Completed') && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-emerald-50 to-emerald-100/70 border-2 border-emerald-400 text-center space-y-4 shadow-md">
          {/* Big Round Green Circle with Bold White Right Check */}
          <div className="relative inline-block">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-2xl ring-8 ring-emerald-200/80">
              <Check className="w-12 h-12 sm:w-14 sm:h-14 stroke-[3.5]" />
            </div>
            <div className="absolute -top-1 -right-1 bg-white p-1 rounded-full shadow-md text-emerald-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-200 text-emerald-950 text-xs font-black uppercase tracking-wider">
              <span>✓ Order Completed Successfully</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-800">
              Order Delivered! (Order Completed)
            </h3>
            <p className="text-xs sm:text-sm text-emerald-900/90 font-medium max-w-md mx-auto">
              Your food order has been successfully delivered fresh to your address. Thank you for choosing SK Pizza Point!
            </p>
          </div>

          {/* Permanent Date & Time Record Stamped Forever */}
          <div className="pt-3 border-t border-emerald-300/80 flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-emerald-950">
            <div className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-xl border border-emerald-300 shadow-xs">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Order Date: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-xl border border-emerald-300 shadow-xs">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Delivered Time: {new Date(order.updatedAt || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-xl border border-emerald-300 shadow-xs font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ID: #{order.id} (Permanent Record)</span>
            </div>
          </div>
        </div>
      )}

      {/* PROCESSING BANNER: In-Progress Status with Pickup & Kitchen Details */}
      {order.status !== 'Delivered' && order.status !== 'Completed' && order.status !== 'Cancelled' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/95 border-2 border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <span className="text-xs font-black uppercase tracking-wider text-amber-950">
                Order Under Active Processing
              </span>
            </div>
            <p className="text-xs text-[#55473E] font-semibold">
              {order.status === 'Preparing'
                ? '🍕 Kitchen is baking your order fresh with mozzarella cheese in our oven.'
                : order.status === 'Out for delivery'
                ? '🛵 Delivery rider has picked up your order and is heading towards your location!'
                : '📝 Your order has been received and confirmed by our kitchen team.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs bg-white px-3.5 py-2 rounded-xl border border-amber-300 font-bold text-amber-950 shrink-0">
            <Clock className="w-4 h-4 text-amber-700" />
            <span>Order Time: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      )}

      {/* Progress Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
        {steps.map((st, idx) => {
          const status = getStepStatus(st.key);
          const isDone = status === 'completed';
          const isActive = status === 'active';

          return (
            <div
              key={idx}
              className={`p-3 rounded-2xl border text-center transition-all ${
                isActive
                  ? 'border-amber-500 bg-amber-50 text-slate-950 font-black shadow-md ring-2 ring-amber-400/30'
                  : isDone
                  ? 'border-emerald-300 bg-emerald-50/60 text-emerald-950 font-bold'
                  : 'border-neutral-200 bg-neutral-50/50 text-neutral-400 font-medium'
              }`}
            >
              <div className="text-xl sm:text-2xl mb-1">{st.icon}</div>
              <div className="text-xs">{st.label}</div>
              <div className="mt-1">
                {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mx-auto" />}
                {isActive && (
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Two-Way Live GPS Radar & Coordinates Section */}
      {isDelivery && (
        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900 text-white space-y-4 shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h4 className="font-black text-sm text-amber-400 uppercase tracking-wide">
                Two-Way Live GPS Radar
              </h4>
            </div>

            {/* Distance & ETA Live Pill */}
            {distanceKm !== null ? (
              <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-xl text-xs font-bold">
                <Navigation className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                <span>{distanceKm} km away</span>
                <span>• ETA ~{etaMinutes} mins</span>
              </div>
            ) : (
              <span className="text-xs text-neutral-400">
                {order.status === 'Out for delivery' ? 'Rider on route' : 'Preparing at kitchen'}
              </span>
            )}
          </div>

          {/* Real Interactive Street Map View (Zomato / Swiggy / Blinkit style) */}
          <div className="space-y-2">
            <InteractiveLiveMap
              mode={isAdminView ? 'admin-view' : 'tracker'}
              customerLocation={customerLoc}
              riderLocation={riderLoc}
              height="260px"
              orderId={order.id}
              orderStatus={order.status}
            />
          </div>

          {/* Details & Actions for Two-way GPS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            {/* Customer coordinates box */}
            <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700/80 space-y-1">
              <span className="text-[10px] font-bold uppercase text-emerald-400 block">
                📍 Customer GPS Pin
              </span>
              {customerLoc ? (
                <>
                  <p className="font-mono text-neutral-200">
                    {customerLoc.latitude.toFixed(5)}, {customerLoc.longitude.toFixed(5)}
                  </p>
                  <p className="text-[10px] text-neutral-400 truncate">
                    {order.deliveryAddress || customerLoc.addressText || 'GPS Pin location on map'}
                  </p>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${customerLoc.latitude},${customerLoc.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-bold underline mt-1"
                  >
                    <span>Open in Google Maps Navigation</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-neutral-400 text-[11px]">No GPS coordinates captured yet.</p>
                  <button
                    type="button"
                    disabled={isUpdatingCustomerLoc}
                    onClick={handleUpdateCustomerLocation}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCw className={`w-3 h-3 ${isUpdatingCustomerLoc ? 'animate-spin' : ''}`} />
                    <span>Share My GPS Now</span>
                  </button>
                </div>
              )}
            </div>

            {/* Rider coordinates box */}
            <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700/80 space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-400 block">
                🛵 Delivery Partner GPS
              </span>
              {riderLoc ? (
                <>
                  <p className="font-mono text-neutral-200">
                    {riderLoc.latitude.toFixed(5)}, {riderLoc.longitude.toFixed(5)}
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    Updated:{' '}
                    {new Date(riderLoc.updatedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>
                  <a
                    href={`https://www.google.com/maps/?q=${riderLoc.latitude},${riderLoc.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-bold underline mt-1"
                  >
                    <span>View Rider on Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              ) : (
                <p className="text-neutral-400 text-[11px]">
                  Rider location broadcast will start once dispatched.
                </p>
              )}

              {/* If Admin / Delivery boy is viewing this card */}
              {isAdminView && (
                <div className="pt-2 border-t border-neutral-700">
                  <button
                    type="button"
                    onClick={toggleRiderLiveGps}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isWatchingRider
                        ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>
                      {isWatchingRider
                        ? '🔴 Stop Broadcasting My GPS'
                        : '🛵 Broadcast My Rider GPS to Customer'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customer summary snapshot */}
      <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#55473E]">
        <div>
          <span className="font-extrabold text-[#1E1915]">Customer:</span> {order.customerName} (
          {order.customerPhone})
          {order.deliveryAddress && (
            <p className="text-[11px] text-[#6B5B4F] mt-0.5">
              <strong>Address:</strong> {order.deliveryAddress}
              {order.city ? `, ${order.city}` : ''}
              {order.pinCode ? ` - ${order.pinCode}` : ''}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${order.customerPhone}`}
            className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 font-bold text-amber-950 hover:bg-amber-100 flex items-center gap-1 shadow-xs transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-amber-700" />
            <span>Call</span>
          </a>
          <a
            href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-[#25D366] text-white font-bold hover:bg-[#20bd5a] flex items-center gap-1 shadow-xs transition-colors"
          >
            <span>WhatsApp</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

export const LiveOrderTracker: React.FC<LiveOrderTrackerProps> = (props) => {
  return (
    <ErrorBoundary
      fallbackTitle="Order Tracker Viewer"
      fallbackMessage="Unable to render tracker graphics. Your order details and updates are safe."
    >
      <LiveOrderTrackerInternal {...props} />
    </ErrorBoundary>
  );
};

