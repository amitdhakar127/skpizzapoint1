import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, X, Sparkles, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';

export const BroadcastAlertBanner: React.FC = () => {
  const { activeBroadcast, dismissActiveBroadcast, navigate } = useApp();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (activeBroadcast) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [activeBroadcast]);

  if (!activeBroadcast || !isVisible) {
    return null;
  }

  const handleActionClick = () => {
    if (activeBroadcast.link) {
      if (activeBroadcast.link.startsWith('http')) {
        window.open(activeBroadcast.link, '_blank', 'noopener,noreferrer');
      } else {
        navigate(activeBroadcast.link);
      }
    } else {
      navigate('/menu');
    }
    dismissActiveBroadcast(activeBroadcast.id);
  };

  const getStyleByType = () => {
    switch (activeBroadcast.type) {
      case 'urgent':
        return {
          bg: 'bg-red-950/95 border-red-500/60 text-white',
          badgeBg: 'bg-red-600 text-white',
          badgeText: '🚨 Urgent Notice',
          btnBg: 'bg-red-500 hover:bg-red-400 text-white',
          icon: <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />,
        };
      case 'offer':
        return {
          bg: 'bg-amber-950/95 border-amber-400/60 text-white',
          badgeBg: 'bg-amber-500 text-slate-950 font-black',
          badgeText: '🔥 Special Offer',
          btnBg: 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black',
          icon: <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />,
        };
      default:
        return {
          bg: 'bg-slate-900/95 border-amber-500/50 text-white',
          badgeBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
          badgeText: '📢 Announcement',
          btnBg: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold',
          icon: <Bell className="w-5 h-5 text-amber-400 shrink-0" />,
        };
    }
  };

  const style = getStyleByType();

  return (
    <div className="fixed top-16 sm:top-20 inset-x-0 z-50 px-3 sm:px-6 pointer-events-none animate-slide-down">
      <div
        className={`max-w-xl mx-auto pointer-events-auto rounded-2xl sm:rounded-3xl border shadow-2xl backdrop-blur-md p-4 sm:p-5 transition-all ${style.bg}`}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-white/10 shrink-0 mt-0.5">
            {style.icon}
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] sm:text-xs uppercase px-2 py-0.5 rounded-full font-black tracking-wider ${style.badgeBg}`}>
                {activeBroadcast.badge || style.badgeText}
              </span>
              <span className="text-[10px] text-neutral-400">Just now</span>
            </div>

            <h4 className="text-sm sm:text-base font-black text-white leading-tight">
              {activeBroadcast.title}
            </h4>

            <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-medium">
              {activeBroadcast.message}
            </p>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleActionClick}
                className={`px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer ${style.btnBg}`}
              >
                <span>View Details / Order</span>
                {activeBroadcast.link?.startsWith('http') ? (
                  <ExternalLink className="w-3.5 h-3.5" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => dismissActiveBroadcast(activeBroadcast.id)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => dismissActiveBroadcast(activeBroadcast.id)}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
