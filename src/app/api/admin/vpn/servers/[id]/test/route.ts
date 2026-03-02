import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createMarzbanClient, type MarzbanServerConfig } from "@/lib/marzban";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ id: string }> };

interface MarzbanServerRow {
  id: string;
  name: string;
  country_code: string;
  marzban_api_url: string | null;
  marzban_admin_user: string | null;
  marzban_admin_pass: string | null;
  marzban_api_key: string | null;
}

export async function POST(_request: NextRequest, context: RouteContext) {
  const { admin, adminClient, error } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status: 401 });

  const { id } = await context.params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid server ID" }, { status: 400 });
  }

  try {
    const { data: server, error: fetchErr } = await adminClient
      .from("vpn_servers")
      .select("id, name, country_code, marzban_api_url, marzban_admin_user, marzban_admin_pass, marzban_api_key")
      .eq("id", id)
      .returns<MarzbanServerRow[]>()
      .single();

    if (fetchErr || !server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    if (!server.marzban_api_url) {
      return NextResponse.json({ status: "no_agent" });
    }

    const config: MarzbanServerConfig = {
      id: server.country_code.toLowerCase(),
      apiUrl: server.marzban_api_url,
      apiKey: server.marzban_api_key || "",
      adminUser: server.marzban_admin_user || "",
      adminPass: server.marzban_admin_pass || "",
      serverId: server.id,
      label: server.name,
    };

    const client = createMarzbanClient(config);
    const start = Date.now();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      await Promise.race([
        client.getSystem(),
        new Promise((_, reject) => {
          controller.signal.addEventListener("abort", () => reject(new Error("Timeout after 10s")));
        }),
      ]);

      const latency_ms = Date.now() - start;
      return NextResponse.json({ status: "ok", latency_ms });
    } catch (e: unknown) {
      return NextResponse.json({ status: "down", error: (e as Error).message });
    } finally {
      clearTimeout(timeout);
    }
  } catch (e: unknown) {
    console.error("[vpn-servers] test error:", (e as Error).message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
