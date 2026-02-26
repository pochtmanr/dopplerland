import { NextResponse } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";

export const revalidate = 300; // 5 min cache

export async function GET() {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("promo_codes")
    .select("code, discount_percent")
    .eq("is_active", true)
    .or("expires_at.is.null,expires_at.gt.now()")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(null, { status: 500 });
  }

  return NextResponse.json(data);
}
