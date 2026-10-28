# AGENT.md — Barangay Matatag Smart E-Governance System (Persistent Project Memory)

> **AUTO-LOAD & AUTO-UPDATE DIRECTIVE**: Every AI agent working in `c:\Users\ZETICUZ\Documents\smart brgy` MUST read this `AGENT.md` at the start of a session and keep it updated whenever new features, routes, assets, or architectural changes are made.

---

## 1. Developer Identity & Global Signature (`ZETICUZ`)
- **Lead Developer**: **Sam Pangilinan** (`ZETICUZ`)
- **Portfolio URL**: `https://www.zeticuz.xyz/`
- **Developer Logo**:
  - Source path: `C:\Users\ZETICUZ\Downloads\zeticuz-logo.svg`
  - Project public path: `public/zeticuz-logo.svg`
- **Footer Signature Standard**:
  - Centered at the very bottom of the footer (`src/pages/PublicLanding.tsx`):
  - Dark pill `[ZETICUZ Logo] SITE DEVELOPED BY: Sam Pangilinan · © 2026` (`className="zeticuz-dev-pill"`)
  - Interactive button below (`Explore Developer Portfolio & Projects ↗`) that opens `https://www.zeticuz.xyz/` in a new tab without showing the raw URL text.

---

## 2. Barangay Profile & Verified Geographic Coordinates
- **Barangay**: Barangay Matatag, Lamitan City, Province of Basilan, BARMM (ZIP Code `7302`)
- **Barangay Hall Exact Coordinates** (from user's Google Earth KML `Untitled KML file.kml`):
  - **Latitude**: `6.6599999`
  - **Longitude**: `122.1377029`
- **Barangay Matatag Exact 4-Corner Boundary Polygon (`BRGY_MATATAG_BOUNDARY_POLYGON`)**:
  1. `[6.6631643, 122.1342636]` (North-West Corner)
  2. `[6.6574351, 122.1337571]` (South-West Corner)
  3. `[6.6568478, 122.1419139]` (South-East Corner)
  4. `[6.6631109, 122.1422829]` (North-East Corner)
- **Official Sangguniang Barangay Roster (DILG Verified)**:
  - **Punong Barangay (Chairwoman)**: `Hon. Hulma G. Abdurahman` (`public/officials/off-1.jpg` — cleaned & enhanced portrait)
  - **Sangguniang Barangay Members (Kagawads)**:
    1. `Hon. Benhar A. Jubail`
    2. `Hon. Diding M. Sabtula`
    3. `Hon. Nawaf U. Jainuddin`
    4. `Hon. Adnin M. Mistiri`
    5. `Hon. Juriya T. Ahmad`
    6. `Hon. Editha T. Abdulgapar`
    7. `Hon. Suraya S. Edris`
  - **SK Chairperson**: `Hon.Nharier S. Abdurahman`
  - **Barangay Secretary**: `Sec. Almira H.adjail` (default fallback logo `/logo.png` when photo not available online)

---

## 3. Architecture & File Map
- **Frontend**: React 18 + TypeScript + Vite (`http://localhost:5173`) + Tailwind CSS + Framer Motion + GSAP + Three.js + Leaflet Google Satellite Hybrid GIS (`mt1.google.com/vt/lyrs=y`).
- **Backend**: Express + Socket.IO (`server/index.ts` on `http://localhost:4000`) + Vercel Serverless Function wrapper (`api/index.ts` + `vercel.json`).
- **Database & Cloud Storage**:
  - **MongoDB Atlas**: Database `smart_barangay_matatag`, collection `portal_state` (`server/index.ts`).
  - **Local & Google Drive Vault Sync**: `server/data/db.json` + `server/google-drive-vault/` (`01_Residents_RBI_Profiles`, `02_Resident_Uploaded_IDs_and_Selfies`, `03_Certificate_Applications`, `04_Lupon_Blotter_and_Subpoenas`, `05_Full_System_Database_Snapshots`).
- **Core Components**:
  - `src/components/IntroSplash.tsx`: Desktop-only 10.0s edge-to-edge intro video (`/intro/intro.mp4`). Starts fading to `#000000` black at `9.0s`, holds pure black for `1.5s` after `10.0s`, then smoothly fades in the main site.
  - `src/components/Navbar.tsx`: Modern sticky header with Light/Dark mode toggle (Light Mode default), standalone Facebook-style real-time Notification Bell dropdown (visible when logged in), Install App button, and Portal navigation.
  - `src/components/SatelliteMapPinpointer.tsx`: 3D Google Satellite Hybrid map with dashed blue boundary (`#2563EB`), inside-boundary click enforcement (`isPointInsideMatatagBoundary`), Barangay Matatag Seal marker at `6.6599999, 122.1377029`, Live Turn-by-Turn GPS Directions on Map (OSRM route polyline + distance + driving/walking ETA), and Open in Google Maps App button.
  - `src/components/CertificatePrinterModal.tsx`: Same-page floating QR Certificate modal with **Download to Device** (high-res PNG), **Print Document**, **Wireless Print**, and **Close**.
  - `src/components/SmartAppDownloadModal.tsx`: Interactive Desktop Setup Wizard (`.exe` / `.dmg` / `.AppImage`), Android `.APK`, and iOS PWA installer modal matching the native Windows Setup Wizard UI.
  - `src/components/EventsCoverflowSlider.tsx`: Continuous 3D coverflow slider of Barangay Matatag community events (`public/events/event-1.jpg` to `event-6.jpg`).
  - `src/utils/securityShield.ts`: Client-side Anti-DevTools shield (blocks right-click & inspect shortcuts and immediately redirects to `https://www.youtube.com/watch?v=HI-oV3r0DOU&rco=1`). Note: For automated Playwright/Chrome DevTools QA, set `sessionStorage.setItem('__MATATAG_AUTOMATED_QA__', '1')` before inspecting.
  - `scripts/build-desktop-installer.mjs`: Compiles `public/downloads/Barangay-Matatag-Smart-Portal-Setup.exe` (via `.NET csc.exe` WinForms GUI installer), `.dmg`, and `.AppImage`.

---

## 4. Credentials & Testing
- **Admin Login**: `admin` (or `admin@matatag.gov.ph`) / `admin123`
- **Staff Login**: `secretary@matatag.gov.ph` / `staff123`
- **Resident Login**: `ahmad.yakan@gmail.com` / `resident123`
- **Sample Tracking Codes**: `MTG-884920` (Approved Barangay Clearance with floating QR PDF), `MTG-551209` (Certificate of Indigency), `MTG-319402` (Business Permit Endorsement).
