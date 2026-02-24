"use client";

import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

// Locales where decorative Latin-only fonts break (no Cyrillic/CJK/Arabic glyphs)
const FALLBACK_FONT_LOCALES = new Set(["ru", "uk", "zh", "ja", "ko", "ar", "fa", "he", "hi", "ur", "th"]);

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "desktop";

  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
}

function PromoBanner() {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText("FEBRUARY26");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="hero-animate hero-animate-delay-4 flex items-center justify-center lg:justify-start">
      <button
        onClick={copyCode}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm cursor-pointer transition-all duration-200 ${
          copied
            ? "bg-accent-gold/20 border-accent-gold/40 text-accent-gold"
            : "bg-accent-gold/10 border-accent-gold/20 text-accent-gold hover:bg-accent-gold/15"
        }`}
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
        </svg>
        <span className="font-semibold">FEBRUARY26</span> &mdash; 26% off
        {copied ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        ) : (
          <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H8.25m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m6 10.375a2.625 2.625 0 0 1-2.625-2.625" />
          </svg>
        )}
      </button>
    </div>
  );
}

export function Hero() {
  const t = useTranslations("hero");
  const locale = useLocale();
  const useFallbackFont = FALLBACK_FONT_LOCALES.has(locale);
  const [platform, setPlatform] = useState<Platform>("desktop");

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Background Effects - no overflow-hidden so blurs bleed into next section */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-10 -start-20 w-[28rem] h-[28rem] bg-accent-teal/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -end-20 w-[32rem] h-[32rem] bg-accent-gold/10 rounded-full blur-3xl" />
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="relative z-10 mx-auto max-w-7xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div className="space-y-6 text-center lg:text-start">
            {/* Tagline */}
            <div className="hero-animate">
              <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-accent-teal/30 text-text-primary text-sm font-medium border border-accent-teal/40">
                {t("tagline")}
              </span>
            </div>

            {/* Headline */}
            <h1
              className="hero-animate hero-animate-delay-1 text-5xl sm:text-6xl md:text-6xl lg:text-7xl text-text-primary leading-tight"
            >
              <span
                className="block"
                style={useFallbackFont ? { fontFamily: "var(--font-body)", fontWeight: 700 } : { fontFamily: "var(--font-serif)" }}
              >
                {useFallbackFont ? (
                  <>{t("headlinePart1a")} {t("headlinePart1b")}</>
                ) : (
                  <><span className="italic">{t("headlinePart1a")}</span>{" "}<span>{t("headlinePart1b")}</span></>
                )}
              </span>
              <span
                className="block mt-0 bg-gradient-to-t from-text-muted to-text-primary bg-clip-text text-transparent"
                style={useFallbackFont ? { fontFamily: "var(--font-body)", fontWeight: 700 } : { fontFamily: "var(--font-raster)" }}
              >
                {t("headlinePart2")}
              </span>
            </h1>

            {/* Subheadline */}
            <p
              className="hero-animate hero-animate-delay-2 text-text-muted text-md sm:text-xl md:text-2xl max-w-md sm:max-w-xl mx-auto lg:mx-0"
            >
              {t("subheadline")}
            </p>

            {/* CTA Buttons */}
            <div
              className="hero-animate hero-animate-delay-3 flex flex-row items-center justify-center lg:justify-start gap-3 pt-4"
            >
              {/* iOS Button - Show on iOS or Desktop */}
              {(platform === "ios" || platform === "desktop") && (
                <a
                  href="https://apps.apple.com/us/app/doppler-vpn-fast-secure/id6757091773"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-teal/20 text-accent-teal hover:bg-accent-teal/30 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  <span className="text-sm font-medium">{t("downloadIos")}</span>
                </a>
              )}

              {/* Android Button - Show on Android or Desktop */}
              {(platform === "android" || platform === "desktop") && (
                <a
                  href="https://play.google.com/store/apps/details?id=com.dopplervpn.android"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors bg-accent-gold/20 text-accent-gold hover:bg-accent-gold/30"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  <span className="text-sm font-medium">
                    {t("downloadAndroid")}
                  </span>
                </a>
              )}

              {/* Telegram Bot Button - Always visible */}
              <a
                href="https://t.me/dopplercreatebot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 border-1 border-[#2AABEE]/50 text-[#2AABEE] hover:border-[#2AABEE]/30 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span className="text-sm font-medium">{t("openTelegram")}</span>
              </a>
            </div>

            {/* Promo Banner */}
            <PromoBanner />

            {/* Trust Badges */}
            <div
              className="hero-animate hero-animate-delay-5 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 pt-4 text-xs text-text-muted"
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-accent-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                {t("trustBadges.noData")}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-accent-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                {t("trustBadges.noLogs")}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-accent-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                {t("trustBadges.unlimited")}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-accent-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                {t("trustBadges.wireguard")}
              </span>
            </div>
          </div>

          {/* Right Column - Card with iPhone (hidden on mobile) */}
          <div className="hero-animate hero-animate-delay-3 hidden lg:flex justify-end">
            <Card
              padding="lg"
              className="relative w-full max-w-xl lg:max-w-2xl aspect-[5/6] overflow-hidden"
            >
              {/* Decorative gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent-teal/10 via-transparent to-accent-gold/5" />

              {/* iPhone Image */}
              <div className="absolute inset-0">
                <Image
                  src="/images/hero.avif"
                  alt="Doppler VPN - Protected connection"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
