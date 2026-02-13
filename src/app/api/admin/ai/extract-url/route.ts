import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { extractFromUrl } from "@/lib/openai/extract";

export async function POST(request: Request) {
  const { admin, error } = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { url } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  try {
    new URL(url); // Validate URL format
  } catch {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  try {
    const result = await extractFromUrl(url);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[extract-url] Error:", err);
    const message =
      err instanceof Error ? err.message : "URL extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
