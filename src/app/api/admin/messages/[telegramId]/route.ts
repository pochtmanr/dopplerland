import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ telegramId: string }> }
) {
  const { admin, error } = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { telegramId } = await params;
  const supabase = createAdminClient();

  // Fetch user info
  const { data: user } = await supabase
    .from("telegram_links")
    .select("telegram_id, username, first_name, last_name, bot_source, bot_state, total_messages, last_active_at, current_device, current_issue")
    .eq("telegram_id", telegramId)
    .single();

  // Fallback to old table
  let userInfo = user;
  if (!userInfo) {
    const { data: oldUser } = await supabase
      .from("telegram_users")
      .select("telegram_id, username, first_name, last_name, bot_source, bot_state, total_messages")
      .eq("telegram_id", telegramId)
      .single();
    userInfo = oldUser;
  }

  // Fetch all messages
  const { data: messages, error: msgError } = await supabase
    .from("bot_messages_log")
    .select("id, telegram_user_id, direction, message_type, content, template_key, created_at, conversation_id, metadata")
    .eq("telegram_user_id", telegramId)
    .order("created_at", { ascending: true });

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }

  return NextResponse.json({
    user: userInfo || { telegram_id: telegramId, username: null, first_name: null },
    messages: messages || [],
  });
}
