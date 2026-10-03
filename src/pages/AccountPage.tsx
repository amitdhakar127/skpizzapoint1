import React, { useState, useEffect } from 'react';
import {
  User,
  Package,
  Phone,
  MapPin,
  Mail,
  Calendar,
  LogOut,
  Clock,
  CheckCircle2,
  Check,
  AlertCircle,
  MessageCircle,
  ShoppingBag,
  Edit2,
  Save,
  ChevronRight,
  ShieldCheck,
  Navigation,
  RotateCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ErrorBoundary } from '../components/ErrorBoundary';

const AccountPageInternal: React.FC = () => {
  const {
    currentUser,
    userProfile,
    updateCustomerProfile,
    orders,
    logout,
    navigate,
    formatPrice,
    generateWhatsAppUrl,
  } = useApp();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState(userProfile?.displayName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [address, setAddress] = useState(userProfile?.defaultAddress || '');
  const [city, setCity] = useState(userProfile?.city || '');
  const [pinCode, setPinCode] = useState(userProfile?.pinCode || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sync profile data into input fields when userProfile loads or changes
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.displayName || '');
      setPhone(userProfile.phone || '');
      setAddress(userProfile.defaultAddress || '');
      setCity(userProfile.city || '');
      setPinCode(userProfile.pinCode || '');
    }
  }, [userProfile]);

  // If not logged in, redirect to login
  if (!currentUser) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 bg-[#FFFDF9]">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-amber-200 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
            <User className="w-8 h-8 text-amber-600" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black text-[#1E1915]">Customer Account</h1>
            <p className="text-xs text-[#6B5B4F]">
              Sign in or create an account to view your past orders, manage saved delivery addresses, and expedite your orders.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              Sign In or Register
            </button>
            <button
              onClick={() => navigate('/menu')}
              className="w-full py-2.5 px-4 rounded-xl border border-amber-200 text-[#1E1915] hover:bg-amber-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              Browse Menu as Guest
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter orders placed by this user (by UID, account email, or saved phone)
  const myOrders = orders.filter(
    (o) =>
      (currentUser && o.userId === currentUser.uid) ||
      (currentUser?.email && o.customerEmail?.toLowerCase() === currentUser.email?.toLowerCase()) ||
      (userProfile?.phone && o.customerPhone && o.customerPhone.trim() === userProfile.phone.trim())
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateCustomerProfile({
      displayName: name.trim(),
      phone: phone.trim(),
      defaultAddress: address.trim(),
      city: city.trim(),
      pinCode: pinCode.trim(),
    });
    setIsSaving(false);
    setIsEditingProfile(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Out for delivery':
      case 'Ready':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Preparing':
      case 'Confirmed by restaurant':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Page Title & User Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-amber-200/80">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-md shrink-0">
            {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1E1915]">
              {userProfile?.displayName || 'Valued Customer'}
            </h1>
            <p className="text-xs sm:text-sm text-[#6B5B4F] flex items-center gap-2">
              <span>{currentUser.email}</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Firebase User
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => logout()}
            className="px-4 py-2.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Customer Profile & Saved Details (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-amber-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-amber-100">
            <h2 className="text-base font-black text-[#1E1915] flex items-center gap-2">
              <User className="w-4 h-4 text-amber-600" />
              <span>Customer Details</span>
            </h2>
            {!isEditingProfile && (
              <button
                onClick={() => {
                  setName(userProfile?.displayName || '');
                  setPhone(userProfile?.phone || '');
                  setAddress(userProfile?.defaultAddress || '');
                  setCity(userProfile?.city || '');
                  setPinCode(userProfile?.pinCode || '');
                  setIsEditingProfile(true);
                }}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {!isEditingProfile ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="block text-[11px] font-bold text-[#8A7B70] uppercase tracking-wider">
                  Full Name
                </span>
                <span className="font-extrabold text-[#1E1915] text-sm">
                  {userProfile?.displayName || 'Not provided'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-[#8A7B70] uppercase tracking-wider">
                  Email
                </span>
                <span className="font-medium text-[#1E1915]">{currentUser.email}</span>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-[#8A7B70] uppercase tracking-wider">
                  Phone Number
                </span>
                <span className="font-medium text-[#1E1915]">
                  {userProfile?.phone || 'Not added yet'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-[#8A7B70] uppercase tracking-wider">
                  Saved Delivery Address
                </span>
                <p className="font-medium text-[#1E1915] leading-relaxed">
                  {userProfile?.defaultAddress
                    ? `${userProfile.defaultAddress}${userProfile.city ? ', ' + userProfile.city : ''}${
                        userProfile.pinCode ? ' - ' + userProfile.pinCode : ''
                      }`
                    : 'No default address saved yet.'}
                </p>
              </div>

              <div className="pt-2 text-[11px] text-[#8A7B70]">
                Account UID: <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded text-neutral-600">{currentUser.uid.slice(0, 10)}...</code>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold uppercase text-[#1E1915]">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-extrabold uppercase text-[#1E1915]">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-extrabold uppercase text-[#1E1915]">Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold uppercase text-[#1E1915]">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold uppercase text-[#1E1915]">PIN Code</label>
                  <input
                    type="text"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Details'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-3 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: "My Orders" Live from Firebase (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-[#1E1915] flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              <span>My Orders ({myOrders.length})</span>
            </h2>
            <button
              onClick={() => navigate('/menu')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Order from Menu</span>
            </button>
          </div>

          {myOrders.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white border border-amber-200/80 shadow-sm text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="font-extrabold text-base text-[#1E1915]">No orders placed yet</h3>
                <p className="text-xs text-[#6B5B4F]">
                  You haven't placed any orders with this account yet. Explore our stone-oven pizzas, burgers, and sandwiches!
                </p>
              </div>
              <button
                onClick={() => navigate('/menu')}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Browse Menu & Order
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myOrders.map((order) => {
                const whatsAppUrl = generateWhatsAppUrl(order);
                return (
                  <div
                    key={order.id}
                    className="p-6 rounded-3xl bg-white border border-amber-200/80 shadow-sm space-y-4 hover:border-amber-300 transition-colors"
                  >
                    {/* Header with Prominent Status Circle & Permanent Date/Time */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-100">
                      <div className="flex items-center gap-3">
                        {order.status === 'Delivered' || order.status === 'Completed' ? (
                          /* Big Round Green Circle with Bold White Right Check */
                          <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md ring-4 ring-emerald-100 shrink-0" title="Order Completed">
                            <Check className="w-7 h-7 stroke-[3.5]" />
                          </div>
                        ) : (
                          /* Processing Active Round Circle */
                          <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-md ring-4 ring-amber-100 shrink-0 animate-pulse" title="Order Processing">
                            <RotateCw className="w-6 h-6 animate-spin" />
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-[#1E1915]">
                              #{order.id}
                            </span>
                            {order.status === 'Delivered' || order.status === 'Completed' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                                ✓ Completed (Delivered)
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                                🔄 In Progress ({order.status})
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-[#6B5B4F] font-semibold flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-3.5 h-3.5 text-amber-700" />
                            <span>
                              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <span>•</span>
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            <span>
                              {new Date(order.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="text-right self-start sm:self-auto">
                        <span className="text-xs text-[#8A7B70] block font-medium">Grand Total</span>
                        <span className="text-lg font-black text-amber-700">
                          {formatPrice(order.finalTotal)}
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-[#6B5B4F] uppercase tracking-wider">
                        Ordered Items
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-100/60 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-[#1E1915]">
                                {item.productName}
                              </span>
                              <span className="text-[11px] text-[#8A7B70] block">
                                Size: {item.size} • Qty: {item.quantity}
                              </span>
                            </div>
                            <span className="font-bold text-amber-800">
                              {formatPrice(item.totalPrice)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                      <div className="text-[#6B5B4F]">
                        Fulfillment: <strong className="text-[#1E1915]">{order.orderType === 'delivery' ? 'Home Delivery' : 'Store Pickup'}</strong>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/track/${order.id}`)}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Track Live Delivery</span>
                        </button>

                        <a
                          href={whatsAppUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
                        >
                          <MessageCircle className="w-4 h-4 fill-current" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const AccountPage: React.FC = () => {
  return (
    <ErrorBoundary
      fallbackTitle="Account Profile View"
      fallbackMessage="Unable to load customer account. Your orders and details are safe."
    >
      <AccountPageInternal />
    </ErrorBoundary>
  );
};

