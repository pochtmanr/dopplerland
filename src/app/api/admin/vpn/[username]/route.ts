import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { loadMarzbanServers, createMarzbanClient } from "@/lib/marzban";

type Ctx = { params: Promise<{ username: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { admin, supabase, error } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status: 401 });
  try {
    const { username } = await ctx.params;
    const serverId = req.nextUrl.searchParams.get("server_id");

    const servers = await loadMarzbanServers(supabase);
    const server = serverId
      ? servers.find((s) => s.serverId === serverId || s.id === serverId)
      : servers[0];

    if (!server) return NextResponse.json({ error: "No Marzban server found" }, { status: 404 });

    const client = createMarzbanClient(server);
    const user = await client.getUser(username);
    return NextResponse.json(user);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const { admin, supabase, error } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status: 401 });
  try {
    const { username } = await ctx.params;
    const body = await request.json();
    const serverId = body.server_id;

    const servers = await loadMarzbanServers(supabase);
    const server = serverId
      ? servers.find((s) => s.serverId === serverId || s.id === serverId)
      : servers[0];

    if (!server) return NextResponse.json({ error: "No Marzban server found" }, { status: 404 });

    const client = createMarzbanClient(server);
    const result = await client.updateUser(username, body);
    return NextResponse.json(result);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { admin, supabase, error } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status: 401 });
  try {
    const { username } = await ctx.params;
    const serverId = req.nextUrl.searchParams.get("server_id");

    const servers = await loadMarzbanServers(supabase);
    const server = serverId
      ? servers.find((s) => s.serverId === serverId || s.id === serverId)
      : servers[0];

    if (!server) return NextResponse.json({ error: "No Marzban server found" }, { status: 404 });

    const client = createMarzbanClient(server);
    await client.deleteUser(username);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
