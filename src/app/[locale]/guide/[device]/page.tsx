import { setRequestLocale, getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";

const DEVICES = ["android", "ios", "windows", "mac"] as const;
type Device = (typeof DEVICES)[number];

interface PageProps {
  params: Promise<{ locale: string; device: string }>;
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    DEVICES.map((device) => ({ locale, device }))
  );
}

const DOWNLOAD_LINKS: Record<Device, { label: string; url: string; label2?: string; url2?: string }> = {
  android: {
    label: "step1PlayStore",
    url: "https://play.google.com/store/apps/details?id=com.v2ray.ang",
    label2: "step1GitHub",
    url2: "https://github.com/2dust/v2rayNG/releases",
  },
  ios: {
    label: "step1AppStore",
    url: "https://apps.apple.com/app/streisand/id6450534064",
  },
  windows: {
    label: "step1Download",
    url: "https://github.com/2dust/v2rayN/releases",
  },
  mac: {
    label: "step1Download",
    url: "https://github.com/tzmax/V2RayXS/releases",
    label2: "step1AppStore",
    url2: "https://apps.apple.com/app/streisand/id6450534064",
  },
};

const deviceNav: { id: Device; icon: string }[] = [
  { id: "android", icon: "🤖" },
  { id: "ios", icon: "🍎" },
  { id: "windows", icon: "🪟" },
  { id: "mac", icon: "💻" },
];

export default async function DeviceGuidePage({ params }: PageProps) {
  const { locale, device } = await params;
  setRequestLocale(locale);

  if (!DEVICES.includes(device as Device)) {
    notFound();
  }

  const t = await getTranslations("guide");
  const d = device as Device;

  const steps = [
    { title: t(`${d}.step1Title`), desc: t(`${d}.step1Desc`), num: 1 },
    { title: t(`${d}.step2Title`), desc: t(`${d}.step2Desc`), num: 2 },
    { title: t(`${d}.step3Title`), desc: t(`${d}.step3Desc`), num: 3 },
    { title: t(`${d}.step4Title`), desc: t(`${d}.step4Desc`), num: 4 },
  ];

  const troubleshooting = [
    t(`${d}.troubleshoot1`),
    t(`${d}.troubleshoot2`),
    t(`${d}.troubleshoot3`),
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg-primary pt-28 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/guide"
            className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mb-8 text-sm"
          >
            ← {t("backToGuides")}
          </Link>

          <div className="flex flex-col lg:flex-row gap-10">
            {/* Sidebar */}
            <aside className="lg:w-56 shrink-0">
              <nav className="lg:sticky lg:top-28 flex lg:flex-col gap-2">
                {deviceNav.map((item) => (
                  <Link
                    key={item.id}
                    href={`/guide/${item.id}`}
                    className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      item.id === d
                        ? "bg-accent-teal/10 text-accent-teal border border-accent-teal/30"
                        : "text-text-muted hover:text-text-primary hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <span>{item.icon}</span>
                    {t(`${item.id}.title`)}
                  </Link>
                ))}
              </nav>
            </aside>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="mb-12">
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-text-primary mb-3">
                  {t(`${d}.title`)}
                </h1>
                <p className="text-lg text-text-muted">
                  {t(`${d}.subtitle`)}
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-8 mb-16">
                {steps.map((step) => {
                  const links = step.num === 1 ? DOWNLOAD_LINKS[d] : null;
                  return (
                    <div
                      key={step.num}
                      className="relative flex gap-6 rounded-2xl border border-white/10 bg-bg-secondary/50 p-6 sm:p-8"
                    >
                      <div className="shrink-0 w-10 h-10 rounded-full bg-accent-teal/20 text-accent-teal font-bold flex items-center justify-center text-lg">
                        {step.num}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-semibold text-text-primary mb-2">
                          {step.title}
                        </h2>
                        <p className="text-text-muted leading-relaxed">
                          {step.desc}
                        </p>
                        {links && (
                          <div className="mt-4 flex flex-wrap gap-3">
                            <a
                              href={links.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-teal text-bg-primary font-semibold rounded-xl hover:bg-accent-teal/90 transition-colors text-sm"
                            >
                              ↓ {t(`${d}.${links.label}`)}
                            </a>
                            {links.url2 && links.label2 && (
                              <a
                                href={links.url2}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/20 text-text-primary font-semibold rounded-xl hover:bg-white/5 transition-colors text-sm"
                              >
                                ↓ {t(`${d}.${links.label2}`)}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Troubleshooting */}
              <div className="rounded-2xl border border-white/10 bg-bg-secondary/50 p-6 sm:p-8 mb-12">
                <h2 className="text-2xl font-semibold text-text-primary mb-6">
                  {t(`${d}.troubleshootTitle`)}
                </h2>
                <ul className="space-y-4">
                  {troubleshooting.map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-text-muted"
                    >
                      <span className="text-accent-gold shrink-0">⚠️</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Telegram Section */}
              <div className="rounded-2xl border border-white/10 bg-bg-secondary/50 p-6 sm:p-8">
                <h2 className="text-2xl font-semibold text-text-primary mb-3">
                  {t("telegramSection.title")}
                </h2>
                <p className="text-text-muted mb-6">
                  {t("telegramSection.subtitle")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <a
                    href="https://t.me/dopplercreatebot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-white/10 p-5 hover:border-accent-teal/50 transition-colors"
                  >
                    <h3 className="font-semibold text-text-primary mb-1">
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
                    className="rounded-xl border border-white/10 p-5 hover:border-accent-teal/50 transition-colors"
                  >
                    <h3 className="font-semibold text-text-primary mb-1">
                      💬 {t("telegramSection.supportBot")}
                    </h3>
                    <p className="text-sm text-text-muted">
                      {t("telegramSection.supportBotDesc")}
                    </p>
                  </a>
                  <div className="rounded-xl border border-white/10 p-5">
                    <h3 className="font-semibold text-text-primary mb-1">
                      📱 {t("telegramSection.miniApp")}
                    </h3>
                    <p className="text-sm text-text-muted">
                      {t("telegramSection.miniAppDesc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
