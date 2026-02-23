import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";

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

  // Fetch user info (with new status fields)
  const { data: user } = await supabase
    .from("telegram_links")
    .select(
      "telegram_id, account_id, username, first_name, last_name, bot_source, bot_state, total_messages, last_active_at, current_device, current_issue, support_status, support_status_updated_at, support_status_updated_by"
    )
    .eq("telegram_id", telegramId)
    .single();

  // Fallback to old table
  let userInfo = user;
  if (!userInfo) {
    const { data: oldUser } = await supabase
      .from("telegram_users")
      .select(
        "telegram_id, username, first_name, last_name, bot_source, bot_state, total_messages"
      )
      .eq("telegram_id", telegramId)
      .single();
    userInfo = oldUser;
  }

  // Fetch account/subscription info if linked
  let account = null;
  const accountId = (userInfo as unknown as Record<string, unknown>)?.account_id;
  if (accountId) {
    const { data } = await supabase
      .from("accounts")
      .select(
        "id, account_id, subscription_tier, subscription_expires_at, subscription_store, subscription_product_id, max_devices, created_at"
      )
      .eq("id", accountId)
      .single();
    account = data;
  }

  // Fetch all messages
  const { data: messages, error: msgError } = await supabase
    .from("bot_messages_log")
    .select(
      "id, telegram_user_id, direction, message_type, content, template_key, created_at, conversation_id, metadata"
    )
    .eq("telegram_user_id", telegramId)
    .order("created_at", { ascending: true });

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }

  return NextResponse.json({
    user: userInfo || {
      telegram_id: telegramId,
      username: null,
      first_name: null,
    },
    account,
    messages: messages || [],
  });
}

// Update support status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ telegramId: string }> }
) {
  const { admin, error } = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { telegramId } = await params;
  const { status } = await request.json();

  const validStatuses = [
    "new",
    "in_progress",
    "solved",
    "refunded",
    "spam",
    "banned",
  ];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = createUntypedAdminClient();

  const { error: updateError } = await supabase
    .from("telegram_links")
    .update({
      support_status: status,
      support_status_updated_at: new Date().toISOString(),
      support_status_updated_by: admin.email,
    })
    .eq("telegram_id", telegramId);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, status });
}

// Delete all messages for a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ telegramId: string }> }
) {
  const { admin, error } = await requireAdmin("admin");
  if (!admin) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { telegramId } = await params;
  const supabase = createUntypedAdminClient();

  const { error: deleteError, count } = await supabase
    .from("bot_messages_log")
    .delete({ count: "exact" })
    .eq("telegram_user_id", telegramId);

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, deleted: count });
}
