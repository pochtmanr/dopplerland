"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { fadeUpVariants, staggerContainerVariants } from "@/lib/animations";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AppInfo {
  icon: string;
  name: string;
  tagline: string;
  appStoreLabel: string;
  playStoreLabel: string;
  appStoreHref: string;
  playStoreHref: string;
  accentColor: "teal" | "gold";
}

interface BlogCtaProps {
  title: string;
  subtitle: string;
  doppler: {
    name: string;
    tagline: string;
    appStore: string;
    playStore: string;
  };
  simnetiq: {
    name: string;
    tagline: string;
    appStore: string;
    playStore: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Store Button Component (compact version)
// ─────────────────────────────────────────────────────────────────────────────

interface StoreButtonProps {
  store: "apple" | "google";
  label: string;
  href: string;
  variant?: "primary" | "secondary";
}

function StoreButton({ store, label, href, variant = "primary" }: StoreButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
        transition-all duration-200 focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-accent-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary
        ${
          isPrimary
            ? "bg-accent-teal hover:bg-accent-teal-light text-bg-white"
            : "bg-white/10 hover:bg-white/15 border border-white/20 text-text-primary"
        }
      `}
    >
      {store === "apple" ? (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
        </svg>
      )}
      {label}
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// App Promotion Card Component
// ─────────────────────────────────────────────────────────────────────────────

interface AppCardProps {
  app: AppInfo;
}

function AppCard({ app }: AppCardProps) {
  const borderColor = app.accentColor === "teal"
    ? "border-s-accent-teal"
    : "border-s-accent-gold";

  return (
    <Card
      hover
      className={`
        min-w-[280px] flex-shrink-0 snap-center
        border-s-2 ${borderColor}
        md:min-w-0 md:flex-shrink
      `}
    >
      {/* Header: Icon + Name */}
      <div className="flex items-start gap-3 mb-4">
        <Image
          src={app.icon}
          alt={app.name}
          width={56}
          height={56}
          className="w-14 h-14 rounded-xl shadow-md"
        />
        <div className="flex-1 min-w-0">
          <h3
            className="text-lg font-semibold text-text-primary"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {app.name}
          </h3>
          <p className="text-sm text-text-muted leading-relaxed line-clamp-2">
            {app.tagline}
          </p>
        </div>
      </div>

      {/* Store Buttons */}
      <div className="flex flex-wrap gap-2">
        <StoreButton
          store="apple"
          label={app.appStoreLabel}
          href={app.appStoreHref}
          variant="primary"
        />
        <StoreButton
          store="google"
          label={app.playStoreLabel}
          href={app.playStoreHref}
          variant="secondary"
        />
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Carousel Dots Component
// ─────────────────────────────────────────────────────────────────────────────

interface CarouselDotsProps {
  count: number;
  activeIndex: number;
  onDotClick: (index: number) => void;
}

function CarouselDots({ count, activeIndex, onDotClick }: CarouselDotsProps) {
  return (
    <div className="flex justify-center gap-2 mt-4 md:hidden">
      {Array.from({ length: count }).map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick(index)}
          className={`
            w-2 h-2 rounded-full transition-all duration-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal
            ${
              index === activeIndex
                ? "bg-accent-teal w-6"
                : "bg-white/30 hover:bg-white/50"
            }
          `}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main BlogCta Component
// ─────────────────────────────────────────────────────────────────────────────

export function BlogCta({ title, subtitle, doppler, simnetiq }: BlogCtaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // App data with store links
  const apps: AppInfo[] = [
    {
      icon: "/images/iosdopplerlogo.png",
      name: doppler.name,
      tagline: doppler.tagline,
      appStoreLabel: doppler.appStore,
      playStoreLabel: doppler.playStore,
      appStoreHref: "https://apps.apple.com/app/doppler-vpn/id6740261606",
      playStoreHref: "https://play.google.com/store/apps/details?id=com.dopplervpn.android",
      accentColor: "teal",
    },
    {
      icon: "/images/iossimnetiqlogo.png",
      name: simnetiq.name,
      tagline: simnetiq.tagline,
      appStoreLabel: simnetiq.appStore,
      playStoreLabel: simnetiq.playStore,
      appStoreHref: "https://apps.apple.com/gb/app/simnetiq-travel-esim-data/id6755963262",
      playStoreHref: "https://play.google.com/store/apps/details?id=com.simnetiq.storeAndroid&hl=en",
      accentColor: "gold",
    },
  ];

  // Handle scroll events to update active dot
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.offsetWidth * 0.85; // Approximate card width
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(newIndex, apps.length - 1));
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [apps.length]);

  // Scroll to specific card
  const scrollToCard = (index: number) => {
    const container = scrollRef.current;
    if (!container) return;

    const cards = container.querySelectorAll<HTMLElement>("[data-app-card]");
    if (cards[index]) {
      cards[index].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  };

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={staggerContainerVariants}
      className="mt-16"
    >
      {/* Section Header */}
      <motion.div variants={fadeUpVariants} className="text-center mb-8">
        <h2
          className="text-2xl sm:text-3xl font-semibold text-text-primary mb-2"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {title}
        </h2>
        <p className="text-text-muted max-w-md mx-auto">
          {subtitle}
        </p>
      </motion.div>

      {/* Desktop: Side-by-side grid */}
      <motion.div
        variants={fadeUpVariants}
        className="hidden md:grid md:grid-cols-2 gap-6"
      >
        {apps.map((app) => (
          <AppCard key={app.name} app={app} />
        ))}
      </motion.div>

      {/* Mobile: Horizontal scroll carousel */}
      <motion.div variants={fadeUpVariants} className="md:hidden">
        <div
          ref={scrollRef}
          className="
            flex gap-4 overflow-x-auto snap-x snap-mandatory
            -mx-4 px-4 pb-2
            scrollbar-none
          "
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {apps.map((app) => (
            <div key={app.name} data-app-card className="w-[85%] flex-shrink-0">
              <AppCard app={app} />
            </div>
          ))}
        </div>

        {/* Pagination dots */}
        <CarouselDots
          count={apps.length}
          activeIndex={activeIndex}
          onDotClick={scrollToCard}
        />
      </motion.div>
    </motion.section>
  );
}
