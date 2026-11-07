import React, { useState, useEffect } from 'react';
import { useAuth, AuthResult } from '../contexts/AuthContext';
import {
  Building2,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Layers,
  FileCheck2,
  HelpCircle
} from 'lucide-react';

interface AuthPageViewProps {
  initialMode: 'signin' | 'signup' | 'forgot';
  redirectPath?: string;
  onNavigate: (path: string) => void;
}

export const AuthPageView: React.FC<AuthPageViewProps> = ({
  initialMode = 'signin',
  redirectPath = '/dashboard',
  onNavigate
}) => {
  const { signIn, signUp, resetPassword, resendConfirmation, user } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isEmailUnconfirmed, setIsEmailUnconfirmed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Sync mode with prop if prop changes
  useEffect(() => {
    setMode(initialMode);
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [initialMode]);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (user) {
      onNavigate(redirectPath || '/dashboard');
    }
  }, [user, onNavigate, redirectPath]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const parseAuthError = (res: AuthResult): string => {
    const raw = (res.error || '').trim();
    const lower = raw.toLowerCase();
    const code = res.code || '';

    if (
      code === 'over_email_send_rate_limit' ||
      lower.includes('email rate limit') ||
      lower.includes('over_email_send_rate_limit')
    ) {
      setIsEmailUnconfirmed(true);
      return 'Email delivery rate limit reached. If you already registered, please sign in directly with your password.';
    }

    if (
      code === 'over_request_rate_limit' ||
      lower.includes('too many requests')
    ) {
      return 'Too many authentication attempts. Please wait 30 seconds before retrying.';
    }

    if (
      res.isEmailUnconfirmed ||
      lower.includes('email not confirmed') ||
      code === 'email_not_confirmed'
    ) {
      setIsEmailUnconfirmed(true);
      return 'Your email address has not been confirmed yet. Please verify your inbox or click below to resend.';
    }

    if (
      lower.includes('invalid login credentials') ||
      lower.includes('invalid credentials') ||
      lower.includes('invalid_grant')
    ) {
      return 'Invalid email or password. Please verify your credentials or use the password recovery option.';
    }

    if (lower.includes('user already registered')) {
      return 'An account with this email already exists. Please sign in below.';
    }

    if (lower.includes('password should be at least')) {
      return 'Password must be at least 6 characters long.';
    }

    return raw || 'Authentication request failed. Please check your network connection.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsEmailUnconfirmed(false);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid work email address.');
      return;
    }

    if (mode !== 'forgot' && (!password || password.length < 6)) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'signup' && !fullName.trim()) {
      setErrorMsg('Please enter your full name or professional title.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        const res = await signIn(cleanEmail, password);
        if (res.error) {
          setErrorMsg(parseAuthError(res));
          setLoading(false);
        } else {
          // Success: AuthContext updates session & redirects via useEffect
          setSuccessMsg('Authentication verified. Accessing ApexProp AI Studio...');
          setTimeout(() => {
            onNavigate(redirectPath || '/dashboard');
          }, 400);
        }
      } else if (mode === 'signup') {
        const res = await signUp(cleanEmail, password, fullName.trim());
        setLoading(false);
        if (res.error) {
          setErrorMsg(parseAuthError(res));
        } else if (res.requiresEmailConfirmation) {
          setSuccessMsg(
            'Registration successful! A confirmation email has been dispatched to your address. Please verify your inbox, then sign in.'
          );
          setIsEmailUnconfirmed(true);
          setMode('signin');
        } else {
          setSuccessMsg('Account created successfully! Entering ApexProp AI Studio...');
          setTimeout(() => {
            onNavigate(redirectPath || '/dashboard');
          }, 400);
        }
      } else if (mode === 'forgot') {
        const res = await resetPassword(cleanEmail);
        setLoading(false);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg('Password recovery instructions sent to your email.');
          setTimeout(() => setMode('signin'), 3000);
        }
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
    }
  };

  const handleResendConfirmation = async () => {
    if (!email.trim() || resendCooldown > 0) return;
    setResending(true);
    try {
      const res = await resendConfirmation(email.trim());
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg('Verification email re-dispatched. Please check your inbox and spam folder.');
        setResendCooldown(60);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend confirmation email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0f1d] flex flex-col justify-between text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Header Navigation */}
      <header className="border-b border-slate-800/80 bg-[#0a0f1d]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between z-20">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">ApexProp</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
              Autonomous Property Intelligence
            </p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-800/60"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Side: Brand Value Proposition & Accreditations (Desktop Only) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-center space-y-6 pr-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-medium w-fit">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Enterprise Grade Clearance</span>
            </div>

            <div>
              <h2 className="text-2xl font-black tracking-tight text-white leading-tight">
                Inspect, Diagnose & Remediate with Forensic Certainty
              </h2>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                ApexProp AI pairs Google Gemini multimodal vision with rigorous IS 456 & NBC 2016 engineering standards to streamline commercial property maintenance.
              </p>
            </div>

            <div className="space-y-3.5 pt-2 border-t border-slate-800/80">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Category A/B/C Epistemic Rigor</h4>
                  <p className="text-[11px] text-slate-400">Strict segregation between visible facts and AI root-cause hypotheses.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/20">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">15-State Work Order FSM</h4>
                  <p className="text-[11px] text-slate-400">Audited contractor coordination, delay reason tracking, and verification gates.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/20">
                  <FileCheck2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Certified Executive Dossiers</h4>
                  <p className="text-[11px] text-slate-400">Instant generation of 5 print-ready PDF reports and universal CSVs.</p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Row-Level Security (RLS) active • Private storage isolation</span>
            </div>
          </div>

          {/* Right Side: Auth Card Form */}
          <div className="lg:col-span-7">
            <div className="w-full max-w-md mx-auto bg-gradient-to-b from-[#111a30] to-[#0c1322] border border-blue-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              {/* Background ambient glow */}
              <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Header Title */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    {mode === 'signup' ? 'New Property Manager' : mode === 'forgot' ? 'Account Recovery' : 'Studio Access'}
                  </span>
                  {mode !== 'forgot' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode(mode === 'signin' ? 'signup' : 'signin');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                    >
                      {mode === 'signin' ? 'Create new account' : 'Sign in instead'}
                    </button>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {mode === 'signup'
                    ? 'Register for ApexProp AI'
                    : mode === 'forgot'
                    ? 'Reset Your Password'
                    : 'Sign in to ApexProp AI'}
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  {mode === 'signup'
                    ? 'Create your property manager credentials to manage portfolio audits.'
                    : mode === 'forgot'
                    ? 'Enter your work email address to receive password recovery instructions.'
                    : 'Enter your verified property manager credentials to access the studio.'}
                </p>
              </div>

              {/* Feedback Notifications */}
              {errorMsg && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-200 flex items-start gap-2.5 animate-fadeIn shadow-lg">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-300">Authentication Alert</p>
                    <p className="mt-0.5 leading-relaxed">{errorMsg}</p>
                    {isEmailUnconfirmed && (
                      <button
                        type="button"
                        onClick={handleResendConfirmation}
                        disabled={resending || resendCooldown > 0}
                        className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-900/60 hover:bg-red-900 border border-red-500/40 text-[11px] font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
                      >
                        {resending ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Resending...</span>
                          </>
                        ) : resendCooldown > 0 ? (
                          <span>Resend available in {resendCooldown}s</span>
                        ) : (
                          <span>Resend Confirmation Email</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {successMsg && (
                <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-2.5 animate-fadeIn shadow-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-emerald-300">Notification</p>
                    <p className="mt-0.5 leading-relaxed">{successMsg}</p>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name field (Sign Up only) */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Full Name & Title <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Suresh Chandragiri"
                        disabled={loading}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                )}

                {/* Email Address field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Work Email Address <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="manager@apexprop.ai"
                      disabled={loading}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Password field (Sign In & Sign Up) */}
                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Password <span className="text-red-400">*</span>
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot');
                            setErrorMsg(null);
                            setSuccessMsg(null);
                          }}
                          className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        disabled={loading}
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {mode === 'signup' && (
                      <p className="text-[10px] text-slate-500 mt-1">Must be at least 6 characters.</p>
                    )}
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {mode === 'signup'
                          ? 'Complete Registration'
                          : mode === 'forgot'
                          ? 'Send Password Reset Email'
                          : 'Sign In to Dashboard'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Mode Switching Helper */}
              {mode === 'forgot' ? (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Sign In</span>
                  </button>
                </div>
              ) : (
                <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
                  <p className="text-xs text-slate-400">
                    {mode === 'signin' ? "Don't have an account yet?" : 'Already registered?'}
                    <button
                      type="button"
                      onClick={() => {
                        setMode(mode === 'signin' ? 'signup' : 'signin');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="ml-1.5 font-bold text-blue-400 hover:text-blue-300 underline cursor-pointer"
                    >
                      {mode === 'signin' ? 'Sign up now' : 'Sign in here'}
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 px-6 text-center text-xs text-slate-500">
        <p>© 2026 ApexProp AI. Autonomous Property Intelligence & Maintenance Platform. IS 456:2000 & NBC 2016 Aligned.</p>
      </footer>
    </div>
  );
};
