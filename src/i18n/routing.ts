import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "he"],
  defaultLocale: "en",
});

export const rtlLocales: readonly string[] = ["he"];

export type Locale = (typeof routing.locales)[number];

export function isRtlLocale(locale: string): boolean {
  return rtlLocales.includes(locale);
}
