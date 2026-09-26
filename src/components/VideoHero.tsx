import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Flame, Sparkles, MessageCircle, MapPin, ArrowRight, ShieldCheck, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const VideoHero: React.FC = () => {
  const { settings, navigate } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);
  const [videoFailed, setVideoFailed] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  // Check user's OS reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Handle Play/Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          setIsPlaying(false);
        });
    }
  };

  // Smart YouTube ID extraction (handles youtu.be, watch?v=, /shorts/, /embed/)
  const extractYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const match = url.trim().match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  };

  const rawVideoUrl = settings.homepageVideoUrl?.trim() || '';
  const youtubeId = extractYouTubeId(rawVideoUrl);

  const videoUrl =
    rawVideoUrl ||
    'https://assets.mixkit.co/videos/preview/mixkit-top-view-of-a-pizza-baking-in-an-oven-43956-large.mp4';

  const imageUrl =
    settings.homepageImageUrl?.trim() ||
    settings.heroImageUrl?.trim() ||
    settings.homepageVideoPosterUrl?.trim() ||
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1920&q=80';

  // Smart detection: check if videoUrl looks like an image or mediaType is explicitly 'image'
  const isVideoUrlAnImage =
    /\.(jpg|jpeg|png|webp|avif|gif)(\?.*)?$/i.test(videoUrl) ||
    videoUrl.includes('images.unsplash.com') ||
    videoUrl.includes('i.imgur.com');

  const effectiveMediaType =
    settings.homepageMediaType === 'image' || isVideoUrlAnImage ? 'image' : 'video';

  const darknessLevel = settings.heroOverlayDarkness || 'balanced';

  return (
    <section className="relative w-full min-h-[85vh] lg:min-h-[92vh] flex items-center justify-center overflow-hidden bg-[#0e0c0a] text-white">
      {/* Background Layer: Responsive Video, YouTube stream, or High-Res Image */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden">
        {effectiveMediaType === 'image' ? (
          <img
            src={imageUrl}
            alt="SK Pizza Point Freshly Baked Pizza"
            className="w-full h-full object-cover opacity-95 transition-transform duration-1000 scale-100 hover:scale-105"
          />
        ) : youtubeId && !prefersReducedMotion ? (
          /* Seamless Auto-looping YouTube Embed without black bars or YouTube UI */
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&playsinline=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&modestbranding=1&fs=0`}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160vw] h-[160vh] min-w-full min-h-full object-cover scale-125 pointer-events-none transition-opacity duration-1000 opacity-95"
              style={{ border: 'none', pointerEvents: 'none' }}
              allow="autoplay; encrypted-media; picture-in-picture"
              title="SK Pizza Point Background Video"
            />
          </div>
        ) : !prefersReducedMotion && !videoFailed ? (
          <video
            ref={videoRef}
            src={videoUrl}
            poster={imageUrl}
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setVideoFailed(true)}
            className={`w-full h-full object-cover transition-opacity duration-700 ${
              videoLoaded ? 'opacity-95' : 'opacity-40'
            }`}
          />
        ) : (
          <img
            src={imageUrl}
            alt="SK Pizza Point Freshly Baked Pizza"
            className="w-full h-full object-cover opacity-95 transition-transform duration-1000 scale-100 hover:scale-105"
          />
        )}

        {/* Fallback image if video is buffering/failed and not YouTube */}
        {effectiveMediaType === 'video' && !youtubeId && !videoLoaded && (
          <img
            src={imageUrl}
            alt="SK Pizza Point Background"
            className="absolute inset-0 w-full h-full object-cover opacity-85"
          />
        )}

        {/* Reduced Overlay Darkness for Bright, Vibrant, Mouthwatering Food Visibility */}
        {darknessLevel === 'subtle' ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/20" />
            <div className="absolute inset-0 bg-radial from-transparent via-black/10 to-black/35" />
          </>
        ) : darknessLevel === 'cinematic' ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0907]/75 via-[#0B0907]/40 to-[#0B0907]/50" />
            <div className="absolute inset-0 bg-radial from-transparent via-[#0B0907]/25 to-[#0B0907]/70" />
          </>
        ) : (
          /* Balanced (Default) - Noticeably lighter & brighter so pizzas and videos pop! */
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/25" />
            <div className="absolute inset-0 bg-radial from-transparent via-black/15 to-black/45" />
          </>
        )}
      </div>

      {/* Foreground Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex flex-col items-center text-center">
        {/* Brand Eyebrow Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-400/25 backdrop-blur-md border border-amber-400/40 text-amber-300 text-xs sm:text-sm font-black tracking-wide uppercase shadow-lg shadow-amber-950/40 mb-6 transition-all hover:bg-amber-400/35">
          <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Handcrafted Stone-Oven Crusts</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="text-white font-bold">From ₹49</span>
        </div>

        {/* Main Display Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl leading-[1.08] sm:leading-[1.05] drop-shadow-2xl">
          Freshly Oven-Baked. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-400">
            Seriously Delicious.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg lg:text-xl text-neutral-100 max-w-2xl font-medium leading-relaxed drop-shadow-md">
          Experience authentic hand-stretched pizzas with 100% pure mozzarella, loaded burgers, and golden grilled toast sandwiches crafted fresh to order.
        </p>

        {/* Trust Badges Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-6 text-xs sm:text-sm text-neutral-200">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold">Pure Mozzarella Cheese</span>
          </span>
          <span className="hidden sm:inline text-neutral-500">•</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold">Fresh Handcrafted Dough</span>
          </span>
          <span className="hidden sm:inline text-neutral-500">•</span>
          <span className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold">Piping-Hot 15-Min Prep</span>
          </span>
        </div>

        {/* CTA Buttons with responsive micro-interactions */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <button
            id="btn-hero-explore-menu"
            onClick={() => navigate('/menu')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-base shadow-xl shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Explore Full Menu</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <a
            id="btn-hero-whatsapp-order"
            href={settings.whatsAppDirectLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-white font-black text-base shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>Order on WhatsApp (+91 9617142439)</span>
          </a>

          <button
            id="btn-hero-directions"
            onClick={() => navigate('/contact')}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-95 border border-white/25 text-white font-bold text-base backdrop-blur-md transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>Store Location</span>
          </button>
        </div>

        {/* Special Offer Banner Highlight */}
        {settings.offersText && (
          <div className="mt-8 px-5 py-2.5 rounded-2xl bg-amber-500/20 border border-amber-400/35 backdrop-blur-md text-amber-200 text-xs sm:text-sm font-semibold max-w-xl text-center shadow-lg">
            {settings.offersText}
          </div>
        )}
      </div>

      {/* Floating Controls: Media Mode / Play / Pause */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
        {effectiveMediaType === 'video' && !prefersReducedMotion && !videoFailed && (
          <button
            id="btn-hero-video-toggle"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause background video' : 'Play background video'}
            title={isPlaying ? 'Pause background video' : 'Play background video'}
            className="p-2.5 rounded-xl bg-black/65 hover:bg-black/85 text-white border border-white/25 backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-90"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        )}
        {effectiveMediaType === 'image' && (
          <div className="px-2.5 py-1.5 rounded-xl bg-black/60 text-white/80 border border-white/20 backdrop-blur-md text-[11px] font-bold flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Photo Background</span>
          </div>
        )}
      </div>

      {/* Scroll Down Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 text-neutral-300 flex flex-col items-center pointer-events-none opacity-85">
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-300">Scroll to Explore</span>
        <ChevronDown className="w-4 h-4 animate-bounce mt-1 text-amber-400" />
      </div>
    </section>
  );
};
