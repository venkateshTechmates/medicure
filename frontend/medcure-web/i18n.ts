import { getRequestConfig } from "next-intl/server";

export const DEFAULT_LOCALE = "en";
export const SUPPORTED_LOCALES = ["en", "es"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Request-time config for next-intl.
 *
 * Locale strategy: we pin to the default ("en") on the server. The
 * client-side override happens in `components/LocaleProvider.tsx`, which
 * reads `localStorage.getItem("medcure_locale")` and re-renders the
 * `NextIntlClientProvider` with the chosen messages. This keeps URLs
 * unchanged and avoids App Router restructuring.
 */
export default getRequestConfig(async () => {
  const locale = DEFAULT_LOCALE;
  const messages = (await import(`./messages/${locale}.json`)).default;
  return { locale, messages };
});
