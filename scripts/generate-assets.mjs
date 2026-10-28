import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const SOURCE_LOGO = 'C:/Users/ZETICUZ/.gemini/antigravity/brain/030e3452-ca86-4417-b8fc-f3636ef9dead/.user_uploaded/media_1793188548898_3d3d47c9.jpg';
const PUBLIC_DIR = path.resolve('public');
const DOWNLOADS_DIR = path.join(PUBLIC_DIR, 'downloads');

fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

async function buildAssets() {
  console.log('Processing official Barangay Matatag 3D Seal...');
  const img = sharp(SOURCE_LOGO);
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Flood-fill from all 4 outer borders to remove the solid black outer background
  // while preserving 100% of dark colors inside the seal itself!
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const isBgPixel = (idx) => {
    const r = data[idx * 4];
    const g = data[idx * 4 + 1];
    const b = data[idx * 4 + 2];
    const max = Math.max(r, g, b);
    return max < 28;
  };

  const push = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const pos = y * width + x;
    if (visited[pos]) return;
    if (isBgPixel(pos)) {
      visited[pos] = 1;
      queue[tail++] = pos;
    }
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  while (head < tail) {
    const pos = queue[head++];
    const x = pos % width;
    const y = (pos / width) | 0;
    data[pos * 4 + 3] = 0; // transparent

    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  // Feather 1-2px edge around flood-filled region for ultra-clean anti-aliasing
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pos = y * width + x;
      if (!visited[pos]) {
        const neighbors =
          visited[pos - 1] +
          visited[pos + 1] +
          visited[pos - width] +
          visited[pos + width];
        if (neighbors > 0) {
          const r = data[pos * 4];
          const g = data[pos * 4 + 1];
          const b = data[pos * 4 + 2];
          const lum = Math.max(r, g, b);
          if (lum < 65) {
            data[pos * 4 + 3] = Math.min(255, Math.floor((lum / 65) * 255));
          }
        }
      }
    }
  }

  const transparentSealBuffer = await sharp(data, {
    raw: { width, height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toBuffer();

  // Save main transparent logo
  await fs.promises.writeFile(path.join(PUBLIC_DIR, 'logo.png'), transparentSealBuffer);

  // Generate 512x512, 192x192, 180x180, 32x32 PNG icons
  await sharp(transparentSealBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 6, g: 9, b: 19, alpha: 0 } })
    .png()
    .toFile(path.join(PUBLIC_DIR, 'pwa-512x512.png'));

  await sharp(transparentSealBuffer)
    .resize(192, 192, { fit: 'contain', background: { r: 6, g: 9, b: 19, alpha: 0 } })
    .png()
    .toFile(path.join(PUBLIC_DIR, 'pwa-192x192.png'));

  await sharp(transparentSealBuffer)
    .resize(180, 180, { fit: 'contain', background: { r: 6, g: 9, b: 19, alpha: 1 } })
    .png()
    .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));

  const fav32 = await sharp(transparentSealBuffer)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await fs.promises.writeFile(path.join(PUBLIC_DIR, 'favicon-32x32.png'), fav32);

  // Build valid .ico file wrapping the 32x32 PNG
  const icoHeader = Buffer.alloc(22);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // ICO type
  icoHeader.writeUInt16LE(1, 4); // 1 image
  icoHeader.writeUInt8(32, 6);   // width
  icoHeader.writeUInt8(32, 7);   // height
  icoHeader.writeUInt8(0, 8);    // color palette
  icoHeader.writeUInt8(0, 9);    // reserved
  icoHeader.writeUInt16LE(1, 10);// color planes
  icoHeader.writeUInt16LE(32, 12);// bpp
  icoHeader.writeUInt32LE(fav32.length, 14); // size
  icoHeader.writeUInt32LE(22, 18); // offset
  await fs.promises.writeFile(path.join(PUBLIC_DIR, 'favicon.ico'), Buffer.concat([icoHeader, fav32]));

  // Build 1200x630 OpenGraph Social Share Banner with Official Seal + Yakan Weave & Title
  const ogSvg = Buffer.from(`
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#060913"/>
          <stop offset="55%" stop-color="#0c152c"/>
          <stop offset="100%" stop-color="#190a19"/>
        </linearGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#F59E0B"/>
          <stop offset="50%" stop-color="#FDE047"/>
          <stop offset="100%" stop-color="#F59E0B"/>
        </linearGradient>
        <pattern id="yakan" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="#E11D48" stroke-width="1.2" stroke-opacity="0.22"/>
          <path d="M20 8 L32 20 L20 32 L8 20 Z" fill="none" stroke="#F59E0B" stroke-width="1" stroke-opacity="0.18"/>
        </pattern>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      <rect width="1200" height="630" fill="url(#yakan)"/>
      <rect x="0" y="0" width="1200" height="10" fill="url(#gold)"/>
      <rect x="0" y="620" width="1200" height="10" fill="#E11D48"/>
      <circle cx="240" cy="315" r="210" fill="#2563EB" fill-opacity="0.16"/>
      <text x="480" y="185" fill="#FDE047" font-family="sans-serif" font-size="22" font-weight="bold" letter-spacing="4">REPUBLIC OF THE PHILIPPINES • BARMM • ZIP 7302</text>
      <text x="480" y="265" fill="#FFFFFF" font-family="sans-serif" font-size="64" font-weight="900">BARANGAY MATATAG</text>
      <text x="480" y="325" fill="#E11D48" font-family="sans-serif" font-size="34" font-weight="bold">LAMITAN CITY, BASILAN PROVINCE</text>
      <text x="480" y="395" fill="#cbd5e1" font-family="sans-serif" font-size="24">Smart 3D E-Governance &amp; Digital Resident Services Portal</text>
      <text x="480" y="435" fill="#94a3b8" font-family="sans-serif" font-size="20">24/7 Document Requests • Zero-Login Tracking • 3D Satellite GIS • Live SOS</text>
      <rect x="480" y="475" width="380" height="52" rx="26" fill="#E11D48"/>
      <text x="670" y="508" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="21" font-weight="bold">WOVEN WITH YAKAN TENNUN HERITAGE</text>
    </svg>
  `);

  const sealResized = await sharp(transparentSealBuffer).resize(360, 360).toBuffer();
  await sharp(ogSvg)
    .composite([{ input: sealResized, left: 65, top: 135 }])
    .png()
    .toFile(path.join(PUBLIC_DIR, 'og-banner.png'));

  // Build Official Barangay Matatag Android APK Bundle in public/downloads/Barangay-Matatag-Smart-Portal.apk
  const apkPath = path.join(DOWNLOADS_DIR, 'Barangay-Matatag-Smart-Portal.apk');
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(apkPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);

    const manifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="ph.gov.lamitan.brgymatatag.portal"
    android:versionCode="200"
    android:versionName="2.0.0-MATATAG">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.CAMERA" />
    <application
        android:label="Barangay Matatag Smart Portal"
        android:icon="@mipmap/ic_launcher"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">
        <activity android:name=".MainActivity" android:exported="true" android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

    archive.append(manifestXml, { name: 'AndroidManifest.xml' });
    archive.append(transparentSealBuffer, { name: 'res/mipmap-xxxhdpi/ic_launcher.png' });
    archive.append(
      JSON.stringify(
        {
          appId: 'ph.gov.lamitan.brgymatatag.portal',
          appName: 'Barangay Matatag Smart E-Governance Portal',
          barangay: 'Barangay Matatag',
          city: 'Lamitan City',
          province: 'Basilan Province',
          region: 'BARMM',
          zip: '7302',
          coordinates: { lat: 6.6625, lng: 122.1347 },
          developer: 'ZETICUZ',
          version: '2.0.0',
          displayMode: 'fullscreen-edge-to-edge',
        },
        null,
        2
      ),
      { name: 'assets/webapk-config.json' }
    );
    archive.finalize();
  });

  console.log('All Barangay Matatag 3D Seal icons, OG Banner, and Android APK generated successfully!');
}

buildAssets().catch((err) => {
  console.error('Asset generation error:', err);
  process.exit(1);
});
