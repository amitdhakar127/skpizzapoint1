import React from 'react';
import {
  MapPin,
  Phone,
  Clock,
  Instagram,
  Facebook,
  Youtube,
  MessageCircle,
  ExternalLink,
  Navigation,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ContactPage: React.FC = () => {
  const { settings } = useApp();

  return (
    <div className="min-h-screen bg-[#FFFDF9] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-amber-600" />
            <span>Visit Us & Get In Touch</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#1E1915]">
            We’d Love to Welcome You
          </h1>
          <p className="text-sm sm:text-base text-[#6B5B4F]">
            Find our exact location, opening hours, WhatsApp direct hotline, and social channels.
          </p>
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Location card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-amber-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-[#1E1915]">Our Location</h3>
            <p className="text-xs sm:text-sm text-[#6B5B4F] leading-relaxed">
              {settings.address}
            </p>
            <div className="pt-2">
              <a
                href={settings.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-all"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Open in Google Maps</span>
              </a>
            </div>
          </div>

          {/* Timings card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-amber-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-[#1E1915]">Operating Hours</h3>
            <p className="text-xs sm:text-sm text-[#6B5B4F] leading-relaxed">
              {settings.openingHours}
            </p>
            <p className="text-xs text-amber-800 font-semibold pt-2">
              Hot kitchen open 7 days a week for takeaway, dine-in, and home delivery!
            </p>
          </div>

          {/* WhatsApp Direct */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-amber-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-[#1E1915]">WhatsApp & Phone</h3>
            <p className="text-xs sm:text-sm text-[#6B5B4F] leading-relaxed">
              Call or message: <strong>{settings.whatsAppNumber}</strong>
            </p>
            <div className="pt-2">
              <a
                href={settings.whatsAppDirectLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow-sm transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                <span>Direct WhatsApp Chat</span>
              </a>
            </div>
          </div>
        </div>

        {/* Google Maps Embed & Showcase */}
        <div className="bg-white rounded-3xl border border-amber-200 overflow-hidden shadow-xl">
          <div className="p-6 sm:p-8 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">Google Maps Directions</h2>
              <p className="text-xs sm:text-sm font-semibold text-amber-950 mt-1">
                Tap below for turnkey turn-by-turn navigation directly to SK Pizza Point.
              </p>
            </div>

            <a
              id="btn-directions-google-maps"
              href={settings.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-[#1E1915] hover:bg-neutral-800 text-white font-bold text-sm shadow-md flex items-center gap-2 self-start sm:self-auto transition-colors"
            >
              <Navigation className="w-4 h-4 text-amber-400" />
              <span>Get Directions</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Map frame or interactive placeholder */}
          <div className="w-full h-80 sm:h-96 bg-neutral-100 relative">
            <iframe
              src={settings.googleMapsEmbedUrl || 'https://maps.google.com/maps?q=SK+Pizza+Point&output=embed'}
              title="SK Pizza Point Google Map"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Social media connections */}
        <div className="p-8 rounded-3xl bg-neutral-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl font-black text-amber-400">Follow Our Culinary Journey</h3>
            <p className="text-xs text-neutral-400">
              Stay tuned for special offers, limited-time toppings, and behind-the-scenes stories.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={settings.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-pink-600/20 text-pink-400 hover:bg-pink-600 hover:text-white border border-pink-500/30 text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <Instagram className="w-4 h-4" />
              <span>Instagram</span>
            </a>

            <a
              href={settings.whatsAppDirectLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>

            {settings.facebookUrl && (
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <Facebook className="w-4 h-4" />
                <span>Facebook</span>
              </a>
            )}

            {settings.youtubeUrl && (
              <a
                href={settings.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <Youtube className="w-4 h-4" />
                <span>YouTube</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
