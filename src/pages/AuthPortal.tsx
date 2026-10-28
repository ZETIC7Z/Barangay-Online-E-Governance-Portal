import React, { useEffect, useMemo, useState } from 'react';
import {
  LogIn,
  UserPlus,
  ShieldCheck,
  MapPin,
  Camera,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Eye,
  EyeOff,
  FileCheck2,
  Award,
  Clock,
  Printer,
  Lock,
  Search,
  Home,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import {
  SatelliteMapPinpointer,
  PinnedHouseLocation,
  BRGY_MATATAG_HALL_COORDS,
} from '../components/SatelliteMapPinpointer';

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const YEARS = Array.from({ length: 95 }, (_, i) => String(2010 - i));

export const AuthPortal: React.FC<{
  initialMode: 'login' | 'register';
  pendingService?: string | null;
  onAuthSuccess: (authData: any) => void;
  onBackHome: () => void;
  onGoTrack?: () => void;
}> = ({ initialMode, pendingService, onAuthSuccess, onBackHome, onGoTrack }) => {
  const [tab, setTab] = useState<'login' | 'register'>(initialMode);

  useEffect(() => {
    setTab(initialMode);
  }, [initialMode]);

  // Login State
  const [loginUsername, setLoginUsername] = useState(() => {
    return localStorage.getItem('matatag_remembered_user') || '';
  });
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStageText, setLoadingStageText] = useState(
    'Authenticating with Barangay Matatag E-Governance Server...'
  );

  // Modern Birthdate Dropdown State (Month / Day / Year)
  const [birthMonth, setBirthMonth] = useState('06');
  const [birthDay, setBirthDay] = useState('18');
  const [birthYear, setBirthYear] = useState('1996');

  // Registration State
  const [regForm, setRegForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    gender: 'Male',
    birthDate: '1996-06-18',
    civilStatus: 'Single',
    contactNumber: '0917-886-7302',
    email: '',
    username: '',
    password: '',
    purok: 'Purok 1 - Aguinaldo Central',
    street: 'Aguinaldo Street',
    houseNo: 'Pinpointed Residence • Aguinaldo Street',
    yearsOfResidency: 15,
    voterStatus: 'Yes',
    occupation: 'Resident / Professional',
    is4Ps: false,
    isPWD: false,
    isSenior: false,
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sync Month/Day/Year dropdowns into regForm.birthDate & calculate age
  const calculatedAge = useMemo(() => {
    const y = parseInt(birthYear, 10) || 1996;
    const m = parseInt(birthMonth, 10) || 6;
    const d = parseInt(birthDay, 10) || 18;
    const now = new Date(2026, 9, 28);
    let age = now.getFullYear() - y;
    if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) {
      age--;
    }
    return Math.max(1, age);
  }, [birthYear, birthMonth, birthDay]);

  useEffect(() => {
    const formatted = `${birthYear}-${birthMonth}-${birthDay}`;
    setRegForm((prev) => ({
      ...prev,
      birthDate: formatted,
      isSenior: calculatedAge >= 60 ? true : prev.isSenior,
    }));
  }, [birthYear, birthMonth, birthDay, calculatedAge]);

  const passwordsMatch =
    regForm.password.length > 0 &&
    confirmPassword.length > 0 &&
    regForm.password === confirmPassword;

  const passwordsMismatch =
    confirmPassword.length > 0 && regForm.password !== confirmPassword;

  const [pinnedLocation, setPinnedLocation] = useState<PinnedHouseLocation | null>({
    lat: BRGY_MATATAG_HALL_COORDS.lat + 0.00025,
    lng: BRGY_MATATAG_HALL_COORDS.lng + 0.00025,
    lotLabel: 'Pinpointed Residence • Aguinaldo Street, Barangay Matatag',
    street: 'Aguinaldo Street',
    purok: 'Purok 1 - Aguinaldo Central',
    confirmedAt: new Date().toISOString(),
  });
  const [selfieBase64, setSelfieBase64] = useState<string>('');
  const [regError, setRegError] = useState('');

  const handleLogin = async (e?: React.FormEvent, demoUser?: string, demoPass?: string) => {
    if (e) e.preventDefault();
    const u = (demoUser ?? loginUsername).trim();
    const p = demoPass ?? loginPassword;
    if (!u || !p) {
      setLoginError('Please enter your username/email and password.');
      return;
    }
    setLoading(true);
    setLoginError('');
    setLoadingStageText('Verifying Barangay Matatag Credentials...');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        setLoginError(data.error || 'Invalid email/username or password.');
      } else {
        if (rememberMe) {
          localStorage.setItem('matatag_remembered_user', u);
        } else {
          localStorage.removeItem('matatag_remembered_user');
        }
        setLoadingStageText(
          `Welcome, ${data.user?.fullName || u}! Loading Barangay Matatag Workspace...`
        );
        setTimeout(() => {
          setLoading(false);
          onAuthSuccess(data);
        }, 750);
      }
    } catch {
      setLoading(false);
      setLoginError('Network error connecting to Barangay Matatag server.');
    }
  };

  const handleFileToBase64 = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelfieBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) {
      setRegError('Please make sure both password boxes match before submitting.');
      return;
    }
    if (!pinnedLocation) {
      setRegError('Please click on the Barangay Matatag map to pinpoint your house location.');
      return;
    }
    setLoading(true);
    setRegError('');
    setLoadingStageText('Creating Resident Profile & Provisioning Google Drive Vault...');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...regForm,
          pinnedLocation,
          selfieBase64,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        setRegError(data.error || 'Registration failed');
      } else {
        setLoadingStageText('Account Verified! Entering Barangay Matatag Resident Portal...');
        setTimeout(() => {
          setLoading(false);
          onAuthSuccess(data);
        }, 750);
      }
    } catch {
      setLoading(false);
      setRegError('Failed to complete registration.');
    }
  };

  return (
    <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 pb-24">
      {/* FULL-SCREEN BEAUTIFUL LOADING ANIMATION OVERLAY */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-8 text-center shadow-2xl space-y-5">
            <div className="relative mx-auto w-28 h-28 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-slate-800" />
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-rose-600 border-b-amber-500 border-l-transparent animate-spin" />
              <img
                src="/logo.png"
                alt="Barangay Matatag Seal"
                className="w-20 h-20 rounded-full object-contain"
              />
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                BARANGAY MATATAG • LAMITAN CITY
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {loadingStageText}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Syncing encrypted session with Barangay Matatag E-Governance Portal
              </p>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-blue-600 via-rose-600 to-amber-500 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {tab === 'login' ? (
        /* CLEAN SPLIT-CARD SIGN IN PORTAL (MATCHING bryg-residentvercelapp.vercel.app/login) */
        <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl grid grid-cols-1 lg:grid-cols-12">
          {/* Left Official Brand Panel */}
          <div className="auth-brand-panel lg:col-span-5 bg-gradient-to-br from-[#1E3A8A] via-[#1D4ED8] to-[#991B1B] p-8 sm:p-10 text-white flex flex-col justify-between">
            <div className="space-y-6">
              <div className="inline-flex items-center justify-center rounded-2xl bg-white p-2.5 shadow-lg">
                <img
                  src="/logo.png"
                  alt="Barangay Matatag Official Seal"
                  className="w-24 h-24 object-contain"
                />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white leading-tight">
                  Barangay Matatag Streamlined Clearance and Certificate
                </h1>
                <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                  Your one-stop digital portal for barangay clearances, certificates, and community governance under Chairwoman Hon. Hulma G. Abdurahman.
                </p>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm font-medium text-white pt-1">
                <li className="flex items-center gap-3">
                  <FileCheck2 className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Barangay Clearance &amp; Residency</span>
                </li>
                <li className="flex items-center gap-3">
                  <Award className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Indigency &amp; Business Permits</span>
                </li>
                <li className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Real-Time Status Tracking</span>
                </li>
                <li className="flex items-center gap-3">
                  <Printer className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Print Official QR Documents</span>
                </li>
                <li className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Secure &amp; Private E-Gov Vault</span>
                </li>
              </ul>
            </div>

            <div className="pt-8 mt-8 border-t border-white/20 text-[11px] text-blue-100">
              Barangay Matatag, Lamitan City, Basilan • ZIP 7302 (BARMM)
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-7 p-8 sm:p-10 bg-white dark:bg-slate-900 flex flex-col justify-center">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white">
                  Welcome Back
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Sign in to your account or register as a new resident.
                </p>
              </div>

              {pendingService && (
                <div className="rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-4 py-3 text-xs text-blue-800 dark:text-blue-200 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Please sign in to proceed with: <strong>{pendingService}</strong>
                  </span>
                </div>
              )}

              {/* Segmented Sign In / Register Switcher (matching bryg-residentvercelapp.vercel.app/login) */}
              <div className="grid grid-cols-2 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] text-white py-2.5 text-xs sm:text-sm font-bold shadow-sm transition"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className="flex items-center justify-center gap-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 py-2.5 text-xs sm:text-sm font-semibold transition"
                >
                  <UserPlus className="w-4 h-4" />
                  Register
                </button>
              </div>

              {loginError && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-700 p-3.5 text-xs font-medium text-rose-700 dark:text-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    Username or Email
                  </label>
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Enter your username or email"
                    className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 pl-4 pr-11 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                    />
                    <button
                      type="button"
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowLoginPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white p-1"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginUsername('resident@gmail.com');
                      setLoginPassword('resident@2026');
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white py-3.5 text-sm font-bold shadow-md transition"
                >
                  <LogIn className="w-4 h-4" />
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>

              {/* Quick 1-Click Demo Login Buttons */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Instant 1-Click Demo Portal Access:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginUsername('admin@test.com');
                      setLoginPassword('admin@2026');
                      handleLogin(undefined, 'admin@test.com', 'admin@2026');
                    }}
                    className="rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 p-2.5 text-left transition"
                  >
                    <div className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-300">
                      ADMINISTRATOR DEMO
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      admin@test.com
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">pw: admin@2026</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginUsername('resident@gmail.com');
                      setLoginPassword('resident@2026');
                      handleLogin(undefined, 'resident@gmail.com', 'resident@2026');
                    }}
                    className="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 p-2.5 text-left transition"
                  >
                    <div className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
                      RESIDENT DEMO
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      resident@gmail.com
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">pw: resident@2026</div>
                  </button>
                </div>
              </div>

              {/* Bottom Navigation Links (matching bryg-residentvercelapp.vercel.app/login) */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (onGoTrack) onGoTrack();
                    else onBackHome();
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                >
                  <Search className="w-3.5 h-3.5 text-blue-600" />
                  Track Request Status
                </button>
                <button
                  type="button"
                  onClick={onBackHome}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                >
                  <Home className="w-3.5 h-3.5 text-slate-600" />
                  Back to Homepage
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* CLEAN MODERN RESIDENT REGISTRATION WITH MONTH/DAY/YEAR BIRTHDATE, 2 PASSWORD MATCH BOXES & CLICK-ANYWHERE MAP */
        <form
          onSubmit={handleRegister}
          className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-10 space-y-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-4">
              <img
                src="/logo.png"
                alt="Barangay Matatag Seal"
                className="w-20 h-20 object-contain shrink-0"
              />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  BARANGAY MATATAG • LAMITAN CITY, BASILAN (7302)
                </span>
                <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white">
                  Resident Registration &amp; Map House Pinpointing
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                  Complete your resident profile and click directly on the Barangay Matatag map to pinpoint your house location.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setTab('login')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 transition"
              >
                <LogIn className="w-4 h-4 text-blue-600" />
                Already Have an Account? Sign In
              </button>
              <button
                type="button"
                onClick={onBackHome}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Home
              </button>
            </div>
          </div>

          {regError && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-600 p-4 text-xs font-semibold text-rose-700 dark:text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{regError}</span>
            </div>
          )}

          {/* STEP 1: Personal & Demographic Information */}
          <div className="space-y-5">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-[11px]">
                01
              </span>
              <span>STEP 01 • PERSONAL &amp; HOUSEHOLD CENSUS DETAILS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Datu Khalid"
                  value={regForm.firstName}
                  onChange={(e) => setRegForm({ ...regForm, firstName: e.target.value })}
                  className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Middle Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ausalin"
                  value={regForm.middleName}
                  onChange={(e) => setRegForm({ ...regForm, middleName: e.target.value })}
                  className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cuevas"
                  value={regForm.lastName}
                  onChange={(e) => setRegForm({ ...regForm, lastName: e.target.value })}
                  className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Gender, Modern Month/Day/Year Birthdate Dropdowns, Civil Status, Mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Gender
                </label>
                <select
                  value={regForm.gender}
                  onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                  className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* Modern Birthdate with Month, Day, and Year Dropdowns */}
              <div className="lg:col-span-5">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Birthdate (Month • Day • Year) *</span>
                  </label>
                  <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:text-blue-300">
                    Age: {calculatedAge} yrs
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    aria-label="Birth Month"
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-white"
                  >
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Birth Day"
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-white"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        Day {parseInt(d, 10)}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Birth Year"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-white"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Civil Status
                </label>
                <select
                  value={regForm.civilStatus}
                  onChange={(e) => setRegForm({ ...regForm, civilStatus: e.target.value })}
                  className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widow">Widow / Widower</option>
                </select>
              </div>

              <div className="lg:col-span-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  value={regForm.contactNumber}
                  onChange={(e) => setRegForm({ ...regForm, contactNumber: e.target.value })}
                  className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-1 text-xs font-medium text-slate-700 dark:text-slate-200">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={regForm.is4Ps}
                  onChange={(e) => setRegForm({ ...regForm, is4Ps: e.target.checked })}
                  className="h-4 w-4 rounded accent-blue-600"
                />
                <span>4Ps Beneficiary Household</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={regForm.isPWD}
                  onChange={(e) => setRegForm({ ...regForm, isPWD: e.target.checked })}
                  className="h-4 w-4 rounded accent-blue-600"
                />
                <span>Person with Disability (PWD)</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={regForm.isSenior}
                  onChange={(e) => setRegForm({ ...regForm, isSenior: e.target.checked })}
                  className="h-4 w-4 rounded accent-blue-600"
                />
                <span>Senior Citizen (60+)</span>
              </label>
            </div>
          </div>

          {/* STEP 2: Click-Anywhere Map Pinpointing of Resident's House */}
          <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-[11px]">
                  02
                </span>
                <span>STEP 02 • CLICK ON THE BARANGAY MATATAG MAP TO PINPOINT YOUR HOUSE</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Locate the official <strong>Barangay Matatag Hall</strong> marker and click anywhere on the map where your house is located to pinpoint and confirm your residence coordinates.
              </p>
            </div>

            <SatelliteMapPinpointer
              mode="signup"
              selectedLocation={pinnedLocation}
              onConfirmLocation={(loc) => {
                setPinnedLocation(loc);
                setRegForm((prev) => ({
                  ...prev,
                  purok: loc.purok,
                  street: loc.street,
                  houseNo: loc.lotLabel,
                }));
              }}
            />
          </div>

          {/* STEP 3: Account Credentials with 2 Password Boxes, Show/Hide Eye & Green Match Indicator */}
          <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-[11px]">
                  03
                </span>
                <span>STEP 03 • ACCOUNT CREDENTIALS &amp; PASSWORD VERIFICATION</span>
              </div>

              {passwordsMatch && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-400 px-3 py-1 text-xs font-extrabold text-emerald-800 dark:text-emerald-300 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>✓ Passwords Match!</span>
                </div>
              )}
              {passwordsMismatch && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 dark:bg-rose-950/80 border border-rose-300 px-3 py-1 text-xs font-bold text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Passwords do not match yet</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@gmail.com"
                  value={regForm.email}
                  onChange={(e) =>
                    setRegForm({ ...regForm, email: e.target.value, username: e.target.value })
                  }
                  className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
                />
              </div>

              {/* Password Box 1 with Show/Hide Eye */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password"
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    className={`w-full rounded-xl pl-3.5 pr-10 py-2.5 text-sm transition ${
                      passwordsMatch
                        ? 'input-match-green border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold'
                        : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                    }`}
                  />
                  <button
                    type="button"
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowRegPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:text-slate-400 p-1"
                  >
                    {showRegPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Box 2 (Confirm Password) with Show/Hide Eye & Green Match State */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full rounded-xl pl-3.5 pr-10 py-2.5 text-sm transition ${
                      passwordsMatch
                        ? 'input-match-green border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold'
                        : passwordsMismatch
                        ? 'border-2 border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
                        : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                    }`}
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:text-slate-400 p-1"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {passwordsMatch && (
                  <p className="mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Password Confirmed &amp; Matched
                  </p>
                )}
              </div>

              {/* Optional KYC ID Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Valid ID / Selfie (Google Drive Vault)
                </label>
                <label className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 border border-dashed border-blue-400 px-3 py-2.5 text-xs font-semibold text-blue-700 dark:text-blue-300 cursor-pointer transition">
                  <Camera className="w-4 h-4" />
                  <span>{selfieBase64 ? '✅ ID Attached' : 'Upload Valid ID'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileToBase64(f);
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>
                Auto-provisions Google Drive folder:{' '}
                <code className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  /GoogleDrive_Vault/{(regForm.firstName || 'Resident') + '_' + (regForm.lastName || 'Matatag')}/
                </code>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition"
            >
              <CheckCircle2 className="w-5 h-5" />
              {loading ? 'Registering Resident...' : 'Complete Registration & Enter Portal'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
