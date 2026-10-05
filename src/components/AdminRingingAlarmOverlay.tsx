// Full-screen / Sticky High-Priority Ringing Alarm Banner for Admin
// KEEPS RINGING and buzzing until the admin taps "STOP ALARM & ACCEPT ORDER"

import React, { useEffect, useState } from 'react';
import { Volume2, BellRing, Check, Eye, X, Phone, MessageCircle } from 'lucide-react';
import { soundAlerts, ActiveAlarmOrder } from '../lib/soundAlerts';
import { useApp } from '../context/AppContext';

interface AdminRingingAlarmOverlayProps {
  onOpenOrder: (orderId: string) => void;
}

export const AdminRingingAlarmOverlay: React.FC<AdminRingingAlarmOverlayProps> = ({ onOpenOrder }) => {
  const { orders, formatPrice, acceptOrderWithLiveLocation } = useApp();
  const [isRinging, setIsRinging] = useState(false);
  const [activeAlarmOrder, setActiveAlarmOrder] = useState<ActiveAlarmOrder | null>(null);

  useEffect(() => {
    const unsub = soundAlerts.subscribeAlarm((ringing, order) => {
      setIsRinging(ringing);
      setActiveAlarmOrder(order);
    });
    return () => unsub();
  }, []);

  if (!isRinging || !activeAlarmOrder) return null;

  const currentOrder = orders.find((o) => o.id === activeAlarmOrder.id);

  const handleStopAndAccept = async () => {
    if (activeAlarmOrder) {
      await acceptOrderWithLiveLocation(activeAlarmOrder.id, 'Preparing');
      onOpenOrder(activeAlarmOrder.id);
    } else {
      soundAlerts.stopContinuousAlarm();
    }
  };

  const handleDismiss = () => {
    soundAlerts.stopContinuousAlarm();
  };

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] p-3 sm:p-4 bg-gradient-to-r from-red-600 via-amber-600 to-red-600 text-white shadow-2xl animate-bounce-subtle border-b-4 border-amber-300">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left info with pulsating siren */}
        <div className="flex items-center gap-3 text-center md:text-left">
          <div className="w-12 h-12 rounded-2xl bg-white text-red-600 flex items-center justify-center shrink-0 shadow-lg animate-pulse">
            <BellRing className="w-7 h-7 animate-wiggle" />
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-2 py-0.5 rounded-full bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider animate-pulse">
                🚨 ALARM RINGING (ACTIVE)
              </span>
              <span className="font-mono font-black text-sm text-yellow-200">
                #{activeAlarmOrder.id}
              </span>
            </div>
            <p className="text-sm sm:text-base font-black mt-0.5">
              New Order: {activeAlarmOrder.customerName} ({formatPrice(activeAlarmOrder.amount)})
            </p>
            {currentOrder?.deliveryAddress && (
              <p className="text-xs text-yellow-100 font-semibold line-clamp-1">
                📍 {currentOrder.deliveryAddress}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleStopAndAccept}
            className="px-5 py-2.5 rounded-2xl bg-white text-red-700 hover:bg-yellow-300 hover:text-slate-950 font-black text-xs sm:text-sm shadow-xl flex items-center gap-2 transition-all active:scale-95 cursor-pointer ring-4 ring-white/40"
          >
            <Check className="w-5 h-5 text-emerald-600" />
            <span>ACCEPT & SHARE LIVE LOCATION</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundAlerts.stopContinuousAlarm();
              onOpenOrder(activeAlarmOrder.id);
            }}
            className="px-4 py-2.5 rounded-2xl bg-black/40 hover:bg-black/60 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-white/30"
          >
            <Eye className="w-4 h-4" />
            <span>View Order Details</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-2 rounded-2xl bg-black/30 hover:bg-black/50 text-white text-xs transition-colors cursor-pointer"
            title="Stop Alarm Sound"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
