import React, { useEffect, useState } from 'react';
import {
  FileText,
  MessageSquare,
  Siren,
  MapPin,
  Scale,
  FolderKanban,
  PackageCheck,
  Send,
  ImagePlus,
  Printer,
  CheckCircle2,
  Bell,
  Radio,
  ShieldAlert,
  Sparkles,
  IdCard,
  Plus,
} from 'lucide-react';
import { GlidingYakanTabs, MagneticButton, YakanTiltCard } from '../components/YakanPrimitives';
import { SatelliteMapPinpointer } from '../components/SatelliteMapPinpointer';

export const ResidentDashboard: React.FC<{
  user: any;
  residentProfile: any;
  fullData: any;
  onRefresh: () => void;
  onPrintDocument: (item: any, type: 'certificate' | 'subpoena') => void;
}> = ({ user, residentProfile, fullData, onRefresh, onPrintDocument }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const residentId = residentProfile?.id || user?.residentId || 'RES-MTG-001';
  const residentName = residentProfile?.fullName || user?.fullName || 'Amir K. Kalun';
  const myRequests = (fullData?.requests || []).filter(
    (r: any) => r.residentId === residentId || r.residentName === residentName
  );
  const mySummons = (fullData?.summons || []).filter(
    (s: any) =>
      s.respondentResidentId === residentId ||
      s.respondent?.toLowerCase() === residentName.toLowerCase()
  );
  const myChats = (fullData?.chatMessages || []).filter((m: any) => m.residentId === residentId);
  const myDriveFiles = (fullData?.driveVault?.files || []).filter(
    (f: any) => f.residentId === residentId
  );
  const myBorrows = (fullData?.borrows || []).filter((b: any) => b.residentId === residentId);
  const myNotifications = (fullData?.notifications || []).filter(
    (n: any) => n.targetResidentId === residentId || n.targetResidentId === 'ALL'
  );

  // Quick Request State
  const [certId, setCertId] = useState('CERT-001');
  const [purpose, setPurpose] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('GCash');
  const [reqSubmitting, setReqSubmitting] = useState(false);

  // Live Chat State
  const [chatText, setChatText] = useState('');
  const [chatImageBase64, setChatImageBase64] = useState('');
  const [chatImageName, setChatImageName] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  // Live Emergency SOS State
  const [sosType, setSosType] = useState('Medical / Rescue Emergency');
  const [sosSeverity, setSosSeverity] = useState('Critical');
  const [sosMessage, setSosMessage] = useState('');
  const [sosPhotoBase64, setSosPhotoBase64] = useState('');
  const [sosSentBanner, setSosSentBanner] = useState<any | null>(null);
  const [liveGpsStreaming, setLiveGpsStreaming] = useState(true);

  // Equipment Borrow State
  const [borrowItems, setBorrowItems] = useState('2x Canopy Tents & 30x Monoblock Chairs');
  const [borrowPurpose, setBorrowPurpose] = useState('');
  const [borrowDate, setBorrowDate] = useState('2026-11-05');

  const handleFileRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqSubmitting(true);
    try {
      const cert = (fullData?.certificates || []).find((c: any) => c.id === certId);
      await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          residentId,
          residentName,
          contactNumber: residentProfile?.contactNumber || user?.contactNumber,
          purok: residentProfile?.purok || user?.purok,
          certificateId: certId,
          documentType: cert?.name || 'Barangay Clearance',
          purpose: purpose || 'Official Requirement',
          paymentMethod,
        }),
      });
      setPurpose('');
      onRefresh();
    } finally {
      setReqSubmitting(false);
    }
  };

  const handleAcknowledgeSubpoena = async (summonsId: string) => {
    await fetch(`/api/summons/${summonsId}/acknowledge`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    onRefresh();
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim() && !chatImageBase64) return;
    setSendingChat(true);
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          residentId,
          residentName,
          senderRole: 'Resident',
          senderName: residentName,
          message: chatText,
          imageBase64: chatImageBase64 || undefined,
          imageName: chatImageName || undefined,
        }),
      });
      setChatText('');
      setChatImageBase64('');
      setChatImageName('');
      onRefresh();
    } finally {
      setSendingChat(false);
    }
  };

  const handleSendEmergencySOS = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = residentProfile?.pinnedLocation?.lat || 6.66275;
    const lng = residentProfile?.pinnedLocation?.lng || 122.13485;
    const res = await fetch('/api/emergencies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        residentId,
        residentName,
        contactNumber: residentProfile?.contactNumber || '0917-542-1886',
        purok: residentProfile?.purok || 'Purok 1 - Aguinaldo Central',
        type: sosType,
        severity: sosSeverity,
        message:
          sosMessage ||
          `Immediate ${sosType} assistance needed at ${residentProfile?.pinnedLocation?.lotLabel || 'Aguinaldo St.'}!`,
        lat,
        lng,
        address: residentProfile?.address || 'Aguinaldo St., Purok 1, Brgy. Matatag, Lamitan City',
        photoBase64: sosPhotoBase64 || undefined,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setSosSentBanner(data.emergency);
      setSosMessage('');
      setSosPhotoBase64('');
      onRefresh();
    }
  };

  const handleFileBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/borrows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        residentId,
        residentName,
        contactNumber: residentProfile?.contactNumber || '0917-542-1886',
        itemsBorrowed: borrowItems,
        quantity: 1,
        borrowDate,
        returnDate: borrowDate,
        purpose: borrowPurpose || 'Community Activity in Barangay Matatag',
      }),
    });
    setBorrowPurpose('');
    onRefresh();
  };

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pb-24 space-y-6">
      {/* ==========================================
          URGENT SUBPOENA / SUMMONS ALERT BANNER (If Resident has been Subpoenaed)
      ========================================== */}
      {mySummons.map((sub: any) => (
        <div
          key={sub.id}
          className="rounded-3xl bg-gradient-to-r from-rose-950/95 via-amber-950/90 to-rose-950/95 border-2 border-rose-500 p-5 sm:p-6 shadow-2xl"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/30 border border-rose-400 px-3 py-0.5 text-xs font-mono font-black text-rose-200">
                <Scale className="w-4 h-4 text-amber-300" />
                ⚖️ OFFICIAL KATARUNGANG PAMBARANGAY SUBPOENA / SUMMONS ({sub.caseNumber})
              </div>
              <h3 className="text-lg sm:text-xl font-display font-extrabold text-white">
                You Have Been Formally Summoned by {sub.presidingOfficer}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200">
                <strong>Complainant:</strong> {sub.complainant} •{' '}
                <strong>Mandatory Hearing Schedule:</strong>{' '}
                <span className="text-amber-300 font-bold underline">
                  {new Date(sub.hearingSchedule).toLocaleString()}
                </span>
              </p>
              <p className="text-xs text-slate-300">
                <strong>Details:</strong> "{sub.incidentDetails}"
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {!sub.acknowledgedByResident ? (
                <button
                  type="button"
                  onClick={() => handleAcknowledgeSubpoena(sub.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Acknowledge Receipt of Subpoena
                </button>
              ) : (
                <span className="rounded-xl bg-emerald-500/20 border border-emerald-400/50 px-3.5 py-2 text-xs font-bold text-emerald-300">
                  ✅ Subpoena Acknowledged
                </span>
              )}
              <button
                type="button"
                onClick={() => onPrintDocument(sub, 'subpoena')}
                className="inline-flex items-center gap-1.5 rounded-xl btn-yakan-sapphire px-4 py-2.5 text-xs font-bold"
              >
                <Printer className="w-4 h-4" />
                View / Print Official Subpoena
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Top Resident Profile & Live GPS Status Header */}
      <div className="rounded-3xl yakan-glass-gold p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src="/logo.png"
            alt="Barangay Matatag Seal"
            className="w-20 h-20 object-contain seal-royal-glow shrink-0"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 text-[11px] font-mono font-bold text-emerald-300">
                VERIFIED RESIDENT • {residentId}
              </span>
              <span className="rounded-full bg-amber-500/20 border border-amber-400/40 px-2.5 py-0.5 text-[11px] font-mono font-bold text-amber-300">
                GOOGLE DRIVE VAULT: {residentProfile?.driveFolderName || 'Amir_K_Kalun_MTG001'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white mt-1">
              Assalamu Alaikum, {residentName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 flex flex-wrap items-center gap-2 mt-0.5">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                Pinned House:{' '}
                <strong className="text-amber-300">
                  {residentProfile?.pinnedLocation?.lotLabel || 'House #14-A, Aguinaldo St.'}
                </strong>{' '}
                ({residentProfile?.purok || 'Purok 1 - Aguinaldo Central'})
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setLiveGpsStreaming((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold border transition ${
              liveGpsStreaming
                ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                : 'bg-white/5 border-white/15 text-slate-400'
            }`}
          >
            <Radio className={`w-4 h-4 ${liveGpsStreaming ? 'text-emerald-400 animate-pulse' : ''}`} />
            {liveGpsStreaming ? 'Live GPS Location Active (Brgy. Protected)' : 'Live GPS Paused'}
          </button>

          <MagneticButton variant="crimson" onClick={() => setActiveTab('emergency')}>
            <Siren className="w-4 h-4" />
            1-Tap Emergency SOS
          </MagneticButton>
        </div>
      </div>

      {/* Navigation Tabs */}
      <GlidingYakanTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        layoutId="resident-portal-tabs"
        tabs={[
          {
            id: 'overview',
            label: 'My Requests & Certificates',
            badge: myRequests.length,
            icon: <FileText className="w-4 h-4" />,
          },
          {
            id: 'chat',
            label: 'Live Chat & Google Drive Vault',
            badge: myChats.length,
            icon: <MessageSquare className="w-4 h-4" />,
          },
          {
            id: 'emergency',
            label: 'Live Emergency SOS',
            icon: <Siren className="w-4 h-4 text-rose-400" />,
          },
          {
            id: 'map-id',
            label: '3D House Map & Digital ID',
            icon: <MapPin className="w-4 h-4 text-amber-400" />,
          },
          {
            id: 'borrows',
            label: 'Borrow Equipment & Alerts',
            badge: myNotifications.length,
            icon: <PackageCheck className="w-4 h-4" />,
          },
        ]}
      />

      {/* ==========================================
          TAB 1: MY REQUESTS & NEW DOCUMENT APPLICATION
      ========================================== */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: File New Request */}
          <div className="lg:col-span-5">
            <form
              onSubmit={handleFileRequest}
              className="rounded-3xl yakan-glass p-6 space-y-4 border border-amber-400/30"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-400" />
                  Request Barangay Document
                </h3>
                <span className="text-xs font-mono text-emerald-300">Auto MTG-2026-XXXX</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Certificate / Permit Type
                </label>
                <select
                  value={certId}
                  onChange={(e) => setCertId(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-white/15 px-3.5 py-2.5 text-sm text-white"
                >
                  {(fullData?.certificates || []).map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.fee === 0 ? 'FREE' : `₱${c.fee}.00`} ({c.processingDays})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-white/15 px-3.5 py-2.5 text-sm text-white"
                >
                  <option value="GCash">GCash (Instant E-OR)</option>
                  <option value="Maya">Maya</option>
                  <option value="Cash at Brgy Hall">Cash at Barangay Matatag Hall</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Specific Purpose
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter purpose (e.g. Employment, Scholarship, Business Renewal)..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-white/15 px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <MagneticButton
                type="submit"
                variant="crimson"
                className="w-full"
                disabled={reqSubmitting}
              >
                {reqSubmitting ? 'Submitting...' : 'Submit Application & Generate Code'}
              </MagneticButton>
            </form>
          </div>

          {/* Right: My Filed Requests */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-lg font-display font-bold text-white">
              My Document Applications ({myRequests.length})
            </h3>
            {myRequests.map((req: any) => (
              <div
                key={req.id}
                className="rounded-2xl yakan-glass p-5 border border-white/15 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-amber-300">
                        {req.trackingNumber}
                      </span>
                      <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[11px] text-slate-300">
                        10-Char: {req.shortCode}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white mt-0.5">{req.documentType}</h4>
                    <p className="text-xs text-slate-400">{req.purpose}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-xs font-bold text-emerald-300">
                      Stage {req.stage}/4 • {req.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => onPrintDocument(req, 'certificate')}
                      className="inline-flex items-center gap-1.5 rounded-xl btn-yakan-sapphire px-3 py-2 text-xs font-bold"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      QR PDF
                    </button>
                  </div>
                </div>
                <div className="text-xs text-slate-300 bg-white/5 rounded-xl p-2.5 flex justify-between">
                  <span>{req.remarks}</span>
                  <span className="font-mono text-amber-300">{req.orNumber}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: TWO-WAY LIVE CHAT + PERSONAL GOOGLE DRIVE MEDIA VAULT
      ========================================== */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chat Console */}
          <div className="lg:col-span-7 rounded-3xl yakan-glass p-5 sm:p-6 flex flex-col h-[560px]">
            <div className="flex items-center justify-between pb-4 border-b border-white/15">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Brgy Seal" className="w-10 h-10 object-contain" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Barangay Matatag 24/7 Live Helpdesk Chat
                  </h3>
                  <p className="text-xs text-emerald-400">
                    ● Connected in Real-Time • All uploaded images auto-save to your Google Drive folder
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
              {myChats.map((m: any) => {
                const isMe = m.senderRole === 'Resident';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl p-3.5 text-xs sm:text-sm ${
                        isMe
                          ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-br-none'
                          : 'bg-slate-900/95 border border-amber-400/35 text-slate-100 rounded-bl-none'
                      }`}
                    >
                      <div className="text-[10px] font-mono opacity-80 mb-1">
                        {m.senderName} • {new Date(m.createdAt).toLocaleTimeString()}
                      </div>
                      <p className="leading-relaxed">{m.message}</p>
                      {m.imageUrl && (
                        <div className="mt-2.5 space-y-1">
                          <img
                            src={m.imageUrl}
                            alt="Chat attachment"
                            className="max-h-48 rounded-xl border border-white/20 object-cover"
                          />
                          <div className="text-[10px] font-mono text-amber-300">
                            ☁️ Saved in Google Drive: /GoogleDrive_Vault/{m.driveFolderName}/
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {chatImageBase64 && (
              <div className="mb-2 flex items-center justify-between rounded-xl bg-amber-500/15 border border-amber-400/40 px-3 py-2 text-xs text-amber-200">
                <span>📎 Ready to upload to your Google Drive Vault: {chatImageName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setChatImageBase64('');
                    setChatImageName('');
                  }}
                  className="text-rose-400 font-bold"
                >
                  Remove
                </button>
              </div>
            )}

            <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-3 border-t border-white/15">
              <label className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 hover:bg-amber-500/25 border border-white/15 text-amber-300 cursor-pointer transition">
                <ImagePlus className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setChatImageName(f.name);
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === 'string') setChatImageBase64(reader.result);
                    };
                    reader.readAsDataURL(f);
                  }}
                />
              </label>
              <input
                type="text"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Type message to Barangay Matatag Staff or attach an image..."
                className="flex-1 rounded-xl bg-slate-950 border border-white/20 px-4 py-2.5 text-sm text-white"
              />
              <MagneticButton type="submit" variant="crimson" disabled={sendingChat}>
                <Send className="w-4 h-4" />
                Send
              </MagneticButton>
            </form>
          </div>

          {/* Right: Resident's Personal Google Drive Media Vault Folder */}
          <div className="lg:col-span-5 rounded-3xl yakan-glass-gold p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-white/15 pb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300">
                <FolderKanban className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-mono uppercase text-amber-300 font-bold">
                  PERSONAL CLOUD DATABASE FOLDER
                </div>
                <h3 className="text-lg font-display font-bold text-white">
                  Google Drive Vault: {residentProfile?.driveFolderName || 'Amir_K_Kalun_MTG001'}
                </h3>
                <p className="text-xs text-slate-300">
                  Folder ID: <code className="text-emerald-300">{residentProfile?.driveFolderId || 'GDRIVE-MTG-AMIRKALUN001'}</code>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Every photo you share in Live Chat, KYC ID/Selfie, or Emergency SOS attachment is automatically stored inside your dedicated account folder.
            </p>

            {myDriveFiles.length === 0 ? (
              <div className="rounded-2xl bg-slate-950/70 border border-dashed border-white/15 p-8 text-center text-xs text-slate-400">
                No images uploaded yet. Click the image icon in the chat box to upload a photo directly into your Google Drive folder!
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[360px] overflow-y-auto">
                {myDriveFiles.map((file: any) => (
                  <a
                    key={file.id}
                    href={file.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-2xl bg-slate-950/90 border border-white/15 overflow-hidden p-2 space-y-1.5 hover:border-amber-400 transition"
                  >
                    <img
                      src={file.publicUrl}
                      alt={file.originalName}
                      className="w-full h-28 object-cover rounded-xl"
                    />
                    <div className="text-[11px] font-bold text-white truncate">
                      {file.originalName}
                    </div>
                    <div className="text-[10px] font-mono text-emerald-400">
                      {file.category} • {(file.sizeBytes / 1024).toFixed(1)} KB
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: 1-TAP LIVE EMERGENCY SOS REPORTER
      ========================================== */}
      {activeTab === 'emergency' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-3xl yakan-glass-gold p-6 sm:p-8 border-2 border-rose-500/60 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/25 border border-rose-400 px-3 py-1 text-xs font-mono font-bold text-rose-200">
              <ShieldAlert className="w-4 h-4" /> 24/7 BARANGAY MATATAG &amp; BDRRMC COMMAND CENTER
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
              Broadcast Live Emergency SOS
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Your exact 3D Satellite Pinpoint (<strong className="text-amber-300">{residentProfile?.pinnedLocation?.lotLabel || 'Aguinaldo St.'}</strong>) and live GPS coordinates (<code className="text-emerald-300">{residentProfile?.pinnedLocation?.lat || 6.66275}° N, {residentProfile?.pinnedLocation?.lng || 122.13485}° E</code>) will be transmitted immediately to the Punong Barangay, BPAT Tanods, BFP Lamitan, and CDRRMO.
            </p>

            {sosSentBanner && (
              <div className="rounded-2xl bg-emerald-950/90 border-2 border-emerald-400 p-4 text-xs sm:text-sm text-emerald-100 space-y-1">
                <div className="font-bold text-emerald-300">
                  🚨 EMERGENCY SOS TRANSMITTED ({sosSentBanner.id})
                </div>
                <div>Status: {sosSentBanner.status}</div>
                <div>
                  Live Coordinates Sent: {sosSentBanner.lat.toFixed(5)}° N, {sosSentBanner.lng.toFixed(5)}° E
                </div>
              </div>
            )}

            <form onSubmit={handleSendEmergencySOS} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Emergency Category
                  </label>
                  <select
                    value={sosType}
                    onChange={(e) => setSosType(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-white/20 px-3.5 py-2.5 text-sm text-white"
                  >
                    <option value="Medical / Ambulance Rescue">Medical / Ambulance Rescue</option>
                    <option value="Fire / BFP Lamitan Alert">Fire / BFP Lamitan Alert</option>
                    <option value="Security / BPAT Tanod & PNP">Security / BPAT Tanod &amp; PNP</option>
                    <option value="Flood / Typhoon BDRRMC Evacuation">Flood / Typhoon BDRRMC Evacuation</option>
                    <option value="Electrical / BASELCO Line Hazard">Electrical / BASELCO Line Hazard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Severity Level
                  </label>
                  <select
                    value={sosSeverity}
                    onChange={(e) => setSosSeverity(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-white/20 px-3.5 py-2.5 text-sm text-white"
                  >
                    <option value="Critical">Critical (Immediate Life/Property Threat)</option>
                    <option value="High">High Priority</option>
                    <option value="Urgent">Urgent Assistance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Situation Details / Landmark Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the emergency situation..."
                  value={sosMessage}
                  onChange={(e) => setSosMessage(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-white/20 px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl btn-yakan-crimson py-4 text-base font-black uppercase tracking-wider text-white flex items-center justify-center gap-3 shadow-2xl"
              >
                <Siren className="w-6 h-6 animate-bounce" />
                TRANSMIT LIVE GPS EMERGENCY SOS NOW
              </button>
            </form>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <h3 className="text-lg font-display font-bold text-white">
              Active Emergency Dispatches in Barangay Matatag
            </h3>
            {(fullData?.emergencies || []).map((em: any) => (
              <div
                key={em.id}
                className="rounded-2xl yakan-glass p-5 border border-rose-500/40 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-rose-500/20 border border-rose-400 px-3 py-0.5 text-xs font-mono font-bold text-rose-300">
                    {em.severity} • {em.type}
                  </span>
                  <span className="text-xs font-mono text-emerald-300">{em.status}</span>
                </div>
                <div className="text-sm font-bold text-white">
                  {em.residentName} — {em.address}
                </div>
                <p className="text-xs text-slate-300">{em.message}</p>
                <div className="text-[11px] font-mono text-amber-300">
                  Live GPS: {Number(em.lat).toFixed(5)}° N, {Number(em.lng).toFixed(5)}° E •{' '}
                  {em.responderNotes}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 4: 3D SATELLITE HOUSE PINPOINT & DIGITAL RESIDENT ID
      ========================================== */}
      {activeTab === 'map-id' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5">
              <YakanTiltCard glowColor="gold" className="p-6 border-2 border-amber-400/50 space-y-4">
                <div className="flex items-center justify-between border-b border-white/15 pb-3">
                  <div className="flex items-center gap-2.5">
                    <img src="/logo.png" alt="Seal" className="w-12 h-12 object-contain" />
                    <div>
                      <div className="text-[10px] font-mono uppercase text-amber-300 font-bold">
                        REPUBLIC OF THE PHILIPPINES • BARMM 7302
                      </div>
                      <div className="text-sm font-display font-black text-white">
                        BARANGAY MATATAG DIGITAL ID
                      </div>
                    </div>
                  </div>
                  <IdCard className="w-6 h-6 text-rose-400" />
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="text-lg font-display font-extrabold text-white">
                    {residentName}
                  </div>
                  <div className="font-mono text-amber-300">
                    ID NO: {residentProfile?.nationalId || '7302-1886-0041-9921'}
                  </div>
                  <div className="text-slate-300">
                    <strong>Address:</strong>{' '}
                    {residentProfile?.address ||
                      'House #14-A, Aguinaldo St., Purok 1, Brgy. Matatag, Lamitan City'}
                  </div>
                  <div className="text-slate-300">
                    <strong>3D GIS Coordinates:</strong>{' '}
                    <span className="font-mono text-emerald-300">
                      {residentProfile?.pinnedLocation?.lat || 6.66275}° N,{' '}
                      {residentProfile?.pinnedLocation?.lng || 122.13485}° E
                    </span>
                  </div>
                </div>
              </YakanTiltCard>
            </div>

            <div className="lg:col-span-7">
              <SatelliteMapPinpointer
                mode="signup"
                selectedLocation={residentProfile?.pinnedLocation}
                onConfirmLocation={async (loc) => {
                  await fetch(`/api/residents/${residentId}/location`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      lat: loc.lat,
                      lng: loc.lng,
                      updatePin: true,
                      lotLabel: loc.lotLabel,
                      street: loc.street,
                      purok: loc.purok,
                      status: `Updated House Pin at ${loc.lotLabel}`,
                    }),
                  });
                  onRefresh();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 5: EQUIPMENT BORROWING & NOTIFICATIONS
      ========================================== */}
      {activeTab === 'borrows' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <form
              onSubmit={handleFileBorrow}
              className="rounded-3xl yakan-glass p-6 space-y-4 border border-white/15"
            >
              <h3 className="text-lg font-display font-bold text-white">
                Reserve Barangay Facilities / Equipment
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Equipment / Facility to Borrow
                </label>
                <select
                  value={borrowItems}
                  onChange={(e) => setBorrowItems(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-white/15 px-3.5 py-2.5 text-sm text-white"
                >
                  <option value="2x Canopy Tents & 30x Monoblock Chairs">
                    2x Canopy Tents &amp; 30x Monoblock Chairs
                  </option>
                  <option value="1x Portable PA Sound System & Wireless Mics">
                    1x Portable PA Sound System &amp; Wireless Mics
                  </option>
                  <option value="1x Emergency Solar Generator (2000W)">
                    1x Emergency Solar Generator (2000W)
                  </option>
                  <option value="Aguinaldo St. Covered Court / Pickleball Court Schedule">
                    Aguinaldo St. Covered Court / Pickleball Court Schedule
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Date Needed
                </label>
                <input
                  type="date"
                  value={borrowDate}
                  onChange={(e) => setBorrowDate(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-white/15 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Event / Purpose
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Purok 1 Assembly or Family Gathering"
                  value={borrowPurpose}
                  onChange={(e) => setBorrowPurpose(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-white/15 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <MagneticButton type="submit" variant="crimson" className="w-full">
                Submit Borrow Reservation
              </MagneticButton>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-lg font-display font-bold text-white">
              My Equipment Reservations &amp; Account Notifications
            </h3>
            {myBorrows.map((b: any) => (
              <div
                key={b.id}
                className="rounded-2xl yakan-glass p-4 border border-white/15 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="text-sm font-bold text-white">{b.itemsBorrowed}</div>
                  <div className="text-xs text-slate-400">
                    Date: {b.borrowDate} • Purpose: {b.purpose}
                  </div>
                </div>
                <span className="rounded-full bg-amber-500/20 border border-amber-400/40 px-3 py-1 text-xs font-bold text-amber-300">
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
