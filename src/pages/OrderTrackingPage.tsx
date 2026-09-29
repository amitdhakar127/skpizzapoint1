import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LiveOrderTracker } from '../components/LiveOrderTracker';
import { ArrowLeft, Search, ShoppingBag, Clock, Package, CheckCircle2, ChevronRight, MessageCircle } from 'lucide-react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Order } from '../types';

interface OrderTrackingPageProps {
  orderIdParam?: string;
}

const OrderTrackingPageInternal: React.FC<OrderTrackingPageProps> = ({ orderIdParam }) => {
  const { orders, myOrders, activeOrder, currentUser, userProfile, navigate, formatPrice, generateWhatsAppUrl } = useApp();
  const [searchId, setSearchId] = useState(orderIdParam || '');

  // Combine device myOrders + user-relevant cloud orders
  const candidateOrdersMap = new Map<string, Order>();
  myOrders.forEach((o) => candidateOrdersMap.set(o.id, o));
  orders.forEach((o) => {
    if (!candidateOrdersMap.has(o.id)) {
      if (currentUser && o.userId === currentUser.uid) candidateOrdersMap.set(o.id, o);
      else if (currentUser?.email && o.customerEmail?.toLowerCase() === currentUser.email?.toLowerCase()) candidateOrdersMap.set(o.id, o);
      else if (userProfile?.phone && o.customerPhone && o.customerPhone.trim() === userProfile.phone.trim()) candidateOrdersMap.set(o.id, o);
    }
  });

  const displayOrders = Array.from(candidateOrdersMap.values()).length > 0
    ? Array.from(candidateOrdersMap.values())
    : orders.slice(0, 5);

  // If no param was given in URL and search is empty, auto-select activeOrder or latest order
  useEffect(() => {
    if (!orderIdParam && !searchId) {
      if (activeOrder) {
        setSearchId(activeOrder.id);
      } else if (displayOrders.length > 0) {
        setSearchId(displayOrders[0].id);
      }
    }
  }, [orderIdParam, activeOrder, displayOrders.length]);

  const targetId = (orderIdParam || searchId).trim().toUpperCase();
  const allOrdersPool = [...myOrders, ...orders];
  const currentOrder = allOrdersPool.find(
    (o) => o.id.toUpperCase() === targetId || o.id.toUpperCase().endsWith(targetId)
  );

  return (
    <div className="min-h-screen bg-[#FFFDF9] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#55473E] hover:text-[#1E1915] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/my-orders')}
              className="text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 px-3 py-1 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>मेरी आर्डर लिस्ट (All Orders)</span>
            </button>
            <span className="hidden sm:inline-block text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
              Live GPS Tracking
            </span>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="bg-white rounded-3xl p-5 border border-amber-200/80 shadow-sm space-y-3">
          <h2 className="text-base sm:text-lg font-black text-[#1E1915]">
            Track Your Pizza & Delivery Partner Live
          </h2>
          <p className="text-xs text-[#6B5B4F]">
            Enter your Order ID (e.g. <span className="font-mono text-amber-800">SKP-...</span>) or tap any recent order below.
          </p>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Enter Order ID (e.g. SKP-...)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono uppercase"
              />
            </div>
            <button
              type="button"
              onClick={() => {}}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition-colors cursor-pointer"
            >
              Track
            </button>
          </div>
        </div>

        {/* Recent Orders Quick Selection Pills */}
        {displayOrders.length > 0 && (
          <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200/80 space-y-2.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-950 block">
              Recent Orders (हालिया ऑर्डर - टैप करके देखें):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {displayOrders.slice(0, 4).map((ord) => {
                const isSelected = currentOrder?.id === ord.id;
                const isCompleted = ord.status === 'Delivered' || ord.status === 'Completed';

                return (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => setSearchId(ord.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm font-bold'
                        : 'bg-white border-amber-200 hover:bg-amber-100/60 text-[#1E1915]'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-black">
                        <span>#{ord.id}</span>
                        {isCompleted ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-100 text-emerald-900 border border-emerald-300">
                            ✓ Delivered
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-900 border border-amber-300">
                            {ord.status}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6B5B4F] truncate">
                        {ord.items.map((i: any) => i.productName).join(', ')}
                      </p>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span className="text-xs font-black block">₹{ord.finalTotal}</span>
                      <span className="text-[10px] text-[#8A7B70]">
                        {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Details & Live Tracker */}
        {currentOrder ? (
          <div className="space-y-6">
            <LiveOrderTracker order={currentOrder} isAdminView={false} />

            {/* Items summary */}
            <div className="p-5 rounded-3xl bg-white border border-amber-200 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-[#1E1915] uppercase tracking-wider">
                Order Items Summary:
              </h4>
              <div className="divide-y divide-amber-100 text-xs">
                {currentOrder.items.map((item, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#1E1915]">{item.productName}</span>
                      <span className="text-[#6B5B4F] ml-1.5">
                        ({item.size} × {item.quantity})
                      </span>
                      {item.addOns.length > 0 && (
                        <span className="text-[11px] text-amber-700 block">
                          + {item.addOns.join(', ')}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-[#1E1915]">₹{item.totalPrice}</span>
                  </div>
                ))}

                <div className="pt-2 flex justify-between font-black text-sm text-[#1E1915]">
                  <span>Total Amount</span>
                  <span className="text-amber-800">₹{currentOrder.finalTotal}</span>
                </div>
              </div>

              {/* WhatsApp direct receipt action */}
              <div className="pt-3 border-t border-amber-100 flex items-center justify-between">
                <span className="text-xs text-[#6B5B4F]">Need help with this order?</span>
                <a
                  href={generateWhatsAppUrl(currentOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Support</span>
                </a>
              </div>
            </div>
          </div>
        ) : targetId ? (
          <div className="p-10 bg-white rounded-3xl border border-amber-200 text-center space-y-4 shadow-sm">
            <ShoppingBag className="w-12 h-12 text-amber-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-[#1E1915]">No order found for "{targetId}"</h3>
              <p className="text-xs text-[#6B5B4F] max-w-sm mx-auto">
                Please double check the Order ID format from your WhatsApp confirmation message.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setSearchId('')}
                className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs transition-colors"
              >
                Clear Search
              </button>
              <button
                type="button"
                onClick={() => navigate('/menu')}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
              >
                Order Fresh Pizza
              </button>
            </div>
          </div>
        ) : (
          <div className="p-10 bg-white rounded-3xl border border-amber-200 text-center space-y-4 shadow-sm">
            <ShoppingBag className="w-12 h-12 text-amber-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-[#1E1915]">No Active Orders Selected</h3>
              <p className="text-xs text-[#6B5B4F] max-w-sm mx-auto">
                Place an order from our menu to track live preparation and delivery partner GPS!
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/menu')}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-md"
            >
              Browse Menu & Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = (props) => {
  return (
    <ErrorBoundary
      fallbackTitle="Order Tracking Service"
      fallbackMessage="Unable to load tracker at this second. Your order is safe in the kitchen."
    >
      <OrderTrackingPageInternal {...props} />
    </ErrorBoundary>
  );
};
