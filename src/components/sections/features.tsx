"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { staggerContainerVariants, cardVariants } from "@/lib/animations";

// Visual feature cards with images (Features 1, 2, 3, 5)
const visualFeatureKeys = [
  "noRegistration",
  "wireguard",
  "adBlocker",
  "minimalData",
] as const;

// Text-only feature cards (Features 4, 6)
const textFeatureKeys = ["contentFilter", "completelyFree"] as const;

// Image paths for visual feature cards
const featureImages: Record<(typeof visualFeatureKeys)[number], string> = {
  noRegistration: "/images/features/1.avif",
  wireguard: "/images/features/3.avif",
  adBlocker: "/images/features/2.avif",
  minimalData: "/images/features/4.avif",
};

// Visual headline text for each feature card (3-style typography like CTA)
const visualHeadlines: Record<(typeof visualFeatureKeys)[number], { italic: string; middle: string; playful: string }> = {
  noRegistration: { italic: "Designed", middle: "for", playful: "Privacy" },
  wireguard: { italic: "Designed", middle: "for", playful: "Security" },
  adBlocker: { italic: "Designed", middle: "to", playful: "Block" },
  minimalData: { italic: "Designed for", middle: "Minimal", playful: "Data" },
};

// Icons for text-only feature cards
const featureIcons: Record<(typeof textFeatureKeys)[number], React.ReactNode> = {
  contentFilter: (
    <svg
      className="w-8 h-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
      />
    </svg>
  ),
  completelyFree: (
    <svg
      className="w-8 h-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
      />
    </svg>
  ),
};

// Visual Feature Card Component
function VisualFeatureCard({
  featureKey,
  title,
  description,
}: {
  featureKey: (typeof visualFeatureKeys)[number];
  title: string;
  description: string;
}) {
  const headline = visualHeadlines[featureKey];
  const imagePath = featureImages[featureKey];

  return (
    <div className="relative h-full min-h-[320px] rounded-xl overflow-hidden group">
      {/* Background Image */}
      <Image
        src={imagePath}
        alt={title}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />

      {/* Gradient Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />

      {/* Text Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        {/* Feature Headline with 3-style Typography Treatment */}
        <h3 className="text-2xl sm:text-3xl lg:text-4xl text-white mb-3 leading-tight">
          {/* Instrument Serif Italic */}
          <span
            className="italic"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {headline.italic}
          </span>{" "}
          {/* Instrument Serif Regular */}
          <span style={{ fontFamily: "var(--font-serif)" }}>
            {headline.middle}
          </span>{" "}
          {/* FK Raster (playful) with gradient */}
          <span
            className="bg-gradient-to-t from-white/50 to-white bg-clip-text text-transparent"
            style={{ fontFamily: "var(--font-raster)" }}
          >
            {headline.playful}
          </span>
        </h3>

        {/* Original Feature Title */}
        <h4 className="text-sm font-medium text-amber-300 uppercase tracking-wider mb-2">
          {title}
        </h4>

        {/* Feature Description */}
        <p className="text-white/70 text-[10px] sm:text-xs leading-relaxed line-clamp-3">
          {description}
        </p>
      </div>
    </div>
  );
}

export function Features() {
  const t = useTranslations("features");

  return (
    <Section id="features">
      <SectionHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="flex justify-center mb-8">
        <Link
          href="/apps"
          className="inline-flex items-center gap-2 text-accent-teal hover:text-accent-teal-light font-medium transition-colors"
        >
          {t("getApp")}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Visual Feature Cards (Features 1, 2, 3, 5) */}
      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"
      >
        {visualFeatureKeys.map((key) => (
          <motion.div key={key} variants={cardVariants}>
            <VisualFeatureCard
              featureKey={key}
              title={t(`items.${key}.title`)}
              description={t(`items.${key}.description`)}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Text-Only Feature Cards (Features 4, 6) */}
      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {textFeatureKeys.map((key) => (
          <motion.div key={key} variants={cardVariants}>
            <Card hover className="h-full">
              <div className="text-accent-teal mb-4">{featureIcons[key]}</div>
              <CardTitle className="mb-2">{t(`items.${key}.title`)}</CardTitle>
              <CardDescription>
                {t(`items.${key}.description`)}
              </CardDescription>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}
