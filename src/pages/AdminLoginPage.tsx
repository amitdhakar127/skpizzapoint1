import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, Mail, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';
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
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // If already logged in as authorized admin
  if (currentUser && isAdmin) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 bg-[#FFFDF9]">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-emerald-200 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black text-[#1E1915]">Administrator Verified</h1>
            <p className="text-xs text-[#6B5B4F]">
              Logged in as <strong className="text-[#1E1915]">{currentUser.email}</strong>
            </p>
            <div className="p-3 rounded-xl bg-neutral-50 text-[11px] font-mono text-neutral-600 break-all border border-neutral-200">
              UID: {currentUser.uid}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate('/admin')}
              className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Go to Admin Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => logout()}
              className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              Sign Out from Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If logged in as customer but not authorized admin
  if (currentUser && !isAdmin) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 bg-[#FFFDF9]">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-red-200 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-800 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-[#1E1915]">Admin Access Required</h1>
            <p className="text-xs text-[#6B5B4F] leading-relaxed">
              You are currently signed in as <strong className="text-[#1E1915]">{currentUser.email}</strong>. This account does not possess administrator privileges for SK Pizza Point.
            </p>
            <div className="p-3 rounded-xl bg-red-50 text-[11px] font-mono text-red-800 text-left space-y-1 border border-red-200">
              <p><strong>Your Current UID:</strong> {currentUser.uid}</p>
              <p><strong>Authorized Admin UID:</strong> {authorizedAdminUid}</p>
            </div>
            <p className="text-[11px] text-[#8A7B70]">
              To access Admin Studio, please sign in with the designated Firebase administrator account.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => logout()}
              className="w-full py-3.5 px-6 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Sign Out & Switch Account</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              Return to Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
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
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-amber-200 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-7 h-7 text-amber-600" />
          </div>
          <h1 className="text-2xl font-black text-[#1E1915]">Admin Studio Login</h1>
          <p className="text-xs text-[#6B5B4F]">
            Sign in with the verified Firebase administrator account to manage menu prices, orders, and restaurant settings.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2.5 text-xs font-semibold">
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

        <form onSubmit={handleAdminLogin} className="space-y-4">
          {/* Email */}
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

          {/* Password */}
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
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="btn-admin-firebase-login"
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
            Access is cryptographically restricted to Firebase UID <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200 text-neutral-700">{authorizedAdminUid.slice(0, 12)}...</code>.
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
