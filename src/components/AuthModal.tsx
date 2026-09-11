import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  LogOut,
  LogIn,
  UserPlus,
  ArrowRight,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
  onSuccess?: () => void;
}

const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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

  const [mode, setMode] = useState<'google' | 'email'>('google');
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleGooglePopupSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      await loginWithGoogle();
      setIsLoading(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Google Popup Sign-In cancel ya error ho gaya. Kripya niche Gmail ID likhein.');
    }
  };

  const handleManualGmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanEmail || !STRICT_EMAIL_REGEX.test(cleanEmail)) {
      setErrorMsg('कृपया एक सही एवं वैध ईमेल दर्ज करें (e.g. student@gmail.com)। केवल टेक्स्ट मान्य नहीं है।');
      return;
    }

    const domain = cleanEmail.split('@')[1] || '';
    if (domain.length < 4 || !domain.includes('.')) {
      setErrorMsg('कृपया अपनी सही Gmail या गूगल ईमेल ID (e.g. name@gmail.com) दर्ज करें।');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      await loginWithGoogle(cleanEmail, nameInput.trim() || undefined);
      setIsLoading(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Sign-in failed. Please check your email format.');
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanEmail || !STRICT_EMAIL_REGEX.test(cleanEmail)) {
      setErrorMsg('कृपया एक वैध ईमेल आईडी दर्ज करें (Please enter a valid email ID, e.g. student@gmail.com)।');
      return;
    }

    if (!passwordInput || passwordInput.trim().length < 4) {
      setErrorMsg('पासवर्ड कम से कम 4 अक्षरों का होना चाहिए (Password must be at least 4 characters)।');
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
      setErrorMsg(err?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div
      id="auth-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-md w-full overflow-hidden flex flex-col relative">
        {/* Header close button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close modal"
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 dark:hover:text-white p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Google Header Logo */}
        <div className="p-6 pt-7 text-center pb-2">
          <div className="w-14 h-14 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-sm flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8" viewBox="0 0 24 24">
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
          </div>

          <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Sign in with Google
          </h3>
          <p className="text-stone-500 dark:text-stone-400 text-xs mt-1">
            to continue to <strong className="text-emerald-700 dark:text-emerald-400 font-bold">ExamCraft CBSE Portal</strong>
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 pt-2 space-y-4">
          {currentUser ? (
            <div className="space-y-4 text-center">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-5 rounded-2xl">
                <div className="w-14 h-14 bg-emerald-700 text-white rounded-full flex items-center justify-center text-xl font-black mx-auto shadow-md mb-3 overflow-hidden">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt={currentUser.name} className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    currentUser.name.charAt(0).toUpperCase()
                  )}
                </div>
                <h4 className="text-base font-black text-stone-900 dark:text-stone-100">{currentUser.name}</h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{currentUser.email}</p>
                <span className="inline-block bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full mt-2">
                  {currentUser.role === 'admin' ? 'Super Admin' : 'Active Student / User'}
                </span>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-xs py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out (साइन आउट करें)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                  }}
                  className="w-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                >
                  <span>Switch Account / Change Google ID</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Notification Banner if prompt reason exists */}
              {initialMessage ? (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/60 p-3 rounded-2xl flex items-start gap-2.5 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900 dark:text-amber-200">{initialMessage}</p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300/90 mt-0.5">
                      Sign in with your Google Account for unlimited paper downloads & keys!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 p-3 rounded-2xl flex items-center justify-between text-xs">
                  <span className="text-stone-600 dark:text-stone-300 font-medium">Guest Free Quota:</span>
                  <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-lg font-bold">
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

              {/* Toggle Mode Tab */}
              <div className="grid grid-cols-2 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300">
                <button
                  onClick={() => {
                    setMode('google');
                    setErrorMsg('');
                  }}
                  type="button"
                  className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    mode === 'google'
                      ? 'bg-white dark:bg-stone-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                  <span>Google Sign-In</span>
                </button>

                <button
                  onClick={() => {
                    setMode('email');
                    setErrorMsg('');
                  }}
                  type="button"
                  className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    mode === 'email'
                      ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <LogIn className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Email & Password</span>
                </button>
              </div>

              {/* Google Sign-In View */}
              {mode === 'google' && (
                <div className="space-y-4 pt-1">
                  {/* Primary 1-Click Google Popup Button */}
                  <button
                    onClick={handleGooglePopupSignIn}
                    disabled={isLoading}
                    type="button"
                    className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-md cursor-pointer border border-blue-500/30"
                  >
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                    </div>
                    <span className="text-sm font-black tracking-wide">
                      {isLoading ? 'Connecting to Google...' : 'Continue with Google Account'}
                    </span>
                  </button>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
                    <span className="flex-shrink mx-3 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      OR SIGN IN WITH GMAIL
                    </span>
                    <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
                  </div>

                  {/* Manual Google Account Input Form */}
                  <form onSubmit={handleManualGmailSignIn} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                        Google Email / Gmail Address:
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
                        className="w-full text-xs p-3 rounded-xl border border-stone-300 dark:border-stone-700 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium"
                      />
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 block">
                        Must be a valid Gmail format (e.g. student@gmail.com)
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                        Full Name (optional):
                      </label>
                      <input
                        type="text"
                        value={nameInput}
                        onChange={e => setNameInput(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full text-xs p-3 rounded-xl border border-stone-300 dark:border-stone-700 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-black dark:hover:bg-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                    >
                      <span>{isLoading ? 'Verifying...' : 'Sign In with Gmail'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* Email & Password Login */}
              {mode === 'email' && (
                <form onSubmit={handlePasswordLogin} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Email Address: <span className="text-red-500">*</span>
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
                      className="w-full text-xs p-3 rounded-xl border border-stone-300 dark:border-stone-700 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Password: <span className="text-red-500">*</span>
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
                      placeholder="Enter account password"
                      className="w-full text-xs p-3 rounded-xl border border-stone-300 dark:border-stone-700 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{isLoading ? 'Logging In...' : 'Log In with Email'}</span>
                  </button>
                </form>
              )}

              {/* Professional Footer Security note */}
              <div className="pt-2 border-t border-stone-200 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 text-center space-y-1">
                <div className="flex items-center justify-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Secured by Google Firebase Authentication</span>
                </div>
                <p className="text-[10px] text-stone-400">
                  Your Google credentials are fully encrypted & verified safely.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


