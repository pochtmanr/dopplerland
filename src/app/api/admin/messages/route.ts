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
    const search = sp.get("search") || "";
    const offset = (page - 1) * limit;
    const supabase = createAdminClient();

    // First, find all telegram_user_ids that have escalation messages
    const { data: escalatedUsers } = await supabase
      .from("bot_messages_log")
      .select("telegram_user_id")
      .eq("template_key", "human.escalated");

    const escalatedIds = [...new Set((escalatedUsers || []).map((r: { telegram_user_id: number }) => r.telegram_user_id))];

    if (!escalatedIds.length) {
      return NextResponse.json({ messages: [], total: 0, page, limit, totalPages: 0 });
    }

    // Get escalation log entries (the escalation messages themselves)
    let query = supabase
      .from("bot_messages_log")
      .select("id, telegram_user_id, direction, message_type, content, template_key, created_at, conversation_id, metadata", { count: "exact" })
      .in("telegram_user_id", escalatedIds)
      .eq("template_key", "human.escalated")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) query = query.ilike("content", `%${search}%`);

    const { data, count, error: e } = await query;
    if (e) return NextResponse.json({ error: e.message }, { status: 500 });

    const messages = (data || []) as unknown as MsgRow[];
    if (!messages.length) return NextResponse.json({ messages: [], total: 0, page, limit, totalPages: 0 });

    // Enrich with user info
    const uniqueIds = [...new Set(messages.map((m) => m.telegram_user_id))];
    const userMap: Record<string, UserRow> = {};

    const { data: users } = await supabase.from("telegram_links").select("telegram_id, username, first_name, bot_source").in("telegram_id", uniqueIds);
    for (const u of (users || []) as unknown as UserRow[]) userMap[String(u.telegram_id)] = u;

    // Also extract escalation metadata (device, issue, account_code) from the log entry
    const enriched = messages.map((m) => {
      const u = userMap[String(m.telegram_user_id)] || { telegram_id: 0, username: null, first_name: null, bot_source: null };
      const meta = m.metadata as Record<string, string> | null;
      return {
        ...m,
        username: u.username,
        first_name: u.first_name,
        bot_source: "support",
        device: meta?.device || null,
        issue: meta?.issue || null,
        account_code: meta?.account_code || null,
      };
    });

    return NextResponse.json({ messages: enriched, total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) });
  } catch (err) {
    console.error("Messages API error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
