import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const COUNTRY_CODE_REGEX = /^[A-Z0-9]{2,4}$/;

function validateServerFields(body: Record<string, unknown>, requireAll: boolean) {
  const errors: Record<string, string> = {};

  const requiredStrings = ["name", "country", "country_code", "city", "ip_address"] as const;
  for (const field of requiredStrings) {
    const val = body[field];
    if (requireAll && (typeof val !== "string" || !val.trim())) {
      errors[field] = `${field} is required`;
    } else if (val !== undefined && (typeof val !== "string" || !val.trim())) {
      errors[field] = `${field} must be a non-empty string`;
    }
  }

  if (typeof body.country_code === "string" && body.country_code.trim() && !COUNTRY_CODE_REGEX.test(body.country_code.trim())) {
    errors.country_code = "country_code must be 2-4 uppercase alphanumeric characters";
  }

  if (typeof body.ip_address === "string" && body.ip_address.trim() && !IPV4_REGEX.test(body.ip_address.trim())) {
    errors.ip_address = "ip_address must be a valid IPv4 address";
  }

  if (body.port !== undefined && body.port !== null) {
    const port = Number(body.port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      errors.port = "port must be an integer between 1 and 65535";
    }
  }

  if (typeof body.marzban_api_url === "string" && body.marzban_api_url.trim()) {
    try { new URL(body.marzban_api_url.trim()); } catch {
      errors.marzban_api_url = "Must be a valid URL";
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export async function GET() {
  const { admin, adminClient, error } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status: 401 });

  try {
    const { data: servers, error: srvErr } = await adminClient
      .from("vpn_servers")
      .select(
        "id, name, country, country_code, city, ip_address, port, protocol, is_active, marzban_api_url"
      )
      .order("is_active", { ascending: false })
      .order("country")
      .returns<
        Array<{
          id: string;
          name: string;
          country: string;
          country_code: string;
          city: string;
          ip_address: string;
          port: number;
          protocol: string;
          is_active: boolean;
          marzban_api_url: string | null;
        }>
      >();

    if (srvErr) throw new Error(`Failed to fetch servers: ${srvErr.message}`);

    // Strip actual marzban_api_url — only expose whether it's configured
    const result = (servers || []).map((srv) => ({
      id: srv.id,
      name: srv.name,
      country: srv.country,
      country_code: srv.country_code,
      city: srv.city,
      ip_address: srv.ip_address,
      port: srv.port,
      protocol: srv.protocol,
      is_active: srv.is_active,
      has_marzban: !!srv.marzban_api_url,
    }));

    return NextResponse.json({ servers: result });
  } catch (e: unknown) {
    console.error("[vpn-servers] GET error:", (e as Error).message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { admin, adminClient, error } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status: 401 });

  try {
    const body = await request.json();

    const fieldErrors = validateServerFields(body, true);
    if (fieldErrors) {
      return NextResponse.json({ error: "Validation failed", fields: fieldErrors }, { status: 400 });
    }

    const insertData: Record<string, unknown> = {
      name: body.name.trim(),
      country: body.country.trim(),
      country_code: body.country_code.trim(),
      city: body.city.trim(),
      ip_address: body.ip_address.trim(),
    };

    const optionalFields = [
      "port", "protocol", "is_active", "is_premium",
      "marzban_api_url", "marzban_admin_user", "marzban_admin_pass", "marzban_api_key", "config_data",
    ] as const;

    for (const field of optionalFields) {
      if (body[field] !== undefined && body[field] !== null) {
        insertData[field] = field === "port" ? Number(body[field]) : body[field];
      }
    }

    if (insertData.config_data === undefined) {
      insertData.config_data = "";
    }

    const { data: server, error: insertErr } = await adminClient
      .from("vpn_servers")
      .insert(insertData as never)
      .select("id, name, country, country_code, city, ip_address, port, protocol, is_active, is_premium, created_at")
      .returns<Array<Record<string, unknown>>>()
      .single();

    if (insertErr) throw insertErr;

    return NextResponse.json({ server }, { status: 201 });
  } catch (e: unknown) {
    console.error("[vpn-servers] POST error:", (e as Error).message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
