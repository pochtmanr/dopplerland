import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() { return createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
); }

export async function POST(req: NextRequest) {
  const { promo_id, account_id, platform, original_price_cents, discounted_price_cents } = await req.json();

  // Insert redemption
  const { error: redemptionError } = await getSupabase()
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

  // Increment counter
  await getSupabase().rpc("increment_promo_redemptions", { promo_uuid: promo_id });

  return NextResponse.json({ success: true });
}
