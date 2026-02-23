"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cardVariants } from "@/lib/animations";

type Duration = "monthly" | "sixMonth" | "annual";
type Region = "US" | "EU";

interface PriceData {
  total: number;
  monthly: number;
  savings: number | null;
}

const PRICES: Record<Region, Record<Duration, PriceData>> = {
  US: {
    monthly: { total: 7.99, monthly: 7.99, savings: null },
    sixMonth: { total: 29.99, monthly: 5.0, savings: 38 },
    annual: { total: 39.99, monthly: 3.33, savings: 58 },
  },
  EU: {
    monthly: { total: 8.99, monthly: 8.99, savings: null },
    sixMonth: { total: 34.99, monthly: 5.83, savings: 35 },
    annual: { total: 44.99, monthly: 3.75, savings: 58 },
  },
};

const CURRENCY_SYMBOLS: Record<Region, string> = {
  US: "$",
  EU: "€",
};

const featureKeys = [
  "noLogs",
  "adBlocker",
  "categoryFilter",
  "customBlocklist",
  "devices",
  "support",
] as const;

function detectRegion(): Region {
  if (typeof window === "undefined") return "US";

  const language = navigator.language || "";
  const euLocales = [
    "de",
    "fr",
    "it",
    "es",
    "nl",
    "pt",
    "pl",
    "el",
    "cs",
    "sk",
    "hu",
    "ro",
    "bg",
    "hr",
    "sl",
    "et",
    "lv",
    "lt",
    "fi",
    "sv",
    "da",
  ];

  const langCode = language.split("-")[0].toLowerCase();
  if (euLocales.includes(langCode)) return "EU";

  return "US";
}

function formatPrice(amount: number, region: Region): string {
  const symbol = CURRENCY_SYMBOLS[region];
  return `${symbol}${amount.toFixed(2)}`;
}

interface DurationSelectorProps {
  selected: Duration;
  onSelect: (duration: Duration) => void;
  t: ReturnType<typeof useTranslations>;
}

function DurationSelector({ selected, onSelect, t }: DurationSelectorProps) {
  const durations: Duration[] = ["monthly", "sixMonth", "annual"];

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      let newIndex = currentIndex;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        newIndex = (currentIndex + 1) % durations.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        newIndex = (currentIndex - 1 + durations.length) % durations.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        newIndex = durations.length - 1;
      }

      if (newIndex !== currentIndex) {
        onSelect(durations[newIndex]);
      }
    },
    [durations, onSelect]
  );

  return (
    <div
      role="tablist"
      aria-label={t("durationSelector")}
      className="relative flex bg-overlay/5 rounded-full p-1"
    >
      {durations.map((duration, index) => {
        const isSelected = selected === duration;
        const isAnnual = duration === "annual";

        return (
          <button
            key={duration}
            role="tab"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect(duration)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`
              relative flex-1 px-4 py-3 text-sm font-medium rounded-full
              transition-colors duration-200 focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-accent-teal focus-visible:ring-offset-2
              focus-visible:ring-offset-bg-primary
              ${
                isSelected
                  ? "text-bg-primary"
                  : "text-text-muted hover:text-text-primary"
              }
            `}
          >
            {isSelected && (
              <motion.span
                layoutId="duration-selector-bg"
                className="absolute inset-0 bg-accent-teal rounded-full"
                transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              {t(`durations.${duration}`)}
              {isAnnual && (
                <span className={`
                  hidden sm:inline text-[10px] uppercase tracking-wider font-bold
                  px-1.5 py-0.5 rounded-full
                  ${isSelected
                    ? "bg-bg-primary/20 text-bg-primary"
                    : "bg-accent-teal/15 text-accent-teal"
                  }
                `}>
                  {t("bestValue")}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface PriceDisplayProps {
  duration: Duration;
  region: Region;
  t: ReturnType<typeof useTranslations>;
}

function PriceDisplay({ duration, region, t }: PriceDisplayProps) {
  const priceData = PRICES[region][duration];
  const monthlyBase = PRICES[region].monthly.monthly;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${duration}-${region}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col items-center gap-2"
      >
        {/* Strikethrough original price (for multi-month plans) */}
        {priceData.savings && (
          <span className="text-lg text-text-muted line-through">
            {formatPrice(monthlyBase, region)}/mo
          </span>
        )}

        {/* Main price */}
        <div className="flex items-baseline gap-1">
          <span className="font-display text-5xl md:text-6xl font-bold text-text-primary">
            {formatPrice(priceData.monthly, region)}
          </span>
          <span className="text-xl text-text-muted">/mo</span>
        </div>

        {/* Total billing info */}
        <p className="text-text-muted text-sm">
          {duration === "monthly" ? (
            t("billedMonthly")
          ) : (
            <>
              {t("billed")} {formatPrice(priceData.total, region)}{" "}
              {duration === "sixMonth" ? t("every6Months") : t("perYear")}
            </>
          )}
        </p>

        {/* Savings badge */}
        {priceData.savings && (
          <Badge variant="teal" className="mt-1">
            {t("save")} {priceData.savings}%
          </Badge>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export function Pricing() {
  const t = useTranslations("pricing");
  const [selectedDuration, setSelectedDuration] = useState<Duration>("annual");
  const [region, setRegion] = useState<Region>("US");

  useEffect(() => {
    setRegion(detectRegion());
  }, []);

  return (
    <Section id="pricing" className="bg-bg-secondary/30">
      <SectionHeader title={t("title")} subtitle={t("subtitle")} />

      <motion.div
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-lg mx-auto"
      >
        <Card
          className="relative border-accent-teal/30 bg-gradient-to-b from-accent-teal/5 to-transparent"
          padding="lg"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <Badge variant="teal" className="mb-4">
              {t("plusBadge")}
            </Badge>
            <h3 className="font-display text-2xl font-semibold text-text-primary mb-2">
              {t("cardTitle")}
            </h3>
            <p className="text-text-muted text-sm">{t("cardSubtitle")}</p>
          </div>

          {/* Duration Selector */}
          <div className="mb-8">
            <DurationSelector
              selected={selectedDuration}
              onSelect={setSelectedDuration}
              t={t}
            />
          </div>

          {/* Price Display */}
          <div className="text-center mb-8 min-h-[140px] flex items-center justify-center">
            <PriceDisplay
              duration={selectedDuration}
              region={region}
              t={t}
            />
          </div>

          {/* Feature assurance */}
          <div className="space-y-3 mb-8">
            <p className="text-accent-teal text-sm font-medium text-center mb-4">
              {t("allFeaturesIncluded")}
            </p>
            <ul className="grid grid-cols-2 gap-2">
              {featureKeys.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-text-muted text-sm"
                >
                  <svg
                    className="w-4 h-4 text-accent-teal flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                  {t(`features.${feature}`)}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Button */}
          <Button variant="primary" className="w-full" size="lg" href="https://t.me/dopplercreatebot" external>
            {t("cta")}
          </Button>

          {/* Cancel anytime note */}
          <p className="text-center text-text-muted text-xs mt-4">
            {t("cancelAnytime")}
          </p>
        </Card>
      </motion.div>

      {/* Money-back guarantee */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="text-center text-text-muted text-sm mt-8"
      >
        <svg
          className="inline-block w-5 h-5 me-2 text-accent-teal"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
          />
        </svg>
        {t("guarantee")}
      </motion.p>

      {/* Region indicator (optional, can be removed) */}
      <p className="text-center text-text-muted/50 text-xs mt-4">
        {t("pricesIn")} {region === "US" ? "USD" : "EUR"}
      </p>
    </Section>
  );
}
