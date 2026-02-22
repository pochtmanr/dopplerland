import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { loadMarzbanServers, createMarzbanClient } from "@/lib/marzban";

export async function GET(request: NextRequest) {
  const { admin, supabase, error } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status: 401 });

  try {
    const searchParams = request.nextUrl.searchParams;
    const offset = parseInt(searchParams.get("offset") || "0");
    const limit = parseInt(searchParams.get("limit") || "50");
    const serverId = searchParams.get("server_id");

    const servers = await loadMarzbanServers(supabase);
    const server = serverId
      ? servers.find((s) => s.serverId === serverId || s.id === serverId)
      : servers[0];

    if (!server) return NextResponse.json({ error: "No Marzban server found" }, { status: 404 });

    const client = createMarzbanClient(server);
    const [system, users] = await Promise.all([client.getSystem(), client.getUsers(offset, limit)]);
    return NextResponse.json({ system, users: users.users, total: users.total, server_id: server.serverId });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { admin, supabase, error } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status: 401 });

  try {
    const body = await request.json();
    const serverId = body.server_id;

    const servers = await loadMarzbanServers(supabase);
    const server = serverId
      ? servers.find((s) => s.serverId === serverId || s.id === serverId)
      : servers[0];

    if (!server) return NextResponse.json({ error: "No Marzban server found" }, { status: 404 });

    const client = createMarzbanClient(server);
    const result = await client.createUser(body);
    return NextResponse.json(result, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
