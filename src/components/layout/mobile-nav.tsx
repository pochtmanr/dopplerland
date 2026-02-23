"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("nav");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => {
    setIsOpen(false);
    hamburgerRef.current?.focus();
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => closeButtonRef.current?.focus());
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  const navItems: { href: string; label: string; isPage?: boolean }[] = [
    { href: "/apps", label: t("apps"), isPage: true },
    { href: "/guide", label: t("guide"), isPage: true },
    { href: "/#pricing", label: t("pricing") },
  ];

  const overlay = (
    <div
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      className={`fixed inset-0 z-[60] md:hidden transition-opacity duration-200 ease-out ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-bg-primary/80 backdrop-blur-2xl"
        onClick={close}
        aria-hidden="true"
      />

      {/* Content */}
      <div
        className={`relative flex flex-col items-center justify-center h-full px-6 transition-all duration-200 ease-out ${
          isOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          onClick={close}
          className="absolute top-5 end-5 p-2.5 text-text-muted hover:text-text-primary transition-colors rounded-full"
          aria-label="Close menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Nav links */}
        <nav className="flex flex-col items-center gap-2">
          {navItems.map((item) =>
            item.isPage ? (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className="text-text-primary hover:text-accent-gold transition-colors py-2.5 text-2xl font-medium tracking-tight"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                onClick={close}
                className="text-text-primary hover:text-accent-gold transition-colors py-2.5 text-2xl font-medium tracking-tight"
              >
                {item.label}
              </a>
            )
          )}
        </nav>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-10">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        {/* Download CTA — mobile only */}
        <Link
          href="/apps"
          onClick={close}
          className="mt-8 inline-flex items-center justify-center px-8 py-3 rounded-xl bg-accent-gold text-bg-primary font-medium text-base hover:bg-accent-gold/90 transition-colors"
        >
          {t("download")}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        ref={hamburgerRef}
        onClick={() => setIsOpen(true)}
        className="p-2 -me-2 text-text-primary hover:text-text-muted transition-colors"
        aria-label="Open menu"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {/* Portal overlay to body — escapes nav's backdrop-filter containing block */}
      {mounted && createPortal(overlay, document.body)}
    </div>
  );
}
