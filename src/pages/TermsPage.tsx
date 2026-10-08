import React, { useEffect } from 'react';
import { FileText, Clock, Truck, ShieldAlert, ArrowLeft, PhoneCall } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const TermsPage: React.FC = () => {
  const { navigate, settings } = useApp();

  useEffect(() => {
    document.title = 'Terms & Delivery Policy | SK Pizza Point';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => {
      document.title = 'SK Pizza Point | Fresh & Delicious Pizza Delivery';
    };
  }, []);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-800 hover:text-amber-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
          <FileText className="w-3.5 h-3.5 text-amber-700" />
          <span>Ordering & Delivery Terms</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#1E1915]">
          Terms & Delivery Conditions
        </h1>
        <p className="text-xs sm:text-sm text-[#6B5B4F]">
          Effective as of October 2026 • Clear and transparent ordering terms for SK Pizza Point customers.
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-amber-200/80 shadow-sm space-y-6 text-[#3E3027] text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-black text-[#1E1915] flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-600" />
            1. Delivery Service & Radius
          </h2>
          <p className="text-xs sm:text-sm text-[#55473E]">
            We provide local home delivery across Gwalior within our specified coverage zones around Badagoan Rd & Khureiri. Minimum order threshold is ₹{settings.minOrderAmount || 99}. Free delivery is automatically applied on orders above ₹{settings.freeDeliveryThreshold || 499}.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-black text-[#1E1915] flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            2. Fresh Preparation & Delivery Times
          </h2>
          <p className="text-xs sm:text-sm text-[#55473E]">
            All pizzas are made-to-order with fresh fermented dough and 100% mozzarella cheese. Average oven bake time is 15-25 minutes. Delivery duration may vary moderately during adverse weather conditions or peak dinner hours (7:30 PM - 10:00 PM).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-black text-[#1E1915] flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            3. Cancellations & Modifications
          </h2>
          <p className="text-xs sm:text-sm text-[#55473E]">
            Because food items are freshly prepared immediately upon receiving your order, cancellations can only be accepted within 5 minutes of placing your order by directly calling our hotline at {settings.whatsAppNumber}.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-black text-[#1E1915] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            4. Pricing & Payments
          </h2>
          <p className="text-xs sm:text-sm text-[#55473E]">
            All displayed prices are in Indian Rupees (₹). We accept Cash on Delivery (COD) and direct UPI transfers upon delivery.
          </p>
        </section>

        <div className="pt-4 border-t border-amber-100 flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs text-[#8A7B70]">
            Need immediate clarification? Reach our store supervisor:
          </span>
          <a
            href={`tel:${settings.whatsAppNumber}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>{settings.whatsAppNumber}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
