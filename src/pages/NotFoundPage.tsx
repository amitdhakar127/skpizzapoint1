import React, { useEffect } from 'react';
import { Pizza, Home, UtensilsCrossed, PhoneCall } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const NotFoundPage: React.FC = () => {
  const { navigate, settings } = useApp();

  useEffect(() => {
    // Set page title for 404
    document.title = '404 - Slice Not Found | SK Pizza Point';
    return () => {
      document.title = 'SK Pizza Point | Fresh & Delicious Pizza Delivery';
    };
  }, []);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-[#181411] text-[#FDFBF7] rounded-3xl p-8 sm:p-10 border border-amber-500/30 shadow-2xl text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
          <Pizza className="w-10 h-10 animate-bounce" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider inline-block">
            Error 404
          </span>
          <h1 className="text-3xl sm:text-4xl font-black font-heading text-white">
            Oops! Slice Missing
          </h1>
          <p className="text-xs sm:text-sm text-[#A8988C] leading-relaxed">
            The page you're searching for might have been eaten or never came out of the oven. Let's get you back to the fresh feast!
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={() => navigate('/')}
            className="w-full py-3.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </button>

          <button
            onClick={() => navigate('/menu')}
            className="w-full py-3.5 px-5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm border border-neutral-700 flex items-center justify-center gap-2 transition-colors"
          >
            <UtensilsCrossed className="w-4 h-4 text-amber-400" />
            <span>Browse Delicious Menu</span>
          </button>

          <a
            href={`tel:${settings.whatsAppNumber || '+919617142439'}`}
            className="w-full py-3 px-5 rounded-2xl bg-transparent hover:bg-neutral-800/60 text-[#D4C3B7] font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
            <span>Need Help? Call Kitchen ({settings.whatsAppNumber || '+91 9617142439'})</span>
          </a>
        </div>
      </div>
    </div>
  );
};
