import React, { useState, useEffect, useRef } from 'react';
import { useAuth, AuthResult } from '../contexts/AuthContext';
import {
  Lock,
  Mail,
  User,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  KeyRound,
  ArrowLeft,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Send,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, signIn, signUp, signOut, resetPassword, resendConfirmation } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEmailUnconfirmed, setIsEmailUnconfirmed] = useState(false);
  const [rateLimitType, setRateLimitType] = useState<'none' | 'email' | 'request'>('none');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [showEmailTips, setShowEmailTips] = useState(false);

  const lastSubmitRef = useRef<number>(0);

  // Active cooldown countdown timer for request rate limits
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          setErrorMsg(null);
          setRateLimitType('none');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  // Resend button cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const parseAuthError = (res: AuthResult): string => {
    const raw = (res.error || '').trim();
    const lower = raw.toLowerCase();
    const code = res.code || '';
    const status = res.status;

    // 1. Supabase Email Rate Limit (free tier built-in SMTP: 3-4 emails/hour)
    if (
      code === 'over_email_send_rate_limit' ||
      lower.includes('email rate limit') ||
      lower.includes('over_email_send_rate_limit')
    ) {
      setRateLimitType('email');
      setIsEmailUnconfirmed(true);
      setShowEmailTips(true);
      return 'Supabase email send limit reached (free-tier limit: ~3 emails/hour). If you have already registered, sign in with your password below.';
    }

    // 2. Request / Security Attempt Rate Limit (too many requests)
    if (
      code === 'over_request_rate_limit' ||
      (status === 429 && !lower.includes('email')) ||
      lower.includes('too many requests')
    ) {
      setRateLimitType('request');
      setCooldownSeconds(60);
      return 'Security rate-limit active: Too many authentication attempts. Please wait 60 seconds before retrying.';
    }

    // 3. Duplicate User / Already Exists
    if (
      code === 'user_already_exists' ||
      lower.includes('user already registered') ||
      lower.includes('already registered') ||
      lower.includes('already exists')
    ) {
      return 'An account with this email address already exists. Please sign in with your password.';
    }

    // 4. Invalid Password / Credentials
    if (code === 'invalid_credentials' || lower.includes('invalid login credentials')) {
      return 'Invalid email or password. Please verify your credentials and try again.';
    }

    // 5. Unconfirmed Email
    if (code === 'email_not_confirmed' || lower.includes('email not confirmed')) {
      setIsEmailUnconfirmed(true);
      return 'Your email address is pending verification. Supabase requires email confirmation before first login.';
    }

    // 6. Password Length
    if (code === 'weak_password' || lower.includes('password should be at least')) {
      return 'Password must be at least 6 characters in length.';
    }

    return raw || 'Authentication could not be completed. Please try again.';
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setErrorMsg('Please enter your email address to resend confirmation.');
      return;
    }
    if (resending || resendCooldown > 0) return;

    setResending(true);
    try {
      const res = await resendConfirmation(email);
      if (res.error) {
        setErrorMsg(parseAuthError(res));
      } else {
        setResendCooldown(60);
        setSuccessMsg(`Confirmation email re-dispatched to ${email}. If delivery is delayed, see the instant login guide below.`);
      }
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || cooldownSeconds > 0) return;

    const now = Date.now();
    if (now - lastSubmitRef.current < 1200) {
      return; // Debounce rapid multi-clicks
    }
    lastSubmitRef.current = now;

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsEmailUnconfirmed(false);
    setRateLimitType('none');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await signUp(email, password, fullName || 'Property Manager');
        if (res.error) {
          setErrorMsg(parseAuthError(res));
        } else if (res.requiresEmailConfirmation) {
          setIsEmailUnconfirmed(true);
          setSuccessMsg(`Account created! A confirmation email was sent to ${email}. If delivery is delayed, see the instant login guide below.`);
        } else {
          setSuccessMsg('Account created successfully! You are now signed in.');
          setTimeout(() => onClose(), 1200);
        }
      } else if (mode === 'signin') {
        const res = await signIn(email, password);
        if (res.error) {
          setErrorMsg(parseAuthError(res));
          if (res.isEmailUnconfirmed) {
            setIsEmailUnconfirmed(true);
          }
        } else {
          setSuccessMsg('Authentication successful. Welcome back.');
          setTimeout(() => onClose(), 1000);
        }
      } else if (mode === 'forgot') {
        const res = await resetPassword(email);
        if (res.error) {
          setErrorMsg(parseAuthError(res));
        } else {
          setSuccessMsg('Password recovery instructions have been sent to your email.');
          setTimeout(() => setMode('signin'), 2500);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0f172a] border border-slate-700/80 rounded-2xl p-6 sm:p-7 shadow-2xl relative text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Branding & Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/25 text-white">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-extrabold tracking-tight text-white">ApexProp</h2>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                AI
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {user ? 'Authenticated Property Manager' : 'Autonomous Property Intelligence Platform'}
            </p>
          </div>
        </div>

        {/* Authenticated Account Overview */}
        {user ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Role</span>
                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {profile?.role || 'Property Manager'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Full Name</span>
                <span className="text-xs font-semibold text-white">{profile?.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Email Address</span>
                <span className="text-xs font-mono text-slate-300">{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Organization</span>
                <span className="text-xs text-slate-300">{profile?.organization || 'ApexProp Assets Group'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Authorized Session</span>
              </div>
              <button
                onClick={async () => {
                  await signOut();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-red-600/15 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-xs font-bold transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          /* Unauthenticated Login / Sign Up Form */
          <div>
            <div className="mb-5">
              <h3 className="text-base font-bold text-white">
                {mode === 'signup'
                  ? 'Create Property Manager Account'
                  : mode === 'forgot'
                  ? 'Reset Your Password'
                  : 'Welcome Back'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                {mode === 'signup'
                  ? 'Register to access property defect investigations, risk intelligence, and work orders.'
                  : mode === 'forgot'
                  ? 'Enter your registered email address to receive password recovery instructions.'
                  : 'Enter your credentials to access your properties, forensic audits, and work order dispatch pipeline.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Cooldown Active Warning Banner */}
              {cooldownSeconds > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <Clock className="w-4 h-4 animate-pulse text-amber-400 shrink-0" />
                    <span>Authentication Rate-Limit Cooldown</span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Too many authentication requests received by Supabase Auth. To protect your account, requests are paused for <span className="font-mono font-bold text-white">{cooldownSeconds}s</span>.
                  </p>
                  <div className="w-full bg-slate-900/60 rounded-full h-1.5 mt-1 overflow-hidden">
                    <div
                      className="bg-amber-400 h-1.5 transition-all duration-1000"
                      style={{ width: `${(cooldownSeconds / 60) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {errorMsg && cooldownSeconds <= 0 && (
                <div className={`p-3.5 rounded-xl text-xs space-y-2 animate-in fade-in duration-200 ${
                  rateLimitType === 'email'
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-200'
                    : 'bg-red-500/10 border border-red-500/25 text-red-300'
                }`}>
                  <div className="flex items-start gap-2.5">
                    {rateLimitType === 'email' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-relaxed">{errorMsg}</span>
                  </div>

                  {/* Quick Shortcut to Sign In if already registered or email limited */}
                  {mode === 'signup' && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('signin');
                          setErrorMsg(null);
                          setRateLimitType('none');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 text-xs font-bold transition-all cursor-pointer"
                      >
                        <span>Switch to Sign In</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Unconfirmed Email Action Panel */}
              {isEmailUnconfirmed && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-amber-300">Confirmation Email Not Arriving?</div>
                      <p className="text-[11px] text-amber-200/90 leading-relaxed">
                        Supabase free-tier emails are limited to ~3/hour and can be delayed by spam filters. Use the options below to proceed.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={resending || resendCooldown > 0 || cooldownSeconds > 0}
                      onClick={handleResendConfirmation}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {resendCooldown > 0
                          ? `Resend in ${resendCooldown}s`
                          : resending
                          ? 'Sending...'
                          : 'Resend Email'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowEmailTips(!showEmailTips)}
                      className="text-[11px] text-amber-300/80 hover:text-amber-200 hover:underline flex items-center gap-1 cursor-pointer ml-auto"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{showEmailTips ? 'Hide Quick Fix' : 'Instant Login Fix'}</span>
                      {showEmailTips ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Quick Fix Instructions */}
                  {showEmailTips && (
                    <div className="p-2.5 rounded-lg bg-black/40 border border-amber-500/20 text-[11px] text-slate-300 space-y-1.5 mt-2">
                      <div className="font-bold text-amber-300">Recommended 2-Click Fix (No Email Needed):</div>
                      <ol className="list-decimal list-inside space-y-1 text-slate-300">
                        <li>
                          Open <span className="font-semibold text-white">Supabase Dashboard</span> &gt; <span className="font-semibold text-white">Authentication</span> &gt; <span className="font-semibold text-white">Providers</span> &gt; <span className="font-semibold text-white">Email</span>
                        </li>
                        <li>
                          Toggle <span className="font-semibold text-amber-300">"Confirm email"</span> to <span className="font-semibold text-emerald-400">OFF</span> and click <span className="font-semibold text-white">Save</span>
                        </li>
                        <li>
                          Or under <span className="font-semibold text-white">Users</span>, click <span className="font-semibold text-white">"..."</span> next to your email and select <span className="font-semibold text-emerald-400">"Confirm user"</span>
                        </li>
                      </ol>
                      <p className="text-[10px] text-slate-400 pt-1">
                        Once saved, you can log in immediately with your password without waiting for any email.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Success Banner */}
              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 flex items-center gap-2.5 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Full Name (Sign Up only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      disabled={loading || cooldownSeconds > 0}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Suresh Chandragiri"
                      className="w-full bg-[#1e293b]/70 text-slate-100 text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border border-slate-700/80 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Manager Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    disabled={loading || cooldownSeconds > 0}
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="manager@apexprop.ai"
                    className="w-full bg-[#1e293b]/70 text-slate-100 text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border border-slate-700/80 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password Field (Sign In and Sign Up) */}
              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-300">
                      Password
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        disabled={loading || cooldownSeconds > 0}
                        onClick={() => {
                          setMode('forgot');
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      disabled={loading || cooldownSeconds > 0}
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#1e293b]/70 text-slate-100 text-xs sm:text-sm pl-9 pr-10 py-2.5 rounded-xl border border-slate-700/80 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      disabled={loading || cooldownSeconds > 0}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || cooldownSeconds > 0}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {cooldownSeconds > 0 ? (
                  <>
                    <Clock className="w-4 h-4 animate-pulse text-amber-300" />
                    <span>Security Cooldown ({cooldownSeconds}s)</span>
                  </>
                ) : loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : mode === 'signup' ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Manager Account</span>
                  </>
                ) : mode === 'forgot' ? (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Send Reset Instructions</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Portal</span>
                  </>
                )}
              </button>

              {/* Mode Switching Links */}
              <div className="pt-2 text-center text-xs text-slate-400">
                {mode === 'signin' ? (
                  <span>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-blue-400 hover:underline font-semibold cursor-pointer"
                    >
                      Create one
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-blue-400 hover:underline font-semibold cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
