import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { rewriteContent } from "@/lib/openai/rewrite";

export async function POST(request: Request) {
  const { admin, error } = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { text } = await request.json();

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const result = await rewriteContent(text);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI rewrite failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
