import { setRequestLocale, getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Link } from "@/i18n/navigation";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const platforms = {
  mobile: [
    {
      id: "ios" as const,
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
      ),
      color: "text-blue-400",
      href: "https://apps.apple.com/us/app/doppler-vpn-fast-secure/id6757091773",
      external: true,
      available: true,
    },
    {
      id: "android" as const,
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.61 15.15c-.46 0-.84-.37-.84-.83s.38-.83.84-.83c.46 0 .83.37.83.83s-.37.83-.83.83m-9.22 0c-.46 0-.84-.37-.84-.83s.38-.83.84-.83c.46 0 .83.37.83.83s-.37.83-.83.83m9.5-5.09l1.67-2.88a.35.35 0 00-.12-.47.35.35 0 00-.48.12l-1.69 2.93A10.1 10.1 0 0012 8.57c-1.53 0-2.98.34-4.27.95L6.04 6.59a.35.35 0 00-.48-.12.35.35 0 00-.12.47l1.67 2.88C4.44 11.36 2.62 14.09 2.3 17.3h19.4c-.32-3.21-2.14-5.94-4.81-7.24z" />
        </svg>
      ),
      color: "text-green-400",
      href: "https://play.google.com/store/apps/details?id=com.dopplervpn.android",
      external: true,
      available: true,
    },
  ],
  desktop: [
    {
      id: "windows" as const,
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 12V6.75l6-1.32v6.48L3 12zm17-9v8.75l-10 .08V5.67L20 3zM3 13l6 .09v6.81l-6-1.15V13zm7 .18l10 .08V21l-10-1.76V13.18z" />
        </svg>
      ),
      color: "text-cyan-400",
      href: "/guide/windows",
      external: false,
      available: false,
    },
    {
      id: "mac" as const,
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
      ),
      color: "text-purple-400",
      href: "/guide/mac",
      external: false,
      available: false,
    },
  ],
  web: [
    {
      id: "telegram" as const,
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      ),
      color: "text-sky-400",
      href: "https://t.me/dopplercreatebot",
      external: true,
      available: true,
    },
    {
      id: "miniApp" as const,
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
        </svg>
      ),
      color: "text-violet-400",
      href: "",
      external: false,
      available: false,
    },
    {
      id: "extension" as const,
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z" />
        </svg>
      ),
      color: "text-orange-400",
      href: "",
      external: false,
      available: false,
    },
  ],
} as const;

type PlatformId = "ios" | "android" | "windows" | "mac" | "telegram" | "miniApp" | "extension";

export default async function AppsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("apps");

  function renderCard(platform: { id: PlatformId; icon: React.ReactNode; color: string; href: string; external: boolean; available: boolean }) {
    const inner = (
      <>
        <div className={`${platform.color} mb-4 flex justify-center`}>
          {platform.icon}
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-1">
          {t(`${platform.id}.title`)}
        </h2>
        <p className="text-sm text-text-muted mb-4">
          {t(`${platform.id}.description`)}
        </p>
        {platform.available ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-teal">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            {t("available")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted">
            <span className="w-2 h-2 rounded-full bg-text-muted/50" />
            {t("comingSoon")}
          </span>
        )}
        {platform.available && platform.href && (
          <div className="mt-3 text-accent-teal text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
            {t(`${platform.id}.action`)} →
          </div>
        )}
        {!platform.available && platform.href && (
          <div className="mt-3 text-text-muted text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
            {t(`${platform.id}.action`)} →
          </div>
        )}
      </>
    );

    const cardClass = "group relative rounded-2xl border border-overlay/10 bg-bg-secondary/50 p-8 text-center transition-all duration-300" +
      (platform.href ? " hover:border-accent-teal/50 hover:bg-bg-secondary" : "");

    if (platform.external && platform.href) {
      return (
        <a
          key={platform.id}
          href={platform.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cardClass}
        >
          {inner}
        </a>
      );
    }

    if (!platform.external && platform.href) {
      return (
        <Link key={platform.id} href={platform.href} className={cardClass}>
          {inner}
        </Link>
      );
    }

    return (
      <div key={platform.id} className={cardClass + " opacity-70"}>
        {inner}
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg-primary pt-28 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-display font-bold text-text-primary mb-4">
              {t("title")}
            </h1>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              {t("subtitle")}
            </p>
          </div>

          {/* Mobile Apps */}
          <div className="mb-12">
            <h2 className="text-xl font-display font-semibold text-text-primary mb-6">
              {t("mobileApps")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {platforms.mobile.map(renderCard)}
            </div>
          </div>

          {/* Desktop Apps */}
          <div className="mb-12">
            <h2 className="text-xl font-display font-semibold text-text-primary mb-6">
              {t("desktopApps")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {platforms.desktop.map(renderCard)}
            </div>
          </div>

          {/* Telegram & Web */}
          <div className="mb-16">
            <h2 className="text-xl font-display font-semibold text-text-primary mb-6">
              {t("telegramWeb")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {platforms.web.map(renderCard)}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="rounded-2xl border border-overlay/10 bg-bg-secondary/50 p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-text-primary mb-3">
              {t("needHelp")}
            </h2>
            <Link
              href="/guide"
              className="inline-flex items-center gap-2 text-accent-teal hover:text-accent-teal-light font-medium transition-colors"
            >
              {t("viewGuides")} →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
