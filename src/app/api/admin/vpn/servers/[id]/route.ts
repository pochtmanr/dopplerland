import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const COUNTRY_CODE_REGEX = /^[A-Z0-9]{2,4}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ id: string }> };

interface VpnServer {
  id: string;
  name: string;
  country: string;
  country_code: string;
  city: string;
  ip_address: string;
  port: number | null;
  protocol: string | null;
  config_data: string;
  is_active: boolean;
  is_premium: boolean | null;
  load_percentage: number | null;
  latency_ms: number | null;
  speed_mbps: number | null;
  score: number | null;
  operator: string | null;
  uptime_seconds: number | null;
  total_users: number | null;
  marzban_api_url: string | null;
  marzban_admin_user: string | null;
  marzban_admin_pass: string | null;
  marzban_api_key: string | null;
  created_at: string;
  updated_at: string | null;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { admin, adminClient, error } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status: 401 });

  const { id } = await context.params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid server ID" }, { status: 400 });
  }

  try {
    const { data: server, error: fetchErr } = await adminClient
      .from("vpn_servers")
      .select("*")
      .eq("id", id)
      .returns<VpnServer[]>()
      .single();

    if (fetchErr || !server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    // Strip credentials for non-admin users
    const result = admin.role !== "admin"
      ? { ...server, marzban_admin_pass: null, marzban_api_key: null }
      : server;

    return NextResponse.json({ server: result });
  } catch (e: unknown) {
    console.error("[vpn-servers] GET error:", (e as Error).message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { admin, adminClient, error } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status: 401 });

  const { id } = await context.params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid server ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const fieldErrors: Record<string, string> = {};

    // Block credential modifications for non-admin users
    const credentialFields = ["marzban_api_url", "marzban_admin_user", "marzban_admin_pass", "marzban_api_key"];
    for (const field of credentialFields) {
      if (body[field] !== undefined && admin.role !== "admin") {
        return NextResponse.json({ error: "Insufficient permissions to modify credentials" }, { status: 403 });
      }
    }

    const stringFields = ["name", "country", "country_code", "city", "ip_address"] as const;
    for (const field of stringFields) {
      if (body[field] !== undefined && (typeof body[field] !== "string" || !body[field].trim())) {
        fieldErrors[field] = `${field} must be a non-empty string`;
      }
    }

    if (typeof body.country_code === "string" && body.country_code.trim() && !COUNTRY_CODE_REGEX.test(body.country_code.trim())) {
      fieldErrors.country_code = "country_code must be 2-4 uppercase alphanumeric characters";
    }

    if (typeof body.ip_address === "string" && body.ip_address.trim() && !IPV4_REGEX.test(body.ip_address.trim())) {
      fieldErrors.ip_address = "ip_address must be a valid IPv4 address";
    }

    if (body.port !== undefined && body.port !== null) {
      const port = Number(body.port);
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        fieldErrors.port = "port must be an integer between 1 and 65535";
      }
    }

    if (typeof body.marzban_api_url === "string" && body.marzban_api_url.trim()) {
      try { new URL(body.marzban_api_url.trim()); } catch {
        fieldErrors.marzban_api_url = "Must be a valid URL";
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json({ error: "Validation failed", fields: fieldErrors }, { status: 400 });
    }

    const allowedFields = [
      "name", "country", "country_code", "city", "ip_address", "port", "protocol",
      "config_data", "is_active", "is_premium", "load_percentage", "latency_ms",
      "speed_mbps", "score", "operator", "marzban_api_url", "marzban_admin_user",
      "marzban_admin_pass", "marzban_api_key",
    ] as const;

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (typeof body[field] === "string") {
          updateData[field] = body[field].trim();
        } else {
          updateData[field] = body[field];
        }
      }
    }

    if (body.port !== undefined && body.port !== null) {
      updateData.port = Number(body.port);
    }

    const { data: server, error: updateErr } = await adminClient
      .from("vpn_servers")
      .update(updateData as never)
      .eq("id", id)
      .select("id, name, country, country_code, city, ip_address, port, protocol, is_active, is_premium, updated_at")
      .returns<VpnServer[]>()
      .single();

    if (updateErr) {
      if (updateErr.code === "PGRST116") {
        return NextResponse.json({ error: "Server not found" }, { status: 404 });
      }
      throw updateErr;
    }

    return NextResponse.json({ server });
  } catch (e: unknown) {
    console.error("[vpn-servers] PUT error:", (e as Error).message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { admin, adminClient, error } = await requireAdmin("admin");
  if (!admin) return NextResponse.json({ error }, { status: 401 });

  const { id } = await context.params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid server ID" }, { status: 400 });
  }

  const hard = request.nextUrl.searchParams.get("hard") === "true";

  try {
    if (hard) {
      const { count, error: countErr } = await adminClient
        .from("vpn_users")
        .select("id", { count: "exact", head: true })
        .eq("server_id", id);

      if (countErr) throw countErr;

      if (count && count > 0) {
        return NextResponse.json(
          { error: `Cannot hard-delete: ${count} user(s) linked to this server` },
          { status: 409 }
        );
      }

      const { error: deleteErr } = await adminClient
        .from("vpn_servers")
        .delete()
        .eq("id", id);

      if (deleteErr) throw deleteErr;
    } else {
      const { error: softErr } = await adminClient
        .from("vpn_servers")
        .update({ is_active: false, updated_at: new Date().toISOString() } as never)
        .eq("id", id);

      if (softErr) throw softErr;
    }

    return NextResponse.json({ success: true, hard });
  } catch (e: unknown) {
    console.error("[vpn-servers] DELETE error:", (e as Error).message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
