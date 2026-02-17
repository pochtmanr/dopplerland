import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { code, account_id } = await req.json();

    if (!code || !account_id) {
      return NextResponse.json(
        { success: false, message: 'Code and account_id are required.' },
        { status: 400 }
      );
    }

    // Look up promo code
    const { data: promo, error: promoError } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .single();

    if (promoError || !promo) {
      return NextResponse.json(
        { success: false, message: 'Invalid promo code.' },
        { status: 404 }
      );
    }

    // Validate
    if (!promo.is_active) {
      return NextResponse.json(
        { success: false, message: 'This promo code is no longer active.' },
        { status: 400 }
      );
    }

    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, message: 'This promo code has expired.' },
        { status: 400 }
      );
    }

    if (promo.max_redemptions && promo.current_redemptions >= promo.max_redemptions) {
      return NextResponse.json(
        { success: false, message: 'This promo code has been fully redeemed.' },
        { status: 400 }
      );
    }

    // Check if user already redeemed this code
    const { data: existing } = await supabase
      .from('promo_redemptions')
      .select('id')
      .eq('promo_id', promo.id)
      .eq('account_id', account_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'You have already redeemed this code.' },
        { status: 400 }
      );
    }

    // Calculate days to grant
    let daysGranted: number;
    if (promo.free_days) {
      daysGranted = promo.free_days;
    } else if (promo.discount_percent) {
      daysGranted = Math.round(30 * promo.discount_percent / 100);
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid promo code configuration.' },
        { status: 500 }
      );
    }

    // Calculate new expiration: extend from current expiration or from now
    const { data: account } = await supabase
      .from('accounts')
      .select('subscription_expires_at')
      .eq('account_id', account_id)
      .single();

    const now = new Date();
    const currentExpiry = account?.subscription_expires_at
      ? new Date(account.subscription_expires_at)
      : now;
    const baseDate = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseDate.getTime() + daysGranted * 24 * 60 * 60 * 1000);

    // Update account subscription
    const { error: updateError } = await supabase
      .from('accounts')
      .update({
        subscription_tier: 'pro',
        subscription_expires_at: newExpiry.toISOString(),
      })
      .eq('account_id', account_id);

    if (updateError) {
      return NextResponse.json(
        { success: false, message: 'Failed to apply promo code.' },
        { status: 500 }
      );
    }

    // Record redemption
    await supabase.from('promo_redemptions').insert({
      promo_id: promo.id,
      account_id,
      redeemed_at: now.toISOString(),
    });

    // Increment redemption count
    await supabase
      .from('promo_codes')
      .update({ current_redemptions: (promo.current_redemptions || 0) + 1 })
      .eq('id', promo.id);

    return NextResponse.json({
      success: true,
      message: `🎉 ${daysGranted} days of Pro added to your account!`,
      days_granted: daysGranted,
    });
  } catch (error) {
    console.error('Promo redemption error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
