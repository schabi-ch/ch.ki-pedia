import { api } from 'boot/axios';
import { getActiveLocale } from 'boot/i18n';

const VISIT_STORAGE_KEY = 'kp_visit';
const VISITOR_STORAGE_KEY = 'kp_visitor';

// Pages that are never counted (the statistics page is admin-only).
const EXCLUDED_PATH_PREFIXES = ['/statistics'];

// A page view is only reported once a person is evidently present: either
// after the first user interaction or after the tab has been visible for this
// long. Headless browsers and crawlers that render the page and leave again
// never interact and rarely linger, so they drop out of the statistics.
const PRESENCE_TIMEOUT_MS = 8_000;
const PRESENCE_EVENTS = ['pointerdown', 'pointermove', 'touchstart', 'keydown', 'wheel', 'scroll'];

interface VisitPayload {
  newSession: boolean;
  newVisitor: boolean;
  siteHost?: string;
  guiLang?: string;
  path?: string;
}

function todayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function hasBrowserStorage(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function readStorage(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    // Tracking must never disturb normal browsing.
  }
}

function getGuiLang(): string {
  return getActiveLocale().toLowerCase().split('-')[0] || 'de';
}

function isExcludedPath(path: string): boolean {
  return EXCLUDED_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

// Browsers driven by automation tools (Puppeteer, Playwright, Selenium, ...)
// expose this flag; such clients are crawlers or monitors, not readers.
function isAutomatedBrowser(): boolean {
  return typeof navigator !== 'undefined' && navigator.webdriver === true;
}

let presencePromise: Promise<void> | null = null;

function waitForPresence(): Promise<void> {
  if (presencePromise) {
    return presencePromise;
  }

  presencePromise = new Promise<void>((resolve) => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const done = () => {
      for (const event of PRESENCE_EVENTS) {
        window.removeEventListener(event, done);
      }
      document.removeEventListener('visibilitychange', arm);
      if (timer) {
        clearTimeout(timer);
      }
      resolve();
    };

    // The timer only runs while the tab is actually visible.
    const arm = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (document.visibilityState === 'visible') {
        timer = setTimeout(done, PRESENCE_TIMEOUT_MS);
      }
    };

    for (const event of PRESENCE_EVENTS) {
      window.addEventListener(event, done, { passive: true });
    }
    document.addEventListener('visibilitychange', arm);
    arm();
  });

  return presencePromise;
}

async function postVisit(payload: VisitPayload): Promise<void> {
  try {
    await api.post('/stats/visit', payload, {
      headers: { 'X-Silent-Error': 'true' },
    });
  } catch {
    // The axios interceptor may show network errors; tracking itself stays best-effort.
  }
}

// Reports one page view for `path`. The first reported view of a browser
// session also counts as a visit, the first of the day as a visitor; both
// markers are only written once the view is actually reported.
export async function trackPageView(path: string): Promise<void> {
  if (!hasBrowserStorage() || isAutomatedBrowser() || isExcludedPath(path)) {
    return;
  }

  await waitForPresence();

  const today = todayKey();
  const sessionVisit = readStorage(window.sessionStorage, VISIT_STORAGE_KEY);
  const visitorDate = readStorage(window.localStorage, VISITOR_STORAGE_KEY);
  const newSession = !sessionVisit;
  const newVisitor = !visitorDate || visitorDate < today;

  if (newSession) {
    writeStorage(window.sessionStorage, VISIT_STORAGE_KEY, today);
  }
  if (newVisitor) {
    writeStorage(window.localStorage, VISITOR_STORAGE_KEY, today);
  }

  await postVisit({
    newSession,
    newVisitor,
    siteHost: window.location.hostname,
    guiLang: getGuiLang(),
    path,
  });
}
