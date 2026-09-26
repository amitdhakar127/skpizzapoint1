import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const FloatingWhatsApp: React.FC = () => {
  const { settings, currentPath } = useApp();
  const [showTooltip, setShowTooltip] = useState(true);

  // Don't clutter if on admin pages
  if (currentPath.startsWith('/admin')) {
    return null;
  }

  const cleanPhone = settings.whatsAppNumber.replace(/[^0-9]/g, '');
  const whatsAppDirect = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    'Hello SK Pizza Point! I would like to inquire about your menu and place an order.'
  )}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 select-none">
      {/* Tooltip bubble */}
      {showTooltip && (
        <div className="relative hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#1E1915] text-white text-xs font-semibold shadow-xl border border-amber-400/30 animate-bounce-subtle">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Need help? Order directly on WhatsApp!</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }}
            className="text-neutral-400 hover:text-white ml-1 p-0.5"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <a
        id="btn-floating-whatsapp"
        href={whatsAppDirect}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#25D366] text-white shadow-2xl hover:bg-[#20bd5a] hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-300"
        aria-label="Chat with SK Pizza Point on WhatsApp"
        title="Direct WhatsApp: +91 96171 42439"
      >
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
        </span>
        <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
      </a>
    </div>
  );
};
