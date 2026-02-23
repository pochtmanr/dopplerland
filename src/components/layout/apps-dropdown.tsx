"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const platforms = [
  {
    label: "App Store",
    description: "iPhone & iPad",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11" />
      </svg>
    ),
  },
  {
    label: "Google Play",
    description: "Android",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302-2.302 2.302-2.725-2.302 2.725-2.302zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
      </svg>
    ),
  },
  {
    label: "Telegram",
    description: "Telegram Bot",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
];

export function AppsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("nav");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        close();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, close]);

  return (
    <div ref={dropdownRef}>
      {/* Trigger */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1 text-sm font-medium px-3 py-2 transition-colors ${
          isOpen ? "text-text-primary" : "text-text-muted hover:text-text-primary"
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {t("apps")}
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Full-width panel — positioned relative to <nav> */}
      <div
        className={`absolute inset-x-0 top-full mt-1.5 bg-bg-primary/70 backdrop-blur-xl border border-overlay/[0.08] rounded-2xl shadow-lg shadow-overlay/5 p-2.5 transition-all duration-[180ms] ease-out ${
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
        role="menu"
        aria-label="App platforms"
      >
        <div className="grid grid-cols-3 gap-2">
          {platforms.map((item) => (
            <Link
              key={item.label}
              href="/apps"
              role="menuitem"
              tabIndex={isOpen ? 0 : -1}
              onClick={close}
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-overlay/[0.03] hover:bg-accent-teal/15 transition-colors group"
            >
              <span className="w-9 h-9 rounded-[10px] bg-overlay/[0.05] group-hover:bg-accent-teal/20 flex items-center justify-center text-text-muted group-hover:text-accent-teal shrink-0 transition-colors">
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
          ))}
        </div>
      </div>
    </div>
  );
}
