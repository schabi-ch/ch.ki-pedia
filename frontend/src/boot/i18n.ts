import { defineBoot } from '#q-app/wrappers';
import { createI18n } from 'vue-i18n';

import messages from 'src/i18n';
import { resolveBrandingFromHostname } from 'src/utils/branding';

export type MessageLanguages = keyof typeof messages;
// Type-define 'en-US' as the master schema for the resource
export type MessageSchema = typeof messages['en-US'];

// See https://vue-i18n.intlify.dev/guide/advanced/typescript.html#global-resource-schema-type-definition
/* eslint-disable @typescript-eslint/no-empty-object-type */
declare module 'vue-i18n' {
  // define the locale messages schema
  export interface DefineLocaleMessage extends MessageSchema {}

  // define the datetime format schema
  export interface DefineDateTimeFormat {}

  // define the number format schema
  export interface DefineNumberFormat {}
}
/* eslint-enable @typescript-eslint/no-empty-object-type */

const LOCALE_STORAGE_KEY = 'ki-pedia-locale';

// Maps a BCP 47 language tag from the browser (e.g. "fr-CH", "en", "de_DE")
// to a supported UI locale, or null if there is no matching translation.
function localeForBrowserLanguage(tag: string): MessageLanguages | null {
  const primary = tag.trim().toLowerCase().replace(/_/g, '-').split('-')[0] ?? '';
  if (!primary) return null;
  if (primary === 'en') return 'en-US';
  return primary in messages ? (primary as MessageLanguages) : null;
}

// Language the user's browser/OS prefers, restricted to the UI locales we
// ship. Walks navigator.languages in preference order.
function detectBrowserLocale(): MessageLanguages | null {
  if (typeof navigator === 'undefined') return null;
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of candidates) {
    if (!tag) continue;
    const locale = localeForBrowserLanguage(tag);
    if (locale) return locale;
  }
  return null;
}

// Fallback when the browser language is not one of ours: the domain hints at
// the audience (ia-pedia/wikiped-ia → French, ai-pedia → English, else German).
function localeForHostname(hostname: string): MessageLanguages {
  const { brandName } = resolveBrandingFromHostname(hostname);
  if (brandName === 'ia-pedia') return 'fr';
  if (brandName === 'ai-pedia') return 'en-US';
  return 'de';
}

function readSavedLocale(): MessageLanguages | null {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved && saved in messages) {
      return saved as MessageLanguages;
    }
  } catch {
    // Storage may be blocked (private mode, disabled cookies); fall through.
  }
  return null;
}

// Initial UI locale: an explicit earlier choice wins, then the browser's
// preferred language, then a domain-based default. Detection results are not
// persisted, so a changed browser setting is picked up on the next visit.
function getSavedLocale(): MessageLanguages {
  const saved = readSavedLocale();
  if (saved) return saved;

  const browserLocale = detectBrowserLocale();
  if (browserLocale) return browserLocale;

  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  return localeForHostname(hostname);
}

// The UI locale this visit really runs on: resolved once by getSavedLocale()
// and updated by saveLocale() on every explicit switch. Everything outside the
// i18n instance - above all which Wikipedia we search - must ask here instead
// of reading localStorage, which is empty whenever the locale came from browser
// or domain detection (those are deliberately not persisted).
let activeLocale: MessageLanguages | null = null;

function getActiveLocale(): MessageLanguages {
  activeLocale ??= getSavedLocale();
  return activeLocale;
}

function saveLocale(locale: string) {
  if (locale in messages) {
    activeLocale = locale as MessageLanguages;
  }

  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Storage may be blocked; the in-memory locale still applies for this visit.
  }
}

// Wikipedia language code for a UI locale, as it appears in article URLs
// (de.wikipedia.org, fr.wikipedia.org, ...).
function wikiLangForLocale(locale: string): string {
  return locale === 'en-US' ? 'en' : locale;
}

// The Wikipedia the UI is currently pointed at. Always in sync with the
// displayed UI language; inverse of localeForWikiLang().
function getWikiLang(): string {
  return wikiLangForLocale(getActiveLocale());
}

// Reverse of wikiLangForLocale(): maps a Wikipedia language
// code (as it appears in article URLs) back to a supported UI locale, or
// null if the wiki language has no matching UI translation.
function localeForWikiLang(wikiLang: string): MessageLanguages | null {
  const candidate = wikiLang === 'en' ? 'en-US' : wikiLang;
  return candidate in messages ? (candidate as MessageLanguages) : null;
}

// A visit that starts on a language-specific article URL (shared link, search
// engine) may take its UI locale from that URL - but only on the very first
// article route of the page load, and only if the visitor never picked a UI
// language. Later route changes (switching the article language, back button)
// must leave the UI alone, so students keep an interface they can read.
// Like browser/domain detection, the result is not persisted.
let entryLocaleConsidered = false;

function adoptEntryLocale(wikiLang: string | undefined): MessageLanguages | null {
  if (entryLocaleConsidered) return null;
  entryLocaleConsidered = true;
  if (!wikiLang || readSavedLocale()) return null;
  const locale = localeForWikiLang(wikiLang);
  if (locale) activeLocale = locale;
  return locale;
}

export default defineBoot(({ app }) => {
  const i18n = createI18n<{ message: MessageSchema }, MessageLanguages>({
    locale: getActiveLocale(),
    messages,
  });

  app.use(i18n);
});

export {
  saveLocale,
  getActiveLocale,
  getWikiLang,
  wikiLangForLocale,
  localeForWikiLang,
  adoptEntryLocale,
  localeForBrowserLanguage,
  LOCALE_STORAGE_KEY,
};
