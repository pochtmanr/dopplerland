import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createUntypedAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { admin, error } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status: 401 });

  const { promo_id, account_id, platform, original_price_cents, discounted_price_cents } =
    await req.json();

  const supabase = createUntypedAdminClient();

  const { error: redemptionError } = await supabase
    .from("promo_redemptions")
    .insert({
      promo_code_id: promo_id,
      account_id,
      platform,
      original_price_cents,
      discounted_price_cents,
    });

  if (redemptionError) {
    return NextResponse.json({ error: redemptionError.message }, { status: 500 });
  }

  await supabase.rpc("increment_promo_redemptions", { promo_uuid: promo_id });

  return NextResponse.json({ success: true });
}
