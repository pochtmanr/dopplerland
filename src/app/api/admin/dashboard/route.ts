import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { admin, error } = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [
    totalAccounts,
    accountsToday,
    accountsWeek,
    accountsMonth,
    allAccounts,
    activeSubscriptions,
    totalTelegram,
    telegramBySource,
    channelMembers,
    recentSignups,
    deviceSessions,
    escalations,
    activeUsers24h,
    messageStats,
  ] = await Promise.all([
    // 1. Total accounts
    supabase.from("accounts").select("*", { count: "exact", head: true }),
    // 2a. Today
    supabase.from("accounts").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
    // 2b. This week
    supabase.from("accounts").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    // 2c. This month
    supabase.from("accounts").select("*", { count: "exact", head: true }).gte("created_at", monthAgo),
    // 3. All accounts for tier breakdown
    supabase.from("accounts").select("subscription_tier"),
    // 4. Active subscriptions
    supabase
      .from("accounts")
      .select("*", { count: "exact", head: true })
      .neq("subscription_tier", "free")
      .gt("subscription_expires_at", now.toISOString()),
    // 5. Total telegram users
    supabase.from("telegram_links").select("*", { count: "exact", head: true }),
    // 6. Telegram by bot_source
    supabase.from("telegram_links").select("bot_source"),
    // 7. Channel members
    supabase.from("telegram_links").select("*", { count: "exact", head: true }).eq("is_channel_member", true),
    // 8. Recent signups
    supabase
      .from("accounts")
      .select("id, account_code, subscription_tier, created_at, telegram_links(username, first_name, bot_source, last_active_at, is_channel_member)")
      .order("created_at", { ascending: false })
      .limit(10),
    // 9. Device sessions
    supabase.from("device_sessions").select("device_type"),
    // 10. Support escalations
    supabase
      .from("bot_messages_log")
      .select("id, telegram_user_id, content, template_key, created_at")
      .or("template_key.eq.human.escalated,content.ilike.%escalat%")
      .order("created_at", { ascending: false })
      .limit(20),
    // 11. Active users 24h
    supabase.from("telegram_links").select("*", { count: "exact", head: true }).gt("last_active_at", dayAgo),
    // 12. Total messages
    supabase.from("telegram_links").select("total_messages"),
  ]);

  // Process tier breakdown
  const tierBreakdown: Record<string, number> = {};
  if (allAccounts.data) {
    for (const a of allAccounts.data as Array<{ subscription_tier: string | null }>) {
      const tier = a.subscription_tier || "free";
      tierBreakdown[tier] = (tierBreakdown[tier] || 0) + 1;
    }
  }

  // Process bot_source breakdown
  const sourceBreakdown: Record<string, number> = {};
  if (telegramBySource.data) {
    for (const t of telegramBySource.data as Array<{ bot_source: string | null }>) {
      const src = t.bot_source || "unknown";
      sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1;
    }
  }

  // Process device breakdown
  const deviceBreakdown: Record<string, number> = {};
  if (deviceSessions.data) {
    for (const d of deviceSessions.data as Array<{ device_type: string | null }>) {
      const type = d.device_type || "unknown";
      deviceBreakdown[type] = (deviceBreakdown[type] || 0) + 1;
    }
  }

  // Sum total messages
  const totalMessages = messageStats.data
    ? (messageStats.data as Array<{ total_messages: number | null }>).reduce((sum, t) => sum + (t.total_messages || 0), 0)
    : 0;

  return NextResponse.json({
    accounts: {
      total: totalAccounts.count || 0,
      today: accountsToday.count || 0,
      thisWeek: accountsWeek.count || 0,
      thisMonth: accountsMonth.count || 0,
      tierBreakdown,
    },
    subscriptions: {
      active: activeSubscriptions.count || 0,
    },
    telegram: {
      total: totalTelegram.count || 0,
      bySource: sourceBreakdown,
      channelMembers: channelMembers.count || 0,
      activeUsers24h: activeUsers24h.count || 0,
      totalMessages,
    },
    devices: {
      total: deviceSessions.data?.length || 0,
      byType: deviceBreakdown,
    },
    recentSignups: recentSignups.data || [],
    escalations: escalations.data || [],
  });
}
