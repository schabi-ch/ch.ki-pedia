import type { MessageLanguages } from 'boot/i18n';

export interface UiLocaleOption {
  label: string;
  value: MessageLanguages;
}

// The UI languages ki-pedia ships, in menu order. Each label is the language's
// own name, so the list reads the same whatever locale is currently active.
export const UI_LOCALE_OPTIONS: readonly UiLocaleOption[] = [
  { label: 'Deutsch', value: 'de' },
  { label: 'Français', value: 'fr' },
  { label: 'Italiano', value: 'it' },
  { label: 'Rumantsch', value: 'rm' },
  { label: 'English', value: 'en-US' },
];

export function uiLocaleLabel (locale: string): string {
  return UI_LOCALE_OPTIONS.find((option) => option.value === locale)?.label ?? locale;
}
