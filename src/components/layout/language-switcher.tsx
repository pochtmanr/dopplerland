"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const localeConfig: Record<string, { label: string; flag: string; name: string }> = {
  en: { label: "EN", flag: "🇺🇸", name: "English" },
  he: { label: "עב", flag: "🇮🇱", name: "עברית" },
  ru: { label: "RU", flag: "🇷🇺", name: "Русский" },
  es: { label: "ES", flag: "🇪🇸", name: "Español" },
  pt: { label: "PT", flag: "🇧🇷", name: "Português" },
  fr: { label: "FR", flag: "🇫🇷", name: "Français" },
  zh: { label: "中文", flag: "🇨🇳", name: "中文" },
  de: { label: "DE", flag: "🇩🇪", name: "Deutsch" },
  fa: { label: "فا", flag: "🇮🇷", name: "فارسی" },
  ar: { label: "عر", flag: "🇸🇦", name: "العربية" },
  hi: { label: "हि", flag: "🇮🇳", name: "हिन्दी" },
  id: { label: "ID", flag: "🇮🇩", name: "Bahasa" },
  tr: { label: "TR", flag: "🇹🇷", name: "Türkçe" },
  vi: { label: "VI", flag: "🇻🇳", name: "Tiếng Việt" },
  th: { label: "ไท", flag: "🇹🇭", name: "ไทย" },
  ms: { label: "MS", flag: "🇲🇾", name: "Bahasa Melayu" },
  ko: { label: "한", flag: "🇰🇷", name: "Korean" },
  ja: { label: "日", flag: "🇯🇵", name: "日本語" },
  tl: { label: "TL", flag: "🇵🇭", name: "Filipino" },
  ur: { label: "اُر", flag: "🇵🇰", name: "اردو" },
  sw: { label: "SW", flag: "🇰🇪", name: "Kiswahili" },
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentConfig = localeConfig[locale] || localeConfig.en;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-bg-secondary/50 text-text-primary hover:bg-bg-secondary transition-all duration-200"
        aria-label="Switch language"
        aria-expanded={isOpen}
      >
        <span className="text-base leading-none">{currentConfig.flag}</span>
        <span>{currentConfig.label}</span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 end-0 min-w-[180px] bg-bg-secondary/95 backdrop-blur-xl border border-overlay/10 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="py-1 max-h-[320px] overflow-y-auto">
            {routing.locales.map((loc) => {
              const config = localeConfig[loc] || { label: loc, flag: "", name: loc };
              const isActive = locale === loc;
              return (
                <button
                  key={loc}
                  onClick={() => switchLocale(loc)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150
                    ${isActive
                      ? "bg-accent-teal/20 text-accent-teal"
                      : "text-text-muted hover:text-text-primary hover:bg-overlay/5"
                    }
                  `}
                  aria-label={`Switch to ${config.name}`}
                >
                  <span className="text-base leading-none">{config.flag}</span>
                  <span className="font-medium">{config.name}</span>
                  {isActive && (
                    <svg className="w-4 h-4 ms-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
