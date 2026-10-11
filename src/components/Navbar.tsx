import React, { useState, useRef, useEffect } from 'react';
import { CustomBranding } from '../types';
import { LiquidChromeLogo } from './LiquidChromeLogo';
import {
  FileText,
  BookOpenCheck,
  History,
  BrainCircuit,
  Database,
  PlayCircle,
  Printer,
  Sparkles,
  Settings,
  Zap,
  Crown,
  LogIn,
  LogOut,
  ChevronDown,
  Cloud,
  GraduationCap,
  User,
  Box
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  branding?: CustomBranding;
  onOpenBranding: () => void;
  onOpenPaperCodeModal: () => void;
  onOpenQuestionVault: () => void;
  onOpenGoogleDrive: () => void;
  onOpenAuthModal: () => void;
  onOpenAdminPanel: () => void;
  generatedPaperCount: number;
  customCartCount: number;
  is3DEnabled?: boolean;
  onToggle3D?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  branding,
  onOpenBranding,
  onOpenPaperCodeModal,
  onOpenQuestionVault,
  onOpenGoogleDrive,
  onOpenAuthModal,
  onOpenAdminPanel,
  generatedPaperCount,
  customCartCount,
  is3DEnabled = true,
  onToggle3D
}) => {
  const { currentUser, isAdmin, logout, guestDownloadsCount, guestMaxFreeDownloads } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu when clicking or touching anywhere outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showUserDropdown]);

  const navItems = [
    { id: 'generator', label: 'Paper Generator', icon: FileText },
    { id: 'evaluator', label: 'AI Copy Checking', icon: BrainCircuit },
    { id: 'revision', label: 'Revision Sheets', icon: Zap },
    { id: 'syllabus', label: 'Syllabus & Blueprint', icon: BookOpenCheck },
    { id: 'pyq', label: 'Previous Year Papers', icon: History },
    { id: 'qbank', label: 'Question Bank', icon: Database, cartCount: customCartCount },
    { id: 'grammar', label: 'Grammar (3–8)', icon: GraduationCap },
    { id: 'quiz', label: 'Interactive Practice', icon: PlayCircle },
  ];

  const today = new Date().toISOString().split('T')[0];
  const dailyUsed = currentUser
    ? currentUser.lastDownloadDate === today
      ? currentUser.dailyDownloadsUsed
      : 0
    : guestDownloadsCount;
  const dailyLimit = currentUser?.dailyQuotaLimit || 5;
  const remainingQuota = Math.max(0, dailyLimit - dailyUsed);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 transition-all w-full">
      {/* Top Utility Announcement Bar */}
      <div className="bg-slate-900 dark:bg-slate-950 text-slate-300 text-[11px] sm:text-xs py-1 px-4 text-center font-medium flex items-center justify-center gap-2 border-b border-slate-800">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        <span className="tracking-normal truncate">
          ExamCraft CBSE Board Paper Engine • Aligned with 2025–2026 Blueprint & Sample Papers
        </span>
      </div>

      <div className="w-full max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3 min-w-0">
          {/* Brand Wordmark & Logo */}
          <div 
            onClick={() => setActiveTab('generator')}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <img 
              src={branding?.logoUrl || "/logo.png"} 
              alt="ExamCraft CBSE" 
              className="h-8 w-8 sm:h-9 sm:w-9 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                ExamCraft
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-normal mt-0.5">
                CBSE Paper Engine
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-1 nav-scrollbar min-w-0 flex-1 justify-center px-2 py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white dark:text-slate-900' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.cartCount !== undefined && item.cartCount > 0 && (
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {item.cartCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Header Actions - PINNED TO THE RIGHT CORNER */}
          <div className="flex items-center gap-2 shrink-0 ml-auto z-30">
            {/* 3D Background Toggle Button */}
            {onToggle3D && (
              <button
                onClick={onToggle3D}
                type="button"
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  is3DEnabled
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                    : 'bg-transparent text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-600'
                }`}
                title={is3DEnabled ? '3D Diagrams Enabled (Click to Pause)' : '3D Diagrams Paused (Click to Enable)'}
              >
                <Box className={`w-3.5 h-3.5 ${is3DEnabled ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                <span className="text-[11px]">{is3DEnabled ? '3D Active' : '3D Off'}</span>
              </button>
            )}

            {generatedPaperCount > 0 && (
              <button
                onClick={() => setActiveTab('generator')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Paper Ready</span>
              </button>
            )}

            {/* Profile Avatar & Login Button (Always pinned on the right for mobile & desktop) */}
            <div ref={userDropdownRef} className="relative shrink-0">
              {currentUser ? (
                <button
                  onClick={() => setShowUserDropdown(prev => !prev)}
                  type="button"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors text-xs font-semibold cursor-pointer shadow-xs"
                  title="Account Info & Tools"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 rounded-full border border-slate-200 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[75px] sm:max-w-[110px] truncate">{currentUser.name}</span>
                  {isAdmin ? (
                    <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[9px] px-1 py-0.2 rounded font-bold uppercase shrink-0">ADMIN</span>
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  )}
                </button>
              ) : (
                <button
                  onClick={() => onOpenAuthModal()}
                  type="button"
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-1.5 sm:py-2 rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs"
                  title="Click to Log In / Sign In"
                >
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs whitespace-nowrap">
                    Sign In
                  </span>
                </button>
              )}

              {/* Dropdown Menu Options - Right-Aligned */}
              {showUserDropdown && (
                <div
                  className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-3 z-50 animate-in fade-in space-y-1.5"
                >
                  {currentUser ? (
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {currentUser.name}
                        {isAdmin && <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase">ADMIN</span>}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                      
                      {!isAdmin && (
                        <div className="mt-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg text-[11px]">
                          <div className="flex justify-between text-slate-600 dark:text-slate-300 font-medium">
                            <span>Daily Quota:</span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">{remainingQuota} / {dailyLimit} left</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full"
                              style={{ width: `${Math.min(100, (dailyUsed / dailyLimit) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5 text-center">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">ExamCraft Account</p>
                      <p className="text-[11px] text-slate-500">Sign in to save papers and manage quota</p>
                    </div>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenAdminPanel();
                      }}
                      type="button"
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Admin Control Panel</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenQuestionVault();
                    }}
                    type="button"
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Database className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Question Auto-Vault</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenGoogleDrive();
                    }}
                    type="button"
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Cloud className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Google Drive Sync</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenBranding();
                    }}
                    type="button"
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Custom School Header</span>
                  </button>

                  {onToggle3D && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onToggle3D();
                      }}
                      type="button"
                      className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>3D Background Visualizer</span>
                      </div>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${is3DEnabled ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {is3DEnabled ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  )}

                  {currentUser ? (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        logout();
                      }}
                      type="button"
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer mt-1"
                    >
                      <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Log Out</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenAuthModal();
                      }}
                      type="button"
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer mt-1"
                    >
                      <LogIn className="w-4 h-4 text-white shrink-0" />
                      <span>Sign In</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="lg:hidden flex items-center nav-scrollbar py-2 space-x-1.5 border-t border-slate-200 dark:border-slate-800 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
