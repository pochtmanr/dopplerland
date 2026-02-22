import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getMarzbanServers, createMarzbanClient } from "@/lib/marzban";

interface ServerOverview {
  id: string;
  name: string;
  country: string;
  country_code: string;
  ip_address: string;
  protocol: string;
  is_active: boolean;
  protocols: string[];
  live: {
    cpu_usage: number | null;
    mem_used: number | null;
    mem_total: number | null;
    online_users: number;
    bandwidth_in: number;
    bandwidth_out: number;
  } | null;
  user_counts: {
    total: number;
    active: number;
    by_platform: Record<string, number>;
    by_protocol: Record<string, number>;
  };
}

export async function GET() {
  const { admin, supabase, error } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status: 401 });

  try {
    // 1. Get all servers from Supabase
    const { data: servers, error: srvErr } = await supabase
      .from("vpn_servers")
      .select("id, name, country, country_code, city, ip_address, port, is_active, protocol")
      .order("country")
      .returns<Array<{ id: string; name: string; country: string; country_code: string; city: string; ip_address: string; port: number; is_active: boolean; protocol: string }>>();

    if (srvErr) throw new Error(`Failed to fetch servers: ${srvErr.message}`);

    // 2. Get user counts from vpn_users, grouped by server
    const { data: userCounts, error: ucErr } = await supabase
      .from("vpn_users")
      .select("server_id, platform, protocol, status")
      .returns<Array<{ server_id: string; platform: string; protocol: string; status: string }>>();

    if (ucErr) throw new Error(`Failed to fetch user counts: ${ucErr.message}`);

    // 3. Aggregate user counts per server
    const countsByServer = new Map<string, {
      total: number;
      active: number;
      by_platform: Record<string, number>;
      by_protocol: Record<string, number>;
    }>();

    for (const row of userCounts || []) {
      let entry = countsByServer.get(row.server_id);
      if (!entry) {
        entry = { total: 0, active: 0, by_platform: {}, by_protocol: {} };
        countsByServer.set(row.server_id, entry);
      }
      entry.total++;
      if (row.status === "active") entry.active++;
      entry.by_platform[row.platform] = (entry.by_platform[row.platform] || 0) + 1;
      entry.by_protocol[row.protocol] = (entry.by_protocol[row.protocol] || 0) + 1;
    }

    // 4. Fetch live stats from Marzban instances in parallel
    const marzbanServers = getMarzbanServers();
    const liveStats = new Map<string, ServerOverview["live"]>();

    const marzbanPromises = marzbanServers.map(async (ms) => {
      try {
        const client = createMarzbanClient(ms);
        const system = await client.getSystem();
        liveStats.set(ms.serverId, {
          cpu_usage: system.cpu_usage ?? null,
          mem_used: system.mem_used ?? null,
          mem_total: system.mem_total ?? null,
          online_users: system.online_users ?? 0,
          bandwidth_in: system.incoming_bandwidth ?? 0,
          bandwidth_out: system.outgoing_bandwidth ?? 0,
        });
      } catch {
        // Server unreachable — live stats will be null
        liveStats.set(ms.serverId, null);
      }
    });

    await Promise.allSettled(marzbanPromises);

    // 5. Build response
    const marzbanServerIds = new Set(marzbanServers.map((ms) => ms.serverId));

    const serverOverviews: ServerOverview[] = (servers || []).map((srv) => {
      const hasMarzban = marzbanServerIds.has(srv.id);
      const protocols = [srv.protocol];
      if (hasMarzban && !protocols.includes("marzban")) protocols.push("marzban");

      return {
        id: srv.id,
        name: srv.name,
        country: srv.country,
        country_code: srv.country_code,
        ip_address: srv.ip_address,
        protocol: srv.protocol,
        is_active: srv.is_active,
        protocols,
        live: liveStats.get(srv.id) ?? null,
        user_counts: countsByServer.get(srv.id) || {
          total: 0,
          active: 0,
          by_platform: {},
          by_protocol: {},
        },
      };
    });

    // 6. Compute totals
    const totals = {
      total_users: 0,
      online_users: 0,
      by_platform: {} as Record<string, number>,
      by_protocol: {} as Record<string, number>,
    };

    for (const srv of serverOverviews) {
      totals.total_users += srv.user_counts.total;
      if (srv.live) totals.online_users += srv.live.online_users;
      for (const [p, c] of Object.entries(srv.user_counts.by_platform)) {
        totals.by_platform[p] = (totals.by_platform[p] || 0) + c;
      }
      for (const [p, c] of Object.entries(srv.user_counts.by_protocol)) {
        totals.by_protocol[p] = (totals.by_protocol[p] || 0) + c;
      }
    }

    return NextResponse.json({ servers: serverOverviews, totals });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
