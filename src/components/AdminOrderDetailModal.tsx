// Admin Comprehensive Order Detail & Live Map Modal
// Displays complete order metadata, customer contact, items breakdown,
// status pipeline, payment updater, and interactive Zomato-style live route map!

import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  ExternalLink,
  MapPin,
  Clock,
  Compass,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Printer,
  ChevronRight,
  ShieldCheck,
  Navigation,
  Trash2,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { InteractiveLiveMap } from './InteractiveLiveMap';
import { useApp } from '../context/AppContext';
import { getGoogleMapsNavigationUrl, getGoogleMapsPinUrl, STORE_GOOGLE_MAPS_URL } from '../lib/locationService';
import { ErrorBoundary } from './ErrorBoundary';

interface AdminOrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
  onDeleteOrder?: (order: Order) => void;
}

const AdminOrderDetailModalInternal: React.FC<AdminOrderDetailModalProps> = ({ order, onClose, onDeleteOrder }) => {
  const {
    updateOrderStatus,
    updateOrderPaymentStatus,
    updateOrderLocation,
    formatPrice,
    generateWhatsAppUrl,
    settings,
    showToast,
  } = useApp();

  const [isBroadcastingRider, setIsBroadcastingRider] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  if (!order) return null;

  const primaryStatuses: OrderStatus[] =
    order.orderType === 'pickup'
      ? ['Pending', 'Preparing', 'Ready for Pickup', 'Delivered', 'Cancelled']
      : ['Pending', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled'];

  // Rider Live GPS broadcasting toggle
  const toggleRiderGps = () => {
    if (isBroadcastingRider) {
      if (watchId !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setIsBroadcastingRider(false);
      showToast('🛵 Rider live GPS broadcast paused.', 'info');
    } else {
      if (typeof window === 'undefined' || !('geolocation' in navigator)) {
        showToast('Device does not support GPS geolocation', 'error');
        return;
      }

      showToast('Starting live delivery GPS broadcast...', 'info');
      setIsBroadcastingRider(true);

      const id = navigator.geolocation.watchPosition(
        (pos) => {
          updateOrderLocation(
            order.id,
            {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: Math.round(pos.coords.accuracy || 10),
              heading: pos.coords.heading,
              speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : null,
              updatedAt: new Date().toISOString(),
            },
            true
          );
        },
        (err) => {
          showToast(`GPS Error: ${err.message}`, 'error');
          setIsBroadcastingRider(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
      setWatchId(id);
      showToast('🟢 Live Rider Location Broadcasting to Customer!', 'success');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl border-2 border-amber-300 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-[#181411] text-white p-4 sm:p-5 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
              #{order.id.slice(-4)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg tracking-tight font-mono">
                  Order #{order.id}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Placed on {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors cursor-pointer"
              title="Print Order Receipt / Kitchen KOT"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors cursor-pointer"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Status Pipeline Buttons */}
          <div className="space-y-2 bg-amber-50/70 p-4 rounded-2xl border border-amber-200">
            <span className="text-xs font-black uppercase tracking-wider text-amber-950 block">
              Update Live Order Status:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {primaryStatuses.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => updateOrderStatus(order.id, st)}
                  className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer text-center ${
                    order.status === st
                      ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400'
                      : 'bg-white hover:bg-amber-100 text-[#55473E] border border-amber-200'
                  }`}
                >
                  {st === 'Pending' && '📝 Pending'}
                  {st === 'Preparing' && '🍕 In Process'}
                  {st === 'Ready for Pickup' && '🛍️ Ready for Pickup'}
                  {st === 'Out for delivery' && '🛵 Out for Delivery'}
                  {st === 'Delivered' && '✅ Completed'}
                  {st === 'Cancelled' && '❌ Cancelled'}
                </button>
              ))}
            </div>
          </div>

          {/* Customer & Fulfillment Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-white border border-amber-200 space-y-2.5 shadow-xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#1E1915] block">
                Customer Contact Details
              </span>
              <div>
                <strong className="text-sm text-[#1E1915] block">{order.customerName}</strong>
                <span className="text-neutral-500 font-mono">{order.customerPhone}</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`tel:${order.customerPhone}`}
                  className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-700" />
                  <span>Call Customer</span>
                </a>

                <a
                  href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>

              {order.instructions && (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950">
                  <strong className="block text-[10px] uppercase text-amber-800">
                    Kitchen / Delivery Instructions:
                  </strong>
                  <span>{order.instructions}</span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-white border border-amber-200 space-y-2.5 shadow-xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#1E1915] block">
                Fulfillment & Payment
              </span>
              <div>
                <span className="text-neutral-500">Order Type:</span>
                <span className="ml-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase bg-amber-100 text-amber-950">
                  {order.orderType === 'delivery' ? 'Home Delivery 🛵' : 'Self Pickup 🛍️'}
                </span>
              </div>

              <div>
                <span className="text-neutral-500 block">Delivery Address:</span>
                <p className="font-semibold text-[#1E1915] mt-0.5">
                  {order.deliveryAddress || 'Pickup from restaurant counter'}
                  {order.city ? `, ${order.city}` : ''}
                  {order.pinCode ? ` - ${order.pinCode}` : ''}
                </p>
              </div>

              <div className="pt-2 border-t border-amber-100 flex items-center justify-between">
                <span className="font-bold text-[#55473E]">Payment Status:</span>
                <select
                  value={order.paymentStatus || 'Pending'}
                  onChange={(e) => updateOrderPaymentStatus(order.id, e.target.value as any)}
                  className="px-3 py-1 rounded-xl border border-amber-300 bg-amber-50 font-black text-xs text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Cash on Delivery">Cash on Delivery</option>
                  <option value="Paid Online">Paid Online</option>
                  <option value="Verified">Verified ✓</option>
                </select>
              </div>
            </div>
          </div>

          {/* Interactive Live Map & Route (Zomato/Swiggy style) */}
          {order.orderType === 'delivery' && (
            <div className="space-y-3 p-4 sm:p-5 rounded-3xl bg-[#1E1915] text-white shadow-xl border border-neutral-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-amber-400 animate-spin-slow" />
                  <h4 className="font-black text-sm uppercase tracking-wider text-amber-400">
                    Live Route & Customer Location Map (Zomato / Swiggy Style)
                  </h4>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {order.customerLocation && (
                    <>
                      <a
                        href={order.customerLocation.googleMapsLink || getGoogleMapsPinUrl(order.customerLocation.latitude, order.customerLocation.longitude)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs inline-flex items-center gap-1 transition-all shadow-md active:scale-95 cursor-pointer"
                        title="Open customer pinned location in Google Maps"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>📍 Customer Pin</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href={getGoogleMapsNavigationUrl(
                          order.customerLocation.latitude,
                          order.customerLocation.longitude
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center gap-1 transition-all shadow-md active:scale-95 cursor-pointer"
                        title="Open Google Maps turn-by-turn navigation"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>🚗 Directions</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </>
                  )}
                  <a
                    href={settings.googleMapsUrl || STORE_GOOGLE_MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-bold text-xs inline-flex items-center gap-1 transition-all shadow-md active:scale-95 cursor-pointer border border-neutral-700"
                    title="Open store Google Maps location"
                  >
                    <span>🏪 Store Location</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href={`/#track-${order.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-1 transition-all shadow-md active:scale-95 cursor-pointer"
                    title="Open live customer tracking view"
                  >
                    <span>🗺️ Live System Tracker</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Leaflet Interactive Map View */}
              <InteractiveLiveMap
                mode="admin-view"
                customerLocation={order.customerLocation}
                riderLocation={order.deliveryRiderLocation}
                height="320px"
                orderId={order.id}
                orderStatus={order.status}
              />

              {/* Rider Broadcast Control */}
              <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="font-extrabold text-amber-300 block">
                    🛵 Live Delivery Rider Broadcast:
                  </span>
                  <p className="text-neutral-400 text-[11px]">
                    Turn on while riding so the customer sees your bike moving on their map in real-time.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleRiderGps}
                  className={`px-4 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 ${
                    isBroadcastingRider
                      ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span>
                    {isBroadcastingRider
                      ? '🔴 Stop Broadcasting GPS'
                      : '🛵 Start Rider GPS Broadcast'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Ordered Food Items Table */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-[#1E1915]">Ordered Food Items</h4>
            <div className="border border-amber-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-amber-50 text-[#55473E] uppercase text-[10px] font-black border-b border-amber-200">
                  <tr>
                    <th className="p-3">Item & Customization</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100 font-medium">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/40">
                      <td className="p-3">
                        <span className="font-bold text-[#1E1915] block">{item.productName}</span>
                        <span className="text-[11px] text-amber-800">Size: {item.size}</span>
                        {item.addOns.length > 0 && (
                          <span className="text-[10px] text-[#6B5B4F] block">
                            + {item.addOns.join(', ')}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold">{item.quantity}</td>
                      <td className="p-3 text-right">₹{item.unitPrice}</td>
                      <td className="p-3 text-right font-black text-[#1E1915]">₹{item.totalPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total Summary */}
              <div className="p-3 bg-amber-50/70 border-t border-amber-200 space-y-1 text-xs">
                <div className="flex justify-between text-[#6B5B4F]">
                  <span>Subtotal:</span>
                  <span className="font-bold text-[#1E1915]">₹{order.subtotal}</span>
                </div>
                <div className="flex justify-between text-[#6B5B4F]">
                  <span>Delivery Charge:</span>
                  <span className="font-bold text-[#1E1915]">
                    {order.deliveryFee > 0 ? `₹${order.deliveryFee}` : 'FREE'}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-amber-950 pt-1.5 border-t border-amber-300">
                  <span>Grand Total:</span>
                  <span>{formatPrice(order.finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-100 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <a
              href={generateWhatsAppUrl(order)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send WhatsApp Receipt</span>
            </a>

            {onDeleteOrder && (
              <button
                type="button"
                onClick={() => onDeleteOrder(order)}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
                title="Delete this order permanently"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete Order</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-900 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdminOrderDetailModal: React.FC<AdminOrderDetailModalProps> = (props) => {
  return (
    <ErrorBoundary
      fallbackTitle="Order Details Error"
      fallbackMessage="Unable to render the full order modal. Please close and re-open."
    >
      <AdminOrderDetailModalInternal {...props} />
    </ErrorBoundary>
  );
};

