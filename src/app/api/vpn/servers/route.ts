import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const { data: servers, error } = await supabase
      .from('vpn_servers')
      .select('id, name, country, country_code, city, ip_address, port, is_premium, is_active, load_percentage, latency_ms, speed_mbps')
      .eq('is_active', true)
      .order('country');

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch servers' }, { status: 500 });
    }

    return NextResponse.json({ servers });
  } catch (err) {
    console.error('Server list error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
