import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu as MenuIcon, X, Phone, Lock, Sparkles, Compass, User as UserIcon, ShieldAlert, Home, Bell, Navigation } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Header: React.FC = () => {
  const {
    currentPath,
    navigate,
    cartCount,
    setIsCartOpen,
    settings,
    currentUser,
    userProfile,
    isAdmin,
    activeBroadcast,
  } = useApp();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Menu', path: '/menu' },
    { label: 'Live Track', path: '/track' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Videos', path: '/videos' },
    { label: 'Reviews', path: '/reviews' },
    { label: 'Contact', path: '/contact' },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    if (path === '/' && currentPath === '/') return true;
    if (path !== '/' && currentPath.startsWith(path)) return true;
    return false;
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#FFFDF9]/95 backdrop-blur-md shadow-sm border-b border-amber-100 py-3'
          : 'bg-[#FFFDF9] border-b border-amber-100/60 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo & Name */}
          <button
            onClick={() => handleNavClick('/')}
            className="flex items-center gap-3 group text-left transition-transform duration-200 hover:scale-[1.02] cursor-pointer"
            id="brand-logo-button"
          >
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-amber-400 shadow-md bg-amber-50 shrink-0 flex items-center justify-center">
              {!imgError ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.restaurantName}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-amber-500 flex items-center justify-center font-black text-slate-950 text-sm">
                  SK
                </div>
              )}
            </div>
            <div>
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-[#1E1915] block leading-tight">
                {settings.restaurantName}
              </span>
              <span className="text-[11px] font-semibold text-amber-700 block tracking-wide">
                Fresh • Hot • Seriously Delicious
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-amber-50/60 px-3 py-1.5 rounded-full border border-amber-200/60">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <button
                  key={link.path}
                  onClick={() => handleNavClick(link.path)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    active
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-[#45382E] hover:text-[#1E1915] hover:bg-amber-100/60'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Desktop Right Action Area */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Always Visible Home Button */}
            <button
              id="btn-header-home-desktop"
              onClick={() => handleNavClick('/')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentPath === '/'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'bg-white border border-amber-200 text-[#1E1915] hover:bg-amber-50'
              }`}
              title="Home"
            >
              <Home className="w-4 h-4 text-amber-700" />
              <span>Home</span>
            </button>

            {/* Customer Account / Sign In */}
            {currentUser ? (
              <button
                onClick={() => handleNavClick('/account')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  currentPath === '/account'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                    : 'bg-white border-amber-200 text-[#1E1915] hover:bg-amber-50'
                }`}
                title="My Account & Orders"
              >
                <div className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-[10px] font-black">
                  {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="max-w-[100px] truncate">
                  {userProfile?.displayName?.split(' ')[0] || 'My Account'}
                </span>
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('/login')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#45382E] hover:text-[#1E1915] hover:bg-amber-100/60 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 text-amber-700" />
                <span>Sign In</span>
              </button>
            )}

            {/* Active Announcement Bell Indicator */}
            {activeBroadcast && (
              <button
                type="button"
                onClick={() => handleNavClick('/menu')}
                className="relative p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 transition-colors cursor-pointer"
                title={`Active Announcement: ${activeBroadcast.title}`}
              >
                <Bell className="w-4 h-4 text-amber-700 animate-bounce" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              </button>
            )}

            {/* Cart Button with Count Badge */}
            <button
              id="btn-desktop-cart"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-amber-200 hover:border-amber-300 text-[#1E1915] font-bold text-sm shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-amber-600" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Order Now Button */}
            <button
              id="btn-desktop-order-now"
              onClick={() => handleNavClick('/menu')}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              Order Now
            </button>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex lg:hidden items-center gap-2">
            {/* Always Visible Mobile Titlebar Home Button */}
            <button
              id="btn-mobile-topbar-home"
              onClick={() => handleNavClick('/')}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                currentPath === '/'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-white border-amber-200 text-[#1E1915] shadow-sm hover:bg-amber-50'
              }`}
              aria-label="Home"
              title="Go to Home"
            >
              <Home className="w-5 h-5 text-amber-700" />
            </button>

            {/* Account Icon */}
            <button
              onClick={() => handleNavClick(currentUser ? '/account' : '/login')}
              className="p-2.5 rounded-xl bg-white border border-amber-200 text-[#1E1915] shadow-sm cursor-pointer"
              aria-label="Account"
            >
              <UserIcon className="w-5 h-5 text-amber-700" />
            </button>

            {/* Active Announcement Bell for Mobile */}
            {activeBroadcast && (
              <button
                type="button"
                onClick={() => handleNavClick('/menu')}
                className="relative p-2.5 rounded-xl bg-amber-500/10 border border-amber-300 text-amber-900 cursor-pointer"
                title={`Active Announcement: ${activeBroadcast.title}`}
              >
                <Bell className="w-5 h-5 text-amber-700 animate-bounce" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              </button>
            )}

            {/* Cart icon */}
            <button
              id="btn-mobile-cart"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-xl bg-white border border-amber-200 text-[#1E1915] shadow-sm cursor-pointer"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-5 h-5 text-amber-600" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Hamburger button */}
            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-amber-100 text-amber-950 hover:bg-amber-200 transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[73px] bottom-0 bg-black/40 backdrop-blur-sm z-50 animate-fade-in">
          <div className="bg-[#FFFDF9] border-b border-amber-200 p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex flex-col gap-1.5">
              {navLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <button
                    key={link.path}
                    onClick={() => handleNavClick(link.path)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold text-base transition-colors cursor-pointer ${
                      active
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-[#1E1915] hover:bg-amber-50'
                    }`}
                  >
                    <span>{link.label}</span>
                    <span className="text-xs opacity-60">→</span>
                  </button>
                );
              })}

              {/* Mobile Account link */}
              <button
                onClick={() => handleNavClick(currentUser ? '/account' : '/login')}
                className="flex items-center justify-between px-4 py-3 rounded-xl font-bold text-base text-[#1E1915] hover:bg-amber-50 border border-amber-100 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-amber-700" />
                  <span>{currentUser ? 'My Profile & Orders' : 'Sign In / Register'}</span>
                </div>
                <span className="text-xs opacity-60">→</span>
              </button>
            </div>

            <div className="pt-4 border-t border-amber-200/80 space-y-3">
              <button
                onClick={() => handleNavClick('/menu')}
                className="w-full py-3.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-center shadow-md shadow-amber-500/25 cursor-pointer"
              >
                Order Fresh Pizza Now
              </button>

              <div className="flex items-center justify-between gap-3 pt-2">
                <a
                  href={`tel:${settings.whatsAppNumber}`}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-neutral-100 text-[#1E1915] text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-600" />
                  <span>Call Us ({settings.whatsAppNumber})</span>
                </a>

                <button
                  onClick={() => handleNavClick('/track')}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-amber-100 text-amber-950 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5 text-amber-700" />
                  <span>Track Order</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
