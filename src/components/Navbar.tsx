import React, { useState } from 'react';
import { CustomBranding } from '../types';
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

  const navItems = [
    { id: 'generator', label: 'Paper Generator', icon: FileText, badge: 'AI Powered' },
    { id: 'evaluator', label: 'AI Copy Checking & Email', icon: BrainCircuit, badge: 'Student Email' },
    { id: 'revision', label: 'Formula & Revision Sheets', icon: Zap, badge: '5-Min' },
    { id: 'syllabus', label: 'Syllabus & Blueprint', icon: BookOpenCheck },
    { id: 'pyq', label: 'Previous Year Papers', icon: History, badge: '2020-2025' },
    { id: 'qbank', label: 'Question Bank', icon: Database, cartCount: customCartCount },
    { id: 'grammar', label: 'Grammar (Class 3-8)', icon: GraduationCap, badge: 'Kids' },
    { id: 'quiz', label: 'Interactive Practice', icon: PlayCircle, badge: 'Timed' },
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
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800/80 text-stone-800 dark:text-stone-100 shadow-sm transition-all w-full">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-blue-100 text-[11px] sm:text-xs py-1 px-3 sm:px-4 text-center font-medium flex items-center justify-center gap-1.5 border-b border-blue-800/50">
        <Sparkles className="w-3 h-3 text-amber-300 animate-pulse shrink-0" />
        <span className="tracking-wide truncate">ExamCraft CBSE Test Generator • Class 9th, 10th & 12th Board Blueprint</span>
      </div>

      <div className="w-full max-w-[1536px] mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-2 min-w-0">
          {/* Logo */}
          <div 
            onClick={() => setActiveTab('generator')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0"
          >
            <div className="flex items-center justify-center p-1 rounded-xl bg-white/60 dark:bg-stone-800/60 border border-emerald-500/20 shadow-xs group-hover:scale-105 transition-all duration-300 shrink-0">
              <img 
                src={branding?.logoUrl || "/logo.png"} 
                alt="ExamCraft CBSE Logo" 
                className="h-9 w-9 sm:h-11 sm:w-11 object-cover rounded-lg filter drop-shadow-[0_2px_8px_rgba(16,185,129,0.25)] shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="text-base sm:text-xl font-black tracking-tight text-emerald-800 dark:text-emerald-400 whitespace-nowrap">
                  ExamCraft <span className="text-stone-800 dark:text-stone-100 font-extrabold text-xs sm:text-base">CBSE</span>
                </span>
                <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-stone-950 border border-amber-300 text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                  Test Generator
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-semibold leading-none mt-0.5 max-w-[160px] sm:max-w-none truncate">
                {branding?.schoolName ? branding.schoolName : 'Smart & Reliable CBSE Paper Generation'}
              </p>
            </div>
          </div>

          {/* Desktop Nav Links - Flex 1 min-w-0 nav-scrollbar for smooth left-to-right scrolling */}
          <nav className="hidden lg:flex items-center space-x-1.5 nav-scrollbar min-w-0 flex-1 justify-center px-2 py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                      isActive 
                        ? 'bg-blue-800 text-blue-100 border-blue-600'
                        : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {item.cartCount !== undefined && item.cartCount > 0 && (
                    <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                      {item.cartCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Header Actions - ALWAYS PINNED ON THE RIGHT */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto z-20">
            {/* 3D Background Quick Toggle Button */}
            {onToggle3D && (
              <button
                onClick={onToggle3D}
                type="button"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  is3DEnabled
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700/80 shadow-amber-500/10'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border-stone-300 dark:border-stone-700'
                }`}
                title={is3DEnabled ? '3D Background Active (Click to Pause)' : '3D Background Paused (Click to Enable)'}
              >
                <Box className={`w-4 h-4 shrink-0 ${is3DEnabled ? 'text-amber-600 dark:text-amber-400 animate-spin-slow' : 'opacity-60'}`} />
                <span className="hidden xl:inline font-extrabold">{is3DEnabled ? '3D Mode ON' : '3D Mode OFF'}</span>
              </button>
            )}

            {/* Account Profile / Menu Dropdown Trigger */}
            <div className="relative shrink-0">
              {currentUser ? (
                <button
                  onClick={() => setShowUserDropdown(prev => !prev)}
                  type="button"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 sm:py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all text-xs font-bold cursor-pointer shadow-xs"
                  title="Account Info & Tools"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 rounded-full border border-stone-300 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[70px] sm:max-w-[110px] truncate font-extrabold">{currentUser.name}</span>
                  {isAdmin ? (
                    <span className="bg-amber-100 text-amber-800 text-[9px] px-1 py-0.2 rounded font-black uppercase shrink-0">ADMIN</span>
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  )}
                </button>
              ) : (
                <button
                  onClick={() => onOpenAuthModal()}
                  type="button"
                  className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition-all shadow-md shadow-emerald-900/20 active:scale-95 cursor-pointer shrink-0 border border-emerald-500/30"
                  title="Click to Log In / Sign In"
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span className="font-black text-xs">Log In / Profile</span>
                </button>
              )}

              {/* Dropdown Menu */}
              {showUserDropdown && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl p-3 z-50 animate-in fade-in space-y-2"
                >
                  {currentUser ? (
                    <div className="border-b border-stone-100 dark:border-stone-800 pb-2.5">
                      <p className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                        {currentUser.name}
                        {isAdmin && <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-black uppercase">ADMIN</span>}
                      </p>
                      <p className="text-[11px] text-stone-500 truncate">{currentUser.email}</p>
                      
                      {!isAdmin && (
                        <div className="mt-2 bg-stone-50 dark:bg-stone-800/60 p-2 rounded-xl text-[11px]">
                          <div className="flex justify-between text-stone-600 dark:text-stone-300 font-medium">
                            <span>Daily Quota:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{remainingQuota} / {dailyLimit} left</span>
                          </div>
                          <div className="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-600 h-full rounded-full"
                              style={{ width: `${Math.min(100, (dailyUsed / dailyLimit) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border-b border-stone-100 dark:border-stone-800 pb-2.5 text-center">
                      <p className="text-xs font-bold text-stone-800 dark:text-stone-200">Welcome to ExamCraft</p>
                      <p className="text-[11px] text-stone-500">Sign in to save papers & manage quota</p>
                    </div>
                  )}

                  {/* 1. Admin Control Panel (Only visible to verified admins) */}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenAdminPanel();
                      }}
                      type="button"
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/70 border border-amber-200 dark:border-amber-800/80 transition-colors cursor-pointer"
                    >
                      <Crown className="w-4 h-4 text-amber-600 fill-amber-600 shrink-0" />
                      <span>Admin Control Panel</span>
                    </button>
                  )}

                  {/* 2. Question Auto-Vault */}
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenQuestionVault();
                    }}
                    type="button"
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    <Database className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Question Auto-Vault</span>
                  </button>

                  {/* 3. Google Drive Sync */}
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenGoogleDrive();
                    }}
                    type="button"
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    <Cloud className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Google Drive Sync</span>
                  </button>

                  {/* 4. Custom School Header */}
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenBranding();
                    }}
                    type="button"
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-stone-500 shrink-0" />
                    <span>Custom School Header</span>
                  </button>

                  {/* 5. 3D Background Toggle */}
                  {onToggle3D && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onToggle3D();
                      }}
                      type="button"
                      className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>3D Animated Background</span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${is3DEnabled ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'}`}>
                        {is3DEnabled ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  )}

                  {/* 5. Log Out or Log In */}
                  {currentUser ? (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        logout();
                      }}
                      type="button"
                      className="w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-black text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/60 transition-colors cursor-pointer border border-red-200 dark:border-red-900/50"
                    >
                      <LogOut className="w-4 h-4 text-red-600 shrink-0" />
                      <span>Log Out (लॉग आउट)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenAuthModal();
                      }}
                      type="button"
                      className="w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 transition-all cursor-pointer shadow-md"
                    >
                      <LogIn className="w-4 h-4 text-white shrink-0" />
                      <span>Log In (लॉग इन / साइन इन)</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {generatedPaperCount > 0 && (
              <button
                onClick={() => setActiveTab('generator')}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-2.5 py-1.5 sm:py-2 rounded-xl flex items-center gap-1 shadow-md shadow-emerald-900/15 transition-all shrink-0 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Paper Ready</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row - Smooth horizontal scrollbar */}
        <div className="lg:hidden flex items-center nav-scrollbar py-2 space-x-1.5 border-t border-stone-200 dark:border-stone-800 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-emerald-700 text-white font-bold shadow-xs'
                    : 'text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                    isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
