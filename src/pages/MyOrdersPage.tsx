import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Compass,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Search,
  Sparkles,
  Calendar,
  Phone,
  RefreshCw,
} from 'lucide-react';
import { Order } from '../types';

export const MyOrdersPage: React.FC = () => {
  const {
    orders,
    myOrders,
    currentUser,
    userProfile,
    navigate,
    formatPrice,
    generateWhatsAppUrl,
    addToCart,
    products,
    settings,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  // Safe timestamp helper
  const safeTime = (dateVal: any) => {
    if (!dateVal) return 0;
    const t = new Date(dateVal).getTime();
    return isNaN(t) ? 0 : t;
  };

  // Safe English date formatters
  const formatOrderDate = (dateVal: any) => {
    if (!dateVal) return 'Recently';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatOrderTime = (dateVal: any) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Combine device myOrders + currentUser orders + global orders matching phone/email/id
  const combinedOrdersMap = new Map<string, Order>();

  // 1. First add device orders (guaranteed local storage persistence)
  (Array.isArray(myOrders) ? myOrders : []).forEach((o) => {
    if (o && o.id) combinedOrdersMap.set(o.id, o);
  });

  // 2. Add any matching user orders
  (Array.isArray(orders) ? orders : []).forEach((o) => {
    if (!o || !o.id) return;
    if (combinedOrdersMap.has(o.id)) {
      // Keep newer version
      const existing = combinedOrdersMap.get(o.id)!;
      if (safeTime(o.updatedAt) >= safeTime(existing.updatedAt)) {
        combinedOrdersMap.set(o.id, o);
      }
    } else {
      // Check if matches user
      if (currentUser && o.userId === currentUser.uid) {
        combinedOrdersMap.set(o.id, o);
      } else if (currentUser?.email && o.customerEmail?.toLowerCase() === currentUser.email?.toLowerCase()) {
        combinedOrdersMap.set(o.id, o);
      } else if (userProfile?.phone && o.customerPhone && o.customerPhone.trim() === userProfile.phone.trim()) {
        combinedOrdersMap.set(o.id, o);
      }
    }
  });

  const allUserOrders = Array.from(combinedOrdersMap.values()).sort(
    (a, b) => safeTime(b.createdAt) - safeTime(a.createdAt)
  );

  const filteredOrders = allUserOrders.filter((ord) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const items = Array.isArray(ord.items) ? ord.items : [];
    return (
      (ord.id || '').toLowerCase().includes(q) ||
      (ord.customerName || '').toLowerCase().includes(q) ||
      (ord.deliveryAddress || '').toLowerCase().includes(q) ||
      items.some((it) => (it.productName || '').toLowerCase().includes(q))
    );
  });

  const handleReorder = (ord: Order) => {
    const items = Array.isArray(ord.items) ? ord.items : [];
    items.forEach((item) => {
      const prod = products.find((p) => p.name === item.productName || p.id === item.productId);
      if (prod) {
        const matchedAddons: any[] = (item.addOns || [])
          .map((name) => (prod.availableAddOns || []).find((a) => a.name === name))
          .filter(Boolean);
        addToCart(prod, (item.size as any) || 'Small', item.quantity || 1, matchedAddons);
      }
    });
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation back & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#55473E] hover:text-[#1E1915] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1E1915] flex items-center gap-2.5">
              <span>My Orders</span>
              <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black">
                {allUserOrders.length}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-[#6B5B4F]">
              All your recent and past food orders are saved securely. Track live delivery or re-order anytime.
            </p>
          </div>

          <button
            onClick={() => navigate('/menu')}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all self-start sm:self-auto cursor-pointer"
          >
            + Order Food Now
          </button>
        </div>

        {/* Search Bar */}
        {allUserOrders.length > 0 && (
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by Order ID or item name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
            />
          </div>
        )}

        {/* Order Cards List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-amber-200 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8 text-amber-700" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-base sm:text-lg text-[#1E1915]">
                {allUserOrders.length === 0
                  ? 'No Orders Placed Yet'
                  : 'No Matching Orders Found'}
              </h3>
              <p className="text-xs text-[#6B5B4F] max-w-md mx-auto">
                {allUserOrders.length === 0
                  ? 'Once you place your pizza or burger order, your complete order history will be saved here permanently!'
                  : 'Please check the order ID or clear your search query.'}
              </p>
            </div>
            <button
              onClick={() => navigate('/menu')}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
            >
              Explore Delicious Menu
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isCompleted = order.status === 'Delivered' || order.status === 'Completed';
              const isCancelled = order.status === 'Cancelled';
              const isProcessing = !isCompleted && !isCancelled;

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-3xl border-2 transition-all shadow-sm overflow-hidden ${
                    isCompleted
                      ? 'border-emerald-300 hover:border-emerald-400'
                      : 'border-amber-300 hover:border-amber-400'
                  }`}
                >
                  {/* Status Banner */}
                  <div
                    className={`px-4 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                        : isCancelled
                        ? 'bg-red-50 text-red-950 border-red-200'
                        : 'bg-amber-50 text-amber-950 border-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isCompleted ? (
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm ring-4 ring-emerald-200">
                          <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                        </div>
                      ) : isCancelled ? (
                        <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 shadow-sm ring-4 ring-red-200">
                          <Clock className="w-6 h-6" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm ring-4 ring-amber-200 animate-pulse">
                          <Clock className="w-6 h-6 stroke-[2.5]" />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm sm:text-base tracking-wide">
                            #{order.id}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isCompleted
                                ? 'bg-emerald-600 text-white'
                                : isCancelled
                                ? 'bg-red-600 text-white'
                                : 'bg-amber-600 text-white'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-neutral-600 flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                          <span>
                            {formatOrderDate(order.createdAt)}{' '}
                            {formatOrderTime(order.createdAt) ? `• ${formatOrderTime(order.createdAt)}` : ''}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Right completed celebratory badge */}
                    {isCompleted && (
                      <div className="flex items-center gap-2 bg-emerald-100/90 text-emerald-900 border border-emerald-300 px-3.5 py-1.5 rounded-2xl shadow-xs">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-black">Delivered Fresh ✓</span>
                      </div>
                    )}

                    {isProcessing && (
                      <div className="flex items-center gap-2 bg-amber-100 text-amber-900 border border-amber-300 px-3.5 py-1.5 rounded-2xl shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
                        <span className="text-xs font-black">Baking in Kitchen (15-25 Mins)</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-6 space-y-4">
                    {/* Items */}
                    <div className="space-y-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 block">
                        Ordered Food Items
                      </span>
                      <div className="divide-y divide-amber-100 bg-neutral-50/70 rounded-2xl p-3 border border-amber-200/60">
                        {(Array.isArray(order.items) ? order.items : []).map((item, idx) => (
                          <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.productName || 'Pizza'}
                                  className="w-11 h-11 rounded-xl object-cover shrink-0 border border-amber-200 shadow-xs"
                                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 font-bold text-sm">
                                  🍕
                                </div>
                              )}
                              <div className="space-y-0.5 min-w-0">
                                <span className="font-extrabold text-[#1E1915] block truncate">
                                  {item.productName || 'Item'}{' '}
                                  <span className="font-normal text-neutral-500">
                                    ({item.size || 'Regular'}) × {item.quantity || 1}
                                  </span>
                                </span>
                                {Array.isArray(item.addOns) && item.addOns.length > 0 && (
                                  <p className="text-[10px] text-amber-800">
                                    Add-ons: +{item.addOns.join(', ')}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="font-bold text-[#1E1915] shrink-0">
                              {formatPrice(Number(item.totalPrice) || 0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery & Customer Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/70">
                      <div className="space-y-1">
                        <span className="font-bold text-neutral-500 block text-[10px] uppercase tracking-wider">
                          Customer & Phone
                        </span>
                        <p className="font-black text-[#1E1915]">{order.customerName}</p>
                        <p className="font-mono text-neutral-600 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-amber-600" />
                          <span>{order.customerPhone}</span>
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="font-bold text-neutral-500 block text-[10px] uppercase tracking-wider">
                          Delivery Address & Mode
                        </span>
                        <p className="font-extrabold text-[#1E1915]">
                          {order.orderType === 'delivery' ? '🚗 Home Delivery' : '🏪 Store Pickup'}
                        </p>
                        {order.deliveryAddress && (
                          <p className="text-neutral-600 flex items-start gap-1">
                            <MapPin className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                            <span>{order.deliveryAddress}</span>
                          </p>
                        )}
                        {order.customerLocation?.googleMapsLink && (
                          <a
                            href={order.customerLocation.googleMapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-950 underline mt-0.5"
                          >
                            <span>📍 View Customer Google Maps Pin</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <a
                          href={settings.googleMapsUrl || 'https://maps.app.goo.gl/ahwPDzJqRtSEXVYb8?g_st=ac'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-600 hover:text-amber-900 underline mt-0.5 block"
                        >
                          <span>🏪 Store Location (SK Pizza Point)</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {/* Total & Action Buttons */}
                    <div className="pt-2 border-t border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] text-neutral-500 font-semibold block">Total Amount</span>
                        <span className="text-xl font-black text-amber-950">
                          {formatPrice(order.finalTotal)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Direct Call Kitchen Button */}
                        <a
                          href={`tel:${settings.whatsAppNumber || '+919617142439'}`}
                          className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
                          title="Call SK Pizza Point Kitchen Directly"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call Kitchen</span>
                        </a>

                        {/* Track Live Map Button */}
                        <button
                          type="button"
                          onClick={() => navigate(`/live-track-${order.id}`)}
                          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Open dedicated Live GPS Map tracking page"
                        >
                          <Compass className="w-3.5 h-3.5 text-slate-950 animate-spin-slow" />
                          <span>🗺️ Live Map Track</span>
                        </button>

                        {/* WhatsApp Button */}
                        <a
                          href={generateWhatsAppUrl(order)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        {/* Reorder Button */}
                        <button
                          type="button"
                          onClick={() => handleReorder(order)}
                          className="px-3 py-2.5 rounded-xl border border-amber-300 text-amber-900 hover:bg-amber-100/70 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                          title="Reorder this order"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reorder</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
