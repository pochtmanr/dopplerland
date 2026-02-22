import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";

export async function Navbar() {
  const t = await getTranslations("nav");

  const navItems = [
    { href: "/#features", label: t("features") },
    { href: "/#pricing", label: t("pricing") },
    { href: "/#faq", label: t("faq") },
    { href: "/blog", label: t("blog"), isPage: true },
    { href: "/guide", label: t("guide"), isPage: true },
  ];

  return (
    <header className="fixed top-4 inset-x-0 z-50 px-4 sm:px-6 lg:px-8">
      <nav className="mx-auto max-w-7xl flex items-center justify-between h-12 sm:h-14 bg-bg-primary/70 backdrop-blur-xl border border-overlay/10 rounded-full shadow-lg shadow-overlay/5 px-2 sm:px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/images/roundeddopplerlogo.png"
            alt="Doppler VPN"
            width={36}
            height={36}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full"
            priority
          />
          <span className="hidden sm:inline font-display text-lg font-semibold text-text-primary">
            Doppler
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-text-muted hover:text-text-primary transition-colors text-sm font-medium py-2"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right Side - Theme Toggle, Language Switcher & CTA */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <LanguageSwitcher />
          <Link
            href="/apps"
            className="inline-flex items-center px-4 py-2 rounded-full bg-accent-gold text-bg-primary font-medium text-sm hover:bg-accent-gold/90 transition-colors"
          >
            {t("download")}
          </Link>
        </div>

        {/* Mobile Navigation */}
        <MobileNav />
      </nav>
    </header>
  );
}
