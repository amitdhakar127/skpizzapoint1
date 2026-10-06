import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Flame,
  Sparkles,
  MessageCircle,
  MapPin,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Film,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ScrollFrameHeroProps {
  totalFrames?: number;
}

export const ScrollFrameHero: React.FC<ScrollFrameHeroProps> = ({ totalFrames = 60 }) => {
  const { settings, navigate } = useApp();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef<number>(1);
  const targetFrameRef = useRef<number>(1);
  const animFrameIdRef = useRef<number | null>(null);

  const [loadedCount, setLoadedCount] = useState<number>(0);
  const [activeFrameDisplay, setActiveFrameDisplay] = useState<number>(1);
  const [actualTotalFrames, setActualTotalFrames] = useState<number>(totalFrames);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);

  const fallbackImageUrl =
    settings.heroImageUrl?.trim() ||
    settings.homepageImageUrl?.trim() ||
    'https://i.imgur.com/ofhMdHe.jpeg';

  // Helper: Format frame filename with zero padding (e.g., 001, 002)
  const getFrameUrl = useCallback((index: number, padLen: number = 3): string => {
    const pad = String(index).padStart(padLen, '0');
    return `/hero-frames/ezgif-frame-${pad}.jpg`;
  }, []);

  // Draw a given image onto the canvas with cover aspect ratio
  const renderImageToCanvas = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Cover scale calculation
    const hRatio = width / (img.naturalWidth || img.width || width);
    const vRatio = height / (img.naturalHeight || img.height || height);
    const ratio = Math.max(hRatio, vRatio);

    const drawW = (img.naturalWidth || img.width || width) * ratio;
    const drawH = (img.naturalHeight || img.height || height) * ratio;
    const shiftX = (width - drawW) / 2;
    const shiftY = (height - drawH) / 2;

    ctx.fillStyle = '#0E0C0A';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, img.naturalWidth || img.width, img.naturalHeight || img.height, shiftX, shiftY, drawW, drawH);
  }, []);

  // Preload frames sequentially / in batches for ultra-smooth scrubbing
  useEffect(() => {
    let isCancelled = false;
    const images: HTMLImageElement[] = [];
    let countLoaded = 0;
    let detectedFrames = totalFrames;

    // Try detecting how many frames exist (supports standard 30, 45, 60, 80, 100 frames)
    const preload = async () => {
      // First, test if frame 1 exists
      const testImg = new Image();
      testImg.src = getFrameUrl(1, 3);

      testImg.onload = () => {
        if (isCancelled) return;
        // Primary 3-digit pattern works! Preload all frames
        for (let i = 1; i <= detectedFrames; i++) {
          const img = new Image();
          img.src = getFrameUrl(i, 3);
          img.onload = () => {
            if (isCancelled) return;
            countLoaded++;
            setLoadedCount(countLoaded);
            if (i === 1) {
              renderImageToCanvas(img);
              setIsReady(true);
            }
          };
          img.onerror = () => {
            // Reached end of available frames
            if (i > 5 && detectedFrames > i - 1) {
              detectedFrames = i - 1;
              setActualTotalFrames(detectedFrames);
            }
          };
          images.push(img);
        }
        imagesRef.current = images;
      };

      testImg.onerror = () => {
        // Fallback test: Try 2-digit padding or fallback image
        const test2Img = new Image();
        test2Img.src = getFrameUrl(1, 2);
        test2Img.onload = () => {
          if (isCancelled) return;
          for (let i = 1; i <= detectedFrames; i++) {
            const img = new Image();
            img.src = getFrameUrl(i, 2);
            img.onload = () => {
              if (isCancelled) return;
              countLoaded++;
              setLoadedCount(countLoaded);
              if (i === 1) {
                renderImageToCanvas(img);
                setIsReady(true);
              }
            };
            images.push(img);
          }
          imagesRef.current = images;
        };

        test2Img.onerror = () => {
          // Fallback to static hero storefront image if frames are not yet placed
          const fallback = new Image();
          fallback.src = fallbackImageUrl;
          fallback.onload = () => {
            if (isCancelled) return;
            imagesRef.current = [fallback];
            renderImageToCanvas(fallback);
            setIsReady(true);
          };
        };
      };
    };

    preload();

    return () => {
      isCancelled = true;
    };
  }, [totalFrames, getFrameUrl, renderImageToCanvas, fallbackImageUrl]);

  // Resize canvas for device pixel ratio
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;

      const currentIdx = Math.min(
        Math.max(1, Math.round(currentFrameRef.current)),
        imagesRef.current.length
      );
      const activeImg = imagesRef.current[currentIdx - 1];
      if (activeImg && activeImg.complete) {
        renderImageToCanvas(activeImg);
      }
    }
  }, [renderImageToCanvas]);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [updateCanvasSize]);

  // Smooth lerp animation loop for frame rendering
  const animateFrames = useCallback(() => {
    const diff = targetFrameRef.current - currentFrameRef.current;

    if (Math.abs(diff) > 0.05) {
      // Lerp smoothing: smoothly interpolates frame updates to match scroll momentum
      currentFrameRef.current += diff * 0.35;
      const targetIndex = Math.min(
        Math.max(1, Math.round(currentFrameRef.current)),
        imagesRef.current.length || actualTotalFrames
      );

      const img = imagesRef.current[targetIndex - 1];
      if (img && img.complete) {
        renderImageToCanvas(img);
        setActiveFrameDisplay(targetIndex);
      }
    } else {
      currentFrameRef.current = targetFrameRef.current;
      const targetIndex = Math.min(
        Math.max(1, Math.round(currentFrameRef.current)),
        imagesRef.current.length || actualTotalFrames
      );
      const img = imagesRef.current[targetIndex - 1];
      if (img && img.complete) {
        renderImageToCanvas(img);
        setActiveFrameDisplay(targetIndex);
      }
    }

    animFrameIdRef.current = requestAnimationFrame(animateFrames);
  }, [actualTotalFrames, renderImageToCanvas]);

  useEffect(() => {
    animFrameIdRef.current = requestAnimationFrame(animateFrames);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [animateFrames]);

  // Scroll Listener on Window to scrub frames proportional to scroll distance
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerTop = rect.top;
      const totalScrollableDistance = rect.height - window.innerHeight;

      if (totalScrollableDistance <= 0) return;

      // Progress goes from 0 (at top of hero) to 1 (when scrolled past hero track)
      const scrolledPastTop = -containerTop;
      const progress = Math.min(Math.max(scrolledPastTop / totalScrollableDistance, 0), 1);

      setScrollProgress(progress);

      const frameRange = imagesRef.current.length > 1 ? imagesRef.current.length : actualTotalFrames;
      const frameTarget = 1 + progress * (frameRange - 1);
      targetFrameRef.current = frameTarget;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [actualTotalFrames]);

  // Fade out hero text slightly as user finishes scrubbing the pizza frame
  const textOpacity = Math.max(0, 1 - scrollProgress * 1.5);
  const textTranslateY = -(scrollProgress * 60);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: '240vh' }} // Gives 2.4 viewport heights of buttery-smooth scroll scrub track
    >
      {/* Sticky Fullscreen Canvas Stage */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden bg-[#0E0C0A] flex items-center justify-center">
        {/* Hardware-Accelerated Canvas Layer */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Fallback Static Image if canvas is loading initial frames */}
        {!isReady && (
          <img
            src={fallbackImageUrl}
            alt="SK Pizza Point Stone Oven Craft"
            className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity duration-500"
          />
        )}

        {/* Cinematic Vignette Gradients for Text Legibility & Mood */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/50 pointer-events-none" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/75 pointer-events-none" />

        {/* Floating Content Layer (Fades smoothly as user scrolls) */}
        <div
          className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex flex-col items-center text-center will-change-transform transition-opacity duration-200"
          style={{
            opacity: textOpacity,
            transform: `translateY(${textTranslateY}px)`,
            pointerEvents: textOpacity < 0.1 ? 'none' : 'auto',
          }}
        >
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 backdrop-blur-md border border-amber-400/30 text-amber-300 text-xs sm:text-sm font-black tracking-wide uppercase shadow-xl mb-6 hover:bg-amber-400/30 transition-all">
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Artisan Stone-Oven Crusts</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-white font-bold">From ₹49</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl leading-[1.08] sm:leading-[1.05] drop-shadow-2xl">
            Freshly Oven-Baked. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-400">
              Seriously Delicious.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg lg:text-xl text-neutral-200 max-w-2xl font-medium leading-relaxed drop-shadow-lg">
            Experience authentic hand-stretched pizzas with 100% pure mozzarella, loaded burgers, and golden grilled toast sandwiches crafted fresh to order at SK Pizza Point.
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-6 text-xs sm:text-sm text-neutral-300">
            <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-semibold text-neutral-100">Pure Mozzarella Cheese</span>
            </span>
            <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-semibold text-neutral-100">Handcrafted Dough</span>
            </span>
            <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
              <Flame className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-semibold text-neutral-100">Piping-Hot 15-Min Prep</span>
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
        </div>

        {/* Frame Scrub Live Indicator Badge */}
        <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2 select-none">
          <div className="px-3.5 py-1.5 rounded-xl bg-black/80 text-amber-300 border border-amber-400/40 backdrop-blur-md text-xs font-bold flex items-center gap-2 shadow-2xl">
            <Film className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>
              Frame {activeFrameDisplay} / {actualTotalFrames}
            </span>
            <span className="text-[10px] text-neutral-400 border-l border-white/20 pl-2">
              {Math.round(scrollProgress * 100)}%
            </span>
          </div>
        </div>

        {/* Bottom Scroll Prompt */}
        <div
          className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none transition-opacity duration-300 select-none"
          style={{ opacity: Math.max(0, 1 - scrollProgress * 3) }}
        >
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-300 drop-shadow">
            Scroll to Animate
          </span>
          <ChevronDown className="w-4 h-4 text-amber-400 animate-bounce mt-1" />
        </div>
      </div>
    </div>
  );
};
