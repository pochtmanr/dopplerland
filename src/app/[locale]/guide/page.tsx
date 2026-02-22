import { setRequestLocale, getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Link } from "@/i18n/navigation";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const devices = [
  {
    id: "android",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.61 15.15c-.46 0-.84-.37-.84-.83s.38-.83.84-.83c.46 0 .83.37.83.83s-.37.83-.83.83m-9.22 0c-.46 0-.84-.37-.84-.83s.38-.83.84-.83c.46 0 .83.37.83.83s-.37.83-.83.83m9.5-5.09l1.67-2.88a.35.35 0 00-.12-.47.35.35 0 00-.48.12l-1.69 2.93A10.1 10.1 0 0012 8.57c-1.53 0-2.98.34-4.27.95L6.04 6.59a.35.35 0 00-.48-.12.35.35 0 00-.12.47l1.67 2.88C4.44 11.36 2.62 14.09 2.3 17.3h19.4c-.32-3.21-2.14-5.94-4.81-7.24z" />
      </svg>
    ),
    color: "text-green-400",
  },
  {
    id: "ios",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
    color: "text-blue-400",
  },
  {
    id: "windows",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 12V6.75l6-1.32v6.48L3 12zm17-9v8.75l-10 .08V5.67L20 3zM3 13l6 .09v6.81l-6-1.15V13zm7 .18l10 .08V21l-10-1.76V13.18z" />
      </svg>
    ),
    color: "text-cyan-400",
  },
  {
    id: "mac",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
    color: "text-purple-400",
  },
] as const;

export default async function GuidePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("guide");

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

          {/* Device Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {devices.map((device) => (
              <Link
                key={device.id}
                href={`/guide/${device.id}`}
                className="group relative rounded-2xl border border-overlay/10 bg-bg-secondary/50 p-8 text-center hover:border-accent-teal/50 hover:bg-bg-secondary transition-all duration-300"
              >
                <div className={`${device.color} mb-4 flex justify-center`}>
                  {device.icon}
                </div>
                <h2 className="text-xl font-semibold text-text-primary mb-2">
                  {t(`${device.id}.title`)}
                </h2>
                <p className="text-sm text-text-muted">
                  {t(`${device.id}.subtitle`)}
                </p>
                <div className="mt-4 text-accent-teal text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  {t("chooseDevice")} →
                </div>
              </Link>
            ))}
          </div>

          {/* Telegram Section */}
          <div className="rounded-2xl border border-overlay/10 bg-bg-secondary/50 p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-text-primary mb-3 text-center">
              {t("telegramSection.title")}
            </h2>
            <p className="text-text-muted text-center mb-10 max-w-2xl mx-auto">
              {t("telegramSection.subtitle")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <a
                href="https://t.me/dopplercreatebot"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-overlay/10 p-6 hover:border-accent-teal/50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  🤖 {t("telegramSection.vpnBot")}
                </h3>
                <p className="text-sm text-text-muted">
                  {t("telegramSection.vpnBotDesc")}
                </p>
              </a>
              <a
                href="https://t.me/DopplerSupportBot"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-overlay/10 p-6 hover:border-accent-teal/50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  💬 {t("telegramSection.supportBot")}
                </h3>
                <p className="text-sm text-text-muted">
                  {t("telegramSection.supportBotDesc")}
                </p>
              </a>
              <div className="rounded-xl border border-overlay/10 p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  📱 {t("telegramSection.miniApp")}
                </h3>
                <p className="text-sm text-text-muted">
                  {t("telegramSection.miniAppDesc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
