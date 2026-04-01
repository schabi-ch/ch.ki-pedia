import { defineBoot } from '#q-app/wrappers';
import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { Notify } from 'quasar';
import messages from 'src/i18n';
import { LOCALE_STORAGE_KEY } from './i18n';

type ApiErrorPayload = {
  message?: string | string[];
  error?: string;
  details?: string;
};

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
const api = axios.create({ baseURL: '/api' });

function getLocalizedMessage(path: string, fallback: string): string {
  let locale: keyof typeof messages = 'de';

  try {
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (savedLocale && savedLocale in messages) {
      locale = savedLocale as keyof typeof messages;
    }
  } catch {
    locale = 'de';
  }

  const value = path
    .split('.')
    .reduce<unknown>((current, segment) => {
      if (current && typeof current === 'object' && segment in current) {
        return (current as Record<string, unknown>)[segment];
      }

      return undefined;
    }, messages[locale]);

  return typeof value === 'string' ? value : fallback;
}

function extractApiErrorMessage(error: AxiosError<ApiErrorPayload>): string {
  const payload = error.response?.data;
  const payloadMessage = Array.isArray(payload?.message)
    ? payload.message.join(' ')
    : payload?.message;

  return payloadMessage
    ?? payload?.details
    ?? payload?.error
    ?? error.message
    ?? getLocalizedMessage('failed', 'Action failed');
}

function notifyError(message: string): void {
  Notify.create({
    type: 'negative',
    message,
    position: 'bottom',
  });
}

function notifySuccess(message: string): void {
  Notify.create({
    type: 'positive',
    message,
    position: 'bottom',
  });
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    if (!axios.isCancel(error)) {
      notifyError(extractApiErrorMessage(error));
    }

    return Promise.reject(error);
  },
);

export default defineBoot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios;
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api;
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
});

export { api };
export { getLocalizedMessage, notifySuccess };
