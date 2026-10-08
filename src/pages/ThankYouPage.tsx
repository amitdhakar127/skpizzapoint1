import React, { useEffect } from 'react';
import { CheckCircle2, Compass, ArrowRight, MessageCircle, Phone, Clock, Pizza } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ThankYouPage: React.FC = () => {
  const { navigate, settings, activeOrder } = useApp();

  useEffect(() => {
    // Dynamic noindex meta tag to ensure Google search does NOT index this order confirmation page
    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const originalContent = metaRobots ? metaRobots.content : '';
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.name = 'robots';
      document.head.appendChild(metaRobots);
    }
    metaRobots.content = 'noindex, follow';

    document.title = 'Order Received — Thank You! | SK Pizza Point';

    return () => {
      if (metaRobots) {
        metaRobots.content = originalContent || 'index, follow';
      }
      document.title = 'SK Pizza Point | Fresh & Delicious Pizza Delivery';
    };
  }, []);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full bg-white rounded-3xl p-6 sm:p-10 border border-amber-200/90 shadow-xl text-center space-y-6">
        {/* Animated Celebration Badge */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center border-2 border-emerald-400/40 shadow-inner">
          <CheckCircle2 className="w-10 h-10 animate-pulse text-emerald-600" />
        </div>

        <div className="space-y-2">
          <span className="px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase tracking-wider inline-block border border-emerald-200">
            Order Confirmed & Baking
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1E1915]">
            Thank You for Your Order!
          </h1>
          <p className="text-xs sm:text-sm text-[#55473E] leading-relaxed max-w-md mx-auto">
            Your fresh feast is now registered in our kitchen. We've started hand-stretching the dough and heating up the stone oven!
          </p>
        </div>

        {/* Live Order Snapshot (If available in context) */}
        {activeOrder ? (
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-left space-y-2 text-xs sm:text-sm text-[#3E3027]">
            <div className="flex justify-between items-center border-b border-amber-200/60 pb-2">
              <span className="font-bold text-[#1E1915]">Order ID: #{activeOrder.id}</span>
              <span className="font-black text-amber-800">₹{activeOrder.finalTotal}</span>
            </div>
            <div className="flex items-center gap-2 text-amber-900 font-semibold">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Est. Preparation: 15-25 Minutes</span>
            </div>
            {activeOrder.deliveryAddress && (
              <p className="text-xs text-[#6B5B4F] truncate">
                <strong>Delivery to:</strong> {activeOrder.deliveryAddress}
              </p>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 text-xs text-[#55473E] flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Average preparation time: <strong>15-25 minutes</strong></span>
          </div>
        )}

        {/* Action CTAs */}
        <div className="space-y-3 pt-2">
          {activeOrder ? (
            <button
              onClick={() => navigate(`/track-${activeOrder.id}`)}
              className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Compass className="w-5 h-5 animate-spin-slow" />
              <span>Track Live Delivery on Map</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          ) : (
            <button
              onClick={() => navigate('/my-orders')}
              className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Compass className="w-5 h-5" />
              <span>View My Orders & Track</span>
            </button>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={settings.whatsAppDirectLink}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>WhatsApp Kitchen Chat</span>
            </a>

            <button
              onClick={() => navigate('/menu')}
              className="py-3 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#1E1915] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Pizza className="w-4 h-4 text-amber-600" />
              <span>Explore More Food</span>
            </button>
          </div>
        </div>

        {/* Direct Contact Support */}
        <p className="text-xs text-[#8A7B70] pt-2">
          Questions about your order? Call our helpline at{' '}
          <a href={`tel:${settings.whatsAppNumber}`} className="font-bold text-amber-800 hover:underline">
            {settings.whatsAppNumber}
          </a>
        </p>
      </div>
    </div>
  );
};
