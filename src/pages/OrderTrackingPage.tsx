import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LiveOrderTracker } from '../components/LiveOrderTracker';
import { ArrowLeft, Search, ShoppingBag } from 'lucide-react';

interface OrderTrackingPageProps {
  orderIdParam?: string;
}

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({ orderIdParam }) => {
  const { orders, navigate } = useApp();
  const [searchId, setSearchId] = useState(orderIdParam || '');

  // Look for order matching id (from param or search)
  const targetId = (orderIdParam || searchId).trim().toUpperCase();
  const currentOrder = orders.find(
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

          <span className="text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
            SK Pizza Point Live Tracking
          </span>
        </div>

        {/* Search Input if not already found or want to search different order */}
        <div className="bg-white rounded-3xl p-5 border border-amber-200/80 shadow-sm space-y-3">
          <h2 className="text-base sm:text-lg font-black text-[#1E1915]">
            Track Your Pizza & Rider Live
          </h2>
          <p className="text-xs text-[#6B5B4F]">
            Enter your official Order ID (e.g. <span className="font-mono text-amber-800">SKP-2026...</span>) received on WhatsApp or website.
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
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition-colors"
            >
              Track
            </button>
          </div>
        </div>

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
            </div>
          </div>
        ) : targetId ? (
          <div className="p-10 bg-white rounded-3xl border border-amber-200 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto" />
            <h3 className="font-extrabold text-base text-[#1E1915]">No order found for "{targetId}"</h3>
            <p className="text-xs text-[#6B5B4F] max-w-sm mx-auto">
              Please double check the Order ID format from your WhatsApp confirmation message.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
