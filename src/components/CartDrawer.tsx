import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PizzaSize } from '../types';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    cartCount,
    subtotal,
    deliveryFee,
    finalTotal,
    updateCartQuantity,
    updateCartItemSize,
    removeFromCart,
    clearCart,
    formatPrice,
    navigate,
    products,
    settings,
  } = useApp();

  if (!isCartOpen) return null;

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in flex justify-end">
      <div
        className="w-full max-w-md bg-[#FFFDF9] h-full shadow-2xl flex flex-col justify-between border-l border-amber-200 animate-slide-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-amber-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
              <ShoppingBag className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-black text-lg text-[#1E1915]">Your Fresh Cart</h2>
              <p className="text-xs text-[#6B5B4F]">{cartCount} items selected</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline px-2 py-1"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl hover:bg-neutral-100 text-[#1E1915] transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-3xl">
                🍕
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-[#1E1915]">Your cart is empty</h3>
                <p className="text-xs text-[#6B5B4F] mt-1 max-w-xs">
                  Fresh handcrafted pizzas, burgers, and sandwiches are waiting for you!
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/menu');
                }}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all"
              >
                Explore Menu
              </button>
            </div>
          ) : (
            cart.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              const hasMultipleSizes = product && product.sizes.length > 1;
              const addOnsPrice = item.selectedAddOns.reduce((acc, a) => acc + a.price, 0);
              const itemTotal = (item.unitPrice + addOnsPrice) * item.quantity;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white border border-amber-100 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-16 h-16 rounded-xl object-cover bg-amber-50 shrink-0 border border-amber-100"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-extrabold text-sm text-[#1E1915] truncate">
                          {item.productName}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-neutral-400 hover:text-red-500 p-1 transition-colors shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Size Selector in Cart */}
                      {hasMultipleSizes ? (
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-[11px] text-[#6B5B4F] font-semibold">Size:</span>
                          <div className="flex items-center gap-1">
                            {product?.sizes.map((s) => (
                              <button
                                key={s.size}
                                onClick={() => updateCartItemSize(item.id, s.size as PizzaSize)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                  item.selectedSize === s.size
                                    ? 'bg-amber-500 text-slate-950'
                                    : 'bg-neutral-100 text-[#55473E] hover:bg-neutral-200'
                                }`}
                              >
                                {s.size}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-800 font-semibold block mt-0.5">
                          Standard Portion
                        </span>
                      )}

                      {/* Add-ons tag */}
                      {item.selectedAddOns.length > 0 && (
                        <p className="text-[11px] text-[#6B5B4F] mt-1 line-clamp-1">
                          + {item.selectedAddOns.map((a) => a.name).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quantity & Price Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-amber-50">
                    <div className="flex items-center gap-2 bg-amber-50/70 border border-amber-200/60 rounded-xl p-1">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-white flex items-center justify-center font-bold text-xs hover:bg-amber-100 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-5 text-center text-[#1E1915]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-white flex items-center justify-center font-bold text-xs hover:bg-amber-100 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-[#1E1915]">{formatPrice(itemTotal)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer math and checkout */}
        {cart.length > 0 && (
          <div className="p-5 bg-white border-t border-amber-100 space-y-3">
            <div className="space-y-1.5 text-xs text-[#55473E]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-[#1E1915]">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Delivery</span>
                <span className="font-semibold text-amber-800">
                  {deliveryFee > 0 ? formatPrice(deliveryFee) : settings.deliveryFeeNote || 'To be confirmed'}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-[#1E1915] pt-2 border-t border-amber-100">
                <span>Estimated Total</span>
                <span className="text-base text-amber-700">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            <button
              id="btn-drawer-checkout"
              onClick={handleProceedToCheckout}
              className="w-full py-3.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
