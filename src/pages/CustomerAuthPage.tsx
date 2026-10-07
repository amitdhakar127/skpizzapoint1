import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Pizza,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CustomerAuthPage: React.FC = () => {
  const {
    currentUser,
    registerCustomer,
    loginCustomer,
    sendPasswordReset,
    navigate,
    currentPath,
  } = useApp();

  // Switch between 'login' and 'register'
  const [mode, setMode] = useState<'login' | 'register'>(
    currentPath === '/register' ? 'register' : 'login'
  );

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // If already logged in, redirect to /account
  if (currentUser) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 bg-[#FFFDF9]">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-amber-200 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-amber-600" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-[#1E1915]">You Are Signed In</h1>
            <p className="text-xs text-[#6B5B4F]">
              Logged in as <strong className="text-[#1E1915]">{currentUser.email}</strong>
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate('/')}
              className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Go to Home Page</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/account')}
              className="w-full py-2.5 px-4 rounded-xl border border-amber-200 text-[#1E1915] hover:bg-amber-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              View My Orders & Profile
            </button>
            <button
              onClick={() => navigate('/menu')}
              className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              Order Pizzas Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setResetSent(false);

    if (!email || !password) {
      setErrorMsg('Please enter email and password.');
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please verify.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }

      setIsLoading(true);
      const res = await registerCustomer(email, password, displayName, phone, address);
      setIsLoading(false);

      if (res.success) {
        navigate('/');
      } else {
        setErrorMsg(res.error || 'Failed to create account.');
      }
    } else {
      setIsLoading(true);
      const res = await loginCustomer(email, password);
      setIsLoading(false);

      if (res.success) {
        navigate('/');
      } else {
        setErrorMsg(res.error || 'Login failed. Please check credentials.');
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg('Please enter your email above to receive a password reset link.');
      return;
    }
    setIsResetting(true);
    const res = await sendPasswordReset(email);
    setIsResetting(false);
    if (res.success) {
      setResetSent(true);
      setErrorMsg(null);
    } else {
      setErrorMsg(res.error || 'Password reset failed.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-[#FFFDF9]">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto shadow-sm">
            <Pizza className="w-6 h-6 text-amber-600" />
          </div>
          <h1 className="text-2xl font-black text-[#1E1915]">
            {mode === 'login' ? 'Welcome Back!' : 'Create Customer Account'}
          </h1>
          <p className="text-xs text-[#6B5B4F]">
            {mode === 'login'
              ? 'Sign in to access your order history, saved addresses, and faster checkout.'
              : 'Join SK Pizza Point to save delivery details and track your hot pizza orders.'}
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-amber-50/80 border border-amber-200/60">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-[#6B5B4F] hover:text-[#1E1915]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-[#6B5B4F] hover:text-[#1E1915]'
            }`}
          >
            Register New
          </button>
        </div>

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2.5 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {resetSent && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Password reset email dispatched to {email}. Check your inbox.</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Registration Extra Fields */}
          {mode === 'register' && (
            <>
              <div className="space-y-1">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#1E1915]">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-amber-200 bg-neutral-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#1E1915]">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    placeholder="e.g. +91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-amber-200 bg-neutral-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#1E1915]">
                  Default Delivery Address (Optional)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. House #14, Near City Mall"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-amber-200 bg-neutral-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#1E1915]">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-amber-200 bg-neutral-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#1E1915]">
                Password
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isResetting || isLoading}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                >
                  {isResetting ? 'Sending...' : 'Forgot?'}
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-10 py-2 rounded-xl border border-amber-200 bg-neutral-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-2.5 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Register mode only) */}
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#1E1915]">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-10 py-2 rounded-xl border border-amber-200 bg-neutral-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-2.5 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            id="btn-customer-auth-submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In to Account' : 'Register Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="pt-4 border-t border-amber-100 flex items-center justify-between text-xs text-[#6B5B4F]">
          <button
            onClick={() => navigate('/menu')}
            className="hover:text-amber-800 transition-colors cursor-pointer"
          >
            ← Browse Menu as Guest
          </button>
          <button
            onClick={() => navigate('/admin/login')}
            className="text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
          >
            Admin Studio →
          </button>
        </div>
      </div>
    </div>
  );
};
