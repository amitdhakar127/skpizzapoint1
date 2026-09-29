import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Flame,
  Sparkles,
  MessageCircle,
  MapPin,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Image as ImageIcon,
  Sliders,
  Film,
  Building,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const VideoHero: React.FC = () => {
  const { settings, navigate } = useApp();
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Scroll scrub state: scrubs frame-by-frame as user scrolls down!
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isScrollDriven, setIsScrollDriven] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);
  const [videoFailed, setVideoFailed] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  // User toggleable media mode on hero: 'storefront' | 'video'
  const [heroMode, setHeroMode] = useState<'storefront' | 'video'>('storefront');

  const TOTAL_FRAMES = 60;
  const currentFrame = Math.min(
    TOTAL_FRAMES,
    Math.max(1, Math.round(scrollProgress * (TOTAL_FRAMES - 1)) + 1)
  );

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

  // Scroll-driven Frame Scrubbing Engine
  useEffect(() => {
    if (prefersReducedMotion) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollDistance = window.scrollY;
          // Calculate progress over the first 700px of scrolling
          const maxScroll = Math.max(window.innerHeight * 1.1, 550);
          const progress = Math.min(Math.max(scrollDistance / maxScroll, 0), 1);
          setScrollProgress(progress);

          if (
            heroMode === 'video' &&
            isScrollDriven &&
            videoRef.current &&
            videoRef.current.duration &&
            !isNaN(videoRef.current.duration)
          ) {
            const targetTime = progress * videoRef.current.duration;
            if (Math.abs(videoRef.current.currentTime - targetTime) > 0.04) {
              videoRef.current.currentTime = targetTime;
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial position sync

    return () => window.removeEventListener('scroll', handleScroll);
  }, [heroMode, isScrollDriven, prefersReducedMotion]);

  // Handle Play/Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setIsScrollDriven(true);
    } else {
      setIsScrollDriven(false);
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const videoUrl =
    settings.homepageVideoUrl?.trim() ||
    'https://assets.mixkit.co/videos/preview/mixkit-top-view-of-a-pizza-baking-in-an-oven-43956-large.mp4';

  const storefrontImageUrl =
    settings.heroImageUrl?.trim() ||
    settings.homepageImageUrl?.trim() ||
    'https://i.imgur.com/ofhMdHe.jpeg';

  const darknessLevel = settings.heroOverlayDarkness || 'balanced';

  // Dynamic frame-by-frame transform calculations based on scrollProgress
  const scaleValue = 1 + scrollProgress * 0.18; // smooth 1.0 -> 1.18 zoom
  const translateYValue = scrollProgress * 25; // 0px -> 25px depth parallax
  const brightnessValue = 1 - scrollProgress * 0.12;

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-[85vh] lg:min-h-[92vh] flex items-center justify-center overflow-hidden bg-[#0e0c0a] text-white"
    >
      {/* Background Layer: Real Storefront Photo Frame-by-Frame Scroll or Video */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden">
        {heroMode === 'storefront' ? (
          <div
            className="w-full h-full relative transition-transform duration-100 ease-out will-change-transform"
            style={{
              transform: `scale(${scaleValue}) translateY(${translateYValue}px)`,
              filter: `brightness(${brightnessValue})`,
            }}
          >
            <img
              src={storefrontImageUrl}
              alt="SK Pizza Point Official Storefront"
              className="w-full h-full object-cover opacity-95 transition-opacity duration-700"
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            poster={storefrontImageUrl}
            autoPlay={!isScrollDriven}
            muted
            loop={!isScrollDriven}
            playsInline
            onLoadedData={() => {
              setVideoLoaded(true);
              if (isScrollDriven && videoRef.current) {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
              }
            }}
            onError={() => setVideoFailed(true)}
            className={`w-full h-full object-cover transition-opacity duration-700 ${
              videoLoaded ? 'opacity-95' : 'opacity-40'
            }`}
          />
        )}

        {/* Overlay Gradients */}
        {darknessLevel === 'subtle' ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/15 to-black/25" />
            <div className="absolute inset-0 bg-radial from-transparent via-black/10 to-black/35" />
          </>
        ) : darknessLevel === 'cinematic' ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0907]/80 via-[#0B0907]/45 to-[#0B0907]/55" />
            <div className="absolute inset-0 bg-radial from-transparent via-[#0B0907]/25 to-[#0B0907]/75" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/30" />
            <div className="absolute inset-0 bg-radial from-transparent via-black/15 to-black/50" />
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
          Experience authentic hand-stretched pizzas with 100% pure mozzarella, loaded burgers, and golden grilled toast sandwiches crafted fresh to order at SK Pizza Point.
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

        {/* CTA Buttons */}
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

      {/* Floating Controls: Scroll Scrub Mode, Frame Indicator, and Storefront/Video Switcher */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-wrap items-center gap-2">
        {/* Frame / Scroll Counter */}
        <div
          className="px-3 py-1.5 rounded-xl bg-black/75 text-amber-300 border border-amber-400/40 backdrop-blur-md text-xs font-bold flex items-center gap-1.5 shadow-lg select-none"
          title="Scroll down to scrub frames forward, scroll up to scrub backward"
        >
          <Film className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>
            Frame {currentFrame} / {TOTAL_FRAMES}
          </span>
          <span className="text-[10px] text-neutral-300 hidden sm:inline">
            • स्क्रोल फ्रेम
          </span>
        </div>

        {/* Media Mode Switcher: Storefront Image vs Baking Video */}
        <div className="flex items-center gap-1 bg-black/75 p-1 rounded-xl border border-white/20 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setHeroMode('storefront')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              heroMode === 'storefront'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>रेस्टोरेंट फोटो</span>
          </button>

          <button
            type="button"
            onClick={() => setHeroMode('video')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              heroMode === 'video'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>वीडियो</span>
          </button>
        </div>

        {heroMode === 'video' && !prefersReducedMotion && !videoFailed && (
          <button
            id="btn-hero-video-toggle"
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause background video' : 'Play background video'}
            title={isPlaying ? 'Pause background video' : 'Play background video'}
            className="p-2.5 rounded-xl bg-black/65 hover:bg-black/85 text-white border border-white/25 backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-90"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Scroll Down Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 text-neutral-300 flex flex-col items-center pointer-events-none opacity-85 select-none">
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-300">
          Scroll to Scrub Frames
        </span>
        <ChevronDown className="w-4 h-4 animate-bounce mt-1 text-amber-400" />
      </div>
    </section>
  );
};
