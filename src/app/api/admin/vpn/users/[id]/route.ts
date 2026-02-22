import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { admin, supabase, error } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status: 401 });

  try {
    const { id } = await ctx.params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: delErr } = await (supabase.from("vpn_users") as any)
      .delete()
      .eq("id", id);

    if (delErr) throw new Error(delErr.message);

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
