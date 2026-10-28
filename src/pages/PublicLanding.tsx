import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileCheck2,
  Search,
  ShieldCheck,
  Home,
  HeartHandshake,
  Store,
  Scale,
  IdCard,
  Users,
  Zap,
  CheckCircle2,
  Clock,
  Printer,
  MapPin,
  PhoneCall,
  ThumbsUp,
  MessageSquare,
  Download,
  Award,
  Compass,
  ArrowRight,
  X,
  Briefcase,
  Gavel,
  PackageCheck,
  FileText,
} from 'lucide-react';
import { SatelliteMapPinpointer } from '../components/SatelliteMapPinpointer';
import { EventsCarousel } from '../components/EventsCarousel';

const ICON_MAP: Record<string, any> = {
  ShieldCheck,
  Home,
  HeartHandshake,
  Store,
  Scale,
  IdCard,
  Users,
  Zap,
  Briefcase,
  Gavel,
  PackageCheck,
  FileText,
};

// Complete Core Barangay Services (matching bryg-residentvercelapp.vercel.app + Certificate types)
const CORE_BARANGAY_SERVICES = [
  {
    id: 'SRV-CLEARANCE',
    code: 'BRGY-CLR',
    name: 'Barangay Clearances',
    category: 'Official Clearance',
    icon: 'ShieldCheck',
    actionLabel: 'File Request',
    description:
      'Issuance of official barangay documents, including Barangay Clearance, Certificate of Indigency, and Certificate of Residency for residents.',
    requirements: 'Valid Government ID or Cedula & Purok Verification',
    processingDays: 'Instant Online Processing',
  },
  {
    id: 'SRV-BUSINESS',
    code: 'BUS-PERMIT',
    name: 'Business Clearance',
    category: 'Commercial Permit',
    icon: 'Briefcase',
    actionLabel: 'File Request',
    description:
      'Applications and renewals of Barangay Business Clearances for local businesses, shops, and establishments operating within Barangay Matatag.',
    requirements: 'DTI / SEC Registration & Store Location in Barangay Matatag',
    processingDays: 'Same-Day EODB Release',
  },
  {
    id: 'SRV-INDIGENCY',
    code: 'CERT-IND',
    name: 'Certificate of Indigency',
    category: 'Social Welfare',
    icon: 'HeartHandshake',
    actionLabel: 'File Request',
    description:
      'Official certification for medical assistance, DSWD AICS, PhilHealth, legal aid, and educational scholarship programs for Barangay Matatag residents.',
    requirements: 'Resident Profile & Purpose of Assistance',
    processingDays: 'Instant Online Processing',
  },
  {
    id: 'SRV-RESIDENCY',
    code: 'CERT-RES',
    name: 'Certificate of Residency',
    category: 'Civil Registry',
    icon: 'Home',
    actionLabel: 'File Request',
    description:
      'Proof of bona fide residence in Puroks 1–7 of Barangay Matatag, Lamitan City for employment, school enrollment, and banking requirements.',
    requirements: 'Verified House Pinpoint on Barangay Matatag Map',
    processingDays: 'Instant Online Processing',
  },
  {
    id: 'SRV-BLOTTER',
    code: 'KP-BLOTTER',
    name: 'Blotters',
    category: 'Peace & Order',
    icon: 'FileText',
    actionLabel: 'File Blotter',
    description:
      'Record of incidents, complaints, or community disputes reported to Barangay Matatag for proper documentation, mediation, and resolution.',
    requirements: 'Incident Details, Date/Time & Parties Involved',
    processingDays: '24/7 Lupon & BPAT Desk',
  },
  {
    id: 'SRV-SUMMONS',
    code: 'KP-SUMMONS',
    name: 'Summons',
    category: 'Katarungang Pambarangay',
    icon: 'Gavel',
    actionLabel: 'Access Portal',
    description:
      'Generation, issuance, and tracking of barangay summons and subpoenas requiring involved parties to appear for mediation or hearings.',
    requirements: 'Registered Resident Account',
    processingDays: 'Lupon Tagapamayapa Schedule',
  },
  {
    id: 'SRV-BORROW',
    code: 'BRGY-BORROW',
    name: 'Borrow Equipment',
    category: 'Community Resources',
    icon: 'PackageCheck',
    actionLabel: 'Reserve Equipment',
    description:
      'Request and reservation of barangay-owned equipment and facilities (tents, chairs, tables, PA system) for community events or personal use.',
    requirements: 'Resident Account & Event Schedule',
    processingDays: 'Subject to Availability',
  },
  {
    id: 'SRV-JOBSEEKER',
    code: 'RA-11261',
    name: 'First-Time Jobseeker (RA 11261)',
    category: 'Youth & Employment',
    icon: 'Award',
    actionLabel: 'File Request',
    description:
      'Official Oath of Undertaking and Barangay Certification under R.A. 11261 for first-time jobseekers residing in Barangay Matatag.',
    requirements: 'Valid ID & Oath of Undertaking',
    processingDays: 'Instant Online Processing',
  },
];

// Official Barangay Matatag officials (DILG Barangay Officials listing).
// Only the Punong Barangay has a verified photo; others display the official Barangay seal.
const DEFAULT_MATATAG_OFFICIALS = [
  { id: 'OFF-001', name: 'Hon. Hulma G. Abdurahman', position: 'Punong Barangay', chairmanship: 'Punong Barangay, Barangay Matatag', photo: '/officials/off-1.jpg', email: '' },
  { id: 'OFF-002', name: 'Hon. Benhar A. Jubail', position: 'Sangguniang Barangay Member', chairmanship: 'Barangay Kagawad', photo: '/logo.png', email: '' },
  { id: 'OFF-003', name: 'Hon. Diding M. Sabtula', position: 'Sangguniang Barangay Member', chairmanship: 'Barangay Kagawad', photo: '/logo.png', email: '' },
  { id: 'OFF-004', name: 'Hon. Nawaf U. Jainuddin', position: 'Sangguniang Barangay Member', chairmanship: 'Barangay Kagawad', photo: '/logo.png', email: '' },
  { id: 'OFF-005', name: 'Hon. Adnin M. Mistiri', position: 'Sangguniang Barangay Member', chairmanship: 'Barangay Kagawad', photo: '/logo.png', email: '' },
  { id: 'OFF-006', name: 'Hon. Juriya T. Ahmad', position: 'Sangguniang Barangay Member', chairmanship: 'Barangay Kagawad', photo: '/logo.png', email: '' },
  { id: 'OFF-007', name: 'Hon. Editha T. Abdulgapar', position: 'Sangguniang Barangay Member', chairmanship: 'Barangay Kagawad', photo: '/logo.png', email: '' },
  { id: 'OFF-008', name: 'Hon. Suraya S. Espiritu', position: 'Sangguniang Barangay Member', chairmanship: 'Barangay Kagawad', photo: '/logo.png', email: '' },
  { id: 'OFF-009', name: 'Hon. Kimar T. Abdulgapar', position: 'SK Chairperson', chairmanship: 'Sangguniang Kabataan, Barangay Matatag', photo: '/logo.png', email: 'kimarabdulgapar714@gmail.com' },
  { id: 'OFF-010', name: 'Taifa A. Mohammad', position: 'Barangay Secretary', chairmanship: 'Office of the Barangay Secretary', photo: '/logo.png', email: '' },
];

const isSealPhoto = (photo?: string) => !photo || photo === '/logo.png';

export const PublicLanding: React.FC<{
  bootstrap: any;
  user: any | null;
  onNavigate: (view: string, serviceName?: string) => void;
  onOpenDownloadApp: () => void;
  onPrintDocument: (item: any, type: 'certificate' | 'subpoena') => void;
  onRefreshData: () => void;
}> = ({
  bootstrap,
  user,
  onNavigate,
  onOpenDownloadApp,
  onPrintDocument,
  onRefreshData,
}) => {
  const bulletins = bootstrap?.bulletins || [];
  const rawOfficials =
    bootstrap?.officials && bootstrap.officials.length >= 10
      ? bootstrap.officials
      : DEFAULT_MATATAG_OFFICIALS;

  const officials = rawOfficials.map((off: any) => ({
    ...off,
    photo: off.photo || off.avatarUrl || '/logo.png',
  }));

  // Zero-Login Real-Time Tracker State
  const [trackCode, setTrackCode] = useState('MTG-2026-8842');
  const [trackedRequest, setTrackedRequest] = useState<any | null>(null);
  const [trackError, setTrackError] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);

  // Interactive Request Form Modal State (when user IS logged in)
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [reqForm, setReqForm] = useState({
    residentName: user?.fullName || 'Amir K. Kalun',
    contactNumber: user?.contactNumber || '0917-542-1886',
    purok: user?.purok || 'Purok 1 - Aguinaldo Central',
    purpose: '',
    paymentMethod: 'Cash at Brgy Hall',
    businessName: '',
    businessOwner1: '',
    businessNature: '',
    businessAddress: 'Aguinaldo St., Purok 1, Brgy. Matatag, Lamitan City',
  });
  const [createdReqResult, setCreatedReqResult] = useState<any | null>(null);
  const [submittingReq, setSubmittingReq] = useState(false);

  // Handle clicking any Document Service card (matching bryg-residentvercelapp.vercel.app/login)
  const handleServiceCardClick = (srv: any) => {
    if (!user) {
      // If not logged in, route directly to Sign In portal with service name remembered!
      onNavigate('login', srv.name);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // If logged in as Admin, go to Admin Dashboard
    if (user.role?.toLowerCase() === 'admin') {
      onNavigate('admin-dashboard', srv.name);
      return;
    }
    // If logged in as Resident, open the interactive request modal right away (or route to Resident Dashboard)
    setSelectedService(srv);
    setCreatedReqResult(null);
  };

  const handleTrackSearch = async (e?: React.FormEvent, overrideCode?: string) => {
    if (e) e.preventDefault();
    const code = (overrideCode ?? trackCode).trim();
    if (!code) return;
    setTrackLoading(true);
    setTrackError('');
    try {
      const res = await fetch(`/api/track/${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok) {
        setTrackedRequest(null);
        setTrackError(data.error || 'Reference code not found.');
      } else {
        setTrackedRequest(data.request);
      }
    } catch {
      setTrackError('Unable to reach tracking server.');
    } finally {
      setTrackLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    setSubmittingReq(true);
    try {
      const isBusiness = selectedService.code === 'BUS-PERMIT';
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          residentId: user?.residentId || 'RES-MTG-001',
          residentName: reqForm.residentName || user?.fullName || 'Amir K. Kalun',
          contactNumber: reqForm.contactNumber,
          purok: reqForm.purok,
          certificateId: selectedService.id,
          documentType: selectedService.name,
          purpose: reqForm.purpose || `Official ${selectedService.name} Application`,
          paymentMethod: reqForm.paymentMethod,
          businessDetails: isBusiness
            ? {
                businessName: reqForm.businessName || 'Matatag Enterprise',
                businessOwner1: reqForm.businessOwner1 || reqForm.residentName,
                businessNature: reqForm.businessNature || 'General Merchandise',
                businessAddress: reqForm.businessAddress,
              }
            : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.request) {
        setCreatedReqResult(data.request);
        setTrackCode(data.request.trackingNumber);
        setTrackedRequest(data.request);
        onRefreshData();
      }
    } finally {
      setSubmittingReq(false);
    }
  };

  const handleReactBulletin = async (id: string, type: 'like' | 'helpful') => {
    await fetch(`/api/bulletins/${id}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
    onRefreshData();
  };

  const stages = [
    { step: 1, title: 'Submitted', desc: 'Online Application & Reference Issued' },
    { step: 2, title: 'Secretary Verification', desc: 'Residency, Purok & KYC Check' },
    { step: 3, title: 'Punong Barangay Signature', desc: 'Cryptographic Digital Seal' },
    { step: 4, title: 'Ready for Claim / QR PDF', desc: 'Instant Printable QR Release' },
  ];

  const chairwoman = officials[0] || DEFAULT_MATATAG_OFFICIALS[0];
  const councilMembers = officials.slice(1);

  return (
    <div className="relative z-10">
      {/* ==========================================
          1. HERO SECTION (Clean Light/Dark Mode + BIGGER Official Barangay Matatag Seal)
      ========================================== */}
      <section className="relative pt-8 pb-16 sm:pt-12 sm:pb-20 overflow-hidden">
        <div className="mx-auto max-w-[1520px] px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Hero Copy & Clean Simple CTAs */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 px-4 py-1.5 shadow-sm"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-[#1D4ED8]" />
                <span className="text-xs font-extrabold tracking-wider uppercase text-[#1D4ED8] dark:text-blue-400">
                  BARANGAY MATATAG • LAMITAN CITY, BASILAN
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="font-display font-extrabold text-4xl sm:text-5xl xl:text-6xl tracking-tight leading-[1.08] text-slate-900 dark:text-white"
              >
                Modern Digital Services for Residents
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
              >
                Request certificates, submit applications, track requests, and receive announcements online — led by{' '}
                <strong className="text-slate-900 dark:text-white">
                  Chairwoman Hon. Hulma G. Abdurahman
                </strong>{' '}
                and the Sangguniang Barangay of Matatag.
              </motion.p>

              {/* Simple, Clean Rectangular Buttons matching bryg-residentvercelapp.vercel.app */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      onNavigate('login', 'Barangay Clearances & Certifications');
                    } else {
                      document
                        .getElementById('services-section')
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="inline-flex items-center gap-2.5 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white px-6 py-3.5 text-sm font-bold shadow-md transition"
                >
                  <FileCheck2 className="w-4 h-4" />
                  Request Certifications
                </button>

                <button
                  type="button"
                  onClick={() => {
                    document
                      .getElementById('tracker-section')
                      ?.scrollIntoView({ behavior: 'smooth' });
                    handleTrackSearch(undefined, 'MTG-2026-8842');
                  }}
                  className="inline-flex items-center gap-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 px-6 py-3.5 text-sm font-bold shadow-sm transition"
                >
                  <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Track Request
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('register')}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white px-5 py-3.5 text-sm font-bold shadow-md transition"
                >
                  <MapPin className="w-4 h-4" />
                  Pinpoint House on Map
                </button>
              </motion.div>

              {/* Quick Live Telemetry Pills */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-3 gap-3.5 pt-4 max-w-xl mx-auto lg:mx-0"
              >
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-t-[3px] border-t-[#1D4ED8] p-3.5 text-left shadow-sm">
                  <div className="text-[11px] font-bold uppercase text-[#1D4ED8] dark:text-blue-400">
                    POPULATION
                  </div>
                  <div className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 dark:text-white mt-0.5">
                    2,854+
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Residents • 7 Puroks</div>
                </div>
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-t-[3px] border-t-[#B91C1C] p-3.5 text-left shadow-sm">
                  <div className="text-[11px] font-bold uppercase text-[#B91C1C] dark:text-rose-400">
                    EODB RELEASE
                  </div>
                  <div className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 dark:text-white mt-0.5">
                    15 Min
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">QR Digital Release</div>
                </div>
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-t-[3px] border-t-[#D97706] p-3.5 text-left shadow-sm">
                  <div className="text-[11px] font-bold uppercase text-[#D97706] dark:text-amber-400">
                    LGU LAMITAN
                  </div>
                  <div className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 dark:text-white mt-0.5">
                    ZIP 7302
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Aguinaldo St., Basilan</div>
                </div>
              </motion.div>
            </div>

            {/* Right Column: ENLARGED Official Barangay Matatag Seal Showcase (Image 3 Refinement) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-5 flex flex-col items-center justify-center"
            >
              <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-t-4 border-t-[#1D4ED8] p-6 sm:p-8 text-center shadow-xl">
                {/* Enlarged Official Seal (260px - 285px, No dark clipping circle) */}
                <div className="mx-auto w-[250px] h-[250px] sm:w-[280px] sm:h-[280px] flex items-center justify-center p-1">
                  <img
                    src="/logo.png"
                    alt="Official Barangay Matatag Seal"
                    className="w-full h-full object-contain drop-shadow-md transition-transform duration-500 hover:scale-105"
                  />
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-3.5 py-1 text-[11px] font-extrabold text-[#1D4ED8] dark:text-blue-300">
                    <ShieldCheck className="w-3.5 h-3.5" /> OFFICIAL SEAL OF BARANGAY MATATAG
                  </div>
                  <h2 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 dark:text-white">
                    Lamitan City, Basilan Province
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Punong Barangay:{' '}
                    <span className="text-[#1D4ED8] dark:text-blue-400 font-extrabold">
                      Hon. Hulma G. Abdurahman
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Aguinaldo St., Poblacion • Coordinates: 6.6600° N, 122.1377° E
                  </p>
                </div>

                {/* Quick Portal Access Buttons */}
                <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2.5 text-left">
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 p-3 transition"
                  >
                    <div className="text-[10px] uppercase text-[#1D4ED8] dark:text-blue-300 font-extrabold">
                      ADMIN PANEL LOGIN
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                      admin@test.com
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 p-3 transition"
                  >
                    <div className="text-[10px] uppercase text-emerald-700 dark:text-emerald-300 font-extrabold">
                      RESIDENT PORTAL
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                      resident@gmail.com
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==========================================
          2. DOCUMENT SERVICES SECTION (NO PRICE BADGES • ROUTES TO /LOGIN WHEN NOT SIGNED IN)
      ========================================== */}
      <motion.section
        id="services-section"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="py-16 relative"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-2">
              ONLINE E-GOVERNANCE SERVICES
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white">
              Document Services
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2">
              Request official barangay certificates, file incident blotters, check summons, and reserve barangay equipment completely online. Fast processing with digital logs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CORE_BARANGAY_SERVICES.map((srv, idx) => {
              const IconComp = ICON_MAP[srv.icon] || ShieldCheck;
              return (
                <motion.div
                  key={srv.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  onClick={() => handleServiceCardClick(srv)}
                  className="cursor-pointer rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 p-6 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-200 group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-[#1D4ED8] dark:text-blue-400 group-hover:bg-[#1D4ED8] group-hover:text-white transition-colors">
                        <IconComp className="w-6 h-6" />
                      </div>
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        {srv.category}
                      </span>
                    </div>

                    <h3 className="text-lg font-display font-extrabold text-slate-900 dark:text-white group-hover:text-[#1D4ED8] dark:group-hover:text-blue-400 transition-colors">
                      {srv.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                      {srv.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-extrabold text-[#1D4ED8] dark:text-blue-400">
                    <span>{srv.actionLabel}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* ==========================================
          3. ZERO-LOGIN PUBLIC APPLICATION TRACKER (4-Stage Progress Stepper)
      ========================================== */}
      <motion.section
        id="tracker-section"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="py-14 relative"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-t-4 border-t-[#1D4ED8] p-6 sm:p-10 shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
                  <Clock className="w-3.5 h-3.5" /> ZERO-LOGIN REAL-TIME TRACKING
                </div>
                <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white">
                  Zero Login Public Tracking
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Monitor your filed document requests in real-time. Simply enter your{' '}
                  <strong className="text-blue-700 dark:text-blue-300">MTG-2026-XXXX</strong> reference or unique{' '}
                  <strong className="text-emerald-700 dark:text-emerald-300">10-character code</strong> to visually track approval and printing milestones.
                </p>

                <ul className="space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Live timeline checklist milestones</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>View official receipt &amp; verification logs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Receive immediate staff notice messages</span>
                  </li>
                </ul>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-semibold text-slate-500">Demo Tracking Codes:</span>
                  {['MTG-2026-8842', 'MTG-2026-1028', 'MTG-2026-4519'].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => {
                        setTrackCode(sample);
                        handleTrackSearch(undefined, sample);
                      }}
                      className="rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-xs font-mono font-bold text-blue-700 dark:text-blue-300 transition"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-7 space-y-5">
                <form onSubmit={handleTrackSearch} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={trackCode}
                    onChange={(e) => setTrackCode(e.target.value)}
                    placeholder="e.g. MTG-2026-8842"
                    className="flex-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-4 py-3.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white px-6 py-3.5 text-sm font-bold shadow-md transition"
                  >
                    <Search className="w-4 h-4" />
                    {trackLoading ? 'Checking...' : 'Track Application'}
                  </button>
                </form>

                {trackError && (
                  <div className="rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-700 p-4 text-xs font-semibold text-rose-700 dark:text-rose-200">
                    {trackError}
                  </div>
                )}

                {trackedRequest && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-5 space-y-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-blue-700 dark:text-blue-400">
                            {trackedRequest.trackingNumber}
                          </span>
                          <span className="rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-0.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            10-Char: {trackedRequest.shortCode}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                          {trackedRequest.documentType} — {trackedRequest.residentName}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {trackedRequest.purpose}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          {trackedRequest.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => onPrintDocument(trackedRequest, 'certificate')}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white px-3.5 py-2 text-xs font-bold shadow-sm transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          View / Print QR PDF
                        </button>
                      </div>
                    </div>

                    {/* 4-Stage Progress Stepper */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      {stages.map((st) => {
                        const completed = trackedRequest.stage >= st.step;
                        const isCurrent = trackedRequest.stage === st.step;
                        return (
                          <div
                            key={st.step}
                            className={`rounded-xl p-3 border transition ${
                              completed
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-white'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                            } ${isCurrent ? 'ring-2 ring-blue-600' : ''}`}
                          >
                            <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                              <span>STAGE 0{st.step}</span>
                              {completed && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                            </div>
                            <div className="text-xs font-bold">{st.title}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {st.desc}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                      <span>
                        <strong>Staff Remarks:</strong> {trackedRequest.remarks}
                      </span>
                      <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                        O.R. #: {trackedRequest.orNumber} ({trackedRequest.paymentStatus})
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ==========================================
          4. INTERACTIVE SATELLITE MAP OF BARANGAY MATATAG (ACCURATE BRGY HALL + CLICK ANYWHERE)
      ========================================== */}
      <motion.section
        id="map-section"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="py-12 relative"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400">
                SATELLITE GIS HOUSE PINPOINTING • AGUINALDO ST. POBLACION
              </div>
              <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white mt-1">
                Barangay Matatag Satellite Map
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                View the official Barangay Matatag Hall location and click anywhere on the map to pinpoint your house location.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('register')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white px-5 py-3 text-sm font-bold shadow-md transition"
            >
              <Compass className="w-4 h-4" />
              Register &amp; Pinpoint My House
            </button>
          </div>

          <SatelliteMapPinpointer
            mode="public"
            residents={[]}
            emergencies={[]}
            onConfirmLocation={() => onNavigate('register')}
          />
        </div>
      </motion.section>

      {/* ==========================================
          5. EVENTS & ACTIVITIES (Tilted auto-looping carousel)
      ========================================== */}
      <EventsCarousel />

      {/* ==========================================
          6. SANGGUNIANG BARANGAY OF MATATAG ROSTER (DILG OFFICIAL LIST)
      ========================================== */}
      <motion.section
        id="officials-section"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="py-16 relative"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-2">
              BARANGAY OFFICIALS OF MATATAG
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white">
              Sangguniang Barangay of Matatag
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2">
              Committed public servants of Barangay Matatag, Lamitan City, Basilan Province delivering transparent, responsive local governance.
            </p>
          </div>

          {/* Featured Punong Barangay / Chairwoman Card — Optimized for Mobile & Desktop */}
          <div className="mx-auto max-w-3xl mb-8">
            <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-blue-600 p-5 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center gap-5 sm:gap-6 text-center sm:text-left">
              <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-4 border-blue-100 dark:border-blue-900 shadow-lg shrink-0 bg-emerald-950">
                <img
                  src={chairwoman.photo}
                  alt={chairwoman.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1D4ED8] text-white px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" /> {chairwoman.position}
                </span>
                <h3 className="text-xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white">
                  {chairwoman.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {chairwoman.chairmanship}
                </p>
                <div className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                  Barangay Matatag Hall • Aguinaldo St., Poblacion, Lamitan City, Basilan 7302 (6.6600° N, 122.1377° E)
                </div>
              </div>
            </div>
          </div>

          {/* Sangguniang Barangay Members, SK Chairperson & Barangay Secretary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {councilMembers.map((off: any, idx: number) => (
              <motion.div
                key={off.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.04 }}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 p-5 flex flex-col items-center text-center shadow-sm hover:shadow-lg transition"
              >
                <img
                  src={off.photo}
                  alt={isSealPhoto(off.photo) ? `${off.name} — Barangay Matatag seal` : off.name}
                  className={`w-24 h-24 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-md mb-3.5 ${
                    isSealPhoto(off.photo)
                      ? 'object-contain p-2 bg-slate-50 dark:bg-slate-800'
                      : 'object-cover object-top'
                  }`}
                />
                <span className="inline-block rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 px-3 py-0.5 text-[11px] font-extrabold text-blue-700 dark:text-blue-300">
                  {off.position}
                </span>
                <h4 className="text-base font-display font-extrabold text-slate-900 dark:text-white mt-2">
                  {off.name}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {off.chairmanship}
                </p>
                {off.email && (
                  <a
                    href={`mailto:${off.email}`}
                    className="mt-1.5 text-[11px] font-semibold text-blue-700 dark:text-blue-400 hover:underline break-all"
                  >
                    {off.email}
                  </a>
                )}
              </motion.div>
            ))}
          </div>
          <p className="mt-6 text-center text-[11px] text-slate-500 dark:text-slate-400">
            Official roster based on the DILG Barangay Officials listing for Barangay Matatag, Lamitan City.
          </p>
        </div>
      </motion.section>

      {/* ==========================================
          6. DIGITAL BULLETINS & REAL-TIME ANNOUNCEMENTS
      ========================================== */}
      <motion.section
        id="announcements-section"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="py-14 relative"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-2">
              LIVE BARANGAY BROADCASTS &amp; ADVISORIES
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white">
              Announcements &amp; Advisories
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2">
              Stay up to date with official programs, medical missions, clean-up drives, and weather advisories from the Barangay Matatag administration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {bulletins.map((b: any) => (
              <div
                key={b.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 px-3 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                      {b.category}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                      {b.publishedDate}
                    </span>
                  </div>
                  <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">
                    {b.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
                    {b.content}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Posted by:{' '}
                    <strong className="text-slate-800 dark:text-slate-200">{b.postedBy}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleReactBulletin(b.id, 'like')}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 text-blue-600" />
                        <span>{b.likes}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReactBulletin(b.id, 'helpful')}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Helpful ({b.helpful})</span>
                      </button>
                    </div>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" /> {b.comments?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ==========================================
          7. HISTORY OF BARANGAY MATATAG & THE LEGACY OF DATU KALUN (1886)
      ========================================== */}
      <motion.section
        id="history-section"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="py-16 relative"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-3.5 py-1 text-xs font-bold text-amber-800 dark:text-amber-300 mb-2">
              <Award className="w-4 h-4 text-amber-600" /> OFFICIAL HISTORICAL &amp; CULTURAL ARCHIVE
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white">
              History of Barangay Matatag &amp; Datu Kalun (1886)
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2">
              Rooted in the pre-colonial and 19th-century coastal trade of Basilan Island and the historic founding of Lamitan in June 1886.
            </p>
          </div>

          {/* CHAPTER I: ACTUAL HISTORY OF BARANGAY MATATAG (WITH FULL UNCROPPED IMAGE 2) */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-md grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6">
              <div className="rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-slate-950 shadow-lg">
                <img
                  src="/history/brgy-matatag-history.jpg"
                  alt="Early Coastal Settlers & Outrigger Vintas of Lamitan, Basilan — History of Barangay Matatag"
                  className="w-full h-auto object-contain block"
                />
                <div className="px-4 py-2.5 bg-slate-900 text-amber-200 text-[11px] font-medium flex items-center justify-between">
                  <span>📜 Early Coastal &amp; Poblacion Settlement of Lamitan, Basilan</span>
                  <span className="font-mono text-amber-400">Archival Plate I</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                CHAPTER I • BARANGAY MATATAG, LAMITAN CITY
              </div>
              <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white leading-tight">
                The History of Barangay Matatag: Heart of Lamitan’s Poblacion
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                Long before modern roads connected the interior of Basilan Island, the northeastern shoreline and fertile plains of <strong>Lamitan</strong> served as a vital meeting ground where indigenous <strong>Yakan</strong> weavers and agriculturists traded with maritime <strong>Tausug</strong>, <strong>Samal</strong>, and <strong>Chavacano</strong> families arriving aboard traditional outrigger <em>vintas</em> and sailboats.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                As the historic <em>Poblacion</em> (town center) expanded around the civic grid of <strong>Aguinaldo Street, Quezon Boulevard, P. Cuevas Street, Rizal Avenue, and Patikul Street</strong>, the district was officially organized as <strong>Barangay Matatag</strong>—named after the Filipino word <em>“Matatag”</em> (meaning <strong>steadfast, unshakeable, and resilient</strong>), honoring the enduring solidarity of its Muslim and Christian households through generations of growth.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                Today, under the Bangsamoro Autonomous Region in Muslim Mindanao (<strong>BARMM, ZIP 7302</strong>) and the leadership of <strong>Punong Barangay Hon. Hulma G. Abdurahman</strong> and the Sangguniang Barangay, Barangay Matatag stands as a premier urban, educational, and commercial hub of <strong>Lamitan City</strong>, serving over <strong>2,854+ citizens across Puroks 1 to 7</strong> within its verified <strong>100,231.39 m²</strong> jurisdiction.
              </p>
            </div>
          </div>

          {/* CHAPTER II: DATU KALUN (PEDRO JAVIER CUEVAS, 1845–1904) IN PHILIPPINE HISTORY */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-md grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                CHAPTER II • PHILIPPINE NATIONAL &amp; BASILAN HISTORY
              </div>
              <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white leading-tight">
                Datu Kalun (Pedro Javier Cuevas, 1845–1904): Founder of Lamitan
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                Recorded in Philippine history as one of Mindanao’s most extraordinary leaders, <strong>Datu Kalun</strong> was born <strong>Pedro Javier Cuevas</strong> on <strong>May 14, 1845</strong> in <strong>Bacoor, Cavite</strong>. Implicated during the turbulent era of the <strong>1872 Cavite Mutiny</strong> against Spanish colonial rule, he was exiled to the maximum-security <em>San Ramon Penal Colony</em> in Zamboanga.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                Escaping across the Basilan Strait in a small boat, Cuevas ventured into the Yakan heartland of Basilan. Through his mastery of martial arts, diplomacy, and fairness, he challenged and defeated the formidable local chieftain of <em>Bohe Lebung</em> in single combat, earning the revered royal title <strong>“Datu Kalun”</strong> and marrying into the Yakan nobility.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                In <strong>June 1886</strong>, Datu Kalun officially founded the peaceful settlement of <strong>Lamitan</strong>, uniting Yakan, Tausug, and Christian settlers under a code of mutual respect and defending Basilan from external raiders. Recognized with a royal pardon by Spanish Governor-General Valeriano Weyler and later respected by American authorities until his death on <strong>July 16, 1904</strong>, his legacy of harmony is celebrated every June during Lamitan City’s vibrant <strong>Lami-Lamihan Festival</strong> (established in 1983) and honored along <strong>P. Cuevas Street</strong> inside Barangay Matatag.
              </p>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-center">
                  <div className="text-xs font-extrabold text-blue-700 dark:text-blue-400">MAY 14, 1845</div>
                  <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                    Born in Bacoor, Cavite
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-center">
                  <div className="text-xs font-extrabold text-amber-700 dark:text-amber-400">JUNE 1886</div>
                  <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                    Founded Lamitan, Basilan
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-center">
                  <div className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">JULY 16, 1904</div>
                  <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                    Honored at Kalun Shrine
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 order-1 lg:order-2">
              <div className="rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-slate-950 shadow-lg">
                <img
                  src="/history/datu-kalun-history.jpg"
                  alt="Datu Kalun (Pedro Javier Cuevas, 1845–1904) and Yakan Elders in Historic Lamitan, Basilan"
                  className="w-full h-auto object-contain block"
                />
                <div className="px-4 py-2.5 bg-slate-900 text-amber-200 text-[11px] font-medium flex items-center justify-between">
                  <span>👑 Datu Kalun (Pedro Javier Cuevas, 1845–1904) &amp; Yakan Council of Lamitan</span>
                  <span className="font-mono text-amber-400">Archival Plate II</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ==========================================
          8. CLEAN LIGHT/DARK OFFICIAL FOOTER + ZETICUZ DEVELOPER SIGNATURE
      ========================================== */}
      <footer className="mt-14 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center gap-3.5">
                <img
                  src="/logo.png"
                  alt="Barangay Matatag Official Seal"
                  className="w-16 h-16 object-contain"
                />
                <div>
                  <h3 className="text-lg font-display font-extrabold text-slate-900 dark:text-white">
                    BARANGAY MATATAG
                  </h3>
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                    Lamitan City, Basilan Province • BARMM (ZIP 7302)
                  </p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Official Smart Barangay E-Governance Digital Portal. Empowering residents along Aguinaldo St., Quezon Blvd., P. Cuevas St., Patikul St., and Puroks 1–7 with transparent, paperless, 24/7 public service.
              </p>
            </div>

            <div className="md:col-span-3 space-y-2.5 text-xs sm:text-sm">
              <h4 className="font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                PORTAL ACCESS
              </h4>
              <ul className="space-y-2 text-slate-600 dark:text-slate-300 font-medium">
                <li>
                  <button
                    onClick={() => onNavigate('login')}
                    className="hover:text-blue-600 transition"
                  >
                    Resident Sign In
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('register')}
                    className="hover:text-blue-600 transition"
                  >
                    Resident Registration
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('login')}
                    className="hover:text-blue-600 transition"
                  >
                    Admin Login Portal
                  </button>
                </li>
                <li>
                  <button
                    onClick={onOpenDownloadApp}
                    className="hover:text-blue-600 transition font-semibold text-blue-700 dark:text-blue-400 text-left"
                  >
                    Download PC (.EXE) / Android (.APK) / iOS App
                  </button>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-2.5 text-xs sm:text-sm">
              <h4 className="font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                CONTACT &amp; INSTALLERS
              </h4>
              <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Aguinaldo St., Poblacion, Lamitan City, Basilan 7302 (6.6600° N, 122.1377° E)</span>
                </li>
                <li className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Brgy. Matatag Hall • Punong Barangay: Hon. Hulma G. Abdurahman</span>
                </li>
                <li className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-600 shrink-0" />
                  <a
                    href="/downloads/Barangay-Matatag-Smart-Portal-Setup.exe"
                    download
                    className="text-blue-700 dark:text-blue-400 font-semibold underline hover:text-blue-900"
                  >
                    Download Windows Desktop Setup Wizard (.EXE)
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-rose-600 shrink-0" />
                  <a
                    href="/downloads/Barangay-Matatag-Smart-Portal.apk"
                    download
                    className="text-rose-700 dark:text-rose-400 font-semibold underline hover:text-rose-900"
                  >
                    Download Android Mobile Package (.APK)
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Centered Developer Signature Bar at the Very End of the Site (Matches Image 3 & Image 4) */}
          <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-3.5 pb-16 lg:pb-2">
            <div className="inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-[#0D1117] px-5 py-3 border border-slate-800 shadow-lg zeticuz-dev-pill">
              <img
                src="/zeticuz-logo.svg"
                alt="ZETICUZ Logo"
                className="h-7 w-auto object-contain"
              />
              <span className="text-xs sm:text-sm font-display tracking-wider uppercase text-slate-300 font-semibold">
                SITE DEVELOPED BY:{' '}
                <strong className="text-[#F87171] font-extrabold tracking-normal capitalize text-sm sm:text-base">
                  Sam Pangilinan
                </strong>
              </span>
              <span className="text-slate-500 font-bold">·</span>
              <span className="text-xs sm:text-sm font-semibold text-slate-300">
                © 2026
              </span>
              <button
                type="button"
                onClick={() =>
                  window.open('https://www.zeticuz.xyz/', '_blank', 'noopener,noreferrer')
                }
                className="ml-1 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-md transition transform hover:-translate-y-0.5"
              >
                <span>Explore Developer Portfolio &amp; Projects ↗</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              © 2026 Barangay Matatag Online E-Governance Portal • Lamitan City, Basilan Province (BARMM). All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* ==========================================
          INTERACTIVE DOCUMENT REQUEST MODAL (When User IS Logged In)
      ========================================== */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 my-8 shadow-2xl">
            <button
              onClick={() => setSelectedService(null)}
              className="absolute top-4 right-4 rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {createdReqResult ? (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
                <div className="inline-block rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  APPLICATION FILED SUCCESSFULLY
                </div>
                <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                  Reference: {createdReqResult.trackingNumber}
                </h3>
                <p className="text-xs font-mono font-bold text-blue-700 dark:text-blue-400">
                  10-Character Zero-Login Code: <strong>{createdReqResult.shortCode}</strong>
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Your <strong>{createdReqResult.documentType}</strong> request has been logged into the Barangay Matatag E-Governance Queue.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      const item = createdReqResult;
                      setSelectedService(null);
                      onPrintDocument(item, 'certificate');
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white px-5 py-2.5 text-xs font-bold shadow-md"
                  >
                    <Printer className="w-4 h-4" />
                    Preview / Print Certificate
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedService(null)}
                    className="rounded-xl bg-slate-100 dark:bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateRequest} className="space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase text-blue-700 dark:text-blue-400">
                    {selectedService.category}
                  </span>
                  <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                    {selectedService.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Requirements: {selectedService.requirements}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Applicant Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={reqForm.residentName}
                      onChange={(e) => setReqForm({ ...reqForm, residentName: e.target.value })}
                      className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      required
                      value={reqForm.contactNumber}
                      onChange={(e) => setReqForm({ ...reqForm, contactNumber: e.target.value })}
                      className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Barangay Matatag Purok / Zone
                  </label>
                  <select
                    value={reqForm.purok}
                    onChange={(e) => setReqForm({ ...reqForm, purok: e.target.value })}
                    className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
                  >
                    {(bootstrap?.barangay?.puroks || ['Purok 1 - Aguinaldo Central']).map(
                      (p: string) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Purpose / Details
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="State your purpose or request details..."
                    value={reqForm.purpose}
                    onChange={(e) => setReqForm({ ...reqForm, purpose: e.target.value })}
                    className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submittingReq}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white px-5 py-2.5 text-sm font-bold shadow-md"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    {submittingReq ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
