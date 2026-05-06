import { api } from 'boot/axios';

const VISIT_STORAGE_KEY = 'kp_visit';
const VISITOR_STORAGE_KEY = 'kp_visitor';

interface VisitPayload {
  newSession: boolean;
  newVisitor: boolean;
}

function todayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function hasBrowserStorage(): boolean {
  return typeof window !== 'undefined';
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

async function postVisit(payload: VisitPayload): Promise<void> {
  try {
    await api.post('/stats/visit', payload, {
      headers: { 'X-Silent-Error': 'true' },
    });
  } catch {
    // The axios interceptor may show network errors; tracking itself stays best-effort.
  }
}

export async function trackPageView(isInitial: boolean): Promise<void> {
  if (!hasBrowserStorage()) {
    return;
  }

  if (!isInitial) {
    await postVisit({ newSession: false, newVisitor: false });
    return;
  }

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

  await postVisit({ newSession, newVisitor });
}
