import React, { useState } from 'react';
import {
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  Phone,
  User,
  MapPin,
  FileText,
  MessageCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Compass,
  Radio,
  RotateCw,
  Navigation,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { Order, LiveLocation } from '../types';
import { LiveOrderTracker } from '../components/LiveOrderTracker';
import { InteractiveLiveMap } from '../components/InteractiveLiveMap';
import {
  acquireLiveLocation,
  calculateDistanceKm,
  estimateEtaMinutes,
  RESTAURANT_COORDINATES,
  STORE_GOOGLE_MAPS_URL,
} from '../lib/locationService';

export const CheckoutPage: React.FC = () => {
  const {
    cart,
    subtotal,
    deliveryFee,
    finalTotal,
    createOrder,
    formatPrice,
    navigate,
    generateWhatsAppUrl,
    activeOrder,
    setActiveOrder,
    settings,
    currentUser,
    userProfile,
    showToast,
  } = useApp();

  const [customerName, setCustomerName] = useState(userProfile?.displayName || '');
  const [customerPhone, setCustomerPhone] = useState(userProfile?.phone || '');
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState(userProfile?.defaultAddress || '');
  const [city, setCity] = useState(userProfile?.city || '');
  const [pinCode, setPinCode] = useState(userProfile?.pinCode || '');
  const [instructions, setInstructions] = useState('');

  // Live Location GPS State
  const [customerLocation, setCustomerLocation] = useState<LiveLocation | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locatingStatus, setLocatingStatus] = useState<string>('');
  const [locationError, setLocationError] = useState<string | null>(null);

  // Multi-tier GPS & Network Geolocation Request (Auto-Retry + IP Fallback)
  const requestCustomerLiveLocation = async (): Promise<LiveLocation | null> => {
    setIsLocating(true);
    setLocationError(null);
    setLocatingStatus('Connecting to GPS...');

    try {
      const res = await acquireLiveLocation((msg) => setLocatingStatus(msg));
      if (res.location) {
        setCustomerLocation(res.location);
        if (res.location.addressText && !deliveryAddress) {
          setDeliveryAddress(res.location.addressText);
        }
        showToast(
          res.source === 'gps'
            ? '✓ Accurate GPS location locked successfully!'
            : '✓ Network location pinned!',
          'success'
        );
        setIsLocating(false);
        setLocatingStatus('');
        return res.location;
      } else {
        setIsLocating(false);
        setLocatingStatus('');
        setLocationError(
          res.error || 'Please pin your exact house or street on the map below.'
        );
        return null;
      }
    } catch {
      setIsLocating(false);
      setLocatingStatus('');
      setLocationError('Could not auto-fetch GPS. Please drag the pin on the map below.');
      return null;
    }
  };

  const handleMapLocationPicked = (loc: LiveLocation) => {
    setCustomerLocation(loc);
    if (loc.addressText && !deliveryAddress) {
      setDeliveryAddress(loc.addressText);
    }
    setLocationError(null);
    showToast('✓ Address location updated from map pin!', 'success');
  };

  // Sync if userProfile loads asynchronously
  React.useEffect(() => {
    if (userProfile) {
      if (!customerName && userProfile.displayName) setCustomerName(userProfile.displayName);
      if (!customerPhone && userProfile.phone) setCustomerPhone(userProfile.phone);
      if (!deliveryAddress && userProfile.defaultAddress) setDeliveryAddress(userProfile.defaultAddress);
      if (!city && userProfile.city) setCity(userProfile.city);
      if (!pinCode && userProfile.pinCode) setPinCode(userProfile.pinCode);
    }
  }, [userProfile]);

  // Automatically request customer live location when checkout opens (Mandatory for all orders)
  React.useEffect(() => {
    if (!customerLocation) {
      requestCustomerLiveLocation();
    }
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(activeOrder);
  const [whatsAppOpened, setWhatsAppOpened] = useState(false);

  // If already placed an order, show the confirmed order screen
  if (completedOrder) {
    const whatsAppUrl = generateWhatsAppUrl(completedOrder);

    const handleOpenWhatsAppAgain = () => {
      setWhatsAppOpened(true);
      window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');
    };

    return (
      <div className="min-h-screen bg-[#FFFDF9] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-8 animate-scale-up">
          {/* Success Banner */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#1E1915]">Order Created!</h1>
            <p className="text-sm sm:text-base text-[#55473E] max-w-md mx-auto">
              Your unique order ID is generated. Please complete the final step by sending the prepared message on WhatsApp.
            </p>
          </div>

          {/* Unique Order ID Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-300 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <div>
                <span className="text-xs font-bold text-[#6B5B4F] uppercase tracking-wider block">
                  Official Order ID
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-900 tracking-wide font-mono">
                  {completedOrder.id}
                </span>
              </div>
              <div className="sm:text-right">
                <span className="text-xs font-bold text-[#6B5B4F] uppercase tracking-wider block">Status</span>
                <span className="inline-block px-3 py-1 rounded-full bg-amber-200 text-amber-900 font-extrabold text-xs">
                  {completedOrder.status}
                </span>
              </div>
            </div>

            {/* Crucial WhatsApp submission action */}
            <div className="p-5 rounded-2xl bg-[#E8F8EE] border border-emerald-300 space-y-3">
              <div className="flex items-start gap-3">
                <MessageCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-emerald-950">
                    Step 2: Press Send in WhatsApp
                  </h3>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    Opening WhatsApp will pre-fill your entire order summary including items, address, and live GPS pin.
                    <strong> Note:</strong> WhatsApp will not send automatically — please tap the "Send" button in WhatsApp to submit!
                  </p>
                </div>
              </div>

              <button
                id="btn-open-whatsapp-order"
                onClick={handleOpenWhatsAppAgain}
                className="w-full py-4 px-6 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>Open WhatsApp to Send Order</span>
                <ExternalLink className="w-4 h-4 ml-1" />
              </button>

              {whatsAppOpened && (
                <p className="text-[11px] text-emerald-700 text-center font-medium">
                  ✓ WhatsApp window opened. Did you press Send? The restaurant will confirm once received!
                </p>
              )}
            </div>

            {/* Real-time Order & Delivery Tracker Embedded */}
            <LiveOrderTracker order={completedOrder} isAdminView={false} />

            {/* Order Items Summary */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#1E1915] uppercase tracking-wider">Order Items:</h4>
              <div className="divide-y divide-amber-100 border border-amber-100 rounded-2xl p-4 bg-[#FFFDF9]">
                {completedOrder.items.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-bold text-[#1E1915]">{item.productName}</span>
                      <span className="text-xs text-[#6B5B4F] ml-1.5">({item.size} × {item.quantity})</span>
                      {item.addOns.length > 0 && (
                        <span className="text-[11px] text-amber-700 block">+ {item.addOns.join(', ')}</span>
                      )}
                    </div>
                    <span className="font-extrabold text-[#1E1915]">{formatPrice(item.totalPrice)}</span>
                  </div>
                ))}

                <div className="pt-3 space-y-1 text-xs text-[#6B5B4F]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-[#1E1915]">{formatPrice(completedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="font-bold text-[#1E1915]">
                      {completedOrder.deliveryFee > 0
                        ? formatPrice(completedOrder.deliveryFee)
                        : settings.deliveryFeeNote || 'To be confirmed'}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-black text-[#1E1915] pt-2 border-t border-amber-100">
                    <span>Total Amount</span>
                    <span className="text-amber-700">{formatPrice(completedOrder.finalTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Details Snapshot */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-[#55473E] space-y-1">
              <p>
                <strong>Customer:</strong> {completedOrder.customerName} ({completedOrder.customerPhone})
              </p>
              <p>
                <strong>Type:</strong> {completedOrder.orderType === 'delivery' ? 'Home Delivery' : 'Self Pickup'}
              </p>
              {completedOrder.deliveryAddress && (
                <p>
                  <strong>Address:</strong> {completedOrder.deliveryAddress}
                  {completedOrder.city ? `, ${completedOrder.city}` : ''}
                  {completedOrder.pinCode ? ` - ${completedOrder.pinCode}` : ''}
                </p>
              )}
              {completedOrder.instructions && (
                <p>
                  <strong>Instructions:</strong> {completedOrder.instructions}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                onClick={() => navigate(`/track-${completedOrder.id}`)}
                className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-colors text-center shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Compass className="w-4 h-4 animate-spin-slow" />
                <span>Track This Order Live</span>
              </button>

              <button
                onClick={() => navigate('/my-orders')}
                className="py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm transition-colors text-center shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>View All My Orders</span>
              </button>

              <a
                href={`tel:${settings.whatsAppNumber || '+919617142439'}`}
                className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors text-center shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Phone className="w-4 h-4" />
                <span>Call Kitchen</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If cart is empty and no active order
  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-3xl">
          🍕
        </div>
        <h2 className="text-2xl font-black text-[#1E1915]">Your cart is empty</h2>
        <p className="text-sm text-[#6B5B4F] max-w-sm">
          Please select your favorite pizzas, burgers, or sandwiches before proceeding to checkout.
        </p>
        <button
          onClick={() => navigate('/menu')}
          className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all"
        >
          Explore Full Menu
        </button>
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      showToast('Please enter your name', 'error');
      return;
    }
    if (!customerPhone.trim() || customerPhone.replace(/[^0-9]/g, '').length < 8) {
      showToast('Please enter a valid phone number (at least 8-10 digits)', 'error');
      return;
    }

    // Location handling: Use customerLocation if available; otherwise allow address fallback
    let loc = customerLocation;
    if (!loc && orderType === 'delivery') {
      try {
        loc = await requestCustomerLiveLocation();
      } catch {}
    }

    if (orderType === 'delivery') {
      if (!deliveryAddress.trim() && loc?.addressText) {
        setDeliveryAddress(loc.addressText);
      } else if (!deliveryAddress.trim()) {
        showToast('Please enter your house/flat number or landmark for delivery', 'error');
        const addrInput = document.getElementById('input-delivery-address');
        if (addrInput) addrInput.focus();
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const newOrder = await createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: currentUser?.email || undefined,
        orderType,
        deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() : (loc?.addressText || settings.address || 'Store Pickup Counter'),
        city: orderType === 'delivery' ? (city.trim() || undefined) : undefined,
        pinCode: orderType === 'delivery' ? (pinCode.trim() || undefined) : undefined,
        instructions: instructions.trim() || undefined,
        customerLocation: loc || undefined,
        paymentStatus: 'Pending',
      });

      // Joyful celebratory confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#E11D48', '#3B82F6'],
        });
      } catch {
        // Confetti fallback
      }

      setCompletedOrder(newOrder);

      // Open WhatsApp automatically with prefilled message
      const whatsAppUrl = generateWhatsAppUrl(newOrder);
      setWhatsAppOpened(true);
      try {
        const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');
        } else {
          const win = window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');
          if (!win || win.closed || typeof win.closed === 'undefined') {
            window.location.href = whatsAppUrl;
          }
        }
      } catch {
        window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      showToast('Failed to create order. Please check details.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/menu')}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#55473E] hover:text-[#1E1915] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Menu</span>
          </button>

          <span className="text-xs font-semibold text-amber-800 bg-amber-100/70 px-3 py-1 rounded-full">
            Direct WhatsApp Ordering
          </span>
        </div>

        <div className="text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-black text-[#1E1915]">Order Checkout</h1>
          <p className="text-sm text-[#6B5B4F] mt-1">
            Review your food selection, provide your contact details, and confirm your order.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Customer Information Form */}
          <form
            onSubmit={handleSubmitOrder}
            className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-lg space-y-6"
          >
            <h2 className="text-lg font-black text-[#1E1915] flex items-center gap-2">
              <User className="w-5 h-5 text-amber-600" />
              <span>Contact & Delivery Details</span>
            </h2>

            {/* Order Type Toggle */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#1E1915]">
                Select Fulfillment Type:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="btn-order-type-delivery"
                  onClick={() => setOrderType('delivery')}
                  className={`py-3 px-4 rounded-2xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    orderType === 'delivery'
                      ? 'border-amber-500 bg-amber-50 text-slate-950 shadow-sm'
                      : 'border-amber-200 bg-white text-[#55473E] hover:bg-neutral-50'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span>Home Delivery</span>
                </button>

                <button
                  type="button"
                  id="btn-order-type-pickup"
                  onClick={() => setOrderType('pickup')}
                  className={`py-3 px-4 rounded-2xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    orderType === 'pickup'
                      ? 'border-amber-500 bg-amber-50 text-slate-950 shadow-sm'
                      : 'border-amber-200 bg-white text-[#55473E] hover:bg-neutral-50'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                  <span>Store Pickup</span>
                </button>
              </div>
            </div>

            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#1E1915]">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-200 bg-neutral-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#1E1915]">
                  WhatsApp / Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-200 bg-neutral-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* Store Pickup Location Information */}
            {orderType === 'pickup' && (
              <div className="p-4 rounded-3xl bg-amber-500/10 border-2 border-amber-300 space-y-3 animate-fade-in text-xs shadow-sm">
                <div className="flex items-center gap-2 text-amber-950 font-black">
                  <Compass className="w-4 h-4 text-amber-600" />
                  <span className="uppercase tracking-wide">Store Pickup Counter (SK Pizza Point)</span>
                </div>
                <p className="text-[#55473E] font-medium leading-relaxed">
                  {settings.address || 'SK Pizza Point, Badagoan Rd, Khureiri, Gwalior, Madhya Pradesh 474006'}
                </p>
                <div className="pt-1">
                  <a
                    href={settings.googleMapsUrl || STORE_GOOGLE_MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition-all text-xs shadow-md"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Open Store in Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Live GPS Location Access & Interactive Map Card (Mandatory for ALL orders) */}
            <div id="live-location-section" className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-300 space-y-4 shadow-sm animate-fade-in">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-black text-xs text-amber-950 uppercase tracking-wide">
                  <Compass className="w-4 h-4 text-amber-600 animate-spin-slow" />
                  <span>Real-time GPS Location Permission</span>
                  <span className="text-[10px] text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full font-black">
                    MANDATORY
                  </span>
                </div>
                <p className="text-xs text-[#6B5B4F] leading-relaxed">
                  Allow live GPS permission so SK Pizza Point can verify your real location, calculate exact transit distance, and dispatch hot fresh food without delay.
                </p>
              </div>

                  {/* Prominent Large Permission Button when location is not yet locked */}
                  {!customerLocation && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        id="btn-allow-live-gps-permission"
                        disabled={isLocating}
                        onClick={() => requestCustomerLiveLocation()}
                        className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-amber-500/25 flex items-center justify-center gap-3 transition-all transform active:scale-98 cursor-pointer ring-4 ring-amber-400/30"
                      >
                        <Navigation className={`w-5 h-5 ${isLocating ? 'animate-spin' : 'animate-bounce text-slate-950'}`} />
                        <span>
                          {isLocating
                            ? locatingStatus || 'Connecting to Device GPS...'
                            : '📍 ALLOW LIVE GPS LOCATION (REQUIRED FOR DELIVERY)'}
                        </span>
                      </button>
                      <p className="text-[11px] text-center text-amber-900/80 font-medium">
                        Tap &ldquo;Allow&rdquo; on your browser or device prompt to automatically set your pin.
                      </p>
                    </div>
                  )}

                  {/* Location Status Card when locked */}
                  {customerLocation && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-200">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-black text-xs uppercase tracking-wide text-emerald-900 block">
                              Live GPS Location Locked &amp; Verified
                            </span>
                            <span className="text-[11px] text-emerald-800">
                              Accuracy ±{customerLocation.accuracy || 15}m • Coordinates [{customerLocation.latitude.toFixed(5)}, {customerLocation.longitude.toFixed(5)}]
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <button
                            type="button"
                            disabled={isLocating}
                            onClick={() => requestCustomerLiveLocation()}
                            className="px-2.5 py-1 rounded-lg bg-emerald-200 hover:bg-emerald-300 text-emerald-950 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                            <span>Re-detect</span>
                          </button>
                          <a
                            href={customerLocation.googleMapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition-all inline-flex items-center gap-1"
                          >
                            <span>Google Maps</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      {/* Distance & ETA Live Badges */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-white/80 border border-emerald-200">
                          <span className="text-[10px] text-emerald-700 font-bold uppercase block">Distance from Kitchen</span>
                          <span className="font-black text-emerald-950 text-sm">
                            ~{calculateDistanceKm(
                              RESTAURANT_COORDINATES.latitude,
                              RESTAURANT_COORDINATES.longitude,
                              customerLocation.latitude,
                              customerLocation.longitude
                            )} km
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/80 border border-emerald-200">
                          <span className="text-[10px] text-emerald-700 font-bold uppercase block">Estimated Delivery ETA</span>
                          <span className="font-black text-emerald-950 text-sm">
                            ~{estimateEtaMinutes(
                              calculateDistanceKm(
                                RESTAURANT_COORDINATES.latitude,
                                RESTAURANT_COORDINATES.longitude,
                                customerLocation.latitude,
                                customerLocation.longitude
                              )
                            )} mins
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {locationError && (
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{locationError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => requestCustomerLiveLocation()}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
                      >
                        Retry Permission
                      </button>
                    </div>
                  )}

                  {/* Interactive Map Picker (Zomato / Swiggy style pin placement) */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-black uppercase tracking-wider text-[#6B5B4F] flex items-center justify-between">
                      <span>📍 Verify or Adjust Exact Pin on Live Map:</span>
                      <span className="text-amber-800 font-bold text-[11px]">Interactive Live Map</span>
                    </span>
                    <InteractiveLiveMap
                      mode="picker"
                      customerLocation={customerLocation}
                      onLocationChange={handleMapLocationPicked}
                      height="260px"
                    />
                  </div>
                </div>

                {/* Delivery Address fields only for Delivery orders */}
                {orderType === 'delivery' && (
                  <div className="space-y-4 pt-2 border-t border-amber-100 animate-fade-in">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-[#1E1915]">
                    Full Delivery Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                    <textarea
                      required
                      rows={2}
                      placeholder="House/Flat No, Landmark, Street name..."
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-200 bg-neutral-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-[#1E1915]">
                      City / Area
                    </label>
                    <input
                      type="text"
                      placeholder="Area / Town"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-amber-200 bg-neutral-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-[#1E1915]">
                      PIN Code
                    </label>
                    <input
                      type="text"
                      placeholder="PIN Code"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-amber-200 bg-neutral-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Cooking & Delivery Instructions */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#1E1915]">
                Special Instructions (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Ring doorbell, keep food spicy, provide extra tissues..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-amber-200 bg-neutral-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-amber-100">
              {orderType === 'delivery' && !customerLocation && (
                <div className="mb-3.5 p-3 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs flex items-center gap-2.5 shadow-xs">
                  <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                  <div className="flex-1">
                    <p className="font-extrabold text-amber-950">Live GPS Location Required</p>
                    <p className="text-[11px] text-amber-800">
                      Home delivery orders cannot be placed without your doorstep GPS coordinates. Please tap <strong>&ldquo;ALLOW LIVE GPS LOCATION&rdquo;</strong> above to continue.
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                id="btn-submit-order-whatsapp"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base shadow-xl shadow-amber-500/25 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 text-slate-950" />
                <span>Confirm & Send on WhatsApp ({formatPrice(finalTotal)})</span>
              </button>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#6B5B4F]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Zero pre-payment required. Pay on delivery or pickup.</span>
              </div>
            </div>
          </form>

          {/* Right: Order Summary Breakdown */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-amber-200/80 shadow-lg space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <h3 className="font-extrabold text-base text-[#1E1915]">Your Order Summary</h3>
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg">
                {cart.length} item{cart.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Items list */}
            <div className="divide-y divide-amber-100 max-h-72 overflow-y-auto pr-1 space-y-3">
              {cart.map((item) => {
                const addOnsPrice = item.selectedAddOns.reduce((acc, a) => acc + a.price, 0);
                const itemTotal = (item.unitPrice + addOnsPrice) * item.quantity;

                return (
                  <div key={item.id} className="pt-3 first:pt-0 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-extrabold text-[#1E1915] truncate">{item.productName}</p>
                      <p className="text-xs text-[#6B5B4F]">
                        {item.selectedSize} × {item.quantity} (@ {formatPrice(item.unitPrice)})
                      </p>
                      {item.selectedAddOns.length > 0 && (
                        <p className="text-[11px] text-amber-700 truncate">
                          + {item.selectedAddOns.map((a) => a.name).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-black text-[#1E1915] shrink-0">
                      {formatPrice(itemTotal)}
                    </span>
                  </div>
                );
              })}
            </div>

              {/* Calculations breakdown */}
              <div className="pt-3 border-t border-amber-100 space-y-2.5 text-xs text-[#55473E]">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-[#1E1915]">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="font-medium text-[#1E1915]">Delivery Charge</span>
                    {orderType === 'delivery' && settings.deliveryFeeNote && (
                      <p className="text-[10px] text-[#8C7A6B]">{settings.deliveryFeeNote}</p>
                    )}
                  </div>
                  <span className="font-bold text-amber-900">
                    {orderType === 'delivery'
                      ? deliveryFee > 0
                        ? formatPrice(deliveryFee)
                        : (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                            FREE
                          </span>
                        )
                      : (
                        <span className="text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
                          ₹0 (Pickup)
                        </span>
                      )}
                  </span>
                </div>

                {orderType === 'delivery' &&
                  settings.freeDeliveryThreshold &&
                  settings.freeDeliveryThreshold > 0 &&
                  subtotal < settings.freeDeliveryThreshold && (
                    <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 flex items-center justify-between">
                      <span>Add {formatPrice(settings.freeDeliveryThreshold - subtotal)} more for <strong>FREE Delivery</strong></span>
                      <span className="font-bold text-amber-700">Min. ₹{settings.freeDeliveryThreshold}</span>
                    </div>
                )}

                <div className="flex justify-between items-baseline text-base font-black text-[#1E1915] pt-3 border-t border-amber-100">
                  <span>Total Amount</span>
                  <span className="text-xl text-amber-700">
                    {formatPrice(orderType === 'delivery' ? finalTotal : subtotal)}
                  </span>
                </div>
              </div>

            {/* Trust box */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-[#55473E] space-y-1">
              <p className="font-bold text-amber-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>Estimated Prep Time: 15-25 mins</span>
              </p>
              <p className="text-[11px] text-[#6B5B4F]">
                Freshly baked after your order confirmation on WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
