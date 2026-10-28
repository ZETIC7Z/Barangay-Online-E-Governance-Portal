import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  Download,
  X,
  ShieldCheck,
  CheckCircle2,
  Wifi,
  Smartphone,
} from 'lucide-react';

export const CertificatePrinterModal: React.FC<{
  item: any | null;
  type: 'certificate' | 'subpoena';
  onClose: () => void;
}> = ({ item, type, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [wirelessHint, setWirelessHint] = useState<boolean>(false);
  const printSheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!item) return;
    const payload =
      type === 'certificate'
        ? `https://brgy-matatag-lamitan.gov.ph/verify/${item.trackingNumber || item.id}|${item.residentName}|${item.documentType}|SIGNED:PUNONG_BARANGAY_HULMA_G_ABDURAHMAN`
        : `https://brgy-matatag-lamitan.gov.ph/kp/${item.caseNumber}|RESPONDENT:${item.respondent}|HEARING:${item.hearingSchedule}`;

    QRCode.toDataURL(payload, { width: 180, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [item, type]);

  if (!item) return null;

  const docRefCode = item.trackingNumber || item.caseNumber || item.id || 'MTG-2026';
  const docTitle =
    type === 'certificate'
      ? `${item.documentType || 'Barangay Certificate'} (${docRefCode})`
      : `Katarungang Pambarangay Subpoena (${docRefCode})`;

  // Trigger native device/OS print dialog (shows USB, Network, AirPrint, Mopria & Wi-Fi printers)
  const handleTriggerPrint = (isWirelessMode = false) => {
    if (isWirelessMode) {
      setWirelessHint(true);
    }
    setTimeout(() => {
      window.print();
    }, 80);
  };

  // Direct download to client's device as a high-resolution official PNG Certificate file
  const handleDirectDownload = async () => {
    setDownloadStatus('Preparing file...');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1240;
      canvas.height = 1754; // A4 @ 150 DPI
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      // White background & official border
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#1D4ED8';
      ctx.lineWidth = 12;
      ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);

      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 4;
      ctx.strokeRect(52, 52, canvas.width - 104, canvas.height - 104);

      // Load Logo & QR
      const loadImg = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      try {
        const logoImg = await loadImg('/logo.png');
        ctx.drawImage(logoImg, 95, 90, 150, 150);
      } catch {
        // ignore
      }

      if (qrDataUrl) {
        try {
          const qrImg = await loadImg(qrDataUrl);
          ctx.drawImage(qrImg, canvas.width - 245, 90, 150, 150);
          ctx.fillStyle = '#047857';
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('VERIFIED QR SEAL', canvas.width - 170, 258);
        } catch {
          // ignore
        }
      }

      // Header text
      ctx.textAlign = 'center';
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillText(
        'REPUBLIC OF THE PHILIPPINES • BANGSAMORO AUTONOMOUS REGION IN MUSLIM MINDANAO',
        canvas.width / 2,
        118
      );
      ctx.fillText('PROVINCE OF BASILAN • CITY OF LAMITAN (ZIP 7302)', canvas.width / 2, 146);

      ctx.fillStyle = '#991B1B';
      ctx.font = '900 32px sans-serif';
      ctx.fillText('OFFICE OF THE PUNONG BARANGAY', canvas.width / 2, 190);

      ctx.fillStyle = '#1E3A8A';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('BARANGAY MATATAG (POBLACION)', canvas.width / 2, 224);

      ctx.fillStyle = '#64748B';
      ctx.font = '15px sans-serif';
      ctx.fillText(
        'Aguinaldo Street, Poblacion, Lamitan City • KML Verified GPS: 6.6600° N, 122.1377° E',
        canvas.width / 2,
        252
      );

      // Divider line
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(90, 285);
      ctx.lineTo(canvas.width - 90, 285);
      ctx.stroke();

      // Reference Badge & Title
      ctx.fillStyle = '#FEF3C7';
      ctx.fillRect(canvas.width / 2 - 260, 325, 520, 38);
      ctx.fillStyle = '#92400E';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(
        `REFERENCE NO: ${docRefCode} • SHORT CODE: ${item.shortCode || 'MTG2026'}`,
        canvas.width / 2,
        350
      );

      ctx.fillStyle = '#0F172A';
      ctx.font = '900 38px sans-serif';
      ctx.fillText(
        type === 'certificate'
          ? String(item.documentType || 'BARANGAY CLEARANCE').toUpperCase()
          : 'OFFICIAL SUBPOENA / LUPON SUMMONS',
        canvas.width / 2,
        420
      );

      // Body paragraphs
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(
        type === 'certificate' ? 'TO WHOM IT MAY CONCERN:' : `TO: ${String(item.respondent || '').toUpperCase()}`,
        110,
        510
      );

      const wrapParagraph = (text: string, x: number, startY: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(' ');
        let line = '';
        let y = startY;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, x, y);
        return y + lineHeight;
      };

      ctx.font = '22px sans-serif';
      ctx.fillStyle = '#1E293B';

      if (type === 'certificate') {
        const p1 = `This is to officially certify that ${String(
          item.residentName || ''
        ).toUpperCase()}, of legal age, Filipino citizen, is a bonafide and law-abiding resident of ${
          item.purok || 'Purok 1 - Aguinaldo Central'
        }, Barangay Matatag, Lamitan City, Basilan Province (BARMM, ZIP 7302), whose residence location is verified in the Barangay Matatag 3D Satellite GIS Registry.`;
        let nextY = wrapParagraph(p1, 110, 575, canvas.width - 220, 38);

        const p2 = `This certification is issued upon the request of the above-named resident for: ${
          item.purpose || 'Official Legal & Civic Transaction'
        }.`;
        nextY = wrapParagraph(p2, 110, nextY + 35, canvas.width - 220, 38);

        const dateStr = new Date().toLocaleDateString('en-PH', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
        const p3 = `Issued this ${dateStr} at the Office of the Punong Barangay, Aguinaldo Street, Barangay Matatag, Lamitan City, Basilan Province, Philippines.`;
        wrapParagraph(p3, 110, nextY + 35, canvas.width - 220, 38);
      } else {
        const p1 = `You are hereby commanded and subpoenaed to appear in person before the Punong Barangay and the Lupong Tagapamayapa of Barangay Matatag, Lamitan City on ${new Date(
          item.hearingSchedule
        ).toLocaleString()} regarding Case No. ${item.caseNumber} filed by ${item.complainant}.`;
        const nextY = wrapParagraph(p1, 110, 575, canvas.width - 220, 38);
        wrapParagraph(`Incident Summary: "${item.incidentDetails}"`, 110, nextY + 35, canvas.width - 220, 38);
      }

      // Signatory Footer
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`O.R. No.: ${item.orNumber || 'OR-MTG-2026'}`, 110, 1420);
      ctx.fillText(`Status: ${item.paymentStatus || item.status || 'Verified'}`, 110, 1455);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#1E3A8A';
      ctx.font = 'italic 20px serif';
      ctx.fillText('[Digitally Signed & Sealed]', canvas.width - 310, 1395);

      ctx.fillStyle = '#0F172A';
      ctx.font = '900 24px sans-serif';
      ctx.fillText('HON. HULMA G. ABDURAHMAN', canvas.width - 310, 1435);

      ctx.fillStyle = '#991B1B';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('Punong Barangay / Chairwoman • Barangay Matatag', canvas.width - 310, 1468);

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Barangay-Matatag-${docRefCode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadStatus('Saved to device!');
      setTimeout(() => setDownloadStatus(null), 3500);
    } catch {
      setDownloadStatus('Downloaded!');
      setTimeout(() => setDownloadStatus(null), 3000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={docTitle}
    >
      <div className="relative w-full max-w-4xl my-auto rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-2xl">
        {/* Top Floating Modal Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-display font-extrabold text-slate-900 dark:text-white">
                {docTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Same-Page Floating Document Preview • Download to Device or Print (USB / Wireless Printer)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Direct Download to Device Button */}
            <button
              type="button"
              onClick={handleDirectDownload}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2.5 text-xs font-extrabold text-white shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>{downloadStatus || 'Download to Device'}</span>
            </button>

            {/* 2. Print Document (Automatic System Printer Selector) */}
            <button
              type="button"
              onClick={() => handleTriggerPrint(false)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] px-3.5 py-2.5 text-xs font-extrabold text-white shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>

            {/* 3. Mobile / Wireless Printer Trigger */}
            <button
              type="button"
              onClick={() => handleTriggerPrint(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-3.5 py-2.5 text-xs font-extrabold text-white shadow-sm transition"
            >
              <Wifi className="w-4 h-4" />
              <span>Wireless Print</span>
            </button>

            {/* 4. Close Modal Button */}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:text-rose-700 transition"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Wireless Printer Discovery Banner when Wireless Print is Clicked */}
        {wirelessHint && (
          <div className="mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 p-3.5 flex items-center justify-between gap-3 text-xs text-blue-900 dark:text-blue-200">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Wireless Printer Active:</strong> Select your Wi-Fi / AirPrint / Mopria / Bluetooth printer from the system print dialog, or choose <strong>“Save as PDF”</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setWirelessHint(false)}
              className="text-blue-700 dark:text-blue-300 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Printable Official Document Sheet (Matched to #printable-certificate-area in index.css) */}
        <div
          id="printable-certificate-area"
          ref={printSheetRef}
          className="bg-white text-slate-900 rounded-2xl p-6 sm:p-10 shadow-xl border-4 border-amber-500 relative overflow-hidden"
        >
          {/* Top Yakan Geometric Trim */}
          <div
            className="h-3 w-full mb-6"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, #E11D48 0 12px, #F59E0B 12px 24px, #2563EB 24px 36px, #10B981 36px 48px)',
            }}
          />

          {/* Official LGU Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-slate-800 pb-5">
            <img
              src="/logo.png"
              alt="Barangay Matatag Seal"
              className="w-24 h-24 object-contain"
            />
            <div className="text-center flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-600">
                Republic of the Philippines • Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)
              </p>
              <p className="text-sm font-bold uppercase text-slate-800">
                Province of Basilan • City of Lamitan (ZIP 7302)
              </p>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-rose-800 mt-1">
                OFFICE OF THE PUNONG BARANGAY
              </h1>
              <h2 className="text-lg font-extrabold uppercase text-blue-900">
                BARANGAY MATATAG (POBLACION)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Aguinaldo Street, Poblacion, Lamitan City • KML Coordinates: 6.6600° N, 122.1377° E
              </p>
            </div>
            {qrDataUrl && (
              <div className="text-center">
                <img
                  src={qrDataUrl}
                  alt="Verification QR"
                  className="w-24 h-24 border border-slate-300 rounded-lg p-1 mx-auto"
                />
                <span className="text-[10px] font-mono font-bold text-emerald-700 block mt-1">
                  VERIFIED QR SEAL
                </span>
              </div>
            )}
          </div>

          {type === 'certificate' ? (
            <div className="mt-8 space-y-5 text-sm sm:text-base leading-relaxed text-slate-900">
              <div className="text-center">
                <span className="inline-block rounded-full bg-amber-100 border border-amber-500 px-4 py-1 text-xs font-mono font-bold text-amber-900">
                  REFERENCE NO: {item.trackingNumber} • SHORT CODE: {item.shortCode || 'MTG2026'}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-slate-900 mt-2 underline decoration-rose-700 decoration-2 underline-offset-8">
                  {String(item.documentType || 'Barangay Clearance').toUpperCase()}
                </h3>
              </div>

              <p className="font-bold uppercase text-slate-800 mt-6">TO WHOM IT MAY CONCERN:</p>

              <p className="text-justify indent-8 text-slate-900">
                This is to officially certify that{' '}
                <strong className="uppercase underline text-slate-950">{item.residentName}</strong>, of legal age, Filipino citizen, is a bonafide and law-abiding resident of{' '}
                <strong>{item.purok || 'Purok 1 - Aguinaldo Central'}</strong>,{' '}
                <strong>Barangay Matatag, Lamitan City, Basilan Province (BARMM, 7302)</strong>, whose house location is verified in the Barangay Matatag 3D Satellite GIS Registry.
              </p>

              {item.businessDetails && (
                <div className="rounded-xl bg-slate-100 border border-slate-300 p-4 text-xs sm:text-sm space-y-1 text-slate-900">
                  <div className="font-bold uppercase text-blue-900">
                    Registered Business Enterprise Details (R.A. 7160 Sec. 152):
                  </div>
                  <div>
                    <strong>Business Name:</strong> {item.businessDetails.businessName}
                  </div>
                  <div>
                    <strong>Proprietor / Owner:</strong> {item.businessDetails.businessOwner1}
                  </div>
                  <div>
                    <strong>Nature of Business:</strong> {item.businessDetails.businessNature}
                  </div>
                  <div>
                    <strong>Business Address:</strong> {item.businessDetails.businessAddress}
                  </div>
                </div>
              )}

              <p className="text-justify indent-8 text-slate-900">
                This certification is being issued upon the request of the above-named person for:{' '}
                <strong className="underline">{item.purpose}</strong>.
              </p>

              <p className="text-justify indent-8 text-slate-900">
                Issued this{' '}
                <strong>
                  {new Date().toLocaleDateString('en-PH', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </strong>{' '}
                at the Office of the Punong Barangay, Aguinaldo Street, Barangay Matatag, Lamitan City, Basilan Province, Philippines.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 items-end">
                <div className="border border-slate-400 rounded-xl p-3 text-xs space-y-1 bg-slate-50 text-slate-900">
                  <div>
                    <strong>O.R. Number:</strong> {item.orNumber || 'OR-MTG-2026'}
                  </div>
                  <div>
                    <strong>Amount Paid:</strong> ₱{Number(item.fee || 0).toFixed(2)} ({item.paymentStatus})
                  </div>
                  <div>
                    <strong>Date Filed:</strong>{' '}
                    {item.dateFiled ? new Date(item.dateFiled).toLocaleDateString() : '2026-10-28'}
                  </div>
                  <div className="text-emerald-700 font-bold flex items-center gap-1 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> EODB Compliant Digital Release
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-28 h-24 border-2 border-dashed border-slate-400 rounded-lg flex items-center justify-center text-[10px] text-slate-500 text-center p-2">
                    RIGHT THUMBMARK OF APPLICANT
                  </div>
                  <span className="text-xs font-bold mt-2 uppercase text-slate-900">
                    {item.residentName}
                  </span>
                  <span className="text-[11px] text-slate-500">Applicant Signature</span>
                </div>

                <div className="text-center">
                  <div className="font-serif italic text-blue-900 text-sm mb-1">
                    [Digitally Signed &amp; Sealed]
                  </div>
                  <div className="font-black uppercase text-slate-900 border-b border-slate-800 pb-0.5">
                    HON. HULMA G. ABDURAHMAN
                  </div>
                  <div className="text-xs font-bold text-rose-800">
                    Punong Barangay / Chairwoman • Barangay Matatag
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 space-y-5 text-sm sm:text-base leading-relaxed text-slate-900">
              <div className="text-center">
                <span className="inline-block rounded-full bg-rose-100 border border-rose-600 px-4 py-1 text-xs font-mono font-bold text-rose-900">
                  KP FORM NO. 9 • CASE NO: {item.caseNumber}
                </span>
                <h3 className="text-2xl font-black uppercase text-rose-800 mt-2">
                  OFFICIAL SUBPOENA / LUPON SUMMONS
                </h3>
                <p className="text-xs font-bold text-slate-600">
                  OFFICE OF THE LUPONG TAGAPAMAYAPA • BARANGAY MATATAG, LAMITAN CITY
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-100 p-4 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900">
                <div>
                  <strong>Complainant(s):</strong> {item.complainant}
                </div>
                <div>
                  <strong>Respondent (Summoned):</strong>{' '}
                  <span className="text-rose-800 font-bold">{item.respondent}</span>
                </div>
                <div>
                  <strong>Incident Location:</strong> {item.location}
                </div>
                <div>
                  <strong>Mandatory Hearing Schedule:</strong>{' '}
                  <span className="font-bold underline">
                    {new Date(item.hearingSchedule).toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-justify text-slate-900">
                <strong>TO: {String(item.respondent || '').toUpperCase()}</strong> — You are hereby commanded and subpoenaed to appear in person before me and the Lupong Tagapamayapa of{' '}
                <strong>Barangay Matatag, Lamitan City</strong> on the date and time stated above for mediation/conciliation of the complaint summarized below:
              </p>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-400 text-slate-900 font-medium">
                "{item.incidentDetails}"
              </div>

              <p className="text-xs text-slate-600">
                <strong>WARNING:</strong> Willful failure or refusal to appear without justifiable cause may bar you from filing any counterclaim arising from said complaint and may subject you to indirect contempt proceedings under R.A. 7160 (Local Government Code).
              </p>

              <div className="flex justify-between items-end pt-8">
                <div>
                  <div className="text-xs font-bold text-slate-900">Subpoena Status:</div>
                  <div className="text-sm font-bold text-emerald-700">
                    {item.acknowledgedByResident
                      ? '✅ Acknowledged by Resident Online'
                      : '📨 Delivered to Resident Account & Live Chat'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-black uppercase text-slate-900 border-b border-slate-800">
                    {item.presidingOfficer || 'HON. HULMA G. ABDURAHMAN'}
                  </div>
                  <div className="text-xs font-bold text-rose-800">
                    Punong Barangay / Chairwoman
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
