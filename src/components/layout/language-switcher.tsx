"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const localeNames: Record<string, string> = {
  en: "EN",
  he: "עב",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex items-center gap-1 bg-bg-secondary/50 rounded-full p-1">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200
            ${
              locale === loc
                ? "bg-accent-teal text-text-primary"
                : "text-text-muted hover:text-text-primary"
            }
          `}
          aria-label={`Switch to ${loc === "en" ? "English" : "Hebrew"}`}
        >
          {localeNames[loc]}
        </button>
      ))}
    </div>
  );
}
