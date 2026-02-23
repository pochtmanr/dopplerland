"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const guides = [
  {
    label: "Android",
    description: "v2rayNG",
    device: "android",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M16.61 15.15c-.46 0-.84-.37-.84-.83s.38-.83.84-.83c.46 0 .83.37.83.83s-.37.83-.83.83m-9.22 0c-.46 0-.84-.37-.84-.83s.38-.83.84-.83c.46 0 .83.37.83.83s-.37.83-.83.83m9.5-5.09l1.67-2.88a.35.35 0 00-.12-.47.35.35 0 00-.48.12l-1.69 2.93A10.1 10.1 0 0012 8.57c-1.53 0-2.98.34-4.27.95L6.04 6.59a.35.35 0 00-.48-.12.35.35 0 00-.12.47l1.67 2.88C4.44 11.36 2.62 14.09 2.3 17.3h19.4c-.32-3.21-2.14-5.94-4.81-7.24z" />
      </svg>
    ),
  },
  {
    label: "iOS",
    description: "Streisand",
    device: "ios",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11" />
      </svg>
    ),
  },
  {
    label: "Windows",
    description: "v2rayN",
    device: "windows",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M3 12V6.75l6-1.32v6.48L3 12zm17-9v8.75l-10 .08V5.67L20 3zM3 13l6 .09v6.81l-6-1.15V13zm7 .18l10 .08V21l-10-1.76V13.18z" />
      </svg>
    ),
  },
  {
    label: "macOS",
    description: "V2RayXS",
    device: "mac",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11" />
      </svg>
    ),
  },
];

export function GuidesDropdown() {
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
        {t("guide")}
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
        aria-label="Setup guides"
      >
        <div className="grid grid-cols-4 gap-2">
          {guides.map((item) => (
            <Link
              key={item.device}
              href={`/guide/${item.device}`}
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
