import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Scale,
  Megaphone,
  PackageCheck,
  Users,
  Award,
  UserCheck,
  Shield,
  Archive,
  BarChart3,
  Activity,
  MapPin,
  MessageSquare,
  FolderKanban,
  Printer,
  CheckCircle2,
  Send,
  Siren,
  ImagePlus,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { MagneticButton, YakanTiltCard } from '../components/YakanPrimitives';
import { SatelliteMapPinpointer } from '../components/SatelliteMapPinpointer';

const ADMIN_MODULES = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'MAIN' },
  { id: 'requests', label: 'Requests', icon: FileText, group: 'MANAGEMENT' },
  { id: 'payments', label: 'Payments & Revenue', icon: CreditCard, group: 'MANAGEMENT' },
  { id: 'summons', label: 'Summons / Blotters / Subpoena', icon: Scale, group: 'MANAGEMENT' },
  { id: 'gis-sos', label: '3D GIS Map & Live SOS', icon: MapPin, group: 'MANAGEMENT' },
  { id: 'chat-drive', label: 'Live Chat & Google Drive Vault', icon: MessageSquare, group: 'MANAGEMENT' },
  { id: 'bulletins', label: 'Bulletins / Broadcast', icon: Megaphone, group: 'MANAGEMENT' },
  { id: 'borrows', label: 'Borrow Requests', icon: PackageCheck, group: 'MANAGEMENT' },
  { id: 'residents', label: 'Residents Registry', icon: Users, group: 'MANAGEMENT' },
  { id: 'certificates', label: 'Certificate Types', icon: Award, group: 'MANAGEMENT' },
  { id: 'officials', label: 'Officials', icon: UserCheck, group: 'MANAGEMENT' },
  { id: 'users', label: 'User Management', icon: Shield, group: 'ADMINISTRATION' },
  { id: 'archive', label: 'Archive', icon: Archive, group: 'ADMINISTRATION' },
  { id: 'reports', label: 'Reports & Activity Logs', icon: BarChart3, group: 'ADMINISTRATION' },
];

export const AdminDashboard: React.FC<{
  fullData: any;
  onRefresh: () => void;
  onPrintDocument: (item: any, type: 'certificate' | 'subpoena') => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onGoHome?: () => void;
  onLogout?: () => void;
}> = ({
  fullData,
  onRefresh,
  onPrintDocument,
  theme = 'light',
  onToggleTheme,
  onGoHome,
  onLogout,
}) => {
  const [activeModule, setActiveModule] = useState('dashboard');

  const residents = fullData?.residents || [];
  const requests = fullData?.requests || [];
  const payments = fullData?.payments || [];
  const summons = fullData?.summons || [];
  const bulletins = fullData?.bulletins || [];
  const borrows = fullData?.borrows || [];
  const certificates = fullData?.certificates || [];
  const officials = fullData?.officials || [];
  const users = fullData?.users || [];
  const archives = fullData?.archives || [];
  const activityLogs = fullData?.activityLogs || [];
  const emergencies = fullData?.emergencies || [];
  const chatMessages = fullData?.chatMessages || [];
  const driveFiles = fullData?.driveVault?.files || [];

  // Subpoena Dispatcher Form State
  const [subForm, setSubForm] = useState({
    respondentResidentId: 'RES-MTG-001',
    complainant: 'Barangay Peace & Order Committee',
    location: 'Aguinaldo Street, Purok 1, Barangay Matatag',
    incidentDetails: '',
    hearingSchedule: '2026-11-06T10:00',
  });
  const [subSuccess, setSubSuccess] = useState('');

  // Bulletin Broadcast Form State
  const [bulForm, setBulForm] = useState({
    title: '',
    category: 'Urgent Barangay Advisory',
    priority: 'Urgent',
    content: '',
    pinned: true,
  });

  // Admin Live Chat State
  const [selectedChatResidentId, setSelectedChatResidentId] = useState('RES-MTG-001');
  const [adminReplyText, setAdminReplyText] = useState('');
  const [adminReplyImage, setAdminReplyImage] = useState('');

  const handleUpdateRequestStatus = async (reqId: string, stage: number, status: string, remarks: string) => {
    await fetch(`/api/requests/${reqId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage, status, remarks }),
    });
    onRefresh();
  };

  const handleDispatchSubpoena = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetRes = residents.find((r: any) => r.id === subForm.respondentResidentId);
    const res = await fetch('/api/summons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...subForm,
        respondent: targetRes?.fullName || 'Amir K. Kalun',
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setSubSuccess(
        `✅ Official Subpoena ${data.summons.caseNumber} dispatched in real-time to ${data.summons.respondent}'s account & Live Chat!`
      );
      setSubForm({ ...subForm, incidentDetails: '' });
      onRefresh();
    }
  };

  const handleBroadcastBulletin = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/bulletins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bulForm),
    });
    setBulForm({ ...bulForm, title: '', content: '' });
    onRefresh();
  };

  const handleSendAdminChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyText.trim() && !adminReplyImage) return;
    const targetRes = residents.find((r: any) => r.id === selectedChatResidentId) || residents[0];
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        residentId: targetRes.id,
        residentName: targetRes.fullName,
        senderRole: 'Admin',
        senderName: 'Hon. Hulma G. Abdurahman (Punong Barangay)',
        message: adminReplyText,
        imageBase64: adminReplyImage || undefined,
        imageName: 'admin_attachment.png',
      }),
    });
    setAdminReplyText('');
    setAdminReplyImage('');
    onRefresh();
  };

  const totalRevenue = payments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  const currentModuleObj = ADMIN_MODULES.find((m) => m.id === activeModule) || ADMIN_MODULES[0];

  return (
    <div className="relative z-10 min-h-screen w-full flex flex-col lg:flex-row">
      {/* ==========================================
          LEFT SIDEBAR (Clean Royal Blue Desktop Sidebar)
      ========================================== */}
      <aside className="w-full lg:w-64 lg:min-h-screen bg-[#1E3A8A] dark:bg-slate-900 border-r border-blue-900/40 dark:border-slate-800 text-white shrink-0 flex flex-col admin-sidebar-blue">
        <div className="p-5 flex items-center gap-3.5 border-b border-white/15">
          <img
            src="/logo.png"
            alt="Brgy. Matatag Seal"
            className="w-12 h-12 rounded-full object-contain bg-white p-0.5 shrink-0"
          />
          <div>
            <div className="text-sm font-display font-extrabold text-white leading-tight">
              Brgy. Matatag
            </div>
            <div className="text-[11px] text-blue-100/90 font-medium">
              Clearance &amp; E-Gov System
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {['MAIN', 'MANAGEMENT', 'ADMINISTRATION'].map((groupName) => (
            <div key={groupName} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-blue-200/80">
                {groupName}
              </div>
              {ADMIN_MODULES.filter((m) => m.group === groupName).map((m) => {
                const Icon = m.icon;
                const isActive = activeModule === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveModule(m.id)}
                    className={`w-full flex items-center justify-between gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                      isActive
                        ? 'bg-[#2563EB] text-white shadow-md'
                        : 'text-blue-100/90 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-3 truncate">
                      <Icon className="w-4 h-4 shrink-0 text-white" />
                      <span className="truncate">{m.label}</span>
                    </span>
                    {m.id === 'gis-sos' && emergencies.length > 0 && (
                      <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-black text-slate-950">
                        {emergencies.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* ==========================================
          FULL-VIEW DESKTOP MAIN ADMIN WORKSPACE
      ========================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Admin Header Bar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">
              Admin Dashboard — {currentModuleObj.label}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition"
              >
                {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>
            )}

            <div className="flex items-center gap-2 rounded-full border border-blue-200 dark:border-slate-700 bg-blue-50/70 dark:bg-slate-800 pl-1.5 pr-3.5 py-1">
              <img
                src="/officials/off-1.jpg"
                alt="Hon. Hulma G. Abdurahman"
                className="w-7 h-7 rounded-full object-cover border border-blue-400"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-white hidden sm:inline">
                Hon. Hulma G. Abdurahman (Admin)
              </span>
            </div>

            {onGoHome && (
              <button
                type="button"
                onClick={onGoHome}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
              >
                Public Portal
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-1.5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-xs font-bold text-white transition shadow-sm"
              >
                Sign Out
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-8 space-y-6 pb-24">
          {/* Top Administrative Banner */}
          <div className="rounded-2xl yakan-glass p-6 border-l-4 border-l-[#1D4ED8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                Barangay Management System • Barangay Matatag, Lamitan City (ZIP 7302)
              </div>
              <h1 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white mt-0.5">
                Administrative Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                Monitor residents, certificate requests, approvals, releases, 3D GIS house locations, and monthly activity under Chairwoman Hon. Hulma G. Abdurahman.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setActiveModule('requests')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white px-5 py-2.5 text-xs sm:text-sm font-bold shadow-sm transition"
              >
                <FileText className="w-4 h-4" />
                Manage Requests
              </button>
              <button
                type="button"
                onClick={() => setActiveModule('summons')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white px-4 py-2.5 text-xs sm:text-sm font-bold shadow-sm transition"
              >
                <Scale className="w-4 h-4" />
                Send Subpoena
              </button>
            </div>
          </div>

          {/* 1. EXECUTIVE DASHBOARD MODULE */}
          {activeModule === 'dashboard' && (
            <div className="space-y-6">
              {/* Primary 5 Executive KPI Cards + Demographic Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <YakanTiltCard glowColor="crimson" onClick={() => setActiveModule('residents')} className="p-4">
                  <div className="text-xs text-slate-400">Registered Accounts / Census</div>
                  <div className="text-2xl font-display font-black text-white mt-1">
                    {residents.length} <span className="text-xs font-normal text-amber-300">/ 2,854</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1">100% 3D GIS Pinned</div>
                </YakanTiltCard>

                <YakanTiltCard glowColor="sapphire" onClick={() => setActiveModule('requests')} className="p-4">
                  <div className="text-xs text-slate-400">Total Requests</div>
                  <div className="text-2xl font-display font-black text-white mt-1">
                    {requests.length}
                  </div>
                  <div className="text-[11px] text-blue-300 mt-1">EODB Tracked</div>
                </YakanTiltCard>

                <YakanTiltCard glowColor="gold" onClick={() => setActiveModule('requests')} className="p-4">
                  <div className="text-xs text-slate-400">Pending Verification</div>
                  <div className="text-2xl font-display font-black text-amber-300 mt-1">
                    {requests.filter((r: any) => r.status === 'Pending').length}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Secretary Queue</div>
                </YakanTiltCard>

                <YakanTiltCard glowColor="emerald" onClick={() => setActiveModule('requests')} className="p-4">
                  <div className="text-xs text-slate-400">Released QR Certs</div>
                  <div className="text-2xl font-display font-black text-emerald-400 mt-1">
                    {requests.filter((r: any) => r.status === 'Released').length}
                  </div>
                  <div className="text-[11px] text-emerald-300 mt-1">Digitally Signed</div>
                </YakanTiltCard>

                <YakanTiltCard glowColor="gold" onClick={() => setActiveModule('payments')} className="p-4">
                  <div className="text-xs text-slate-400">Clearance Revenue</div>
                  <div className="text-2xl font-display font-black text-amber-300 mt-1">
                    ₱{totalRevenue.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{payments.length} Official Receipts</div>
                </YakanTiltCard>
              </div>

              {/* Secondary Demographic Breakdown Strip (from Repo 2: Voters, 4Ps, PWD, Senior, Puroks, SOS) */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                <div className="rounded-2xl yakan-glass p-3 text-center">
                  <div className="text-[10px] font-mono uppercase text-slate-400">VOTERS</div>
                  <div className="text-lg font-bold text-white">
                    {residents.filter((r: any) => r.voterStatus === 'Yes').length}
                  </div>
                </div>
                <div className="rounded-2xl yakan-glass p-3 text-center">
                  <div className="text-[10px] font-mono uppercase text-slate-400">4Ps MEMBERS</div>
                  <div className="text-lg font-bold text-amber-300">
                    {residents.filter((r: any) => r.is4Ps).length}
                  </div>
                </div>
                <div className="rounded-2xl yakan-glass p-3 text-center">
                  <div className="text-[10px] font-mono uppercase text-slate-400">SENIOR CITIZENS</div>
                  <div className="text-lg font-bold text-emerald-300">
                    {residents.filter((r: any) => r.isSenior).length}
                  </div>
                </div>
                <div className="rounded-2xl yakan-glass p-3 text-center">
                  <div className="text-[10px] font-mono uppercase text-slate-400">PWD REGISTRY</div>
                  <div className="text-lg font-bold text-blue-300">
                    {residents.filter((r: any) => r.isPWD).length}
                  </div>
                </div>
                <div className="rounded-2xl yakan-glass p-3 text-center">
                  <div className="text-[10px] font-mono uppercase text-slate-400">ACTIVE SUBPOENAS</div>
                  <div className="text-lg font-bold text-rose-400">{summons.length}</div>
                </div>
                <div className="rounded-2xl yakan-glass p-3 text-center">
                  <div className="text-[10px] font-mono uppercase text-slate-400">DRIVE VAULT FILES</div>
                  <div className="text-lg font-bold text-amber-300">{driveFiles.length}</div>
                </div>
              </div>

              {/* Recent Requests & Live GIS Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 rounded-3xl yakan-glass p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-display font-bold text-white">
                      Recent Document Applications
                    </h3>
                    <button
                      onClick={() => setActiveModule('requests')}
                      className="text-xs font-bold text-amber-300 hover:underline"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 font-mono uppercase">
                          <th className="py-2.5">Tracking #</th>
                          <th className="py-2.5">Resident</th>
                          <th className="py-2.5">Document</th>
                          <th className="py-2.5">Status</th>
                          <th className="py-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {requests.map((r: any) => (
                          <tr key={r.id}>
                            <td className="py-3 font-mono font-bold text-amber-300">
                              {r.trackingNumber}
                            </td>
                            <td className="py-3 font-semibold text-white">{r.residentName}</td>
                            <td className="py-3 text-slate-300">{r.documentType}</td>
                            <td className="py-3">
                              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                                {r.status}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => onPrintDocument(r, 'certificate')}
                                className="rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 px-2.5 py-1 text-[11px] font-bold text-blue-200"
                              >
                                Print QR
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="lg:col-span-5 rounded-3xl yakan-glass p-6 space-y-4">
                  <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                    <Siren className="w-5 h-5 text-rose-500" />
                    Live Emergency SOS &amp; Subpoena Feed
                  </h3>
                  {emergencies.map((em: any) => (
                    <div
                      key={em.id}
                      className="rounded-2xl bg-rose-950/60 border border-rose-500/50 p-3.5 space-y-1 text-xs"
                    >
                      <div className="flex justify-between font-bold text-rose-300">
                        <span>🚨 {em.type}</span>
                        <span>{em.severity}</span>
                      </div>
                      <div className="text-white font-semibold">
                        {em.residentName} ({em.purok})
                      </div>
                      <div className="text-slate-300">{em.message}</div>
                      <button
                        onClick={() => setActiveModule('gis-sos')}
                        className="text-amber-300 font-bold hover:underline pt-1 inline-block"
                      >
                        Locate on 3D Satellite Map ({em.lat.toFixed(4)}°N, {em.lng.toFixed(4)}°E) →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. REQUESTS MANAGEMENT MODULE */}
          {activeModule === 'requests' && (
            <div className="rounded-3xl yakan-glass p-6 space-y-4">
              <h2 className="text-xl font-display font-bold text-white">
                Document Requests &amp; EODB Release Queue
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/15 text-slate-400 font-mono uppercase">
                      <th className="py-3">Tracking #</th>
                      <th className="py-3">Resident</th>
                      <th className="py-3">Document</th>
                      <th className="py-3">Fee / Payment</th>
                      <th className="py-3">Stage / Status</th>
                      <th className="py-3 text-right">Workflow Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {requests.map((r: any) => (
                      <tr key={r.id}>
                        <td className="py-3.5 font-mono font-bold text-amber-300">
                          {r.trackingNumber}
                          <div className="text-[10px] text-slate-400">10-Char: {r.shortCode}</div>
                        </td>
                        <td className="py-3.5">
                          <div className="font-bold text-white">{r.residentName}</div>
                          <div className="text-[11px] text-slate-400">{r.purok}</div>
                        </td>
                        <td className="py-3.5">
                          <div className="font-semibold text-white">{r.documentType}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            {r.purpose}
                          </div>
                        </td>
                        <td className="py-3.5">
                          <div className="font-bold text-emerald-300">₱{r.fee}.00</div>
                          <div className="text-[10px] font-mono text-slate-400">{r.orNumber}</div>
                        </td>
                        <td className="py-3.5">
                          <span className="rounded-full bg-amber-500/20 border border-amber-400/40 px-2.5 py-1 text-[11px] font-bold text-amber-300">
                            Stage {r.stage}/4 • {r.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right space-x-1.5">
                          <button
                            onClick={() =>
                              handleUpdateRequestStatus(
                                r.id,
                                3,
                                'Approved',
                                'Verified by Brgy. Secretary & Approved by Punong Barangay.'
                              )
                            }
                            className="rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/40 px-2.5 py-1.5 font-bold text-emerald-200"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateRequestStatus(
                                r.id,
                                4,
                                'Released',
                                'Digitally signed with QR Seal and released to resident.'
                              )
                            }
                            className="rounded-lg bg-amber-500/30 hover:bg-amber-500/50 border border-amber-400/40 px-2.5 py-1.5 font-bold text-amber-200"
                          >
                            Release QR
                          </button>
                          <button
                            onClick={() => onPrintDocument(r, 'certificate')}
                            className="rounded-lg btn-yakan-sapphire px-3 py-1.5 font-bold"
                          >
                            Print Cert
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. PAYMENTS & REVENUE LEDGER */}
          {activeModule === 'payments' && (
            <div className="rounded-3xl yakan-glass p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl font-display font-bold text-white">
                  Official Receipts &amp; Treasury Collection Ledger
                </h2>
                <div className="rounded-2xl bg-emerald-950/80 border border-emerald-400/50 px-4 py-2 text-sm font-bold text-emerald-300">
                  Total Collected Revenue: ₱{totalRevenue.toLocaleString()}.00
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/15 text-slate-400 font-mono uppercase">
                      <th className="py-3">O.R. Number</th>
                      <th className="py-3">Tracking #</th>
                      <th className="py-3">Payor (Resident)</th>
                      <th className="py-3">Particulars</th>
                      <th className="py-3">Mode</th>
                      <th className="py-3">Amount</th>
                      <th className="py-3">Treasurer / Cashier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {payments.map((p: any) => (
                      <tr key={p.id}>
                        <td className="py-3 font-mono font-bold text-amber-300">{p.orNumber}</td>
                        <td className="py-3 font-mono text-slate-300">{p.trackingNumber}</td>
                        <td className="py-3 font-bold text-white">{p.residentName}</td>
                        <td className="py-3 text-slate-300">{p.details}</td>
                        <td className="py-3">{p.mode}</td>
                        <td className="py-3 font-bold text-emerald-400">₱{p.amount}.00</td>
                        <td className="py-3 text-slate-400">{p.cashier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. KATARUNGANG PAMBARANGAY: SUMMONS, BLOTTERS & DIRECT SUBPOENA DISPATCHER */}
          {activeModule === 'summons' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 rounded-3xl yakan-glass-gold p-6 space-y-4">
                <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-400" />
                  Issue Official Subpoena / Lupon Summons
                </h3>
                <p className="text-xs text-slate-300">
                  Selecting a resident below will immediately dispatch an urgent Subpoena Alert Banner and formal KP Form #9 notice to their Resident Account &amp; Live Chat.
                </p>

                {subSuccess && (
                  <div className="rounded-xl bg-emerald-950/90 border border-emerald-400 p-3 text-xs text-emerald-200">
                    {subSuccess}
                  </div>
                )}

                <form onSubmit={handleDispatchSubpoena} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Select Resident to Subpoena (Respondent)
                    </label>
                    <select
                      value={subForm.respondentResidentId}
                      onChange={(e) =>
                        setSubForm({ ...subForm, respondentResidentId: e.target.value })
                      }
                      className="w-full rounded-xl bg-slate-950 border border-white/20 px-3.5 py-2.5 text-sm text-white"
                    >
                      {residents.map((r: any) => (
                        <option key={r.id} value={r.id}>
                          {r.fullName} ({r.purok}) — {r.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Complainant / Declarant
                    </label>
                    <input
                      type="text"
                      required
                      value={subForm.complainant}
                      onChange={(e) => setSubForm({ ...subForm, complainant: e.target.value })}
                      className="w-full rounded-xl bg-slate-950 border border-white/20 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Mandatory Hearing Date &amp; Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={subForm.hearingSchedule}
                      onChange={(e) =>
                        setSubForm({ ...subForm, hearingSchedule: e.target.value })
                      }
                      className="w-full rounded-xl bg-slate-950 border border-white/20 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Case Details / Reason for Subpoena
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Enter formal mediation or appearance details..."
                      value={subForm.incidentDetails}
                      onChange={(e) =>
                        setSubForm({ ...subForm, incidentDetails: e.target.value })
                      }
                      className="w-full rounded-xl bg-slate-950 border border-white/20 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>

                  <MagneticButton type="submit" variant="crimson" className="w-full">
                    <Send className="w-4 h-4" />
                    Dispatch Official Subpoena to Resident Account
                  </MagneticButton>
                </form>
              </div>

              <div className="lg:col-span-7 rounded-3xl yakan-glass p-6 space-y-4">
                <h3 className="text-lg font-display font-bold text-white">
                  Katarungang Pambarangay Docket ({summons.length})
                </h3>
                <div className="space-y-3">
                  {summons.map((s: any) => (
                    <div
                      key={s.id}
                      className="rounded-2xl bg-slate-950/85 border border-white/15 p-4 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-amber-300">
                          {s.caseNumber} • {s.type}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            s.acknowledgedByResident
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {s.acknowledgedByResident
                            ? '✅ Acknowledged by Resident'
                            : '📨 Subpoena Active on Account'}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white">
                        Complainant: {s.complainant} → Respondent: {s.respondent}
                      </div>
                      <p className="text-xs text-slate-300">{s.incidentDetails}</p>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs font-mono text-amber-300">
                          Hearing: {new Date(s.hearingSchedule).toLocaleString()}
                        </span>
                        <button
                          onClick={() => onPrintDocument(s, 'subpoena')}
                          className="inline-flex items-center gap-1 rounded-xl btn-yakan-sapphire px-3 py-1.5 text-xs font-bold"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print KP Form #9
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. 3D SATELLITE GIS MAP & LIVE EMERGENCY SOS TRACKING */}
          {activeModule === 'gis-sos' && (
            <div className="space-y-6">
              <div className="rounded-3xl yakan-glass-gold p-6 space-y-4">
                <h2 className="text-xl font-display font-bold text-white">
                  Barangay Matatag 3D Satellite Command GIS • Pinpointed Houses &amp; Live SOS Tracking
                </h2>
                <SatelliteMapPinpointer
                  mode="admin"
                  residents={residents}
                  emergencies={emergencies}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {residents.map((r: any) => (
                  <div
                    key={r.id}
                    className="rounded-2xl yakan-glass p-4 border border-white/15 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-sm font-bold text-white">{r.fullName}</div>
                      <div className="text-xs text-amber-300">
                        📍 Pinned: {r.pinnedLocation?.lotLabel} ({r.purok})
                      </div>
                      <div className="text-[11px] font-mono text-emerald-400">
                        Live GPS: {r.liveLocation?.lat?.toFixed(5)}° N,{' '}
                        {r.liveLocation?.lng?.toFixed(5)}° E • {r.liveLocation?.status}
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-xs font-bold text-emerald-300">
                      GIS Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. LIVE CHAT & PER-RESIDENT GOOGLE DRIVE MEDIA VAULT */}
          {activeModule === 'chat-drive' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 rounded-3xl yakan-glass p-5 space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-amber-400" />
                  Resident Channels &amp; Drive Folders
                </h3>
                {residents.map((r: any) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedChatResidentId(r.id)}
                    className={`w-full text-left rounded-2xl p-3.5 border transition ${
                      selectedChatResidentId === r.id
                        ? 'bg-rose-600/25 border-amber-400 text-white'
                        : 'bg-white/5 border-white/10 text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-sm">{r.fullName}</div>
                    <div className="text-[11px] font-mono text-amber-300 truncate">
                      📁 /GoogleDrive_Vault/{r.driveFolderName}/
                    </div>
                  </button>
                ))}
              </div>

              <div className="lg:col-span-8 rounded-3xl yakan-glass-gold p-6 flex flex-col h-[540px]">
                <div className="pb-3 border-b border-white/15 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Two-Way Live Chat with{' '}
                      {residents.find((r: any) => r.id === selectedChatResidentId)?.fullName}
                    </h3>
                    <p className="text-xs font-mono text-emerald-300">
                      Google Drive Vault Folder:{' '}
                      {residents.find((r: any) => r.id === selectedChatResidentId)?.driveFolderName}
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                  {chatMessages
                    .filter((m: any) => m.residentId === selectedChatResidentId)
                    .map((m: any) => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          m.senderRole === 'Admin' ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl p-3 text-xs sm:text-sm ${
                            m.senderRole === 'Admin'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-900 border border-white/15 text-slate-100'
                          }`}
                        >
                          <div className="text-[10px] font-mono opacity-75 mb-1">
                            {m.senderName}
                          </div>
                          <div>{m.message}</div>
                          {m.imageUrl && (
                            <img
                              src={m.imageUrl}
                              alt="Uploaded"
                              className="mt-2 max-h-40 rounded-xl border border-white/20"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                <form
                  onSubmit={handleSendAdminChat}
                  className="pt-3 border-t border-white/15 flex items-center gap-2"
                >
                  <label className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-amber-300 cursor-pointer">
                    <ImagePlus className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === 'string') setAdminReplyImage(reader.result);
                        };
                        reader.readAsDataURL(f);
                      }}
                    />
                  </label>
                  <input
                    type="text"
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    placeholder="Reply to resident or send official notice..."
                    className="flex-1 rounded-xl bg-slate-950 border border-white/20 px-4 py-2.5 text-sm text-white"
                  />
                  <MagneticButton type="submit" variant="crimson">
                    <Send className="w-4 h-4" /> Reply
                  </MagneticButton>
                </form>
              </div>
            </div>
          )}

          {/* 7. BULLETINS / BROADCAST ANNOUNCEMENTS */}
          {activeModule === 'bulletins' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 rounded-3xl yakan-glass-gold p-6 space-y-4">
                <h3 className="text-lg font-display font-bold text-white">
                  Broadcast Announcement to All Residents
                </h3>
                <form onSubmit={handleBroadcastBulletin} className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Announcement Title"
                    value={bulForm.title}
                    onChange={(e) => setBulForm({ ...bulForm, title: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-white/20 px-3.5 py-2.5 text-sm text-white"
                  />
                  <select
                    value={bulForm.category}
                    onChange={(e) => setBulForm({ ...bulForm, category: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-white/20 px-3.5 py-2.5 text-sm text-white"
                  >
                    <option value="Urgent Barangay Advisory">Urgent Barangay Advisory</option>
                    <option value="Health & Medical Mission">Health &amp; Medical Mission</option>
                    <option value="DRRMC Weather Alert">DRRMC Weather Alert</option>
                    <option value="Lami-Lamihan & Cultural Event">Lami-Lamihan &amp; Cultural Event</option>
                  </select>
                  <textarea
                    rows={4}
                    required
                    placeholder="Write official bulletin message..."
                    value={bulForm.content}
                    onChange={(e) => setBulForm({ ...bulForm, content: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-white/20 px-3.5 py-2.5 text-sm text-white"
                  />
                  <MagneticButton type="submit" variant="crimson" className="w-full">
                    <Megaphone className="w-4 h-4" />
                    Broadcast Live to All Residents
                  </MagneticButton>
                </form>
              </div>

              <div className="lg:col-span-7 space-y-3">
                {bulletins.map((b: any) => (
                  <div
                    key={b.id}
                    className="rounded-2xl yakan-glass p-5 border border-white/15 space-y-2"
                  >
                    <div className="flex justify-between text-xs font-mono text-amber-300">
                      <span>{b.category}</span>
                      <span>{b.publishedDate}</span>
                    </div>
                    <h4 className="text-base font-bold text-white">{b.title}</h4>
                    <p className="text-xs text-slate-300">{b.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. BORROW REQUESTS */}
          {activeModule === 'borrows' && (
            <div className="rounded-3xl yakan-glass p-6 space-y-4">
              <h2 className="text-xl font-display font-bold text-white">
                Community Facility &amp; Equipment Borrow Requests
              </h2>
              <div className="space-y-3">
                {borrows.map((b: any) => (
                  <div
                    key={b.id}
                    className="rounded-2xl bg-slate-950/80 border border-white/15 p-4 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-sm font-bold text-white">
                        {b.residentName} — {b.itemsBorrowed}
                      </div>
                      <div className="text-xs text-slate-400">
                        Borrow Date: {b.borrowDate} • Purpose: {b.purpose}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300">
                        {b.status}
                      </span>
                      <button
                        onClick={async () => {
                          await fetch(`/api/borrows/${b.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'Approved' }),
                          });
                          onRefresh();
                        }}
                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                      >
                        Approve Release
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. RESIDENTS REGISTRY */}
          {activeModule === 'residents' && (
            <div className="rounded-3xl yakan-glass p-6 space-y-4">
              <h2 className="text-xl font-display font-bold text-white">
                Barangay Matatag Master Residents &amp; 3D GIS House Registry ({residents.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/15 text-slate-400 font-mono uppercase">
                      <th className="py-3">ID</th>
                      <th className="py-3">Full Name</th>
                      <th className="py-3">Gender / Age</th>
                      <th className="py-3">Purok &amp; 3D Pinned House</th>
                      <th className="py-3">Google Drive Folder</th>
                      <th className="py-3">Sectors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {residents.map((r: any) => (
                      <tr key={r.id}>
                        <td className="py-3 font-mono font-bold text-amber-300">{r.id}</td>
                        <td className="py-3 font-bold text-white">{r.fullName}</td>
                        <td className="py-3 text-slate-300">
                          {r.gender} • {r.age} yrs ({r.civilStatus})
                        </td>
                        <td className="py-3">
                          <div className="text-white font-semibold">
                            {r.pinnedLocation?.lotLabel}
                          </div>
                          <div className="text-[11px] text-emerald-400 font-mono">
                            {r.purok} ({r.pinnedLocation?.lat?.toFixed(4)}°N,{' '}
                            {r.pinnedLocation?.lng?.toFixed(4)}°E)
                          </div>
                        </td>
                        <td className="py-3 font-mono text-[11px] text-amber-300">
                          📁 {r.driveFolderName}
                        </td>
                        <td className="py-3 space-x-1">
                          {r.voterStatus === 'Yes' && (
                            <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-300">
                              Voter
                            </span>
                          )}
                          {r.is4Ps && (
                            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300">
                              4Ps
                            </span>
                          )}
                          {r.isSenior && (
                            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300">
                              Senior
                            </span>
                          )}
                          {r.isPWD && (
                            <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] text-rose-300">
                              PWD
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 10. CERTIFICATE TYPES */}
          {activeModule === 'certificates' && (
            <div className="rounded-3xl yakan-glass p-6 space-y-4">
              <h2 className="text-xl font-display font-bold text-white">
                Official Barangay Matatag Certificate &amp; Permit Catalog
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certificates.map((c: any) => (
                  <div
                    key={c.id}
                    className="rounded-2xl bg-slate-950/80 border border-white/15 p-4 space-y-1.5"
                  >
                    <div className="flex justify-between">
                      <span className="text-sm font-bold text-white">{c.name}</span>
                      <span className="font-mono text-xs font-bold text-amber-300">
                        ₱{c.fee}.00
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Category: {c.category} • Turnaround: {c.processingDays}
                    </div>
                    <div className="text-[11px] text-slate-300">{c.requirements}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 11. OFFICIALS */}
          {activeModule === 'officials' && (
            <div className="rounded-3xl yakan-glass p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">
                    Sangguniang Barangay of Matatag Roster
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Complete elected council and appointed barangay officials of Barangay Matatag, Lamitan City (2023–2026)
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
                  {officials.length} Active Officials &amp; Staff
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {officials.map((o: any) => {
                  const imgSrc = o.photo || o.avatarUrl || '/logo.png';
                  const isSeal = imgSrc === '/logo.png';
                  return (
                    <div
                      key={o.id}
                      className="rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4 hover:border-blue-500 transition shadow-sm"
                    >
                      <img
                        src={imgSrc}
                        alt={o.name}
                        className={`w-16 h-16 rounded-2xl border-2 border-blue-200 dark:border-blue-800 shadow-sm shrink-0 ${
                          isSeal
                            ? 'object-contain p-1.5 bg-white dark:bg-slate-900'
                            : 'object-cover'
                        }`}
                      />
                      <div className="min-w-0">
                        <span className="inline-block rounded-full bg-blue-100 dark:bg-blue-950/80 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-800 dark:text-blue-300">
                          {o.position}
                        </span>
                        <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1 truncate">
                          {o.name}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">
                          {o.chairmanship}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                          {o.email ? `Email: ${o.email}` : 'Email: N/A'} • Contact: {o.contactNumber || 'N/A'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 12. USER MANAGEMENT */}
          {activeModule === 'users' && (
            <div className="rounded-3xl yakan-glass p-6 space-y-4">
              <h2 className="text-xl font-display font-bold text-white">
                System Users &amp; Role-Based Access Control (RBAC)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/15 text-slate-400 font-mono uppercase">
                      <th className="py-3">Full Name</th>
                      <th className="py-3">Username / Email</th>
                      <th className="py-3">Role</th>
                      <th className="py-3">Position</th>
                      <th className="py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {users.map((u: any) => (
                      <tr key={u.id}>
                        <td className="py-3 font-bold text-white">{u.fullName}</td>
                        <td className="py-3 font-mono text-amber-300">{u.email}</td>
                        <td className="py-3">{u.role}</td>
                        <td className="py-3 text-slate-300">{u.position}</td>
                        <td className="py-3">
                          <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                            {u.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 13. ARCHIVE VAULT */}
          {activeModule === 'archive' && (
            <div className="rounded-3xl yakan-glass p-6 space-y-4">
              <h2 className="text-xl font-display font-bold text-white">
                System Archive &amp; 1-Click Record Recovery
              </h2>
              {archives.map((a: any) => (
                <div
                  key={a.id}
                  className="rounded-2xl bg-slate-950/80 border border-white/15 p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-mono text-amber-300">{a.category}</div>
                    <div className="text-sm font-bold text-white">{a.name}</div>
                    <div className="text-xs text-slate-400">{a.details}</div>
                  </div>
                  <button
                    onClick={async () => {
                      await fetch(`/api/archive/${a.id}/restore`, { method: 'POST' });
                      onRefresh();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restore Record
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 14. REPORTS & ACTIVITY LOGS */}
          {activeModule === 'reports' && (
            <div className="rounded-3xl yakan-glass p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold text-white">
                  Security Audit Trail &amp; Activity Logs
                </h2>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl btn-yakan-sapphire px-4 py-2 text-xs font-bold"
                >
                  <Printer className="w-4 h-4" /> Export Executive Report
                </button>
              </div>
              <div className="space-y-2 max-h-[460px] overflow-y-auto">
                {activityLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="rounded-xl bg-slate-950/80 border border-white/10 p-3 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-amber-300">[{log.action}]</span>{' '}
                      <strong className="text-white">{log.user}</strong> ({log.module}) —{' '}
                      <span className="text-slate-300">{log.description}</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
