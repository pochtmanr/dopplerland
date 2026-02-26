"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { localeConfig } from "@/lib/languages";

type DropdownId = "downloads" | "languages" | null;

const APP_STORE_URL =
  "https://apps.apple.com/us/app/doppler-vpn-fast-secure/id6757091773";

const downloads = [
  {
    label: "iOS",
    description: "iPhone & iPad",
    href: APP_STORE_URL,
    external: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11" />
      </svg>
    ),
  },
  {
    label: "Android",
    description: "Phones & Tablets",
    href: "/guide/android" as const,
    external: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M16.61 15.15c-.46 0-.84-.37-.84-.83s.38-.83.84-.83c.46 0 .83.37.83.83s-.37.83-.83.83m-9.22 0c-.46 0-.84-.37-.84-.83s.38-.83.84-.83c.46 0 .83.37.83.83s-.37.83-.83.83m9.5-5.09l1.67-2.88a.35.35 0 00-.12-.47.35.35 0 00-.48.12l-1.69 2.93A10.1 10.1 0 0012 8.57c-1.53 0-2.98.34-4.27.95L6.04 6.59a.35.35 0 00-.48-.12.35.35 0 00-.12.47l1.67 2.88C4.44 11.36 2.62 14.09 2.3 17.3h19.4c-.32-3.21-2.14-5.94-4.81-7.24z" />
      </svg>
    ),
  },
  {
    label: "Windows",
    description: "PC",
    href: "/guide/windows" as const,
    external: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M3 12V6.75l6-1.32v6.48L3 12zm17-9v8.75l-10 .08V5.67L20 3zM3 13l6 .09v6.81l-6-1.15V13zm7 .18l10 .08V21l-10-1.76V13.18z" />
      </svg>
    ),
  },
  {
    label: "macOS",
    description: "Mac",
    href: "/guide/mac" as const,
    external: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11" />
      </svg>
    ),
  },
];

interface DesktopNavProps {
  pricingLabel: string;
  logo: ReactNode;
  controls: ReactNode;
  mobile: ReactNode;
}

export function DesktopNav({ pricingLabel, logo, controls, mobile }: DesktopNavProps) {
  const [openDropdown, setOpenDropdown] = useState<DropdownId>(null);
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  const close = useCallback(() => setOpenDropdown(null), []);

  const toggle = useCallback((id: DropdownId) => {
    setOpenDropdown((prev) => (prev === id ? null : id));
  }, []);

  const switchLocale = useCallback(
    (newLocale: string) => {
      router.replace(pathname, { locale: newLocale });
      setOpenDropdown(null);
    },
    [router, pathname]
  );

  useEffect(() => {
    if (!openDropdown) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        close();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openDropdown, close]);

  const isLangPanel = openDropdown === "languages";
  const isDownloadsPanel = openDropdown === "downloads";

  const currentLang = localeConfig[locale] || localeConfig.en;

  return (
    <nav
      ref={navRef}
      className="relative mx-auto max-w-7xl bg-bg-primary/90 backdrop-blur-xl rounded-2xl shadow-lg shadow-overlay/5"
    >
      {/* Main bar row */}
      <div className="flex items-center justify-between h-12 sm:h-14 px-3 sm:px-4">
        {logo}

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-0.5">
          <button
            onClick={() => toggle("downloads")}
            className={`flex items-center gap-1 text-sm font-medium px-3 py-2 transition-colors ${
              isDownloadsPanel
                ? "text-text-primary"
                : "text-text-muted hover:text-text-primary"
            }`}
            aria-expanded={isDownloadsPanel}
            aria-haspopup="true"
          >
            {t("downloads")}
            <svg
              className={`w-3 h-3 transition-transform duration-200 ${
                isDownloadsPanel ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <Link
            href="/guide"
            className="text-text-muted hover:text-text-primary transition-colors text-sm font-medium px-3 py-2"
          >
            {t("guides")}
          </Link>

          <Link
            href="/#pricing"
            className="text-text-muted hover:text-text-primary transition-colors text-sm font-medium px-3 py-2"
          >
            {pricingLabel}
          </Link>
        </div>

        {/* Right side controls (desktop) */}
        <div className="hidden md:flex items-center gap-1.5">
          {controls}

          {/* Language trigger */}
          <button
            onClick={() => toggle("languages")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
              isLangPanel
                ? "bg-bg-secondary text-text-primary"
                : "bg-bg-secondary/50 text-text-primary hover:bg-bg-secondary"
            }`}
            aria-expanded={isLangPanel}
            aria-haspopup="true"
            aria-controls="language-panel"
          >
            <span className="text-base leading-none">{currentLang.flag}</span>
            <span>{currentLang.label}</span>
            <svg
              className={`w-3 h-3 transition-transform duration-200 ${
                isLangPanel ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Mobile hamburger */}
        {mobile}
      </div>

      {/* Dropdown panel — inside the nav, shares its bg/blur */}
      <div
        className={`grid transition-[grid-template-rows] duration-[180ms] ease-out ${
          openDropdown ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
        role="menu"
      >
        <div className="overflow-hidden">
          {/* Downloads panel */}
          {isDownloadsPanel && (
            <div className="px-2.5 pb-2.5 space-y-2">
              <div className="grid grid-cols-4 gap-2">
                {downloads.map((item) =>
                  item.external ? (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      role="menuitem"
                      tabIndex={0}
                      onClick={close}
                      className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-bg-secondary hover:bg-accent-teal/15 group"
                    >
                      <span className="w-9 h-9 rounded-[10px] bg-bg-primary group-hover:bg-accent-teal/20 flex items-center justify-center text-text-muted group-hover:text-accent-teal shrink-0">
                        {item.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-text-primary truncate">
                          {item.label}
                        </div>
                        <div className="text-xs text-text-muted truncate">
                          {item.description}
                        </div>
                      </div>
                    </a>
                  ) : (
                    <Link
                      key={item.label}
                      href={item.href}
                      role="menuitem"
                      tabIndex={0}
                      onClick={close}
                      className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-bg-secondary hover:bg-accent-teal/15 group"
                    >
                      <span className="w-9 h-9 rounded-[10px] bg-bg-primary group-hover:bg-accent-teal/20 flex items-center justify-center text-text-muted group-hover:text-accent-teal shrink-0">
                        {item.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-text-primary truncate">
                          {item.label}
                        </div>
                        <div className="text-xs text-text-muted truncate">
                          {item.description}
                        </div>
                      </div>
                    </Link>
                  )
                )}
              </div>
              <Link
                href="/downloads"
                onClick={close}
                className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-text-muted hover:text-accent-teal transition-colors"
              >
                {t("seeAllDownloads")} &rarr;
              </Link>
            </div>
          )}

          {/* Language panel */}
          {isLangPanel && (
            <div
              id="language-panel"
              aria-label="Select language"
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-1.5 px-2.5 pb-2.5"
            >
              {routing.locales.map((loc) => {
                const config = localeConfig[loc] || { label: loc, flag: "", name: loc };
                const isActive = locale === loc;
                return (
                  <button
                    key={loc}
                    role="menuitem"
                    tabIndex={isLangPanel ? 0 : -1}
                    onClick={() => switchLocale(loc)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors duration-150 min-w-0 ${
                      isActive
                        ? "bg-accent-teal/15 text-accent-teal ring-1 ring-accent-teal/20"
                        : "hover:bg-overlay/5 text-text-muted hover:text-text-primary"
                    }`}
                    aria-current={isActive ? "true" : undefined}
                    aria-label={`Switch to ${config.name}`}
                  >
                    <span className="text-base leading-none shrink-0">{config.flag}</span>
                    <span className="font-medium truncate">{config.name}</span>
                    {isActive && (
                      <svg className="w-3.5 h-3.5 ms-auto shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
          )}
        </div>
      </div>
    </nav>
  );
}
