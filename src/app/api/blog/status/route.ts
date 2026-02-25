import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUPPORTED_LOCALES } from "@/lib/openai/translate";

function requireApiKey(request: Request) {
  const apiKey = process.env.BLOG_API_KEY;
  if (!apiKey) throw new Error("BLOG_API_KEY not configured");
  const auth = request.headers.get("authorization");
  if (!auth) return false;
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  return token === apiKey;
}

// GET /api/blog/status — check API health, key validity, stats
export async function GET(request: Request) {
  if (!requireApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();

  // Get post count
  const { count: totalPosts } = await db
    .from("blog_posts")
    .select("id", { count: "exact", head: true });

  const { count: publishedPosts } = await db
    .from("blog_posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  // Get translation count
  const { count: totalTranslations } = await db
    .from("blog_post_translations")
    .select("id", { count: "exact", head: true });

  // Template type distribution (template_type column added in migration 002, not yet in generated types)
  const { data: templateStats } = await db
    .from("blog_posts")
    .select("template_type" as string)
    .eq("status", "published");

  const templateDistribution = (
    (templateStats as unknown as { template_type: string | null }[]) || []
  ).reduce(
    (acc: Record<string, number>, row) => {
      const type = row.template_type || "quick-take";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Latest post
  const { data: latest } = await db
    .from("blog_posts")
    .select("slug, published_at, author_name")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({
    status: "ok",
    api_version: "1.0",
    key_expires: null, // No expiry — static key
    supported_locales: ["en", ...SUPPORTED_LOCALES],
    total_languages: SUPPORTED_LOCALES.length + 1,
    stats: {
      total_posts: totalPosts || 0,
      published_posts: publishedPosts || 0,
      total_translations: totalTranslations || 0,
      template_distribution: templateDistribution,
    },
    latest_post: latest
      ? {
          slug: latest.slug,
          published_at: latest.published_at,
          author: latest.author_name,
        }
      : null,
    endpoints: {
      create: "POST /api/blog/create",
      translate: "POST /api/blog/translate",
      status: "GET /api/blog/status",
    },
  });
}
