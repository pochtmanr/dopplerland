import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { createStaticClient } from "@/lib/supabase/server";

const baseUrl = "https://dopplervpn.com";

interface SitemapPost {
  slug: string;
  updated_at: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createStaticClient();

  // Fetch all published blog posts
  const { data: postsRaw } = await supabase
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("status", "published");

  const posts = postsRaw as SitemapPost[] | null;

  // Static pages
  const staticPages = ["", "/privacy", "/terms", "/blog"];

  const staticEntries = routing.locales.flatMap((locale) =>
    staticPages.map((page) => {
      // Default locale (en) should be at root, others use locale prefix
      const localePath = locale === routing.defaultLocale ? "" : `/${locale}`;
      return {
        url: `${baseUrl}${localePath}${page}`,
        lastModified: new Date(),
        changeFrequency:
          page === ""
            ? ("weekly" as const)
            : page === "/blog"
              ? ("daily" as const)
              : ("monthly" as const),
        priority: page === "" ? 1 : page === "/blog" ? 0.9 : 0.5,
      };
    })
  );

  // Blog post pages
  const blogEntries = (posts || []).flatMap((post) =>
    routing.locales.map((locale) => {
      // Default locale (en) should be at root, others use locale prefix
      const localePath = locale === routing.defaultLocale ? "" : `/${locale}`;
      return {
        url: `${baseUrl}${localePath}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    })
  );

  return [...staticEntries, ...blogEntries];
}
