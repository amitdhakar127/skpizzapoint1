import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingBag, Check, Flame, AlertCircle, Sparkles, Share2 } from 'lucide-react';
import { Product, PizzaSize, AddOn } from '../types';
import { useApp } from '../context/AppContext';

export const ProductDetailModal: React.FC = () => {
  const { activeProductModal, setActiveProductModal, addToCart, formatPrice, navigate, showToast } = useApp();

  if (!activeProductModal) return null;
  const product = activeProductModal;

  const safeSizes = Array.isArray(product?.sizes) && product.sizes.length > 0
    ? product.sizes
    : [{ size: 'Small' as const, price: 99 }];
  const [selectedSize, setSelectedSize] = useState<PizzaSize | 'Standard'>(safeSizes[0]?.size || 'Small');
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [imgError, setImgError] = useState(false);

  const selectedSizeObj = safeSizes.find((s) => s.size === selectedSize) || safeSizes[0];
  const basePrice = selectedSizeObj ? selectedSizeObj.price : 0;
  const addOnsTotal = selectedAddOns.reduce((acc, a) => acc + a.price, 0);
  const unitTotal = basePrice + addOnsTotal;
  const totalPrice = unitTotal * quantity;

  const toggleAddOn = (addon: AddOn) => {
    setSelectedAddOns((prev) => {
      const exists = prev.find((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const handleAddToCart = () => {
    if (!product.isAvailable) return;
    addToCart(product, selectedSize, quantity, selectedAddOns, specialInstructions);
    setActiveProductModal(null);
  };

  const handleBuyNow = () => {
    if (!product.isAvailable) return;
    addToCart(product, selectedSize, quantity, selectedAddOns, specialInstructions);
    setActiveProductModal(null);
    navigate('/checkout');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} at SK Pizza Point`,
          text: `Check out ${product.name} starting from ${formatPrice(basePrice)} at SK Pizza Point!`,
          url: window.location.href,
        });
      } catch {
        // Ignored
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Product link copied to clipboard!', 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-amber-200 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setActiveProductModal(null)}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-white/80 hover:bg-white text-[#1E1915] shadow-lg backdrop-blur-md transition-all"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="absolute top-4 right-16 z-20 p-2.5 rounded-full bg-white/80 hover:bg-white text-[#1E1915] shadow-lg backdrop-blur-md transition-all"
          aria-label="Share product"
          title="Share"
        >
          <Share2 className="w-5 h-5" />
        </button>

        {/* Hero Image */}
        <div className="relative w-full h-64 sm:h-72 bg-amber-50 overflow-hidden">
          {!imgError ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-amber-100 text-amber-900">
              <span className="text-4xl">🍕</span>
              <span className="font-bold text-sm mt-2">{product.name}</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

          {/* Badge & Category */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow">
                {product.category}
              </span>
              {product.badge && (
                <span className="px-3 py-1 rounded-full bg-orange-600 text-white font-bold text-xs uppercase tracking-wider shadow flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  <span>{product.badge}</span>
                </span>
              )}
            </div>

            <div className="text-right">
              <span className="text-xs text-amber-300 font-semibold block uppercase">Unit Base</span>
              <span className="text-2xl font-black text-white">{formatPrice(unitTotal)}</span>
            </div>
          </div>
        </div>

        {/* Details & Customizations */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1E1915]">{product.name}</h2>
            <p className="text-sm sm:text-base text-[#6B5B4F] mt-1.5 leading-relaxed">{product.description}</p>
          </div>

          {/* Status Check */}
          {!product.isAvailable && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2.5 text-sm font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
              <span>This item is currently out of stock. You can still browse other fresh options!</span>
            </div>
          )}

          {/* Size Variants */}
          {safeSizes.length > 1 && (
            <div className="space-y-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#1E1915]">
                Choose Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {safeSizes.map((s) => {
                  const isSelected = selectedSize === s.size;
                  return (
                    <button
                      key={s.size}
                      type="button"
                      onClick={() => setSelectedSize(s.size as PizzaSize)}
                      className={`p-3 rounded-2xl border-2 text-center transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/70 text-slate-950 font-black shadow-sm'
                          : 'border-amber-200/70 bg-white text-[#55473E] font-semibold hover:border-amber-300'
                      }`}
                    >
                      <div className="text-sm">{s.size}</div>
                      <div className="text-sm font-extrabold text-amber-700 mt-0.5">{formatPrice(s.price)}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons Section */}
          {product.availableAddOns && product.availableAddOns.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#1E1915]">
                  Extra Toppings & Add-Ons (Optional)
                </label>
                <span className="text-xs text-amber-700 font-semibold">Multiple allowed</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.availableAddOns.map((addon) => {
                  const isSelected = selectedAddOns.some((a) => a.id === addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => toggleAddOn(addon)}
                      className={`p-2.5 px-3.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 text-slate-950 font-bold shadow-sm'
                          : 'border-amber-100 bg-white text-[#55473E] hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${
                            isSelected ? 'bg-amber-500 border-amber-600 text-white' : 'border-neutral-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-xs font-medium">{addon.name}</span>
                      </div>
                      <span className="text-xs font-bold text-amber-800">+{formatPrice(addon.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#1E1915]">
              Chef Instructions (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Less spicy, extra crispy crust, no onions..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-amber-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between pt-2 border-t border-amber-100">
            <div>
              <span className="text-xs font-bold text-[#6B5B4F] uppercase block">Quantity</span>
              <span className="text-xl sm:text-2xl font-black text-[#1E1915]">{formatPrice(totalPrice)}</span>
            </div>

            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-1.5">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-xl bg-white hover:bg-amber-100 text-[#1E1915] flex items-center justify-center font-bold shadow-sm transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-extrabold text-base w-6 text-center text-[#1E1915]">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-xl bg-white hover:bg-amber-100 text-[#1E1915] flex items-center justify-center font-bold shadow-sm transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Buttons */}
        <div className="p-4 sm:p-6 bg-amber-50/50 border-t border-amber-100 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            disabled={!product.isAvailable}
            onClick={handleAddToCart}
            className={`w-full sm:flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
              product.isAvailable
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 active:scale-95'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add to Cart ({formatPrice(totalPrice)})</span>
          </button>

          <button
            type="button"
            disabled={!product.isAvailable}
            onClick={handleBuyNow}
            className={`w-full sm:flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
              product.isAvailable
                ? 'bg-[#1E1915] hover:bg-[#2E2620] text-white active:scale-95'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Buy Now on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
