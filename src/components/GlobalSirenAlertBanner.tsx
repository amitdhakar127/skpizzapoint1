import React, { useEffect, useState } from 'react';
import { BellRing, VolumeX, Eye, ShieldAlert } from 'lucide-react';
import { soundAlerts, ActiveAlarmOrder } from '../lib/soundAlerts';
import { useApp } from '../context/AppContext';

export const GlobalSirenAlertBanner: React.FC = () => {
  const { navigate, formatPrice } = useApp();
  const [isRinging, setIsRinging] = useState<boolean>(() => soundAlerts.isAlarmRinging());
  const [order, setOrder] = useState<ActiveAlarmOrder | null>(() => soundAlerts.getActiveAlarmOrder());

  useEffect(() => {
    const unsub = soundAlerts.subscribeAlarm((ringing, currentOrder) => {
      setIsRinging(ringing);
      setOrder(currentOrder);
    });
    return unsub;
  }, []);

  if (!isRinging || !order) return null;

  const handleStop = () => {
    soundAlerts.stopContinuousAlarm();
  };

  const handleView = () => {
    soundAlerts.stopContinuousAlarm();
    if (order.id && order.id !== 'TEST-ALERT') {
      navigate('/admin');
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-2xl border-b-4 border-amber-300 px-3 py-2.5 sm:px-6 sm:py-3 animate-bounce-slow">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Flashing Left Alert info */}
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-2xl bg-white text-red-600 flex items-center justify-center shrink-0 shadow-lg animate-pulse">
            <BellRing className="w-6 h-6 animate-wiggle" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider">
                🚨 इमरजेंसी ऑर्डर सायरन (NEW ORDER ALARM)
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            </div>
            <p className="text-xs sm:text-sm font-black tracking-wide text-white drop-shadow">
              ऑर्डर #{order.id}: {order.customerName} — {formatPrice(order.amount)}
            </p>
          </div>
        </div>

        {/* Action Buttons: Giant STOP SIREN and View */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
          <button
            type="button"
            onClick={handleStop}
            id="btn-emergency-stop-siren"
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-100 active:scale-95 text-red-700 font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-transform cursor-pointer border-2 border-red-300 ring-4 ring-white/30"
          >
            <VolumeX className="w-4 h-4 text-red-600" />
            <span>🛑 अलार्म बंद करें (STOP ALARM)</span>
          </button>

          <button
            type="button"
            onClick={handleView}
            className="px-4 py-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-950 active:scale-95 text-amber-300 font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5 transition-transform cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>ऑर्डर देखें</span>
          </button>
        </div>
      </div>
    </div>
  );
};
