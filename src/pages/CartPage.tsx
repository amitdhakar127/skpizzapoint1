import React from 'react';
import { ShoppingBag, ArrowLeft, ArrowRight, Trash2, Plus, Minus, Pizza } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PizzaSize } from '../types';

export const CartPage: React.FC = () => {
  const {
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

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-3xl">
          🍕
        </div>
        <h2 className="text-2xl font-black text-[#1E1915]">Your Shopping Cart is Empty</h2>
        <p className="text-sm text-[#6B5B4F] max-w-sm">
          Discover our stone-baked pizzas, burgers, and crunchy sandwiches freshly prepared for you.
        </p>
        <button
          onClick={() => navigate('/menu')}
          className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all"
        >
          Explore Full Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/menu')}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#55473E] hover:text-[#1E1915] mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Ordering Food</span>
            </button>
            <h1 className="text-3xl font-black text-[#1E1915]">Your Food Cart ({cartCount})</h1>
          </div>

          <button
            onClick={clearCart}
            className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline self-start sm:self-auto"
          >
            Clear Entire Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart items */}
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              const hasMultipleSizes = product && product.sizes.length > 1;
              const addOnsPrice = item.selectedAddOns.reduce((acc, a) => acc + a.price, 0);
              const itemTotal = (item.unitPrice + addOnsPrice) * item.quantity;

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-3xl bg-white border border-amber-200/70 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-20 h-20 rounded-2xl object-cover bg-amber-50 shrink-0 border border-amber-100"
                    />

                    <div className="space-y-1">
                      <h3 className="font-extrabold text-base text-[#1E1915]">{item.productName}</h3>
                      <p className="text-xs text-[#6B5B4F]">Base: {formatPrice(item.unitPrice)}</p>

                      {hasMultipleSizes ? (
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-xs text-[#55473E] font-medium">Size:</span>
                          <div className="flex gap-1">
                            {product?.sizes.map((s) => (
                              <button
                                key={s.size}
                                onClick={() => updateCartItemSize(item.id, s.size as PizzaSize)}
                                className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                                  item.selectedSize === s.size
                                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                                    : 'bg-neutral-100 text-[#55473E] hover:bg-neutral-200'
                                }`}
                              >
                                {s.size}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-800 font-semibold block">Standard Size</span>
                      )}

                      {item.selectedAddOns.length > 0 && (
                        <p className="text-xs text-amber-700">
                          + {item.selectedAddOns.map((a) => a.name).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quantity & Item total */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-100">
                    <div className="flex items-center gap-2 bg-amber-50/70 border border-amber-200 rounded-xl p-1">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-white flex items-center justify-center font-bold text-xs hover:bg-amber-100"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-bold w-6 text-center text-[#1E1915]">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-white flex items-center justify-center font-bold text-xs hover:bg-amber-100"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-[#1E1915] block">{formatPrice(itemTotal)}</span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium inline-flex items-center gap-1 mt-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Checkout summary sidebar */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-amber-200 shadow-md space-y-4">
            <h3 className="font-extrabold text-lg text-[#1E1915] pb-2 border-b border-amber-100">Order Totals</h3>

            <div className="space-y-2 text-sm text-[#55473E]">
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
              <div className="flex justify-between text-base font-black text-[#1E1915] pt-3 border-t border-amber-100">
                <span>Total Amount</span>
                <span className="text-amber-700">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
