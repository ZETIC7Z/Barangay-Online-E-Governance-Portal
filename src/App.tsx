import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Scale, Siren, Megaphone, MessageSquare, X } from 'lucide-react';
import { ThreeYakanScene } from './components/ThreeYakanScene';
import { IntroSplash, shouldPlayIntro } from './components/IntroSplash';
import { Navbar, PortalNotificationItem } from './components/Navbar';
import { PublicLanding } from './pages/PublicLanding';
import { AuthPortal } from './pages/AuthPortal';
import { ResidentDashboard } from './pages/ResidentDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { SmartAppDownloadModal } from './components/SmartAppDownloadModal';
import { CertificatePrinterModal } from './components/CertificatePrinterModal';
import { initSecurityShield } from './utils/securityShield';

interface RealtimeToast {
  id: string;
  type: 'subpoena' | 'emergency' | 'announcement' | 'chat' | 'info';
  title: string;
  message: string;
  timestamp: string;
}

export const App: React.FC = () => {
  const [introActive, setIntroActive] = useState<boolean>(() => shouldPlayIntro());
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeView, setActiveView] = useState<string>('home');
  const [user, setUser] = useState<any | null>(() => {
    try {
      const saved = localStorage.getItem('matatag_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [residentProfile, setResidentProfile] = useState<any | null>(() => {
    try {
      const saved = localStorage.getItem('matatag_resident_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [bootstrap, setBootstrap] = useState<any | null>(null);
  const [fullData, setFullData] = useState<any | null>(null);
  const [pendingService, setPendingService] = useState<string | null>(null);
  const [isDownloadAppOpen, setIsDownloadAppOpen] = useState(false);
  const [printState, setPrintState] = useState<{
    item: any | null;
    type: 'certificate' | 'subpoena';
  }>({ item: null, type: 'certificate' });
  const [toasts, setToasts] = useState<RealtimeToast[]>([]);
  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);

  // Activate Defense-in-Depth Client Security Shield (Anti-DevTools YouTube Redirect + Right-Click/Shortcut Guard)
  useEffect(() => {
    initSecurityShield();
  }, []);

  // Apply Light Mode (default) or Dark Mode class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const pushToast = useCallback(
    (type: RealtimeToast['type'], title: string, message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [
        { id, type, title, message, timestamp: new Date().toLocaleTimeString() },
        ...prev.slice(0, 3),
      ]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 8500);
    },
    []
  );

  const fetchAllData = useCallback(async () => {
    try {
      const [bootRes, fullRes] = await Promise.all([
        fetch('/api/bootstrap'),
        fetch('/api/admin/full-data'),
      ]);
      if (bootRes.ok) {
        const bootJson = await bootRes.json();
        setBootstrap(bootJson);
      }
      if (fullRes.ok) {
        const fullJson = await fullRes.json();
        setFullData(fullJson);
        if (user?.residentId && fullJson?.residents) {
          const updatedProfile = fullJson.residents.find(
            (r: any) => r.id === user.residentId
          );
          if (updatedProfile) {
            setResidentProfile(updatedProfile);
            localStorage.setItem(
              'matatag_resident_profile',
              JSON.stringify(updatedProfile)
            );
          }
        }
      }
    } catch (err) {
      console.error('Data sync error:', err);
    }
  }, [user?.residentId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Real-Time Socket.IO Connection
  useEffect(() => {
    const socket = io('/', { transports: ['websocket', 'polling'] });

    socket.on('subpoena:issued', (summon: any) => {
      fetchAllData();
      pushToast(
        'subpoena',
        `URGENT SUBPOENA ISSUED (${summon.caseNumber})`,
        `Lupon Summons issued to ${summon.respondent} — Hearing: ${summon.hearingSchedule}`
      );
    });

    socket.on('emergency:sos', (sos: any) => {
      fetchAllData();
      pushToast(
        'emergency',
        `LIVE EMERGENCY SOS: ${sos.type}`,
        `${sos.residentName} at ${sos.address} (${sos.lat?.toFixed(4)}°N, ${sos.lng?.toFixed(4)}°E)`
      );
    });

    socket.on('emergency:updated', () => {
      fetchAllData();
    });

    socket.on('announcement:broadcast', (bulletin: any) => {
      fetchAllData();
      pushToast(
        'announcement',
        `BARANGAY MATATAG BROADCAST: ${bulletin.category}`,
        bulletin.title
      );
    });

    socket.on('chat:message', (msg: any) => {
      fetchAllData();
      if (
        (user?.role?.toLowerCase() === 'admin' &&
          msg.senderRole?.toLowerCase() === 'resident') ||
        (user?.role?.toLowerCase() === 'resident' &&
          msg.senderRole?.toLowerCase() === 'admin' &&
          msg.residentId === (residentProfile?.id || user?.residentId))
      ) {
        pushToast(
          'chat',
          `Live Message from ${msg.senderName}`,
          msg.imageUrl
            ? `📷 Shared image to Google Drive Vault: ${msg.message}`
            : msg.message
        );
      }
    });

    socket.on('request:created', () => fetchAllData());
    socket.on('request:updated', (reqItem: any) => {
      fetchAllData();
      pushToast(
        'info',
        `Application Updated (${reqItem.trackingNumber})`,
        `${reqItem.documentType} is now ${reqItem.status}`
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchAllData, pushToast, residentProfile?.id, user?.residentId, user?.role]);

  const handleAuthSuccess = (authData: any) => {
    setUser(authData.user);
    setResidentProfile(authData.residentProfile || null);
    localStorage.setItem('matatag_user', JSON.stringify(authData.user));
    if (authData.residentProfile) {
      localStorage.setItem(
        'matatag_resident_profile',
        JSON.stringify(authData.residentProfile)
      );
    }
    fetchAllData();
    if (authData.user.role?.toLowerCase() === 'admin') {
      setActiveView('admin-dashboard');
    } else {
      setActiveView('resident-dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setResidentProfile(null);
    localStorage.removeItem('matatag_user');
    localStorage.removeItem('matatag_resident_profile');
    setActiveView('home');
  };

  // Build Facebook-Style Real-Time Notification Feed for Logged-In Client or Admin
  const notifications = useMemo<PortalNotificationItem[]>(() => {
    if (!user || !fullData) return [];
    const items: PortalNotificationItem[] = [];

    if (user.role?.toLowerCase() === 'admin') {
      for (const sos of fullData.emergencies || []) {
        if (sos.status !== 'Resolved') {
          items.push({
            id: `notif-sos-${sos.id}`,
            category: 'emergency',
            title: `Emergency SOS: ${sos.type}`,
            message: `${sos.residentName} at ${sos.address}`,
            timestamp: 'Live Alert',
            statusBadge: sos.severity || 'URGENT',
            payload: sos,
          });
        }
      }
      for (const reqItem of (fullData.requests || []).slice(0, 6)) {
        items.push({
          id: `notif-req-${reqItem.id}`,
          category: 'certificate',
          title: `${reqItem.documentType} (${reqItem.trackingNumber})`,
          message: `Applicant: ${reqItem.residentName} • Purpose: ${reqItem.purpose}`,
          timestamp: reqItem.dateFiled
            ? new Date(reqItem.dateFiled).toLocaleDateString()
            : 'Recent',
          statusBadge: reqItem.status,
          payload: reqItem,
        });
      }
      return items;
    }

    // Resident Notifications (Certificates, Subpoenas, Helpdesk Chat, Official Broadcasts)
    const resId = residentProfile?.id || user?.residentId || 'RES-MTG-001';
    const resName = (residentProfile?.fullName || user?.fullName || '').toLowerCase();

    const myRequests = (fullData.requests || []).filter(
      (r: any) =>
        r.residentId === resId ||
        (resName && String(r.residentName || '').toLowerCase() === resName)
    );
    for (const r of myRequests) {
      items.push({
        id: `notif-cert-${r.id}-${r.status}`,
        category: 'certificate',
        title: `${r.documentType} (${r.trackingNumber})`,
        message: `Status: ${r.status} — ${r.remarks || 'Click to view & print your QR PDF certificate in Resident Portal.'}`,
        timestamp: r.dateFiled ? new Date(r.dateFiled).toLocaleDateString() : 'Today',
        statusBadge: r.status,
        payload: r,
      });
    }

    const mySummons = (fullData.summons || []).filter(
      (s: any) =>
        s.respondentResidentId === resId ||
        (resName && String(s.respondent || '').toLowerCase() === resName)
    );
    for (const s of mySummons) {
      items.push({
        id: `notif-kp-${s.id}`,
        category: 'subpoena',
        title: `Lupon Subpoena (${s.caseNumber})`,
        message: `${s.type} • Hearing: ${new Date(s.hearingSchedule).toLocaleDateString()}`,
        timestamp: 'Official Notice',
        statusBadge: s.status,
        payload: s,
      });
    }

    const myAdminChats = (fullData.chatMessages || [])
      .filter(
        (m: any) =>
          m.residentId === resId && String(m.senderRole || '').toLowerCase() === 'admin'
      )
      .slice(-3)
      .reverse();
    for (const m of myAdminChats) {
      items.push({
        id: `notif-chat-${m.id}`,
        category: 'chat',
        title: `Message from ${m.senderName}`,
        message: m.message,
        timestamp: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
        statusBadge: 'Helpdesk',
        payload: m,
      });
    }

    for (const b of (fullData.bulletins || []).slice(0, 2)) {
      items.push({
        id: `notif-bul-${b.id}`,
        category: 'announcement',
        title: b.title,
        message: b.content,
        timestamp: b.publishedDate || ' Advisory',
        statusBadge: b.category,
        payload: b,
      });
    }

    return items;
  }, [fullData, residentProfile?.fullName, residentProfile?.id, user]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !readNotifIds.includes(n.id)).length;
  }, [notifications, readNotifIds]);

  const handleMarkAllRead = useCallback(() => {
    setReadNotifIds(notifications.map((n) => n.id));
  }, [notifications]);

  const handleNotificationClick = useCallback(
    (notif: PortalNotificationItem) => {
      setReadNotifIds((prev) => (prev.includes(notif.id) ? prev : [...prev, notif.id]));
      if (user?.role?.toLowerCase() === 'admin') {
        setActiveView('admin-dashboard');
      } else {
        setActiveView('resident-dashboard');
      }
    },
    [user?.role]
  );

  return (
    <>
      <AnimatePresence>
        {introActive && <IntroSplash onFinish={() => setIntroActive(false)} />}
      </AnimatePresence>
      <motion.div
        className="relative min-h-screen selection:bg-[#B91C1C] selection:text-white"
        initial={false}
        animate={
          introActive
            ? { opacity: 0 }
            : {
                opacity: 1,
                transitionEnd: { transform: 'none', filter: 'none' },
              }
        }
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Smart Barangay E-Governance Civic Network & GIS Motion Background */}
        <ThreeYakanScene theme={theme} />

        {/* Clean Sticky Header Navbar with Standalone Facebook-Style Notification Bell */}
        <Navbar
          activeView={activeView}
          setActiveView={setActiveView}
          user={user}
          onLogout={handleLogout}
          onOpenDownloadApp={() => setIsDownloadAppOpen(true)}
          unreadCount={unreadCount}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          onMarkAllRead={handleMarkAllRead}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Real-Time Socket.IO Toast Stack */}
        {toasts.length > 0 && (
          <div className="fixed top-20 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
            {toasts.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  if (user) {
                    setActiveView(
                      user.role?.toLowerCase() === 'admin'
                        ? 'admin-dashboard'
                        : 'resident-dashboard'
                    );
                  }
                }}
                className="pointer-events-auto cursor-pointer rounded-xl p-4 shadow-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-l-4 border-l-[#B91C1C]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {t.type === 'subpoena' ? (
                      <Scale className="w-4 h-4 text-[#B91C1C] shrink-0" />
                    ) : t.type === 'emergency' ? (
                      <Siren className="w-4 h-4 text-[#B91C1C] animate-bounce shrink-0" />
                    ) : t.type === 'announcement' ? (
                      <Megaphone className="w-4 h-4 text-[#D97706] shrink-0" />
                    ) : t.type === 'chat' ? (
                      <MessageSquare className="w-4 h-4 text-[#059669] shrink-0" />
                    ) : (
                      <Bell className="w-4 h-4 text-[#1D4ED8] shrink-0" />
                    )}
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                      {t.title}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setToasts((prev) => prev.filter((item) => item.id !== t.id));
                    }}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t.message}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Main Content Router */}
        <main className="relative z-10">
          {activeView === 'home' && (
            <PublicLanding
              bootstrap={bootstrap}
              user={user}
              onNavigate={(v, serviceName) => {
                if (serviceName) setPendingService(serviceName);
                else setPendingService(null);
                setActiveView(v);
              }}
              onOpenDownloadApp={() => setIsDownloadAppOpen(true)}
              onPrintDocument={(item, type) => setPrintState({ item, type })}
              onRefreshData={fetchAllData}
            />
          )}

          {(activeView === 'login' || activeView === 'register') && (
            <AuthPortal
              initialMode={activeView === 'register' ? 'register' : 'login'}
              pendingService={pendingService}
              onAuthSuccess={(data) => {
                setPendingService(null);
                handleAuthSuccess(data);
              }}
              onBackHome={() => {
                setPendingService(null);
                setActiveView('home');
              }}
              onGoTrack={() => {
                setPendingService(null);
                setActiveView('home');
                setTimeout(() => {
                  document.getElementById('tracker-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 120);
              }}
            />
          )}

          {activeView === 'resident-dashboard' && (
            <ResidentDashboard
              user={
                user || {
                  id: 'USR-RES-001',
                  username: 'resident@gmail.com',
                  fullName: 'Amir K. Kalun',
                  role: 'Resident',
                  residentId: 'RES-MTG-001',
                }
              }
              residentProfile={
                residentProfile ||
                (fullData?.residents || []).find((r: any) => r.id === 'RES-MTG-001')
              }
              fullData={fullData}
              onRefresh={fetchAllData}
              onPrintDocument={(item, type) => setPrintState({ item, type })}
            />
          )}

          {activeView === 'admin-dashboard' && (
            <AdminDashboard
              fullData={fullData}
              onRefresh={fetchAllData}
              onPrintDocument={(item, type) => setPrintState({ item, type })}
              theme={theme}
              onToggleTheme={toggleTheme}
              onGoHome={() => setActiveView('home')}
              onLogout={handleLogout}
            />
          )}
        </main>

        {/* Clean Official Footer (shown on AuthPortal & ResidentDashboard; PublicLanding has its own full footer) */}
        {activeView !== 'admin-dashboard' && activeView !== 'home' && (
          <footer className="relative z-10 mt-12 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pb-24 lg:pb-8">
            <div className="max-w-[1520px] mx-auto px-4 sm:px-8 pt-8 space-y-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <img
                    src="/logo.png"
                    alt="Barangay Matatag Seal"
                    className="w-12 h-12 rounded-full object-contain"
                  />
                  <div>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white tracking-wide">
                      BARANGAY MATATAG DIGITAL PORTAL • LAMITAN CITY, BASILAN
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Aguinaldo St., Poblacion, ZIP 7302, BARMM • Punong Barangay: Hon. Hulma G. Abdurahman
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <button
                    onClick={() => setActiveView('home')}
                    className="hover:text-slate-900 dark:hover:text-white transition"
                  >
                    Home
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => setIsDownloadAppOpen(true)}
                    className="hover:text-[#1D4ED8] transition font-semibold text-[#1D4ED8] dark:text-blue-400"
                  >
                    Download PC (.EXE) / Android (.APK) / iOS App
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => setActiveView('login')}
                    className="hover:text-slate-900 dark:hover:text-white transition"
                  >
                    Staff &amp; Resident Portal
                  </button>
                </div>
              </div>

              {/* Centered ZETICUZ Developer Credit */}
              <div className="pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-2">
                <div className="inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-[#0D1117] px-5 py-2.5 border border-slate-800 shadow-md zeticuz-dev-pill">
                  <img
                    src="/zeticuz-logo.svg"
                    alt="ZETICUZ Logo"
                    className="h-6 w-auto object-contain"
                  />
                  <span className="text-xs font-display tracking-wider uppercase text-slate-300 font-semibold">
                    SITE DEVELOPED BY:{' '}
                    <strong className="text-[#F87171] font-extrabold capitalize">
                      Sam Pangilinan
                    </strong>
                  </span>
                  <span className="text-slate-500 font-bold">·</span>
                  <span className="text-xs font-semibold text-slate-300">© 2026</span>
                  <button
                    type="button"
                    onClick={() =>
                      window.open('https://www.zeticuz.xyz/', '_blank', 'noopener,noreferrer')
                    }
                    className="ml-1 inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 px-3 py-1 text-[11px] font-extrabold text-white shadow-sm transition"
                  >
                    <span>Explore Developer Portfolio &amp; Projects ↗</span>
                  </button>
                </div>
              </div>
            </div>
          </footer>
        )}

        {/* Smart App Download & PC (.EXE) / Android (.APK) / iOS PWA Modal */}
        <SmartAppDownloadModal
          isOpen={isDownloadAppOpen}
          onClose={() => setIsDownloadAppOpen(false)}
        />

        {/* Same-Page Floating Official QR Certificate & KP Form #9 Subpoena Printer Modal */}
        <CertificatePrinterModal
          item={printState.item}
          type={printState.type}
          onClose={() => setPrintState({ item: null, type: 'certificate' })}
        />
      </motion.div>
    </>
  );
};

export default App;
