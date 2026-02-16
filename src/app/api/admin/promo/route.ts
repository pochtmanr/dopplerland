import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("promo_codes")
    .select(`
      *,
      promo_redemptions (
        id,
        account_id,
        platform,
        original_price_cents,
        discounted_price_cents,
        redeemed_at
      )
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, discount_percent, applicable_plans, max_redemptions, expires_at } = body;

  if (!code || !discount_percent) {
    return NextResponse.json({ error: "code and discount_percent required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("promo_codes")
    .insert({
      code: code.toUpperCase().trim(),
      discount_percent,
      applicable_plans: applicable_plans || ["monthly", "semiannual", "annual"],
      max_redemptions: max_redemptions || null,
      expires_at: expires_at || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Code already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
