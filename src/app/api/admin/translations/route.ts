import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

// PUT /api/admin/translations — save a single translation
export async function PUT(request: Request) {
  const { admin, error } = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const body = await request.json();
  const {
    post_id,
    locale,
    title,
    excerpt,
    content,
    image_alt,
    meta_title,
    meta_description,
    og_title,
    og_description,
  } = body;

  if (!post_id || !locale || !title || !excerpt || !content) {
    return NextResponse.json(
      { error: "post_id, locale, title, excerpt, and content are required" },
      { status: 400 }
    );
  }

  const db = createAdminClient();

  const { error: upsertError } = await db
    .from("blog_post_translations")
    .upsert(
      {
        post_id,
        locale,
        title,
        excerpt,
        content,
        image_alt: image_alt ?? null,
        meta_title: meta_title ?? null,
        meta_description: meta_description ?? null,
        og_title: og_title ?? null,
        og_description: og_description ?? null,
      },
      { onConflict: "post_id,locale" }
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
