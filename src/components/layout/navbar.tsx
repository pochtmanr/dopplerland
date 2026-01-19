import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";
import { MobileNav } from "./mobile-nav";

export async function Navbar() {
  const t = await getTranslations("nav");

  const navItems = [
    { href: "#features", label: t("features") },
    { href: "#pricing", label: t("pricing") },
    { href: "#faq", label: t("faq") },
  ];

  return (
    <header className="fixed top-4 inset-x-0 z-50 px-4 sm:px-6 lg:px-8">
      <nav className="mx-auto max-w-7xl flex items-center justify-between h-12 sm:h-14 bg-bg-primary/70 backdrop-blur-xl border border-white/10 rounded-full shadow-lg shadow-black/5 px-4 sm:px-2">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/images/iosdopplerlogo.png"
            alt="Doppler VPN"
            width={36}
            height={36}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg"
            priority
          />
          <span className="hidden sm:inline font-display text-lg font-semibold text-text-primary">
            Doppler
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-text-muted hover:text-text-primary transition-colors text-sm font-medium py-2"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Right Side - Language Switcher & CTA */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          <a
            href="#pricing"
            className="inline-flex items-center px-4 py-2 rounded-full bg-accent-gold text-bg-primary font-medium text-sm hover:bg-accent-gold/90 transition-colors"
          >
            {t("download")}
          </a>
        </div>

        {/* Mobile Navigation */}
        <MobileNav />
      </nav>
    </header>
  );
}
