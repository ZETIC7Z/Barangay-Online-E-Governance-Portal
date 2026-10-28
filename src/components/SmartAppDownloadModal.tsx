import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Share,
  PlusSquare,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  X,
  Apple,
  Cpu,
  Monitor,
  FolderOpen,
  FileCheck2,
  MapPin,
  Siren,
  Scale,
  QrCode,
  MessageSquare,
  Megaphone,
  PackageCheck,
  Users,
  Wallet,
  Smartphone,
  HardDrive,
} from 'lucide-react';

export const SmartAppDownloadModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [platform, setPlatform] = useState<'desktop' | 'android' | 'ios'>('desktop');
  const [desktopOs, setDesktopOs] = useState<'windows' | 'mac' | 'linux'>('windows');
  const [wizardStep, setWizardStep] = useState<0 | 1 | 2>(0);
  const [installPath, setInstallPath] = useState(
    'C:\\Program Files\\Barangay Matatag Smart Portal'
  );
  const [createDesktopShortcut, setCreateDesktopShortcut] = useState(true);
  const [createStartMenuShortcut, setCreateStartMenuShortcut] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installStatus, setInstallStatus] = useState<'idle' | 'downloading' | 'installed'>('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || '';
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /android/i.test(ua);

    if (isIOS) setPlatform('ios');
    else if (isAndroid) setPlatform('android');
    else {
      setPlatform('desktop');
      if (/Mac/i.test(ua)) {
        setDesktopOs('mac');
        setInstallPath('/Applications/Barangay Matatag Smart Portal.app');
      } else if (/Linux/i.test(ua)) {
        setDesktopOs('linux');
        setInstallPath('/opt/barangay-matatag-smart-portal');
      } else {
        setDesktopOs('windows');
        setInstallPath('C:\\Program Files\\Barangay Matatag Smart Portal');
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const triggerDownloadPackage = (targetUrl: string, fileName: string) => {
    setInstallStatus('downloading');
    setProgress(20);

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
      } catch {
        // ignore
      }
    }

    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) {
          clearInterval(timer);
          return 100;
        }
        return p + 25;
      });
    }, 200);

    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      setInstallStatus('installed');
      setWizardStep(2);
    }, 1100);
  };

  const handleDesktopDownload = () => {
    if (desktopOs === 'windows') {
      triggerDownloadPackage(
        '/downloads/Barangay-Matatag-Smart-Portal-Setup.exe',
        'Barangay-Matatag-Smart-Portal-Setup.exe'
      );
    } else if (desktopOs === 'mac') {
      triggerDownloadPackage(
        '/downloads/Barangay-Matatag-Smart-Portal-macOS.dmg',
        'Barangay-Matatag-Smart-Portal-macOS.dmg'
      );
    } else {
      triggerDownloadPackage(
        '/downloads/Barangay-Matatag-Smart-Portal-Linux.AppImage',
        'Barangay-Matatag-Smart-Portal-Linux.AppImage'
      );
    }
  };

  const featureGridIcons = [
    { icon: FileCheck2, bg: 'bg-blue-600', label: 'Certs' },
    { icon: MapPin, bg: 'bg-emerald-600', label: '3D GIS' },
    { icon: Siren, bg: 'bg-rose-600', label: 'SOS' },
    { icon: Scale, bg: 'bg-amber-600', label: 'Lupon' },
    { icon: QrCode, bg: 'bg-purple-600', label: 'QR PDF' },
    { icon: MessageSquare, bg: 'bg-sky-600', label: 'Chat' },
    { icon: Megaphone, bg: 'bg-orange-600', label: 'News' },
    { icon: PackageCheck, bg: 'bg-teal-600', label: 'Borrow' },
    { icon: Users, bg: 'bg-indigo-600', label: 'Roster' },
    { icon: Wallet, bg: 'bg-yellow-600', label: 'O.R.' },
    { icon: Smartphone, bg: 'bg-pink-600', label: 'Mobile' },
    { icon: HardDrive, bg: 'bg-cyan-600', label: 'Vault' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            className="relative w-full max-w-4xl rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 p-5 sm:p-7 shadow-2xl my-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Top Header */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
              <img
                src="/logo.png"
                alt="Barangay Matatag Official Seal"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0"
              />
              <div className="text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 px-3 py-0.5 text-[11px] font-bold text-blue-700 dark:text-blue-300 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  OFFICIAL MULTI-PLATFORM APPLICATION INSTALLER • BARANGAY MATATAG
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 dark:text-white">
                  Download Barangay Matatag Smart Portal App
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                  Available for <strong>Windows PC (.exe Setup Wizard), macOS (.dmg), Linux (.AppImage)</strong>, <strong>Android (.APK)</strong>, and <strong>iOS (iPhone/iPad PWA)</strong>.
                </p>
              </div>
            </div>

            {/* 3-Platform Switcher Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => {
                  setPlatform('desktop');
                  setInstallStatus('idle');
                }}
                className={`flex items-center justify-center gap-2 rounded-xl p-3 border text-xs sm:text-sm font-bold transition ${
                  platform === 'desktop'
                    ? 'bg-[#1D4ED8] border-blue-700 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                }`}
              >
                <Monitor className="w-4 h-4" />
                PC / Desktop (.EXE / Mac / Linux)
              </button>

              <button
                type="button"
                onClick={() => {
                  setPlatform('android');
                  setInstallStatus('idle');
                }}
                className={`flex items-center justify-center gap-2 rounded-xl p-3 border text-xs sm:text-sm font-bold transition ${
                  platform === 'android'
                    ? 'bg-[#B91C1C] border-rose-700 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                }`}
              >
                <Cpu className="w-4 h-4" />
                Android Mobile (.APK)
              </button>

              <button
                type="button"
                onClick={() => {
                  setPlatform('ios');
                  setInstallStatus('idle');
                }}
                className={`flex items-center justify-center gap-2 rounded-xl p-3 border text-xs sm:text-sm font-bold transition ${
                  platform === 'ios'
                    ? 'bg-slate-900 dark:bg-blue-600 border-slate-800 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                }`}
              >
                <Apple className="w-4 h-4" />
                iOS / iPhone &amp; iPad App
              </button>
            </div>

            {/* =========================================================
                DESKTOP PC SETUP WIZARD (.EXE / MAC / LINUX) — MATCHES IMAGE 5
               ========================================================= */}
            {platform === 'desktop' && (
              <div className="mt-5 space-y-4">
                {/* OS Selector Pills */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      {
                        id: 'windows',
                        label: 'Windows 11 / 10 / 8 / 7 (.exe Setup Wizard)',
                        defaultPath: 'C:\\Program Files\\Barangay Matatag Smart Portal',
                      },
                      {
                        id: 'mac',
                        label: 'macOS Apple Silicon & Intel (.dmg)',
                        defaultPath: '/Applications/Barangay Matatag Smart Portal.app',
                      },
                      {
                        id: 'linux',
                        label: 'Linux Ubuntu / Debian / Arch (.AppImage)',
                        defaultPath: '/opt/barangay-matatag-smart-portal',
                      },
                    ].map((os) => (
                      <button
                        key={os.id}
                        type="button"
                        onClick={() => {
                          setDesktopOs(os.id as any);
                          setInstallPath(os.defaultPath);
                        }}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition ${
                          desktopOs === os.id
                            ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-600 text-blue-700 dark:text-blue-300'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {os.label}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Auto-Creates Desktop Shortcut with Matatag Seal
                  </span>
                </div>

                {/* Native Setup Wizard Window Frame (Matching Image 5 Setup Wizard UI) */}
                <div className="rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 shadow-xl bg-white text-slate-900">
                  {/* Window Title Bar */}
                  <div className="bg-slate-100 border-b border-slate-300 px-3.5 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src="/logo.png" alt="Icon" className="w-4 h-4 object-contain" />
                      <span className="text-xs font-semibold text-slate-800">
                        Barangay Matatag Smart Portal Setup
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-xs font-mono">
                      <span>—</span>
                      <span>□</span>
                      <button
                        type="button"
                        onClick={onClose}
                        className="hover:text-rose-600 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Wizard Split Body: Left Dark Banner + Blue Accent Strip + Right Wizard Content */}
                  <div className="grid grid-cols-1 md:grid-cols-12 min-h-[340px]">
                    {/* Left Dark Branding & 3x4 Feature Module Grid (Matches Image 5) */}
                    <div className="md:col-span-4 bg-[#111318] text-white p-5 flex flex-col justify-between border-r-4 border-[#2563EB] setup-wizard-dark-sidebar">
                      <div>
                        <div className="flex items-center gap-3">
                          <img
                            src="/logo.png"
                            alt="Barangay Matatag Official Seal"
                            className="w-14 h-14 rounded-full object-contain bg-white p-0.5 shadow-md"
                          />
                          <div>
                            <div className="text-sm font-display font-black tracking-wide text-white leading-tight">
                              BARANGAY MATATAG
                            </div>
                            <div className="text-[10px] font-bold tracking-widest text-blue-400 uppercase mt-0.5">
                              SMART PORTAL LAUNCHER
                            </div>
                          </div>
                        </div>

                        {/* 3x4 Feature Icon Grid matching Image 5 */}
                        <div className="grid grid-cols-3 gap-2 mt-5 bg-[#181C24] p-2.5 rounded-xl border border-slate-800">
                          {featureGridIcons.map((item, idx) => {
                            const Icon = item.icon;
                            return (
                              <div
                                key={idx}
                                className="aspect-square rounded-lg bg-[#222733] border border-slate-700/80 flex flex-col items-center justify-center p-1.5"
                              >
                                <div
                                  className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center text-white shadow-sm`}
                                >
                                  <Icon className="w-4 h-4" />
                                </div>
                                <span className="text-[9px] font-bold text-slate-300 mt-1">
                                  {item.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 pt-3 border-t border-slate-800 mt-4">
                        v2.5.0 • Lamitan City, Basilan (7302)
                      </div>
                    </div>

                    {/* Right Setup Wizard Interactive Content Area */}
                    <div className="md:col-span-8 bg-white p-6 flex flex-col justify-between">
                      {wizardStep === 0 && (
                        <div className="space-y-4">
                          <h4 className="text-xl sm:text-2xl font-normal text-slate-900 leading-snug">
                            Welcome to the Barangay Matatag Smart Portal Setup Wizard
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                            The Setup Wizard allows you to install the official{' '}
                            <strong>Barangay Matatag Smart E-Governance Desktop Application</strong> on your computer (Windows, macOS, or Linux) and automatically creates a Desktop shortcut with the official{' '}
                            <strong>Barangay Matatag Seal</strong>.
                          </p>
                          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-700 space-y-1.5">
                            <div className="font-bold text-slate-900">
                              System Overview &amp; Included Desktop Features:
                            </div>
                            <div>
                              • 24/7 Barangay Clearances, Residency, Indigency &amp; Business Permits with QR PDF Print
                            </div>
                            <div>
                              • 3D Google Satellite Map with Live Turn-by-Turn Directions to Barangay Matatag Hall
                            </div>
                            <div>
                              • Real-Time Emergency SOS Dispatch, Katarungang Pambarangay Subpoenas &amp; Live Chat
                            </div>
                            <div>
                              • Centralized Admin Command Center under Punong Barangay Hon. Hulma G. Abdurahman
                            </div>
                          </div>
                          <p className="text-xs text-slate-500">
                            Click <strong>Next</strong> to select your installation folder, or click{' '}
                            <strong>Download Setup Installer</strong> below to run the native installer directly on your PC.
                          </p>
                        </div>
                      )}

                      {wizardStep === 1 && (
                        <div className="space-y-4">
                          <h4 className="text-lg sm:text-xl font-normal text-slate-900">
                            Select Destination Location &amp; Desktop Shortcut
                          </h4>
                          <p className="text-xs text-slate-600">
                            Select the installation path where Barangay Matatag Smart Portal will be installed on your computer:
                          </p>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Installation Directory Path:
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={installPath}
                                onChange={(e) => setInstallPath(e.target.value)}
                                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const custom = window.prompt(
                                    'Enter preferred installation folder path on your PC:',
                                    installPath
                                  );
                                  if (custom) setInstallPath(custom);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
                              >
                                <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                                Browse...
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2 pt-1">
                            <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={createDesktopShortcut}
                                onChange={(e) => setCreateDesktopShortcut(e.target.checked)}
                                className="rounded border-slate-300 text-blue-600"
                              />
                              <span>
                                Auto-create Desktop Shortcut with Official{' '}
                                <strong>Barangay Matatag Seal Logo</strong>
                              </span>
                            </label>
                            <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={createStartMenuShortcut}
                                onChange={(e) => setCreateStartMenuShortcut(e.target.checked)}
                                className="rounded border-slate-300 text-blue-600"
                              />
                              <span>
                                Create Start Menu / Applications Launcher Entry
                              </span>
                            </label>
                          </div>

                          {installStatus === 'downloading' && (
                            <div className="space-y-1.5 pt-2">
                              <div className="flex justify-between text-xs font-bold text-blue-700">
                                <span>Downloading Setup Wizard Installer to your PC...</span>
                                <span>{progress}%</span>
                              </div>
                              <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 transition-all duration-200"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {wizardStep === 2 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-10 h-10 text-emerald-600 shrink-0" />
                            <div>
                              <h4 className="text-lg sm:text-xl font-bold text-slate-900">
                                Setup Wizard Installer Downloaded!
                              </h4>
                              <p className="text-xs text-emerald-700 font-semibold">
                                Ready to run on your computer • Target Path: {installPath}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                            Open <strong>Barangay-Matatag-Smart-Portal-Setup.exe</strong> from your Downloads folder to launch the native Windows Setup Wizard, confirm your installation directory, and place the official{' '}
                            <strong>Barangay Matatag Seal</strong> shortcut on your Desktop.
                          </p>
                        </div>
                      )}

                      {/* Bottom Setup Wizard Buttons (Back / Next / Download / Cancel — Matches Image 5) */}
                      <div className="pt-5 mt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={handleDesktopDownload}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] px-4 py-2 text-xs font-extrabold text-white shadow-md transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {desktopOs === 'windows'
                            ? 'Download Windows Installer (.EXE)'
                            : desktopOs === 'mac'
                            ? 'Download macOS Installer (.DMG)'
                            : 'Download Linux (.AppImage)'}
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={wizardStep === 0}
                            onClick={() =>
                              setWizardStep((s) => (s > 0 ? ((s - 1) as 0 | 1 | 2) : 0))
                            }
                            className="rounded-md border border-slate-300 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 px-4 py-1.5 text-xs font-semibold text-slate-700"
                          >
                            Back
                          </button>
                          {wizardStep === 0 ? (
                            <button
                              type="button"
                              onClick={() => setWizardStep(1)}
                              className="rounded-md border-2 border-blue-600 bg-white hover:bg-blue-50 px-5 py-1.5 text-xs font-bold text-slate-900"
                            >
                              Next
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleDesktopDownload}
                              className="rounded-md border-2 border-blue-600 bg-blue-600 hover:bg-blue-700 px-5 py-1.5 text-xs font-bold text-white"
                            >
                              {wizardStep === 2 ? 'Download Again' : 'Install / Download .EXE'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-slate-300 bg-white hover:bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================
                ANDROID MOBILE PACKAGE (.APK)
               ========================================================= */}
            {platform === 'android' && (
              <div className="mt-5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      Barangay-Matatag-Smart-Portal.apk (v2.5.0-MATATAG)
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      Package: <code className="font-mono text-blue-700 dark:text-blue-400">ph.gov.lamitan.brgymatatag.portal</code> • Official Barangay Matatag Seal Icon
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    Virus-Scanned &amp; LGU Signed
                  </span>
                </div>

                {installStatus === 'downloading' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300 font-mono">
                      <span>Downloading Barangay-Matatag-Smart-Portal.apk...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-200"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {installStatus === 'installed' && (
                  <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 p-3 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Barangay-Matatag-Smart-Portal.apk</strong> downloaded! Open the package on your Android phone to install the app with the Barangay Matatag Seal.
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      triggerDownloadPackage(
                        '/downloads/Barangay-Matatag-Smart-Portal.apk',
                        'Barangay-Matatag-Smart-Portal.apk'
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] px-5 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md transition"
                  >
                    <Download className="w-4 h-4" />
                    {installStatus === 'installed'
                      ? 'Download Android .APK Again'
                      : 'Download Official Android .APK'}
                  </button>
                </div>
              </div>
            )}

            {/* =========================================================
                iOS / iPHONE & iPAD STANDALONE APP
               ========================================================= */}
            {platform === 'ios' && (
              <div className="mt-5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                    iOS / iPadOS Standalone App Installer (Notch &amp; Dynamic Island Ready)
                  </span>
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Verified LGU Profile
                  </span>
                </div>
                <ol className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                  <li className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      1
                    </span>
                    <span>
                      Tap the <strong>Share</strong> button{' '}
                      <Share className="inline w-4 h-4 text-blue-600 mx-1" /> in your Safari toolbar.
                    </span>
                  </li>
                  <li className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      2
                    </span>
                    <span>
                      Select <strong>"Add to Home Screen"</strong>{' '}
                      <PlusSquare className="inline w-4 h-4 text-amber-600 mx-1" /> to install with the official{' '}
                      <strong>Barangay Matatag Seal</strong> icon.
                    </span>
                  </li>
                  <li className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                      3
                    </span>
                    <span>
                      Launch from your Home Screen for full <strong>edge-to-edge standalone view</strong> with Wireless AirPrint support.
                    </span>
                  </li>
                </ol>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
