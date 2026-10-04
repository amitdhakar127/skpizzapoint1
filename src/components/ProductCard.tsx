import React, { useState } from 'react';
import { ShoppingBag, Heart, Eye, Check, Flame, AlertCircle } from 'lucide-react';
import { Product, PizzaSize } from '../types';
import { useApp } from '../context/AppContext';

interface ProductCardProps {
  product: Product;
  onOpenDetails?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenDetails }) => {
  const { addToCart, formatPrice, isFavorite, toggleFavorite, setActiveProductModal, navigate } = useApp();
  const safeSizes = Array.isArray(product?.sizes) && product.sizes.length > 0
    ? product.sizes
    : [{ size: 'Small' as const, price: 99 }];
  const [selectedSize, setSelectedSize] = useState<PizzaSize | 'Standard'>(safeSizes[0]?.size || 'Small');
  const [quantity, setQuantity] = useState(1);
  const [imgError, setImgError] = useState(false);

  const selectedSizeObj = safeSizes.find((s) => s.size === selectedSize) || safeSizes[0];
  const currentPrice = selectedSizeObj ? selectedSizeObj.price : 0;
  const isFav = isFavorite(product?.id || '');

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.isAvailable) return;
    addToCart(product, selectedSize, quantity);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.isAvailable) return;
    addToCart(product, selectedSize, quantity);
    navigate('/checkout');
  };

  const handleCardClick = () => {
    if (onOpenDetails) {
      onOpenDetails(product);
    } else {
      setActiveProductModal(product);
    }
  };

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={handleCardClick}
      className={`group relative flex flex-col justify-between bg-white rounded-2xl sm:rounded-3xl border transition-all duration-300 overflow-hidden cursor-pointer ${
        product.isAvailable
          ? 'border-amber-100/90 hover:border-amber-300 card-depth hover:shadow-xl hover:-translate-y-1'
          : 'border-neutral-200 opacity-80 bg-neutral-50/50'
      }`}
    >
      {/* Top Image Container with 3D Depth */}
      <div className="relative w-full h-48 sm:h-52 bg-amber-50/40 overflow-hidden">
        {!imgError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200 text-amber-900 p-4 text-center">
            <span className="font-extrabold text-2xl">🍕</span>
            <span className="text-xs font-bold mt-1">{product.name}</span>
          </div>
        )}

        {/* Gradient shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Badge (e.g. Popular, Extra Cheesy, etc.) */}
        {product.badge && product.isAvailable && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-md border border-amber-300 flex items-center gap-1">
            <Flame className="w-3 h-3" />
            <span>{product.badge}</span>
          </div>
        )}

        {/* Out of Stock banner */}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-neutral-900/65 backdrop-blur-[1px] flex items-center justify-center p-4">
            <span className="px-4 py-1.5 rounded-xl bg-red-600 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Out of Stock</span>
            </span>
          </div>
        )}

        {/* Favorite button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all shadow-md ${
            isFav
              ? 'bg-rose-500 text-white'
              : 'bg-white/80 text-[#55473E] hover:bg-white hover:text-rose-500'
          }`}
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
        </button>

        {/* Quick view button hint on hover */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="px-3 py-1 rounded-xl bg-white/90 text-[#1E1915] text-xs font-bold shadow flex items-center gap-1">
            <Eye className="w-3 h-3 text-amber-600" />
            <span>Details</span>
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-extrabold text-lg sm:text-xl text-[#1E1915] group-hover:text-amber-700 transition-colors line-clamp-1">
              {product.name}
            </h3>
            <span className="text-xs uppercase font-extrabold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md shrink-0">
              {product.category}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#6B5B4F] mt-1.5 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Size Selection Tabs (if product has multiple sizes like Pizzas) */}
        {safeSizes.length > 1 ? (
          <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between text-xs text-[#55473E] font-medium">
              <span>Select Size:</span>
              <span className="text-amber-800 font-bold">{selectedSize}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-amber-50/70 border border-amber-200/60">
              {safeSizes.map((s) => {
                const isSelected = selectedSize === s.size;
                return (
                  <button
                    key={s.size}
                    type="button"
                    onClick={() => setSelectedSize(s.size as PizzaSize)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-[#55473E] hover:bg-amber-100/60'
                    }`}
                  >
                    <div>{s.size}</div>
                    <div className="text-[11px] font-extrabold opacity-90">{formatPrice(s.price)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-xs text-[#6B5B4F] font-medium">
            <span>Size: Standard portion</span>
          </div>
        )}

        {/* Price & Action Row */}
        <div className="pt-2 border-t border-amber-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-[#6B5B4F] block">Total</span>
            <span className="text-xl sm:text-2xl font-black text-[#1E1915]">
              {formatPrice(currentPrice)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id={`btn-add-cart-${product.id}`}
              type="button"
              disabled={!product.isAvailable}
              onClick={handleAddToCart}
              className={`p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                product.isAvailable
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95 shadow-amber-500/20'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
              title={product.isAvailable ? 'Add to cart' : 'Out of stock'}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>

            <button
              id={`btn-buy-now-${product.id}`}
              type="button"
              disabled={!product.isAvailable}
              onClick={handleBuyNow}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
                product.isAvailable
                  ? 'bg-[#1E1915] hover:bg-[#2E2620] text-white active:scale-95'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
