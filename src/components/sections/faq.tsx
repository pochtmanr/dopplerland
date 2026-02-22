"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Section, SectionHeader } from "@/components/ui/section";

const faqKeys = [
  "what",
  "noLogs",
  "adBlocker",
  "categories",
  "devices",
  "platforms",
  "whatIsIncluded",
  "plans",
  "trial",
  "cancel",
  "restore",
  "refund",
] as const;

function FaqItem({
  faqKey,
  isOpen,
  onToggle,
  t,
}: {
  faqKey: string;
  isOpen: boolean;
  onToggle: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="border-b border-overlay/10 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full py-6 flex items-center justify-between text-start gap-4 group"
        aria-expanded={isOpen}
      >
        <span className="font-display text-lg md:text-xl font-medium text-text-primary group-hover:text-accent-gold transition-colors">
          {t(`items.${faqKey}.question`)}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-text-muted group-hover:text-accent-gold transition-colors"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-text-muted leading-relaxed">
              {t(`items.${faqKey}.answer`)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQ() {
  const t = useTranslations("faq");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const mid = Math.ceil(faqKeys.length / 2);
  const leftKeys = faqKeys.slice(0, mid);
  const rightKeys = faqKeys.slice(mid);

  return (
    <Section id="faq">
      <SectionHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 lg:gap-12">
        <div>
          {leftKeys.map((key, index) => (
            <FaqItem
              key={key}
              faqKey={key}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              t={t}
            />
          ))}
        </div>
        <div>
          {rightKeys.map((key, i) => {
            const index = mid + i;
            return (
              <FaqItem
                key={key}
                faqKey={key}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                t={t}
              />
            );
          })}
        </div>
      </div>
    </Section>
  );
}
