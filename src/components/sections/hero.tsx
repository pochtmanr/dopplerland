"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { fadeUpVariants, staggerContainerVariants } from "@/lib/animations";

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "desktop";

  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
}

export function Hero() {
  const t = useTranslations("hero");
  const [platform, setPlatform] = useState<Platform>("desktop");

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-28 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 start-1/4 w-96 h-96 bg-accent-teal/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 end-1/4 w-96 h-96 bg-accent-gold/10 rounded-full blur-3xl" />
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="relative z-10 mx-auto max-w-7xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 text-center lg:text-start"
          >
            {/* Tagline */}
            <motion.div variants={fadeUpVariants}>
              <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-accent-teal/30 text-white text-sm font-medium border border-accent-teal/40">
                {t("tagline")}
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUpVariants}
              className="text-5xl sm:text-6xl md:text-6xl lg:text-7xl text-text-primary leading-tight"
            >
              <span
                className="block"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                <span className="italic">{t("headlinePart1a")}</span>{" "}
                <span>{t("headlinePart1b")}</span>
              </span>
              <span
                className="block mt-0 bg-gradient-to-t from-text-muted to-white bg-clip-text text-transparent"
                style={{ fontFamily: "var(--font-raster)" }}
              >
                {t("headlinePart2")}
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeUpVariants}
              className="text-text-muted text-md sm:text-xl md:text-2xl max-w-md sm:max-w-xl mx-auto lg:mx-0"
            >
              {t("subheadline")}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeUpVariants}
              className="flex flex-row items-center justify-center lg:justify-start gap-3 pt-4"
            >
              {/* iOS Button - Show on iOS or Desktop */}
              {(platform === "ios" || platform === "desktop") && (
                <a
                  href="#pricing"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-teal hover:bg-accent-teal-light rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-bg-primary"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  <span className="text-sm font-medium text-bg-primary">{t("downloadIos")}</span>
                </a>
              )}

              {/* Android Button - Show on Android or Desktop */}
              {(platform === "android" || platform === "desktop") && (
                <a
                  href="#pricing"
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${
                    platform === "android"
                      ? "bg-accent-teal hover:bg-accent-teal/90"
                      : "bg-white/10 hover:bg-white/15 border border-white/20"
                  }`}
                >
                  <svg
                    className={`w-5 h-5 ${platform === "android" ? "text-bg-primary" : "text-text-primary"}`}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  <span className={`text-sm font-medium ${platform === "android" ? "text-bg-primary" : "text-text-primary"}`}>
                    {t("downloadAndroid")}
                  </span>
                </a>
              )}
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              variants={fadeUpVariants}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 pt-4 text-xs text-text-muted"
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
            </motion.div>
          </motion.div>

          {/* Right Column - Card with iPhone (hidden on mobile) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            className="hidden lg:flex justify-end"
          >
            <Card
              padding="lg"
              className="relative w-full max-w-xl lg:max-w-2xl aspect-[3/4] overflow-hidden"
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
          </motion.div>
        </div>
      </div>
    </section>
  );
}
