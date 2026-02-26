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
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.61 15.15c-.46 0-.84-.37-.84-.83s.38-.83.84-.83c.46 0 .83.37.83.83s-.37.83-.83.83m-9.22 0c-.46 0-.84-.37-.84-.83s.38-.83.84-.83c.46 0 .83.37.83.83s-.37.83-.83.83m9.5-5.09l1.67-2.88a.35.35 0 00-.12-.47.35.35 0 00-.48.12l-1.69 2.93A10.1 10.1 0 0012 8.57c-1.53 0-2.98.34-4.27.95L6.04 6.59a.35.35 0 00-.48-.12.35.35 0 00-.12.47l1.67 2.88C4.44 11.36 2.62 14.09 2.3 17.3h19.4c-.32-3.21-2.14-5.94-4.81-7.24z" />
      </svg>
    ),
  },
  {
    id: "ios",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
  },
  {
    id: "windows",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 12V6.75l6-1.32v6.48L3 12zm17-9v8.75l-10 .08V5.67L20 3zM3 13l6 .09v6.81l-6-1.15V13zm7 .18l10 .08V21l-10-1.76V13.18z" />
      </svg>
    ),
  },
  {
    id: "mac",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
  },
] as const;

export default async function GuidePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("guide");

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen bg-bg-primary pt-28 pb-20">
        {/* Background blurs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -start-20 w-[28rem] h-[28rem] bg-accent-teal/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 -end-20 w-[32rem] h-[32rem] bg-accent-gold/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-display font-bold text-text-primary mb-4 tracking-tight">
              {t("title")}
            </h1>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              {t("subtitle")}
            </p>
          </div>

          <div className="space-y-14">
            {/* Device Cards */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-5">
                {t("chooseDevice")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {devices.map((device) => (
                  <Link
                    key={device.id}
                    href={`/guide/${device.id}`}
                    className="group rounded-2xl border border-overlay/10 bg-bg-secondary/50 p-6 hover:border-accent-teal/30 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-overlay/5 border border-overlay/10 flex items-center justify-center text-text-muted mb-4">
                      {device.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary mb-1">
                      {t(`${device.id}.title`)}
                    </h3>
                    <p className="text-xs text-text-muted mb-3">
                      {t(`${device.id}.subtitle`)}
                    </p>
                    <span className="text-accent-teal text-sm font-medium group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                      {t("chooseDevice")} &rarr;
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Learn More */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-5">
                {t("learnMore")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Link
                  href="/guide/protocols"
                  className="group rounded-2xl border border-overlay/10 bg-bg-secondary/50 p-6 hover:border-accent-teal/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-overlay/5 border border-overlay/10 flex items-center justify-center text-text-muted mb-4">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-1">
                    {t("protocolsCard.title")}
                  </h3>
                  <p className="text-xs text-text-muted mb-3">
                    {t("protocolsCard.subtitle")}
                  </p>
                  <span className="text-accent-teal text-sm font-medium group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                    {t("learnMore")} &rarr;
                  </span>
                </Link>
                <Link
                  href="/guide/subscription"
                  className="group rounded-2xl border border-overlay/10 bg-bg-secondary/50 p-6 hover:border-accent-teal/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-overlay/5 border border-overlay/10 flex items-center justify-center text-text-muted mb-4">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-1">
                    {t("subscriptionCard.title")}
                  </h3>
                  <p className="text-xs text-text-muted mb-3">
                    {t("subscriptionCard.subtitle")}
                  </p>
                  <span className="text-accent-teal text-sm font-medium group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                    {t("learnMore")} &rarr;
                  </span>
                </Link>
              </div>
            </section>

            {/* Telegram Section */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-5">
                {t("telegramSection.title")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <a
                  href="https://t.me/dopplercreatebot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl border border-overlay/10 bg-bg-secondary/50 p-6 hover:border-accent-teal/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-overlay/5 border border-overlay/10 flex items-center justify-center text-text-muted mb-4">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-text-primary mb-1">
                    {t("telegramSection.vpnBot")}
                  </h3>
                  <p className="text-xs text-text-muted">
                    {t("telegramSection.vpnBotDesc")}
                  </p>
                </a>
                <a
                  href="https://t.me/DopplerSupportBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl border border-overlay/10 bg-bg-secondary/50 p-6 hover:border-accent-teal/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-overlay/5 border border-overlay/10 flex items-center justify-center text-text-muted mb-4">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-text-primary mb-1">
                    {t("telegramSection.supportBot")}
                  </h3>
                  <p className="text-xs text-text-muted">
                    {t("telegramSection.supportBotDesc")}
                  </p>
                </a>
                <div className="rounded-2xl border border-overlay/10 bg-bg-secondary/50 p-6 opacity-60">
                  <div className="w-10 h-10 rounded-xl bg-overlay/5 border border-overlay/10 flex items-center justify-center text-text-muted mb-4">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-text-primary mb-1">
                    {t("telegramSection.miniApp")}
                  </h3>
                  <p className="text-xs text-text-muted">
                    {t("telegramSection.miniAppDesc")}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
