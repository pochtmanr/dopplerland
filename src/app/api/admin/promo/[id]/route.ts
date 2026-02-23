import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createUntypedAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { admin, error } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const supabase = createUntypedAdminClient();
  const { data, error: dbError } = await supabase
    .from("promo_codes")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { admin, error } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status: 401 });

  const { id } = await params;

  const supabase = createUntypedAdminClient();
  const { error: dbError } = await supabase
    .from("promo_codes")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
