import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TranslationGrid } from "@/components/admin/translation-grid";

interface PostTranslationsData {
  id: string;
  slug: string;
  blog_post_translations: {
    locale: string;
    title: string;
    excerpt: string;
    content: string;
    image_alt: string | null;
    meta_title: string | null;
    meta_description: string | null;
    og_title: string | null;
    og_description: string | null;
    updated_at: string;
  }[];
}

async function getPostWithTranslations(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      `
      id,
      slug,
      blog_post_translations (
        locale,
        title,
        excerpt,
        content,
        image_alt,
        meta_title,
        meta_description,
        og_title,
        og_description,
        updated_at
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as unknown as PostTranslationsData;
}

export default async function TranslationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPostWithTranslations(id);

  if (!post) {
    notFound();
  }

  const enTranslation = post.blog_post_translations.find(
    (t) => t.locale === "en"
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Translations</h1>
          <p className="text-text-muted text-sm mt-1">
            {enTranslation?.title || post.slug} —{" "}
            {post.blog_post_translations.length}/21 languages
          </p>
        </div>
        <Link
          href={`/admin-dvpn/posts/${id}`}
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back to Edit
        </Link>
      </div>

      <TranslationGrid
        postId={id}
        translations={post.blog_post_translations}
      />
    </div>
  );
}
