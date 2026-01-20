import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Instrument_Serif, Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import { routing, isRtlLocale } from "@/i18n/routing";
import {
  OrganizationSchema,
  ProductSchema,
  WebsiteSchema,
  SoftwareApplicationSchema,
} from "@/components/seo/json-ld";
import "@/app/globals.css";

// Instrument Serif - for hero headline only
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: "400",
  style: ["normal", "italic"],
});

// Space Grotesk - main font for body and section headers
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// FK Raster - for "Stay protected" text only
const fkRaster = localFont({
  src: "../../fonts/FKRasterRomanCompact-Blended.otf",
  variable: "--font-raster",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    en: "Doppler VPN — Free VPN No Registration | Private & Secure",
    he: "Doppler VPN — VPN חינמי ללא רישום | פרטי ומאובטח",
  };

  const descriptions: Record<string, string> = {
    en: "Free VPN with no email or sign up required. Connect instantly with WireGuard encryption, built-in ad blocker & content filter. No logs. No data caps.",
    he: "VPN חינמי ללא צורך באימייל או הרשמה. התחבר מיידית עם הצפנת WireGuard, חוסם פרסומות מובנה וסינון תוכן. ללא יומנים. ללא הגבלות.",
  };

  return {
    title: {
      default: titles[locale] || titles.en,
      template: "%s | Doppler VPN",
    },
    description: descriptions[locale] || descriptions.en,
    icons: {
      icon: [
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      ],
      shortcut: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
    manifest: "/site.webmanifest",
    openGraph: {
      title: titles[locale] || titles.en,
      description: descriptions[locale] || descriptions.en,
      url: `https://dopplervpn.com/${locale}`,
      siteName: "Doppler VPN",
      locale: locale === "he" ? "he_IL" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: titles[locale] || titles.en,
      description: descriptions[locale] || descriptions.en,
    },
    alternates: {
      canonical: `https://dopplervpn.com/${locale}`,
      languages: {
        en: "https://dopplervpn.com/en",
        he: "https://dopplervpn.com/he",
      },
    },
    verification: {
      google: "vfzTLNRXO6Wqg4yP5UTzG8jlnVilqSxwsW4cEAOvqx8",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = isRtlLocale(locale) ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${instrumentSerif.variable} ${spaceGrotesk.variable} ${fkRaster.variable}`}
    >
      <head>
        <OrganizationSchema locale={locale} />
        <ProductSchema locale={locale} />
        <WebsiteSchema locale={locale} />
        <SoftwareApplicationSchema locale={locale} />
      </head>
      <body className="min-h-screen bg-bg-primary text-text-primary font-body antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
