import React, { useState } from 'react';
import {
  X,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  UserCheck,
  AlertCircle,
  Crown,
  KeyRound,
  LogOut,
  LogIn,
  UserPlus,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
  onSuccess?: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMessage,
  onSuccess
}) => {
  const {
    currentUser,
    logout,
    loginWithGoogle,
    loginWithEmail,
    guestDownloadsCount,
    guestMaxFreeDownloads
  } = useAuth();

  const [mode, setMode] = useState<'google' | 'login' | 'signup'>('google');
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async (emailOverride?: string) => {
    if (emailOverride && !EMAIL_REGEX.test(emailOverride.trim())) {
      setErrorMsg('कृपया एक सही ईमेल एड्रेस दर्ज करें (उदा: student@gmail.com)');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      await loginWithGoogle(emailOverride ? emailOverride.trim() : undefined, nameInput || undefined);
      setIsLoading(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Google sign-in failed. Please try again.');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent, isSignUp: boolean) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setErrorMsg('कृपया एक वैध ईमेल आईडी दर्ज करें (Please enter a valid email ID, e.g. student@gmail.com)।');
      return;
    }

    if (!passwordInput || passwordInput.trim().length < 4) {
      setErrorMsg('पासवर्ड कम से कम 4 अक्षरों का होना चाहिए (Password must be at least 4 characters)।');
      return;
    }

    if (isSignUp && !nameInput.trim()) {
      setErrorMsg('कृपया अपना नाम दर्ज करें (Please enter your name to create an account)।');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      await loginWithEmail(cleanEmail, passwordInput, nameInput.trim() || undefined);
      setIsLoading(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Authentication failed. Please check your details.');
    }
  };

  return (
    <div
      id="auth-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-md w-full overflow-hidden flex flex-col relative">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/30 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
          </div>

          <h3 className="text-xl font-black tracking-tight">ExamCraft CBSE Portal Sign-In</h3>
          <p className="text-emerald-100 text-xs mt-1 font-medium">
            Access Free 2026 Board Model Papers & Official Answer Keys
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {currentUser ? (
            <div className="space-y-4 text-center">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-5 rounded-2xl">
                <div className="w-14 h-14 bg-emerald-700 text-white rounded-full flex items-center justify-center text-xl font-black mx-auto shadow-md mb-3">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt={currentUser.name} className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    currentUser.name.charAt(0).toUpperCase()
                  )}
                </div>
                <h4 className="text-base font-black text-stone-900 dark:text-stone-100">{currentUser.name}</h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{currentUser.email}</p>
                <span className="inline-block bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full mt-2">
                  {currentUser.role === 'admin' ? 'Super Admin' : 'Active CBSE Student / Teacher'}
                </span>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-xs py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out / Sign Out (लॉग आउट करें)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                  }}
                  className="w-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                >
                  <span>Switch Account / Sign In as Different User</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Notification / Prompt Reason */}
              {initialMessage ? (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/60 p-3.5 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 dark:text-amber-200">
                    <p className="font-bold">{initialMessage}</p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300/90 mt-0.5">
                      1st Paper was free. Sign in once for uninterrupted daily downloads!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                  <span className="text-stone-600 dark:text-stone-300 font-medium">Guest Free Quota:</span>
                  <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-lg font-bold">
                    {guestDownloadsCount}/{guestMaxFreeDownloads} Paper Used
                  </span>
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-3 p-1 bg-stone-100 dark:bg-stone-800 rounded-2xl text-[11px] font-bold text-stone-600 dark:text-stone-300">
                <button
                  onClick={() => {
                    setMode('google');
                    setErrorMsg('');
                  }}
                  type="button"
                  className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    mode === 'google'
                      ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
                      : 'hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27a7.22 7.22 0 0 1 0-4.54V6.58H1.25a11.98 11.98 0 0 0 0 10.84l4.03-3.15Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  type="button"
                  className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
                      : 'hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Log In</span>
                </button>

                <button
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg('');
                  }}
                  type="button"
                  className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
                      : 'hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Create Account</span>
                </button>
              </div>

              {/* Google Sign-in View */}
              {mode === 'google' && (
                <div className="space-y-4">
                  <button
                    onClick={() => handleGoogleSignIn()}
                    disabled={isLoading}
                    type="button"
                    className="w-full bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 border border-stone-300 dark:border-stone-600 font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-sm active:scale-98 cursor-pointer"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27a7.22 7.22 0 0 1 0-4.54V6.58H1.25a11.98 11.98 0 0 0 0 10.84l4.03-3.15Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                      />
                    </svg>
                    <span className="text-xs sm:text-sm font-black">
                      {isLoading ? 'Signing In...' : '1-Click Google Popup Sign-In'}
                    </span>
                  </button>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
                    <span className="flex-shrink mx-3 text-[11px] font-bold text-stone-400">OR ENTER GMAIL MANUALLY</span>
                    <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); handleGoogleSignIn(emailInput); }} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                        Google Email Address (गूगल ईमेल):
                      </label>
                      <input
                        type="email"
                        required
                        value={emailInput}
                        onChange={e => {
                          setEmailInput(e.target.value);
                          if (errorMsg) setErrorMsg('');
                        }}
                        placeholder="yourname@gmail.com"
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 focus:outline-emerald-600 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100"
                      />
                      <span className="text-[10px] text-stone-500 mt-1 block">
                        Must be a valid email format (e.g., student@gmail.com)
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{isLoading ? 'Signing In...' : 'Sign In with Gmail'}</span>
                    </button>
                  </form>

                  <div className="pt-2 flex items-center justify-between text-xs text-stone-500">
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Don't have an account? Create Account</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Email & Password Log In View */}
              {mode === 'login' && (
                <form onSubmit={(e) => handleEmailAuth(e, false)} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Email Address (ईमेल पता): <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={e => {
                        setEmailInput(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="e.g. student@gmail.com"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 focus:outline-emerald-600 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Password (पासवर्ड): <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      value={passwordInput}
                      onChange={e => {
                        setPasswordInput(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="At least 4 characters"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 focus:outline-emerald-600 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{isLoading ? 'Signing In...' : 'Log In (लॉग इन करें)'}</span>
                  </button>

                  <div className="pt-2 border-t border-stone-200 dark:border-stone-800 text-center">
                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('signup');
                          setErrorMsg('');
                        }}
                        className="text-emerald-700 dark:text-emerald-400 font-extrabold hover:underline cursor-pointer"
                      >
                        Create Account (नया अकाउंट बनाएं)
                      </button>
                    </p>
                  </div>
                </form>
              )}

              {/* Create Account / Register View */}
              {mode === 'signup' && (
                <form onSubmit={(e) => handleEmailAuth(e, true)} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Full Name (आपका नाम): <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={e => {
                        setNameInput(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 focus:outline-emerald-600 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Email Address (ईमेल आईडी): <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={e => {
                        setEmailInput(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="e.g. student@gmail.com"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 focus:outline-emerald-600 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Password (पासवर्ड): <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      value={passwordInput}
                      onChange={e => {
                        setPasswordInput(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="Create password (At least 4 characters)"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 focus:outline-emerald-600 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-teal-700 hover:bg-teal-800 text-white font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isLoading ? 'Creating Account...' : 'Create Free Account (अकाउंट बनाएं)'}</span>
                  </button>

                  <div className="pt-2 border-t border-stone-200 dark:border-stone-800 text-center">
                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setErrorMsg('');
                        }}
                        className="text-emerald-700 dark:text-emerald-400 font-extrabold hover:underline cursor-pointer"
                      >
                        Log In (लॉग इन करें)
                      </button>
                    </p>
                  </div>
                </form>
              )}

              {/* Benefits Info */}
              <div className="bg-stone-50 dark:bg-stone-800/40 p-3.5 rounded-2xl space-y-1.5 text-[11px] text-stone-600 dark:text-stone-400">
                <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Why Register? (अकाउंट बनाने के फायदे)</span>
                </div>
                <p>✓ Daily Free Downloads for 2026 Board Model Papers & Official PYQs.</p>
                <p>✓ Save customized school headers, logos & answer keys permanently.</p>
                <p>✓ Instant access across all your mobile phones and devices.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


