import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const baseUrl = "https://dopplervpn.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/privacy", "/terms"];

  return routing.locales.flatMap((locale) =>
    pages.map((page) => ({
      url: `${baseUrl}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: page === "" ? ("weekly" as const) : ("monthly" as const),
      priority: page === "" ? 1 : 0.8,
    }))
  );
}
