import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PostForm } from "@/components/admin/post-form";

interface PostData {
  id: string;
  slug: string;
  author_name: string;
  status: string;
  published_at: string | null;
  image_url: string | null;
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
  }[];
  blog_post_tags: {
    tag_id: string;
  }[];
}

interface TagRow {
  id: string;
  slug: string;
  blog_tag_translations: { locale: string; name: string }[];
}

async function getPost(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      `
      id,
      slug,
      author_name,
      status,
      published_at,
      image_url,
      blog_post_translations (
        locale,
        title,
        excerpt,
        content,
        image_alt,
        meta_title,
        meta_description,
        og_title,
        og_description
      ),
      blog_post_tags (
        tag_id
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as unknown as PostData;
}

async function getTags() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_tags")
    .select(
      `
      id,
      slug,
      blog_tag_translations (locale, name)
    `
    )
    .order("slug");

  return ((data as TagRow[] | null) || []).map((tag) => ({
    id: tag.id,
    slug: tag.slug,
    name:
      tag.blog_tag_translations.find((t) => t.locale === "en")?.name ||
      tag.slug,
  }));
}

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, tags] = await Promise.all([getPost(id), getTags()]);

  if (!post) {
    notFound();
  }

  const enTranslation = post.blog_post_translations.find(
    (t) => t.locale === "en"
  );
  const translationCount = post.blog_post_translations.length;

  const initialData = {
    slug: post.slug,
    author_name: post.author_name,
    status: post.status,
    published_at: post.published_at,
    image_url: post.image_url,
    title: enTranslation?.title || "",
    excerpt: enTranslation?.excerpt || "",
    content: enTranslation?.content || "",
    image_alt: enTranslation?.image_alt || null,
    meta_title: enTranslation?.meta_title || null,
    meta_description: enTranslation?.meta_description || null,
    og_title: enTranslation?.og_title || null,
    og_description: enTranslation?.og_description || null,
    tag_ids: post.blog_post_tags.map((pt) => pt.tag_id),
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Edit Post</h1>
          <p className="text-text-muted text-sm mt-1 truncate">
            /{post.slug} — {translationCount}/21 translations
          </p>
        </div>
        <Link
          href={`/admin-dvpn/posts/${id}/translations`}
          className="inline-flex items-center gap-2 bg-bg-secondary border border-overlay/10 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm text-text-muted hover:text-text-primary hover:border-overlay/20 transition-colors self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
          </svg>
          Translations
        </Link>
      </div>
      <PostForm
        mode="edit"
        postId={id}
        initialData={initialData}
        availableTags={tags}
      />
    </div>
  );
}
