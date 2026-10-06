import React from 'react';
import {
  ArrowRight,
  Sparkles,
  Flame,
  Clock,
  ShieldCheck,
  Star,
  MapPin,
  MessageCircle,
  Pizza,
  Sandwich,
  UtensilsCrossed,
} from 'lucide-react';
import { ScrollFrameHero } from '../components/ScrollFrameHero';
import { FoodStorytelling } from '../components/FoodStorytelling';
import { ProductCard } from '../components/ProductCard';
import { useApp } from '../context/AppContext';

export const HomePage: React.FC = () => {
  const { products, reviews, settings, navigate } = useApp();

  const featuredPizzas = products.filter((p) => p.category === 'pizza').slice(0, 3);
  const featuredSnacks = products.filter((p) => p.category !== 'pizza').slice(0, 3);
  const approvedReviews = reviews.filter((r) => r.isApproved).slice(0, 3);

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* 1. Ultra-Smooth Cinematic Scroll-Scrub Video Frames Hero */}
      <ScrollFrameHero />

      {/* 2. Restaurant Value Highlights Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-amber-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-[#1E1915]">Stone-Oven Baked</h4>
              <p className="text-xs text-[#6B5B4F]">Crisp blistered crust</p>
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-amber-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-[#1E1915]">15-25 Mins Prep</h4>
              <p className="text-xs text-[#6B5B4F]">Made fresh to order</p>
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-amber-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-[#1E1915]">Pure Mozzarella</h4>
              <p className="text-xs text-[#6B5B4F]">100% genuine cheese</p>
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-amber-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-[#1E1915]">Direct WhatsApp</h4>
              <p className="text-xs text-[#6B5B4F]">Instant confirmation</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 3D-Themed Food Storytelling Category Showcase */}
      <FoodStorytelling />

      {/* 4. Real Restaurant Storefront & Heritage Story */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-amber-200/80 overflow-hidden shadow-xl grid grid-cols-1 lg:grid-cols-12 items-center">
          {/* Real Restaurant Photograph */}
          <div className="lg:col-span-6 relative h-80 sm:h-96 lg:h-full min-h-[360px] bg-neutral-900">
            <img
              src={settings.heroImageUrl}
              alt="SK Pizza Point Real Storefront"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
            <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
              <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider inline-block">
                Authentic Storefront
              </span>
              <p className="text-sm text-neutral-200 font-medium">
                Real atmosphere, warm hospitality & oven-hot dining at SK Pizza Point.
              </p>
            </div>
          </div>

          {/* Story Text */}
          <div className="lg:col-span-6 p-8 sm:p-12 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-700">
                <Sparkles className="w-4 h-4" />
                <span>Our Heritage & Craft</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#1E1915] leading-tight">
                Crafting Every Slice with Fresh Dough & Genuine Love
              </h2>
              <p className="text-sm sm:text-base text-[#55473E] leading-relaxed">
                {settings.aboutStory}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs sm:text-sm text-[#1E1915] font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Handcrafted slow-fermented dough rested for 24 hours</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-[#1E1915] font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Sun-ripened tomato herb marinara made from scratch daily</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-[#1E1915] font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Crispy grilled sandwiches with golden butter and house sauce</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={() => navigate('/contact')}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                <span>Visit Us & Get Directions</span>
              </button>

              <button
                onClick={() => navigate('/gallery')}
                className="px-5 py-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#1E1915] font-bold text-xs sm:text-sm transition-colors"
              >
                View Photo Gallery
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Featured Pizza Selection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-700 mb-1">
              <Pizza className="w-4 h-4" />
              <span>Signature Selections</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1E1915]">
              Popular Stone-Oven Pizzas
            </h2>
          </div>

          <button
            onClick={() => navigate('/menu/pizza')}
            className="inline-flex items-center gap-2 text-sm font-extrabold text-amber-700 hover:text-amber-800 transition-colors"
          >
            <span>View All 6 Pizzas</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {featuredPizzas.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 6. Popular Burgers & Sandwiches */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-700 mb-1">
              <UtensilsCrossed className="w-4 h-4" />
              <span>Crispy & Grilled Snacks</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1E1915]">
              Fresh Burgers & Sandwiches
            </h2>
          </div>

          <button
            onClick={() => navigate('/menu')}
            className="inline-flex items-center gap-2 text-sm font-extrabold text-amber-700 hover:text-amber-800 transition-colors"
          >
            <span>Explore Complete Menu</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {featuredSnacks.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 7. Real Guest Reviews Snapshot */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
            <Star className="w-3.5 h-3.5 fill-amber-600 text-amber-600" />
            <span>Community Love</span>
          </div>
          <h2 className="text-3xl font-black text-[#1E1915]">Words from Our Guests</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {approvedReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-6 rounded-3xl bg-white border border-amber-200/80 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= rev.rating ? 'fill-amber-500 text-amber-500' : 'text-neutral-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-[#45382E] leading-relaxed">
                  "{rev.comment}"
                </p>
              </div>

              <div className="pt-3 border-t border-amber-100 flex items-center justify-between text-xs">
                <span className="font-extrabold text-[#1E1915]">{rev.customerName}</span>
                <span className="text-[#8A7B70]">Verified Guest</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-2">
          <button
            onClick={() => navigate('/reviews')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-amber-800 hover:text-amber-900 hover:underline"
          >
            <span>Read All Verified Reviews or Leave One →</span>
          </button>
        </div>
      </section>

      {/* 8. WhatsApp Direct Order Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-amber-500 via-amber-500 to-amber-600 p-8 sm:p-12 text-slate-950 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-left z-10">
            <span className="px-3 py-1 rounded-full bg-white/25 text-slate-950 text-xs font-black uppercase tracking-wider inline-block">
              Fast Track Kitchen
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Ready for a Piping-Hot Feast?
            </h2>
            <p className="text-sm sm:text-base font-semibold text-amber-950">
              Send your order directly to WhatsApp (+91 9617142439) with custom sizes, delivery address, and zero wait time!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 z-10 w-full md:w-auto">
            <button
              onClick={() => navigate('/menu')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#1E1915] hover:bg-neutral-800 text-white font-black text-sm shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              Order from Menu
            </button>

            <a
              href={settings.whatsAppDirectLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>Direct Chat</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
