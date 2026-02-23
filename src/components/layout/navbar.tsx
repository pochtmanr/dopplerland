import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DopplerLogo } from "./doppler-logo";
import { AppsDropdown } from "./apps-dropdown";
import { GuidesDropdown } from "./guides-dropdown";
import { LanguageSwitcher } from "./language-switcher";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";

export async function Navbar() {
  const t = await getTranslations("nav");

  return (
    <header className="fixed top-4 inset-x-0 z-50 px-4 sm:px-6 lg:px-8">
      <nav className="relative mx-auto max-w-7xl flex items-center justify-between h-12 sm:h-14 bg-bg-primary/70 backdrop-blur-xl border border-overlay/[0.08] rounded-2xl shadow-lg shadow-overlay/5 px-3 sm:px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <DopplerLogo />
          <span className="hidden sm:inline text-lg font-semibold text-text-primary tracking-tight">
            Doppler VPN
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-0.5">
          <AppsDropdown />
          <GuidesDropdown />
          <Link
            href="/#pricing"
            className="text-text-muted hover:text-text-primary transition-colors text-sm font-medium px-3 py-2"
          >
            {t("pricing")}
          </Link>
        </div>

        {/* Right Side — Theme + Language */}
        <div className="hidden md:flex items-center gap-1.5">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

        {/* Mobile Navigation */}
        <MobileNav />
      </nav>
    </header>
  );
}
