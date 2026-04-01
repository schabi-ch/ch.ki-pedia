import { SessionStorage } from 'quasar';

const CACHE_PREFIX = 'wiki:';
const INDEX_KEY = 'wiki:__index__';

interface CacheEntry {
  key: string;
  timestamp: number;
}

function getIndex(): CacheEntry[] {
  return SessionStorage.getItem<CacheEntry[]>(INDEX_KEY) ?? [];
}

function saveIndex(index: CacheEntry[]) {
  SessionStorage.set(INDEX_KEY, index);
}

function buildKey(title: string, lang: string, level: string): string {
  return `${CACHE_PREFIX}${title}:${lang}:${level}`;
}

/**
 * Evict oldest entries until a write is likely to succeed.
 * SessionStorage is ~5 MB; we try to keep 500 KB headroom.
 */
function evictIfNeeded(newValue: string) {
  const index = getIndex();
  // Rough estimate of current usage isn't available via API,
  // so we try writing and catch quota errors.
  let attempts = 0;
  while (attempts < index.length) {
    try {
      // Dry-run: try setting a temporary key
      const testKey = '__wiki_cache_test__';
      SessionStorage.set(testKey, newValue);
      SessionStorage.remove(testKey);
      return; // success — enough space
    } catch {
      // Remove oldest entry
      const oldest = index.shift();
      if (oldest) {
        SessionStorage.remove(oldest.key);
      }
      saveIndex(index);
      attempts++;
    }
  }
}

export function getVersion(
  title: string,
  lang: string,
  level: string,
): string | null {
  const key = buildKey(title, lang, level);
  return SessionStorage.getItem<string>(key);
}

export function setVersion(
  title: string,
  lang: string,
  level: string,
  content: string,
): void {
  const key = buildKey(title, lang, level);

  evictIfNeeded(content);

  try {
    SessionStorage.set(key, content);
  } catch {
    // If still failing after eviction, skip caching silently
    return;
  }

  // Update index
  const index = getIndex().filter((e) => e.key !== key);
  index.push({ key, timestamp: Date.now() });
  saveIndex(index);
}
