import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createUntypedAdminClient } from "@/lib/supabase/admin";

const PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  const { admin, error } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status: 401 });

  try {
    const sp = request.nextUrl.searchParams;
    const page = parseInt(sp.get("page") || "1");
    const type = sp.get("type") || "";
    const search = sp.get("search") || "";
    const offset = (page - 1) * PAGE_SIZE;

    const supabase = createUntypedAdminClient();

    let query = supabase
      .from("subscription_events")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (type) {
      query = query.eq("event_type", type);
    }

    if (search) {
      query = query.ilike("account_id", `%${search}%`);
    }

    const { data, count, error: queryError } = await query;

    if (queryError) {
      return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    return NextResponse.json({
      events: data || [],
      total: count || 0,
      page,
      pageSize: PAGE_SIZE,
    });
  } catch (err) {
    console.error("Subscriptions API error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
