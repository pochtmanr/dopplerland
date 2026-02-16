import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getUser, updateUser, deleteUser } from "@/lib/marzban";

type Ctx = { params: Promise<{ username: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { admin, error } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status: 401 });
  try {
    const { username } = await ctx.params;
    const user = await getUser(username);
    return NextResponse.json(user);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const { admin, error } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status: 401 });
  try {
    const { username } = await ctx.params;
    const body = await request.json();
    const result = await updateUser(username, body);
    return NextResponse.json(result);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { admin, error } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status: 401 });
  try {
    const { username } = await ctx.params;
    await deleteUser(username);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
