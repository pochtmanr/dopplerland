"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("nav");

  const navItems = [
    { href: "/#features", label: t("features") },
    { href: "/#pricing", label: t("pricing") },
    { href: "/#faq", label: t("faq") },
    { href: "/blog", label: t("blog"), isPage: true },
    { href: "/guide", label: t("guide"), isPage: true },
  ];

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-text-primary hover:text-accent-gold transition-colors"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-full start-0 end-0 bg-bg-secondary/95 backdrop-blur-lg border-t border-white/5 p-4">
          <nav className="flex flex-col gap-4">
            {navItems.map((item) =>
              item.isPage ? (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="text-text-primary hover:text-accent-gold transition-colors py-2 text-lg"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="text-text-primary hover:text-accent-gold transition-colors py-2 text-lg"
                >
                  {item.label}
                </a>
              )
            )}
            <div className="pt-4 border-t border-white/10">
              <LanguageSwitcher />
            </div>
            <Link
              href="/#pricing"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-accent-gold text-bg-primary font-medium hover:bg-accent-gold/90 transition-colors"
            >
              {t("download")}
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
