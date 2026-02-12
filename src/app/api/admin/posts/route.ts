import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/posts — list all posts (any status)
export async function GET() {
  const { admin, supabase, error } = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { data: posts, error: dbError } = await supabase
    .from("blog_posts")
    .select(
      `
      id,
      slug,
      image_url,
      status,
      published_at,
      updated_at,
      author_name,
      blog_post_translations (
        locale,
        title
      )
    `
    )
    .order("updated_at", { ascending: false });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(posts);
}

// POST /api/admin/posts — create a new post with EN translation
export async function POST(request: Request) {
  const { admin, error } = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const db = createAdminClient();

  const body = await request.json();
  const {
    slug,
    author_name = "Doppler Team",
    status = "draft",
    published_at,
    image_url,
    title,
    excerpt,
    content,
    image_alt,
    meta_title,
    meta_description,
    og_title,
    og_description,
    tag_ids,
  } = body;

  if (!slug || !title || !excerpt || !content) {
    return NextResponse.json(
      { error: "slug, title, excerpt, and content are required" },
      { status: 400 }
    );
  }

  // Create the post
  const { data: post, error: postError } = await db
    .from("blog_posts")
    .insert({
      slug,
      author_name,
      status,
      published_at:
        published_at || (status === "published" ? new Date().toISOString() : null),
      image_url: image_url || null,
    })
    .select("id")
    .single();

  if (postError || !post) {
    return NextResponse.json(
      { error: postError?.message || "Failed to create post" },
      { status: 500 }
    );
  }

  // Create EN translation
  const { error: transError } = await db
    .from("blog_post_translations")
    .insert({
      post_id: post.id,
      locale: "en" as const,
      title,
      excerpt,
      content,
      image_alt: image_alt || null,
      meta_title: meta_title || null,
      meta_description: meta_description || null,
      og_title: og_title || null,
      og_description: og_description || null,
    });

  if (transError) {
    await db.from("blog_posts").delete().eq("id", post.id);
    return NextResponse.json({ error: transError.message }, { status: 500 });
  }

  // Attach tags if provided
  if (tag_ids && tag_ids.length > 0) {
    const tagLinks = tag_ids.map((tag_id: string) => ({
      post_id: post.id,
      tag_id,
    }));
    await db.from("blog_post_tags").insert(tagLinks);
  }

  return NextResponse.json({ id: post.id, slug }, { status: 201 });
}
