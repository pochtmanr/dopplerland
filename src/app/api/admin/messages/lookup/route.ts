import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createUntypedAdminClient } from "@/lib/supabase/admin";

/**
 * Lookup a user by telegram_id or account_code.
 * Returns account + subscription info.
 */
export async function GET(request: NextRequest) {
  const { admin, error } = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing ?q= parameter" }, { status: 400 });
  }

  const supabase = createUntypedAdminClient();

  // Try as telegram_id first (numeric)
  if (/^\d+$/.test(q)) {
    const { data: link } = await supabase
      .from("telegram_links")
      .select("telegram_id, account_id, username, first_name, bot_source, bot_state, support_status")
      .eq("telegram_id", q)
      .single();

    if (link) {
      let account = null;
      if (link.account_id) {
        const { data } = await supabase
          .from("accounts")
          .select("id, account_id, subscription_tier, subscription_expires_at, subscription_store, subscription_product_id, max_devices, created_at")
          .eq("id", link.account_id)
          .single();
        account = data;
      }
      return NextResponse.json({ source: "telegram_id", user: link, account });
    }
  }

  // Try as account_code (e.g. VPN-XXXX-XXXX-XXXX)
  const { data: account } = await supabase
    .from("accounts")
    .select("id, account_id, subscription_tier, subscription_expires_at, subscription_store, subscription_product_id, max_devices, created_at")
    .eq("account_id", q.toUpperCase())
    .single();

  if (account) {
    const { data: link } = await supabase
      .from("telegram_links")
      .select("telegram_id, username, first_name, bot_source, bot_state, support_status")
      .eq("account_id", account.id)
      .single();

    return NextResponse.json({ source: "account_code", user: link || null, account });
  }

  // Try as @username
  if (q.startsWith("@") || /^[a-zA-Z]/.test(q)) {
    const username = q.replace(/^@/, "");
    const { data: link } = await supabase
      .from("telegram_links")
      .select("telegram_id, account_id, username, first_name, bot_source, bot_state, support_status")
      .eq("username", username)
      .single();

    if (link) {
      let acct = null;
      if (link.account_id) {
        const { data } = await supabase
          .from("accounts")
          .select("id, account_id, subscription_tier, subscription_expires_at, subscription_store, subscription_product_id, max_devices, created_at")
          .eq("id", link.account_id)
          .single();
        acct = data;
      }
      return NextResponse.json({ source: "username", user: link, account: acct });
    }
  }

  return NextResponse.json({ error: "User not found" }, { status: 404 });
}
