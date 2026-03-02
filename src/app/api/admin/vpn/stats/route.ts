import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const { admin, adminClient, error } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status: 401 });

  try {
    // Fetch all users and servers in parallel
    const [usersRes, serversRes] = await Promise.all([
      adminClient
        .from("vpn_users")
        .select("status, used_traffic_bytes, platform, server_id, created_at, backend_username")
        .returns<
          Array<{
            status: string;
            used_traffic_bytes: number;
            platform: string;
            server_id: string;
            created_at: string;
            backend_username: string;
          }>
        >(),
      adminClient
        .from("vpn_servers")
        .select("id, name, country_code")
        .returns<Array<{ id: string; name: string; country_code: string }>>(),
    ]);

    if (usersRes.error) throw new Error(usersRes.error.message);

    const users = usersRes.data || [];
    const serverMap = new Map(
      (serversRes.data || []).map((s) => [s.id, s])
    );

    // Aggregate totals
    const statusCounts: Record<string, number> = {};
    let totalTraffic = 0;
    const todayStr = new Date().toISOString().slice(0, 10);
    let newToday = 0;
    const platformCounts = new Map<string, number>();
    const serverCounts = new Map<string, number>();

    for (const u of users) {
      statusCounts[u.status] = (statusCounts[u.status] || 0) + 1;
      totalTraffic += u.used_traffic_bytes || 0;
      if (u.created_at.slice(0, 10) === todayStr) newToday++;

      // Detect platform from username prefix if still "unknown"
      let platform = u.platform;
      if (platform === "unknown") {
        if (u.backend_username.startsWith("tg_")) platform = "telegram";
        else if (u.backend_username.startsWith("ios_")) platform = "ios";
      }

      platformCounts.set(platform, (platformCounts.get(platform) || 0) + 1);
      serverCounts.set(u.server_id, (serverCounts.get(u.server_id) || 0) + 1);
    }

    // New users per day (last 14 days)
    const days: { day: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      const count = users.filter((u) => u.created_at.slice(0, 10) === dayStr).length;
      days.push({ day: dayStr, count });
    }

    return NextResponse.json({
      totals: {
        total: users.length,
        active: statusCounts["active"] || 0,
        expired: statusCounts["expired"] || 0,
        limited: statusCounts["limited"] || 0,
        disabled: statusCounts["disabled"] || 0,
        on_hold: statusCounts["on_hold"] || 0,
        total_traffic_bytes: totalTraffic,
        new_today: newToday,
      },
      by_platform: Array.from(platformCounts.entries())
        .map(([platform, count]) => ({ platform, count }))
        .sort((a, b) => b.count - a.count),
      by_server: Array.from(serverCounts.entries())
        .map(([server_id, count]) => {
          const srv = serverMap.get(server_id);
          return {
            server_id,
            name: srv?.name || "Unknown",
            country_code: srv?.country_code || "??",
            count,
          };
        })
        .sort((a, b) => b.count - a.count),
      new_users_daily: days,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
