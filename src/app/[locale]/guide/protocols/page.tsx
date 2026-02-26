import { setRequestLocale, getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Link } from "@/i18n/navigation";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProtocolsGuidePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("guideProtocols");

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
          {/* Back link */}
          <Link
            href="/guide"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent-teal transition-colors mb-8"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            {t("backToGuides")}
          </Link>

          {/* Header */}
          <div className="mb-12">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-text-primary mb-3 tracking-tight">
              {t("title")}
            </h1>
            <p className="text-lg text-text-muted max-w-3xl">
              {t("subtitle")}
            </p>
          </div>

          {/* Protocol comparison cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {/* WireGuard */}
            <div className="rounded-2xl border border-overlay/10 bg-bg-secondary/50 p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-accent-teal/10 border border-accent-teal/20 flex items-center justify-center text-accent-teal">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-text-primary">{t("wireguard.title")}</h2>
                  <span className="inline-block mt-0.5 text-xs font-medium text-accent-teal bg-accent-teal/10 px-2 py-0.5 rounded-full">
                    {t("wireguard.badge")}
                  </span>
                </div>
              </div>
              <p className="text-sm text-text-muted leading-relaxed mb-5">
                {t("wireguard.description")}
              </p>
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">{t("bestFor")}</h3>
                {(["speed", "battery", "streaming", "everyday"] as const).map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-accent-teal mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <span className="text-sm text-text-muted">{t(`wireguard.${item}`)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-overlay/10">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">{t("apps")}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-3 py-1.5 rounded-lg bg-overlay/5 border border-overlay/10 text-text-muted">{t("wireguard.appIos")}</span>
                  <span className="text-xs px-3 py-1.5 rounded-lg bg-overlay/5 border border-overlay/10 text-text-muted">{t("wireguard.appAndroid")}</span>
                </div>
              </div>
            </div>

            {/* VLESS-Reality */}
            <div className="rounded-2xl border border-overlay/10 bg-bg-secondary/50 p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center text-accent-gold">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-text-primary">{t("vless.title")}</h2>
                  <span className="inline-block mt-0.5 text-xs font-medium text-accent-gold bg-accent-gold/10 px-2 py-0.5 rounded-full">
                    {t("vless.badge")}
                  </span>
                </div>
              </div>
              <p className="text-sm text-text-muted leading-relaxed mb-5">
                {t("vless.description")}
              </p>
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">{t("bestFor")}</h3>
                {(["censorship", "stealth", "deepPacket", "restricted"] as const).map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-accent-gold mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <span className="text-sm text-text-muted">{t(`vless.${item}`)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-overlay/10">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">{t("apps")}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-3 py-1.5 rounded-lg bg-overlay/5 border border-overlay/10 text-text-muted">{t("vless.appIos")}</span>
                  <span className="text-xs px-3 py-1.5 rounded-lg bg-overlay/5 border border-overlay/10 text-text-muted">{t("vless.appAndroid")}</span>
                  <span className="text-xs px-3 py-1.5 rounded-lg bg-overlay/5 border border-overlay/10 text-text-muted">{t("vless.appWindows")}</span>
                  <span className="text-xs px-3 py-1.5 rounded-lg bg-overlay/5 border border-overlay/10 text-text-muted">{t("vless.appMac")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison table */}
          <section className="mb-12">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-5">
              {t("comparison")}
            </h2>
            <div className="rounded-2xl border border-overlay/10 bg-bg-secondary/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-overlay/10">
                      <th className="text-start p-4 text-text-muted font-medium">{t("tableFeature")}</th>
                      <th className="text-start p-4 text-accent-teal font-medium">WireGuard</th>
                      <th className="text-start p-4 text-accent-gold font-medium">VLESS-Reality</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-overlay/5">
                    {(["speed", "battery", "censorship", "setup", "platforms"] as const).map((row) => (
                      <tr key={row}>
                        <td className="p-4 text-text-muted">{t(`table.${row}.label`)}</td>
                        <td className="p-4 text-text-primary">{t(`table.${row}.wireguard`)}</td>
                        <td className="p-4 text-text-primary">{t(`table.${row}.vless`)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Which should I use? */}
          <section className="mb-12">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-5">
              {t("whichToUse")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-accent-teal/20 bg-accent-teal/5 p-6">
                <h3 className="text-base font-semibold text-text-primary mb-2">{t("useWireguard.title")}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{t("useWireguard.desc")}</p>
              </div>
              <div className="rounded-2xl border border-accent-gold/20 bg-accent-gold/5 p-6">
                <h3 className="text-base font-semibold text-text-primary mb-2">{t("useVless.title")}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{t("useVless.desc")}</p>
              </div>
            </div>
          </section>

          {/* CTA to apps */}
          <div className="flex flex-wrap gap-4">
            <Link
              href="/downloads"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-teal/15 text-accent-teal text-sm font-medium hover:bg-accent-teal/25 transition-colors"
            >
              {t("getApps")} &rarr;
            </Link>
            <Link
              href="/guide/subscription"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-overlay/10 text-text-muted text-sm font-medium hover:border-accent-teal/20 hover:text-text-primary transition-colors"
            >
              {t("viewSubscription")} &rarr;
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
