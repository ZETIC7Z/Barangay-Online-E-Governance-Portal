// Prepares official media for the portal:
//  - Chairwoman portrait (clean upscale + light enhancement, no face alteration)
//  - Events & Activities slider images (Brgy/SK Matatag public album + user-provided photos)
//  - Desktop intro video
// Re-run with: node scripts/prepare-media.mjs
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const UPLOADS = 'C:/Users/ZETICUZ/.gemini/antigravity/brain/030e3452-ca86-4417-b8fc-f3636ef9dead/.user_uploaded';
const FB_DIR = 'C:/Users/ZETICUZ/.gemini/antigravity/brain/030e3452-ca86-4417-b8fc-f3636ef9dead/scratch/fb';
const PUBLIC_DIR = path.resolve('public');
const OFFICIALS_DIR = path.join(PUBLIC_DIR, 'officials');
const EVENTS_DIR = path.join(PUBLIC_DIR, 'events');
const INTRO_DIR = path.join(PUBLIC_DIR, 'intro');

for (const d of [OFFICIALS_DIR, EVENTS_DIR, INTRO_DIR]) fs.mkdirSync(d, { recursive: true });

// Gentle "restore" pipeline: Lanczos upscale, denoise via slight median, local contrast, unsharp mask.
async function enhance(input, { scale = 2, maxWidth = 1400, median = 3, saturation = 1.06 } = {}) {
  const meta = await sharp(input).metadata();
  const targetW = Math.min(maxWidth, Math.round(meta.width * scale));
  return sharp(input)
    .resize({ width: targetW, kernel: sharp.kernel.lanczos3 })
    .median(median)
    .clahe({ width: 64, height: 64, maxSlope: 2 })
    .modulate({ brightness: 1.03, saturation })
    .sharpen({ sigma: 1.1, m1: 0.6, m2: 2.2 });
}

// 1) Chairwoman Hon. Hulma G. Abdurahman — square portrait crop focused on face/upper body.
{
  const src = path.join(UPLOADS, 'media_1793189210866_92f79788.png');
  const buf = await (await enhance(src, { scale: 3, maxWidth: 1146, median: 3, saturation: 1.04 })).toBuffer();
  const m = await sharp(buf).metadata();
  const size = Math.min(m.width, m.height);
  // Keep the face centred horizontally (subject is centred in the source) and anchored to the top.
  await sharp(buf)
    .extract({ left: Math.round((m.width - size) / 2), top: 0, width: size, height: size })
    .resize(800, 800)
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(path.join(OFFICIALS_DIR, 'off-1.jpg'));
  console.log('Chairwoman portrait ready');
}

// Remove previous AI-generated placeholder portraits (they did not depict the real officials).
for (let i = 2; i <= 13; i++) {
  const f = path.join(OFFICIALS_DIR, `off-${i}.jpg`);
  if (fs.existsSync(f)) fs.unlinkSync(f);
}

// 2) Events & Activities slider images.
const events = [
  { from: path.join(UPLOADS, 'media_1793189954099_41da00a7.jpg'), out: 'event-01.jpg', restore: true },
  { from: path.join(FB_DIR, 'fb-28.jpg'), out: 'event-02.jpg' },
  { from: path.join(FB_DIR, 'fb-32.jpg'), out: 'event-03.jpg' },
  { from: path.join(UPLOADS, 'media_1793189917034_6bd21b0f.jpg'), out: 'event-04.jpg', restore: true },
  { from: path.join(FB_DIR, 'fb-02.jpg'), out: 'event-05.jpg' },
  { from: path.join(FB_DIR, 'fb-34.jpg'), out: 'event-06.jpg' },
  { from: path.join(FB_DIR, 'fb-14.jpg'), out: 'event-07.jpg' },
  { from: path.join(FB_DIR, 'fb-30.jpg'), out: 'event-08.jpg' },
  { from: path.join(FB_DIR, 'fb-13.jpg'), out: 'event-09.jpg' },
  { from: path.join(FB_DIR, 'fb-33.jpg'), out: 'event-10.jpg' },
  { from: path.join(FB_DIR, 'fb-17.jpg'), out: 'event-11.jpg' },
];

for (const e of events) {
  // Slider cards are 3:4 portrait; output 900x1200 so they stay crisp on HiDPI screens.
  const base = e.restore
    ? await (await enhance(e.from, { scale: 2.2, maxWidth: 2000, median: 3, saturation: 1.08 })).toBuffer()
    : await sharp(e.from).toBuffer();
  await sharp(base)
    .resize(900, 1200, { fit: 'cover', position: sharp.strategy.attention })
    .sharpen({ sigma: 0.6 })
    .jpeg({ quality: 86, mozjpeg: true, progressive: true })
    .toFile(path.join(EVENTS_DIR, e.out));
  console.log('Event image ready:', e.out);
}

// 3) Desktop intro video.
fs.copyFileSync('C:/Users/ZETICUZ/Downloads/gemini_generated_video_e2e1c83c.mp4', path.join(INTRO_DIR, 'intro.mp4'));
console.log('Intro video copied');
