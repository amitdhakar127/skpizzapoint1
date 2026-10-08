import React, { useEffect } from 'react';
import { ShieldCheck, Lock, Eye, FileText, ArrowLeft, PhoneCall } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const PrivacyPage: React.FC = () => {
  const { navigate, settings } = useApp();

  useEffect(() => {
    document.title = 'Privacy Policy — Data Security | SK Pizza Point';
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Customer Trust & Data Protection</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#1E1915]">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-[#6B5B4F]">
          Last updated: October 2026 • Effective for all orders placed at SK Pizza Point.
        </p>
      </div>

      {/* Main Privacy Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-amber-200/80 shadow-sm space-y-6 text-[#3E3027] text-sm leading-relaxed">
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm font-semibold text-amber-950">
            <strong>Your Data is 100% Safe with SK Pizza Point:</strong> We only collect customer phone numbers and delivery addresses to prepare your orders and deliver hot food directly to your doorstep. We never sell, rent, or trade your personal information.
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="text-lg font-black text-[#1E1915] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            1. Information We Collect
          </h2>
          <p className="text-xs sm:text-sm text-[#55473E]">
            When you place an order or contact us, we collect:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-xs sm:text-sm text-[#55473E]">
            <li><strong>Full Name & Contact Number:</strong> Used to confirm order status, send WhatsApp delivery links, and contact you upon delivery arrival.</li>
            <li><strong>Delivery Address & Optional GPS Coordinates:</strong> Used strictly by our local delivery riders to navigate accurately to your doorstep.</li>
            <li><strong>Order History & Preferences:</strong> Used to show you recent order receipts and speed up repeat checkouts.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-black text-[#1E1915] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            2. How We Use Your Data
          </h2>
          <p className="text-xs sm:text-sm text-[#55473E]">
            Your information is exclusively utilized for:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-xs sm:text-sm text-[#55473E]">
            <li>Kitchen order queuing and real-time live map tracking.</li>
            <li>Instant WhatsApp dispatch updates and notifications.</li>
            <li>Customer support inquiries regarding refunds, cancellations, or special dietary notes.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-black text-[#1E1915] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            3. Payment Security
          </h2>
          <p className="text-xs sm:text-sm text-[#55473E]">
            SK Pizza Point supports Cash on Delivery (COD) and direct UPI apps (Google Pay, PhonePe, Paytm). We do not store or process debit/credit card CVV or sensitive banking passwords on our servers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-black text-[#1E1915] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            4. Contacting the Kitchen
          </h2>
          <p className="text-xs sm:text-sm text-[#55473E]">
            If you have any questions about this privacy statement or wish to have your contact details updated, reach out directly to:
          </p>
          <div className="pt-2 flex flex-wrap gap-4 items-center">
            <a
              href={`tel:${settings.whatsAppNumber}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{settings.whatsAppNumber}</span>
            </a>
            <span className="text-xs text-[#6B5B4F]">Store Address: {settings.address}</span>
          </div>
        </section>
      </div>
    </div>
  );
};
