import React, { useState } from 'react';
import {
  Lock,
  ArrowRight,
  ShieldCheck,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AdminLoginPage: React.FC = () => {
  const {
    loginAdminWithFirebase,
    currentUser,
    isAdmin,
    authorizedAdminUid,
    logout,
    navigate,
    sendPasswordReset,
    settings,
  } = useApp();

  const [email, setEmail] = useState(
    () => (typeof window !== 'undefined' && localStorage.getItem('sk_admin_saved_email')) || 'skpizzapoint@gmail.com'
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // If already logged in as authorized admin
  if (isAdmin) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 bg-[#FFFDF9]">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-emerald-200 shadow-2xl space-y-6 text-center animate-scale-up">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black text-[#1E1915]">Administrator Verified</h1>
            <p className="text-xs text-[#6B5B4F]">
              Logged in as <strong className="text-[#1E1915]">{currentUser?.email || 'Authorized Administrator'}</strong>
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate('/admin')}
              className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Go to Admin Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 px-4 rounded-xl border border-amber-300 text-amber-950 hover:bg-amber-50 text-xs font-bold transition-colors cursor-pointer"
            >
              Open Live Storefront (Home)
            </button>
            <button
              onClick={() => logout()}
              className="w-full py-2 px-4 rounded-xl text-neutral-500 hover:text-red-600 text-xs font-semibold transition-colors cursor-pointer"
            >
              Sign Out from Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleFirebaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const res = await loginAdminWithFirebase(email, password);
    setIsLoading(false);

    if (res.success) {
      try {
        localStorage.setItem('sk_admin_saved_email', email);
        localStorage.setItem('sk_pizza_admin_session', 'true');
      } catch {}
      navigate('/admin');
    } else {
      setErrorMessage(res.error || 'Admin login failed. Please check credentials.');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage('Please enter your administrator email above to reset password.');
      return;
    }
    setIsResetting(true);
    const res = await sendPasswordReset(email);
    setIsResetting(false);
    if (res.success) {
      setResetSent(true);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-[#FFFDF9]">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-300 shadow-2xl space-y-6">
        {/* Header with Logo */}
        <div className="text-center space-y-3">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 bg-amber-50 shadow-md mx-auto flex items-center justify-center">
            <img
              src={settings.logoUrl || 'https://i.imgur.com/x7VzA1Q.jpeg'}
              alt={settings.restaurantName}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1E1915]">
              SK Pizza Point — Admin Sign In
            </h1>
            <p className="text-xs text-[#6B5B4F] mt-1">
              Kitchen Partner & Store Manager Console
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2.5 text-xs font-semibold animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {resetSent && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Password reset email dispatched to {email}.</span>
          </div>
        )}

        {/* FIREBASE EMAIL & PASSWORD LOGIN */}
        <form onSubmit={handleFirebaseLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#1E1915]">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="admin@skpizzapoint.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage(null);
                  }}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-200 bg-neutral-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#1E1915]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isResetting || isLoading}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                >
                  {isResetting ? 'Sending...' : 'Forgot password?'}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  disabled={isLoading}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-amber-200 bg-neutral-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Firebase Credentials...</span>
                </>
              ) : (
                <>
                  <span>Enter Admin Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        {/* Security Notice */}
        <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-[#6B5B4F] space-y-1">
          <p className="font-bold text-[#1E1915] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Authorized Administrator Identity</span>
          </p>
          <p>
            Restricted to SK Pizza Point authorized managers and UID <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200 text-neutral-700">{authorizedAdminUid.slice(0, 10)}...</code>.
          </p>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-amber-100 flex items-center justify-between text-xs text-[#6B5B4F]">
          <button
            onClick={() => navigate('/')}
            className="hover:text-amber-800 transition-colors cursor-pointer"
          >
            ← Return to Website
          </button>
          <button
            onClick={() => navigate('/login')}
            className="text-amber-700 hover:text-amber-800 font-bold transition-colors cursor-pointer"
          >
            Customer Sign In →
          </button>
        </div>
      </div>
    </div>
  );
};
