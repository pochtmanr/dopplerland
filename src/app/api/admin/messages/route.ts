import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

interface MsgRow { id: number; telegram_user_id: number; direction: string; message_type: string; content: string; template_key: string | null; created_at: string; conversation_id: number | null; metadata: Record<string, unknown> | null; }
interface UserRow { telegram_id: number; username: string | null; first_name: string | null; bot_source: string | null; }

export async function GET(request: NextRequest) {
  const { admin, error } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status: 401 });

  try {
    const sp = request.nextUrl.searchParams;
    const page = parseInt(sp.get("page") || "1");
    const limit = parseInt(sp.get("limit") || "50");
    const filter = sp.get("filter") || "all";
    const search = sp.get("search") || "";
    const offset = (page - 1) * limit;
    const supabase = createAdminClient();

    let query = supabase
      .from("bot_messages_log")
      .select("id, telegram_user_id, direction, message_type, content, template_key, created_at, conversation_id, metadata", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (filter === "escalations") query = query.or("template_key.eq.human.escalated,content.ilike.%escalat%");
    if (search) query = query.ilike("content", `%${search}%`);

    const { data, count, error: e } = await query;
    if (e) return NextResponse.json({ error: e.message }, { status: 500 });

    const messages = (data || []) as unknown as MsgRow[];
    if (!messages.length) return NextResponse.json({ messages: [], total: 0, page, limit, totalPages: 0 });

    const uniqueIds = [...new Set(messages.map((m) => m.telegram_user_id))];
    const userMap: Record<string, UserRow> = {};

    const { data: users } = await supabase.from("telegram_links").select("telegram_id, username, first_name, bot_source").in("telegram_id", uniqueIds);
    for (const u of (users || []) as unknown as UserRow[]) userMap[String(u.telegram_id)] = u;

    const missingIds = uniqueIds.filter((id) => !userMap[String(id)]);
    if (missingIds.length) {
      const { data: old } = await supabase.from("telegram_users").select("telegram_id, username, first_name, bot_source").in("telegram_id", missingIds);
      for (const u of (old || []) as unknown as UserRow[]) userMap[String(u.telegram_id)] = u;
    }

    let enriched = messages.map((m) => {
      const u = userMap[String(m.telegram_user_id)] || { telegram_id: 0, username: null, first_name: null, bot_source: null };
      return { ...m, username: u.username, first_name: u.first_name, bot_source: u.bot_source };
    });

    if (filter === "support") enriched = enriched.filter((m) => m.bot_source === "support");
    else if (filter === "main") enriched = enriched.filter((m) => m.bot_source === "main");

    return NextResponse.json({ messages: enriched, total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) });
  } catch (err) {
    console.error("Messages API error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
