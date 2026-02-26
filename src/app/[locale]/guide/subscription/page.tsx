import { setRequestLocale, getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Link } from "@/i18n/navigation";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function SubscriptionGuidePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("guideSubscription");

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

          {/* Promo banner */}
          <div className="rounded-2xl border border-accent-gold/20 bg-accent-gold/5 p-6 mb-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent-gold/15 border border-accent-gold/20 flex items-center justify-center text-accent-gold shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary mb-0.5">{t("promo.title")}</h2>
              <p className="text-sm text-text-muted">
                {t("promo.desc")}
              </p>
            </div>
            <span className="sm:ms-auto px-4 py-2 rounded-lg bg-accent-gold/15 text-accent-gold font-semibold text-sm whitespace-nowrap">
              LAUNCH20
            </span>
          </div>

          {/* Pricing comparison */}
          <section className="mb-12">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-5">
              {t("pricingSection")}
            </h2>
            <div className="rounded-2xl border border-overlay/10 bg-bg-secondary/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-overlay/10">
                      <th className="text-start p-4 text-text-muted font-medium">{t("tableHeaders.plan")}</th>
                      <th className="text-start p-4 text-text-muted font-medium">{t("tableHeaders.appStore")}</th>
                      <th className="text-start p-4 text-text-muted font-medium">{t("tableHeaders.googlePlay")}</th>
                      <th className="text-start p-4 text-accent-teal font-medium">{t("tableHeaders.telegram")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-overlay/5">
                    <tr>
                      <td className="p-4 text-text-primary font-medium">{t("plans.monthly")}</td>
                      <td className="p-4 text-text-muted">$6.99/mo</td>
                      <td className="p-4 text-text-muted">$6.99/mo</td>
                      <td className="p-4 text-accent-teal font-medium">$4/mo</td>
                    </tr>
                    <tr>
                      <td className="p-4 text-text-primary font-medium">{t("plans.sixMonth")}</td>
                      <td className="p-4 text-text-muted">$29.99</td>
                      <td className="p-4 text-text-muted">$29.99</td>
                      <td className="p-4 text-accent-teal font-medium">$20</td>
                    </tr>
                    <tr>
                      <td className="p-4 text-text-primary font-medium">{t("plans.annual")}</td>
                      <td className="p-4 text-text-muted">$39.99</td>
                      <td className="p-4 text-text-muted">$39.99</td>
                      <td className="p-4 text-accent-teal font-medium">$35</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-overlay/10 text-xs text-text-muted">
                {t("pricingNote")}
              </div>
            </div>
          </section>

          {/* How to subscribe sections */}
          <section className="mb-12">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-5">
              {t("howToSubscribe")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* App Store */}
              <div className="rounded-2xl border border-overlay/10 bg-bg-secondary/50 p-6">
                <div className="w-10 h-10 rounded-xl bg-overlay/5 border border-overlay/10 flex items-center justify-center text-text-muted mb-4">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-2">{t("appStoreMethod.title")}</h3>
                <ol className="space-y-2 text-sm text-text-muted">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-md bg-overlay/5 border border-overlay/10 flex items-center justify-center text-xs text-text-muted shrink-0 mt-0.5">1</span>
                    {t("appStoreMethod.step1")}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-md bg-overlay/5 border border-overlay/10 flex items-center justify-center text-xs text-text-muted shrink-0 mt-0.5">2</span>
                    {t("appStoreMethod.step2")}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-md bg-overlay/5 border border-overlay/10 flex items-center justify-center text-xs text-text-muted shrink-0 mt-0.5">3</span>
                    {t("appStoreMethod.step3")}
                  </li>
                </ol>
              </div>

              {/* Google Play */}
              <div className="rounded-2xl border border-overlay/10 bg-bg-secondary/50 p-6">
                <div className="w-10 h-10 rounded-xl bg-overlay/5 border border-overlay/10 flex items-center justify-center text-text-muted mb-4">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-2">{t("googlePlayMethod.title")}</h3>
                <ol className="space-y-2 text-sm text-text-muted">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-md bg-overlay/5 border border-overlay/10 flex items-center justify-center text-xs text-text-muted shrink-0 mt-0.5">1</span>
                    {t("googlePlayMethod.step1")}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-md bg-overlay/5 border border-overlay/10 flex items-center justify-center text-xs text-text-muted shrink-0 mt-0.5">2</span>
                    {t("googlePlayMethod.step2")}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-md bg-overlay/5 border border-overlay/10 flex items-center justify-center text-xs text-text-muted shrink-0 mt-0.5">3</span>
                    {t("googlePlayMethod.step3")}
                  </li>
                </ol>
              </div>

              {/* Telegram */}
              <div className="rounded-2xl border border-accent-teal/20 bg-accent-teal/5 p-6">
                <div className="w-10 h-10 rounded-xl bg-accent-teal/10 border border-accent-teal/20 flex items-center justify-center text-accent-teal mb-4">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-1">{t("telegramMethod.title")}</h3>
                <p className="text-xs text-accent-teal mb-3">{t("telegramMethod.savings")}</p>
                <ol className="space-y-2 text-sm text-text-muted">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-md bg-accent-teal/10 border border-accent-teal/20 flex items-center justify-center text-xs text-accent-teal shrink-0 mt-0.5">1</span>
                    {t("telegramMethod.step1")}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-md bg-accent-teal/10 border border-accent-teal/20 flex items-center justify-center text-xs text-accent-teal shrink-0 mt-0.5">2</span>
                    {t("telegramMethod.step2")}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-md bg-accent-teal/10 border border-accent-teal/20 flex items-center justify-center text-xs text-accent-teal shrink-0 mt-0.5">3</span>
                    {t("telegramMethod.step3")}
                  </li>
                </ol>
              </div>
            </div>
          </section>

          {/* Managing your subscription */}
          <section className="mb-12">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-5">
              {t("manageSection")}
            </h2>
            <div className="space-y-4">
              {(["restore", "cancel", "switch", "crossPlatform"] as const).map((item) => (
                <div key={item} className="rounded-2xl border border-overlay/10 bg-bg-secondary/50 p-5 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-overlay/5 border border-overlay/10 flex items-center justify-center text-text-muted shrink-0 mt-0.5">
                    <span className="text-xs font-medium">!</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">{t(`manage.${item}.title`)}</h3>
                    <p className="text-sm text-text-muted leading-relaxed">{t(`manage.${item}.desc`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="flex flex-wrap gap-4">
            <Link
              href="/apps"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-teal/15 text-accent-teal text-sm font-medium hover:bg-accent-teal/25 transition-colors"
            >
              {t("getApp")} &rarr;
            </Link>
            <a
              href="https://t.me/dopplercreatebot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-overlay/10 text-text-muted text-sm font-medium hover:border-accent-teal/20 hover:text-text-primary transition-colors"
            >
              {t("openBot")} &rarr;
            </a>
            <Link
              href="/guide/protocols"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-overlay/10 text-text-muted text-sm font-medium hover:border-accent-teal/20 hover:text-text-primary transition-colors"
            >
              {t("viewProtocols")} &rarr;
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
