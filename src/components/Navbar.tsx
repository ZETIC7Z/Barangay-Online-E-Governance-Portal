import React, { useEffect, useRef, useState } from 'react';
import {
  Home,
  FileText,
  Search,
  Download,
  UserPlus,
  LayoutDashboard,
  LogOut,
  Bell,
  Sun,
  Moon,
  CheckCircle2,
  Scale,
  MessageSquare,
  Megaphone,
  FileCheck2,
  ChevronRight,
  Clock,
} from 'lucide-react';

export interface PortalNotificationItem {
  id: string;
  category: 'certificate' | 'subpoena' | 'chat' | 'announcement' | 'emergency';
  title: string;
  message: string;
  timestamp: string;
  statusBadge?: string;
  unread?: boolean;
  targetTab?: string;
  payload?: any;
}

export const Navbar: React.FC<{
  activeView: string;
  setActiveView: (v: string) => void;
  user: any | null;
  onLogout: () => void;
  onOpenDownloadApp: () => void;
  unreadCount: number;
  notifications?: PortalNotificationItem[];
  onNotificationClick?: (notif: PortalNotificationItem) => void;
  onMarkAllRead?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}> = ({
  activeView,
  setActiveView,
  user,
  onLogout,
  onOpenDownloadApp,
  unreadCount,
  notifications = [],
  onNotificationClick,
  onMarkAllRead,
  theme = 'light',
  onToggleTheme,
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToSection = (sectionId: string) => {
    if (activeView !== 'home') {
      setActiveView('home');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // When inside Admin Dashboard on desktop, AdminDashboard renders its own full-viewport sidebar & top bar
  if (activeView === 'admin-dashboard') {
    return null;
  }

  const getNotifIcon = (cat: PortalNotificationItem['category']) => {
    switch (cat) {
      case 'certificate':
        return <FileCheck2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'subpoena':
        return <Scale className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Megaphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 shadow-sm transition-colors">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-3">
          {/* Left: Clean Official Barangay Matatag Seal */}
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className="flex items-center gap-3 text-left group focus:outline-none min-w-0"
          >
            <img
              src="/logo.png"
              alt="Official Barangay Matatag Seal"
              className="w-11 h-11 sm:w-14 sm:h-14 rounded-full object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
            />
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
                  BARANGAY MATATAG
                </span>
                <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                  ZIP 7302 • BARMM
                </span>
              </div>
              <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                Lamitan City, Basilan Province
              </p>
            </div>
          </button>

          {/* Center: Clean Simple Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7">
            <button
              type="button"
              onClick={() => {
                setActiveView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`text-xs font-bold tracking-wider uppercase transition-colors ${
                activeView === 'home'
                  ? 'text-[#B91C1C] dark:text-rose-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              HOME
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('services-section')}
              className="text-xs font-bold tracking-wider uppercase text-slate-600 dark:text-slate-300 hover:text-[#B91C1C] dark:hover:text-rose-400 transition-colors"
            >
              BARANGAY SERVICES
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('tracker-section')}
              className="text-xs font-bold tracking-wider uppercase text-slate-600 dark:text-slate-300 hover:text-[#B91C1C] dark:hover:text-rose-400 transition-colors"
            >
              TRACK APPLICATION
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('announcements-section')}
              className="text-xs font-bold tracking-wider uppercase text-slate-600 dark:text-slate-300 hover:text-[#B91C1C] dark:hover:text-rose-400 transition-colors"
            >
              ANNOUNCEMENT
            </button>
            <button
              type="button"
              onClick={onOpenDownloadApp}
              className="text-xs font-bold tracking-wider uppercase text-slate-600 dark:text-slate-300 hover:text-[#1D4ED8] dark:hover:text-blue-400 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              DOWNLOAD APP
            </button>
          </nav>

          {/* Right: Light/Dark Toggle + Standalone Facebook-Style Notification Bell (when logged in) + Portal Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )}
              </button>
            )}

            {/* Standalone Facebook-Style Realtime Notification Bell — Only Displayed When Logged In */}
            {user && (
              <div ref={notifContainerRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotifOpen((prev) => !prev);
                    if (!isNotifOpen && onMarkAllRead) {
                      onMarkAllRead();
                    }
                  }}
                  title="Real-Time Barangay Notifications"
                  aria-label="Real-Time Barangay Notifications"
                  className={`relative p-2.5 rounded-xl border transition-all flex items-center justify-center ${
                    isNotifOpen
                      ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-blue-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <Bell className="w-4 h-4 sm:w-[18px] sm:h-[18px] stroke-[2.2]" />
                  {unreadCount > 0 && (
                    <span className="notif-badge-pill absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-[#DC2626] text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Facebook-Style Floating Notification Dropdown Panel */}
                {isNotifOpen && (
                  <div className="fixed sm:absolute right-3 sm:right-0 top-20 sm:top-auto sm:mt-3 w-[calc(100vw-1.5rem)] sm:w-96 max-h-[80vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-hidden">
                    <div className="px-4 py-3.5 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-display font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Notifications</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                            Live Sync
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Click any update to open your {user.role?.toLowerCase() === 'admin' ? 'Admin Dashboard' : 'Resident Portal'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsNotifOpen(false);
                          setActiveView(
                            user.role?.toLowerCase() === 'admin'
                              ? 'admin-dashboard'
                              : 'resident-dashboard'
                          );
                        }}
                        className="text-xs font-bold text-blue-700 dark:text-blue-400 hover:underline"
                      >
                        Open Portal ↗
                      </button>
                    </div>

                    <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 max-h-[380px]">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center space-y-2">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            You’re all caught up!
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Real-time updates for your Barangay Certificates, Subpoenas, and Helpdesk messages will appear here.
                          </p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <button
                            key={notif.id}
                            type="button"
                            onClick={() => {
                              setIsNotifOpen(false);
                              if (onNotificationClick) {
                                onNotificationClick(notif);
                              } else {
                                setActiveView(
                                  user.role?.toLowerCase() === 'admin'
                                    ? 'admin-dashboard'
                                    : 'resident-dashboard'
                                );
                              }
                            }}
                            className="w-full text-left px-4 py-3.5 hover:bg-blue-50/70 dark:hover:bg-slate-800/80 transition flex items-start gap-3 group"
                          >
                            <div className="mt-0.5 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                              {getNotifIcon(notif.category)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate group-hover:text-blue-700 dark:group-hover:text-blue-400">
                                  {notif.title}
                                </span>
                                {notif.statusBadge && (
                                  <span className="shrink-0 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                                    {notif.statusBadge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                                {notif.message}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1.5">
                                <Clock className="w-3 h-3" />
                                <span>{notif.timestamp}</span>
                                <span>•</span>
                                <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center">
                                  View in Portal <ChevronRight className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {user ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveView(
                      user.role?.toLowerCase() === 'admin'
                        ? 'admin-dashboard'
                        : 'resident-dashboard'
                    )
                  }
                  className="px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#1D4ED8] hover:bg-[#1E40AF] text-white shadow-sm flex items-center gap-2 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">
                    {user.role?.toLowerCase() === 'admin'
                      ? 'Admin Dashboard'
                      : 'Resident Portal'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3 sm:px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActiveView('login')}
                  className="px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Resident Login
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('register')}
                  className="px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#B91C1C] hover:bg-[#991B1B] text-white shadow-sm transition-colors"
                >
                  Register Account
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-2 pt-1.5 pb-[calc(0.45rem+env(safe-area-inset-bottom,0px))]"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-semibold ${
              activeView === 'home'
                ? 'text-[#B91C1C] bg-red-50 dark:bg-rose-950/40 dark:text-rose-300'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Home className="w-4 h-4 mb-0.5" />
            <span>Home</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('services-section')}
            className="flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-semibold text-slate-600 dark:text-slate-400"
          >
            <FileText className="w-4 h-4 mb-0.5" />
            <span>Services</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('tracker-section')}
            className="flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-semibold text-slate-600 dark:text-slate-400"
          >
            <Search className="w-4 h-4 mb-0.5" />
            <span>Track</span>
          </button>

          <button
            type="button"
            onClick={onOpenDownloadApp}
            className="flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-semibold text-[#1D4ED8] dark:text-blue-400"
          >
            <Download className="w-4 h-4 mb-0.5" />
            <span>Get App</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveView(
                user
                  ? user.role?.toLowerCase() === 'admin'
                    ? 'admin-dashboard'
                    : 'resident-dashboard'
                  : 'login'
              )
            }
            className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-semibold ${
              activeView.includes('dashboard') || activeView === 'login'
                ? 'text-[#B91C1C] bg-red-50 dark:bg-rose-950/40 dark:text-rose-300'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {user ? (
              <LayoutDashboard className="w-4 h-4 mb-0.5" />
            ) : (
              <UserPlus className="w-4 h-4 mb-0.5" />
            )}
            <span>{user ? 'Portal' : 'Login'}</span>
          </button>
        </div>
      </nav>
    </>
  );
};
