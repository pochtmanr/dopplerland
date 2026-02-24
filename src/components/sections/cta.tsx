"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";

interface StoreButtonProps {
  store: "apple" | "google";
  label: string;
  href: string;
}

function StoreButton({ store, label, href }: StoreButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium
        transition-colors focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-accent-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary
        ${
          store === "apple"
            ? "bg-accent-teal/20 text-accent-teal hover:bg-accent-teal/30"
            : "bg-accent-gold/20 text-accent-gold hover:bg-accent-gold/30"
        }
      `}
    >
      {store === "apple" ? (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
        </svg>
      )}
      {label}
    </a>
  );
}

interface ProductSectionProps {
  appIcon: string;
  titleItalic: string;
  titleMiddle: string;
  titlePlayful: string;
  subtitle: string;
  appStoreLabel: string;
  playStoreLabel: string;
  appStoreHref: string;
  playStoreHref: string;
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
  accentColor?: "teal" | "gold";
}

function ProductSection({
  appIcon,
  titleItalic,
  titleMiddle,
  titlePlayful,
  subtitle,
  appStoreLabel,
  playStoreLabel,
  appStoreHref,
  playStoreHref,
  imageSrc,
  imageAlt,
  reverse = false,
  accentColor = "teal",
}: ProductSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
      {/* Content Column */}
      <Reveal className={`space-y-6 text-center lg:text-start ${reverse ? "lg:order-2" : ""}`}>
        {/* App Icon + Headline */}
        <div className="flex flex-row items-center justify-center lg:justify-start gap-4">
          {/* iOS-style App Icon */}
          <Image
            src={appIcon}
            alt={titlePlayful}
            width={80}
            height={80}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-[18px] shadow-lg shrink-0"
          />

          {/* Headline with 3-style typography */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl text-text-primary leading-tight">
            {/* Instrument Serif Italic */}
            <span
              className="italic"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {titleItalic}
            </span>{" "}
            {/* Instrument Serif Regular */}
            <span style={{ fontFamily: "var(--font-serif)" }}>
              {titleMiddle}
            </span>{" "}
            {/* FK Raster (playful) */}
            <span
              className="bg-gradient-to-t from-text-muted to-text-primary bg-clip-text text-transparent"
              style={{ fontFamily: "var(--font-raster)" }}
            >
              {titlePlayful}
            </span>
          </h2>
        </div>

        {/* Subheadline */}
        <p className="text-text-muted text-lg max-w-md mx-auto lg:mx-0">
          {subtitle}
        </p>

        {/* Store Buttons */}
        <div className="flex flex-row flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
          <StoreButton
            store="apple"
            label={appStoreLabel}
            href={appStoreHref}
          />
          <StoreButton
            store="google"
            label={playStoreLabel}
            href={playStoreHref}
          />
        </div>
      </Reveal>

      {/* Image Column - 4:3 aspect ratio card */}
      <Reveal delay={100} className={`w-full ${reverse ? "lg:order-1" : ""}`}>
        <Card
          padding="none"
          className={`relative w-full aspect-[4/3] overflow-hidden ${
            accentColor === "teal"
              ? "border-accent-teal/20 bg-gradient-to-br from-accent-teal/10 via-transparent to-accent-gold/5"
              : "border-accent-gold/20 bg-gradient-to-br from-accent-gold/10 via-transparent to-accent-teal/5"
          }`}
        >
          <div className="absolute inset-0">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover"
            />
          </div>
        </Card>
      </Reveal>
    </div>
  );
}

export function CTA() {
  const t = useTranslations("cta");

  return (
    <section className="relative py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 start-1/4 w-96 h-96 bg-accent-teal/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 end-1/4 w-96 h-96 bg-accent-gold/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-24 lg:space-y-32">
        {/* Doppler VPN Section */}
        <ProductSection
          appIcon="/images/iosdopplerlogo.png"
          titleItalic={t("doppler.titleItalic")}
          titleMiddle={t("doppler.titleMiddle")}
          titlePlayful={t("doppler.titlePlayful")}
          subtitle={t("doppler.subtitle")}
          appStoreLabel={t("doppler.appStore")}
          playStoreLabel={t("doppler.playStore")}
          appStoreHref="https://apps.apple.com/us/app/doppler-vpn-fast-secure/id6757091773"
          playStoreHref="https://play.google.com/store/apps/details?id=com.dopplervpn.android"
          imageSrc="/images/dopplerdownload.avif"
          imageAlt="Doppler VPN app interface"
          accentColor="teal"
        />

        {/* Simnetiq Section */}
        <ProductSection
          appIcon="/images/iossimnetiqlogo.png"
          titleItalic={t("simnetiq.titleItalic")}
          titleMiddle={t("simnetiq.titleMiddle")}
          titlePlayful={t("simnetiq.titlePlayful")}
          subtitle={t("simnetiq.subtitle")}
          appStoreLabel={t("simnetiq.appStore")}
          playStoreLabel={t("simnetiq.playStore")}
          appStoreHref="https://apps.apple.com/gb/app/simnetiq-travel-esim-data/id6755963262"
          playStoreHref="https://play.google.com/store/apps/details?id=com.simnetiq.storeAndroid&hl=en"
          imageSrc="/images/simnetiqiphones.avif"
          imageAlt="Simnetiq app"
          reverse
          accentColor="gold"
        />

        {/* Footer Attribution with external link arrow */}
        <Reveal className="text-center" delay={100}>
          <p className="text-text-muted text-sm">
            {t("byLabel")}{" "}
            <a
              href="https://simnetiq.store"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-accent-gold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal rounded"
            >
              {t("simnetiqName")}
              {/* External link arrow (45° up-right) */}
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 17L17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
