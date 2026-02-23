import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const { admin, supabase, error } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status: 401 });

  try {
    const { data: servers, error: srvErr } = await supabase
      .from("vpn_servers")
      .select(
        "id, name, country, country_code, city, ip_address, port, protocol, is_active, marzban_api_url"
      )
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
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
