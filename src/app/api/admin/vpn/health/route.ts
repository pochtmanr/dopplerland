import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { loadMarzbanServers, createMarzbanClient, type MarzbanServerConfig } from "@/lib/marzban";

interface HealthResult {
  server_id: string;
  name: string;
  country_code: string;
  ip_address: string;
  status: "healthy" | "degraded" | "down" | "no_agent";
  latency_ms: number | null;
  marzban: {
    cpu_usage: number | null;
    mem_used: number | null;
    mem_total: number | null;
    users_active: number;
    total_users: number;
    bandwidth_in: number;
    bandwidth_out: number;
  } | null;
  error: string | null;
}

interface VpnServer {
  id: string;
  name: string;
  country_code: string;
  ip_address: string;
  marzban_api_url: string | null;
  is_active: boolean;
}

async function checkServer(
  srv: VpnServer,
  marzbanConfig: MarzbanServerConfig | undefined,
): Promise<HealthResult> {
  const base = { server_id: srv.id, name: srv.name, country_code: srv.country_code, ip_address: srv.ip_address };

  if (marzbanConfig) {
    const start = Date.now();
    try {
      const client = createMarzbanClient(marzbanConfig);
      const system = await client.getSystem();
      return {
        ...base,
        status: "healthy",
        latency_ms: Date.now() - start,
        marzban: {
          cpu_usage: system.cpu_usage ?? null,
          mem_used: system.mem_used ?? null,
          mem_total: system.mem_total ?? null,
          users_active: system.online_users ?? 0,
          total_users: system.total_user ?? 0,
          bandwidth_in: system.incoming_bandwidth ?? 0,
          bandwidth_out: system.outgoing_bandwidth ?? 0,
        },
        error: null,
      };
    } catch (err) {
      return {
        ...base,
        status: "down",
        latency_ms: Date.now() - start,
        marzban: null,
        error: err instanceof Error ? err.message : "Unknown",
      };
    }
  }

  // No Marzban configured for this server
  return { ...base, status: "no_agent", latency_ms: null, marzban: null, error: null };
}

export async function GET() {
  const { admin, supabase, error } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status: 401 });

  try {
    const { data: servers, error: srvErr } = await supabase
      .from("vpn_servers")
      .select("id, name, country_code, ip_address, marzban_api_url, is_active")
      .eq("is_active", true)
      .order("country")
      .returns<VpnServer[]>();

    if (srvErr) throw new Error(srvErr.message);

    // Load Marzban configs from Supabase (credentials included)
    const marzbanConfigs = await loadMarzbanServers(supabase);
    const byServerId = new Map(marzbanConfigs.map((mc) => [mc.serverId, mc]));

    const settled = await Promise.allSettled(
      (servers || []).map((srv) => {
        const config = byServerId.get(srv.id);
        return checkServer(srv, config);
      }),
    );

    const results: HealthResult[] = settled.map((r, i) => {
      if (r.status === "fulfilled") return r.value;
      const srv = servers![i];
      return {
        server_id: srv.id,
        name: srv.name,
        country_code: srv.country_code,
        ip_address: srv.ip_address,
        status: "down" as const,
        latency_ms: null,
        marzban: null,
        error: r.reason?.message || "Check failed",
      };
    });

    return NextResponse.json({
      servers: results,
      checked_at: new Date().toISOString(),
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
