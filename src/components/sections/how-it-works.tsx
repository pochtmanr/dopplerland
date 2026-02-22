"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { Section, SectionHeader } from "@/components/ui/section";
import { staggerContainerVariants, fadeUpVariants } from "@/lib/animations";

const stepIcons = {
  download: (
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
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  ),
  connect: (
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
        d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9"
      />
    </svg>
  ),
  browse: (
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

const stepKeys = ["download", "connect", "browse"] as const;

const stepLinks: Record<(typeof stepKeys)[number], { href: string; isPage?: boolean }> = {
  download: { href: "/apps", isPage: true },
  connect: { href: "/guide", isPage: true },
  browse: { href: "/#faq" },
};

export function HowItWorks() {
  const t = useTranslations("howItWorks");

  return (
    <Section id="how-it-works">
      <SectionHeader title={t("title")} subtitle={t("subtitle")} />

      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12"
      >
        {stepKeys.map((key, index) => (
          <motion.div
            key={key}
            variants={fadeUpVariants}
            className="relative text-center"
          >
            {/* Connector Line (desktop only) */}
            {index < stepKeys.length - 1 && (
              <div className="hidden md:block absolute top-12 start-[60%] w-[80%] h-px bg-gradient-to-r rtl:bg-gradient-to-l from-accent-teal/50 to-transparent" />
            )}

            {/* Step Number */}
            <div className="relative inline-flex items-center justify-center mb-6">
              {/* Shadow glow - halved opacity in light mode */}
              <div className="absolute w-28 h-28 rounded-full bg-accent-teal/20 [.light_&]:bg-accent-teal/10 blur-sm" />
              <div className="relative w-20 h-20 rounded-full bg-bg-secondary border border-accent-teal/50 [.light_&]:border-accent-teal/30 flex items-center justify-center">
                <span className="absolute -top-2 -end-2 w-8 h-8 rounded-full bg-accent-gold text-bg-primary font-bold text-sm flex items-center justify-center">
                  {index + 1}
                </span>
                <div className="text-accent-teal-light">{stepIcons[key]}</div>
              </div>
            </div>

            {/* Title as Link */}
            {stepLinks[key].isPage ? (
              <Link
                href={stepLinks[key].href}
                className="inline-flex items-center gap-2 font-display text-xl md:text-2xl font-semibold text-text-primary hover:text-accent-teal transition-colors mb-2"
              >
                {t(`steps.${key}.title`)}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <a
                href={stepLinks[key].href}
                className="inline-flex items-center gap-2 font-display text-xl md:text-2xl font-semibold text-text-primary hover:text-accent-teal transition-colors mb-2"
              >
                {t(`steps.${key}.title`)}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            )}
            <p className="text-text-muted text-base">
              {t(`steps.${key}.description`)}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}
