import { createClient } from "@/lib/supabase/server";
import { PostForm } from "@/components/admin/post-form";

interface TagRow {
  id: string;
  slug: string;
  blog_tag_translations: { locale: string; name: string }[];
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

export default async function NewPostPage() {
  const tags = await getTags();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">New Post</h1>
        <p className="text-text-muted text-sm mt-1">
          Create a new blog post in English. You can add translations later.
        </p>
      </div>
      <PostForm mode="create" availableTags={tags} />
    </div>
  );
}
