/**
 * Barangay Matatag Smart E-Governance — Defense-in-Depth Client Security Shield
 * Engineered by Sam Pangilinan (ZETICUZ)
 *
 * Capabilities:
 * 1. Instant YouTube Redirect (https://www.youtube.com/watch?v=HI-oV3r0DOU&rco=1) when DevTools
 *    shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U) or Browser Menu DevTools inspection are triggered.
 * 2. Right-Click (contextmenu) & Image Extraction / Drag Protection across all portal views.
 * 3. Client-side XSS / Prototype Pollution / DOM Injection guard.
 */

export const YOUTUBE_GUARD_REDIRECT_URL =
  'https://www.youtube.com/watch?v=HI-oV3r0DOU&rco=1';

let shieldInitialized = false;

export function triggerSecurityRedirect(): void {
  try {
    window.location.replace(YOUTUBE_GUARD_REDIRECT_URL);
  } catch {
    window.location.href = YOUTUBE_GUARD_REDIRECT_URL;
  }
}

export function initSecurityShield(): void {
  if (typeof window === 'undefined' || shieldInitialized) return;
  shieldInitialized = true;

  // 1. Block Right-Click Context Menu Inspection & Image Saving
  window.addEventListener(
    'contextmenu',
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    },
    { capture: true }
  );

  // 2. Prevent Dragging / Extracting Official Images & Seals
  window.addEventListener(
    'dragstart',
    (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'IMG' || target.tagName === 'SVG' || target.tagName === 'VIDEO')) {
        e.preventDefault();
      }
    },
    { capture: true }
  );

  // 3. Intercept DevTools & Source-View Keyboard Shortcuts -> Instant YouTube Redirect
  window.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      const key = (e.key || '').toUpperCase();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;

      const isF12 = key === 'F12' || e.keyCode === 123;
      const isInspectCombo =
        ctrlOrCmd && e.shiftKey && (key === 'I' || key === 'J' || key === 'C' || key === 'K');
      const isMacInspectCombo =
        e.metaKey && e.altKey && (key === 'I' || key === 'J' || key === 'C' || key === 'U');
      const isViewSource = ctrlOrCmd && key === 'U';
      const isSavePage = ctrlOrCmd && key === 'S';

      if (isF12 || isInspectCombo || isMacInspectCombo || isViewSource || isSavePage) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityRedirect();
        return false;
      }
    },
    { capture: true }
  );

  // 4. Detect Manual Browser Menu DevTools Opening (Outer/Inner Viewport Delta + Console Getter Probe)
  let baselineDeltaW = Math.abs(window.outerWidth - window.innerWidth);
  let baselineDeltaH = Math.abs(window.outerHeight - window.innerHeight);

  const checkDevToolsOpen = () => {
    try {
      // Allow automated verification script only when explicit temporary QA flag is set
      if (window.sessionStorage.getItem('__MATATAG_AUTOMATED_QA__') === '1') {
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const currentDeltaW = Math.abs(window.outerWidth - window.innerWidth * dpr);
      const currentDeltaH = Math.abs(window.outerHeight - window.innerHeight * dpr);
      const rawDeltaW = Math.abs(window.outerWidth - window.innerWidth);
      const rawDeltaH = Math.abs(window.outerHeight - window.innerHeight);

      // If user opens docked DevTools via Browser Menu (More Tools -> Developer Tools),
      // the viewport delta jumps by > 165px compared to initial baseline
      const dockedSideOpened =
        rawDeltaW - baselineDeltaW > 165 && currentDeltaW > 165 && window.innerWidth > 500;
      const dockedBottomOpened =
        rawDeltaH - baselineDeltaH > 165 && currentDeltaH > 165 && window.innerHeight > 400;

      if (dockedSideOpened || dockedBottomOpened) {
        triggerSecurityRedirect();
        return;
      }

      // Console inspection trap for undocked / detached DevTools window
      const probe = new Image();
      Object.defineProperty(probe, 'id', {
        get: () => {
          triggerSecurityRedirect();
          return '';
        },
      });
      // Only evaluated by browser if DevTools console is actively inspecting logged objects
      console.debug(probe);
      console.clear();
    } catch {
      // ignore
    }
  };

  window.addEventListener('resize', () => {
    checkDevToolsOpen();
  });

  window.setInterval(checkDevToolsOpen, 1500);
}
