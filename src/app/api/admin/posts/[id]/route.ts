import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

// GET /api/admin/posts/[id] — get single post with all translations
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { admin, supabase, error } = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { id } = await params;

  const { data: post, error: dbError } = await supabase
    .from("blog_posts")
    .select(
      `
      *,
      blog_post_translations (*),
      blog_post_tags (
        tag_id,
        blog_tags (
          id,
          slug,
          blog_tag_translations (locale, name)
        )
      )
    `
    )
    .eq("id", id)
    .single();

  if (dbError || !post) {
    return NextResponse.json(
      { error: dbError?.message || "Post not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(post);
}

// PUT /api/admin/posts/[id] — update post metadata + EN translation
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { admin, error } = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const db = createAdminClient();
  const { id } = await params;
  const body = await request.json();
  const {
    slug,
    author_name,
    status,
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

  // Update post metadata
  const postUpdate: Record<string, unknown> = {};
  if (slug !== undefined) postUpdate.slug = slug;
  if (author_name !== undefined) postUpdate.author_name = author_name;
  if (status !== undefined) postUpdate.status = status;
  if (published_at !== undefined) postUpdate.published_at = published_at;
  if (image_url !== undefined) postUpdate.image_url = image_url;

  // If publishing for first time, set published_at
  if (status === "published" && published_at === undefined) {
    const { data: existing } = await db
      .from("blog_posts")
      .select("published_at")
      .eq("id", id)
      .single();
    if (existing && !existing.published_at) {
      postUpdate.published_at = new Date().toISOString();
    }
  }

  if (Object.keys(postUpdate).length > 0) {
    const { error: postError } = await db
      .from("blog_posts")
      .update(postUpdate as Database["public"]["Tables"]["blog_posts"]["Update"])
      .eq("id", id);

    if (postError) {
      return NextResponse.json({ error: postError.message }, { status: 500 });
    }
  }

  // Update EN translation if content fields are provided
  if (title || excerpt || content) {
    const { error: transError } = await db
      .from("blog_post_translations")
      .upsert(
        {
          post_id: id,
          locale: "en" as const,
          title: title || "",
          excerpt: excerpt || "",
          content: content || "",
          image_alt: image_alt ?? null,
          meta_title: meta_title ?? null,
          meta_description: meta_description ?? null,
          og_title: og_title ?? null,
          og_description: og_description ?? null,
        },
        { onConflict: "post_id,locale" }
      );

    if (transError) {
      return NextResponse.json({ error: transError.message }, { status: 500 });
    }
  }

  // Update tags if provided
  if (tag_ids !== undefined) {
    await db.from("blog_post_tags").delete().eq("post_id", id);

    if (tag_ids.length > 0) {
      const tagLinks = tag_ids.map((tag_id: string) => ({
        post_id: id,
        tag_id,
      }));
      await db.from("blog_post_tags").insert(tagLinks);
    }
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/posts/[id] — delete a post
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { admin, error } = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const db = createAdminClient();
  const { id } = await params;

  const { error: dbError } = await db
    .from("blog_posts")
    .delete()
    .eq("id", id);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
