import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function getServiceRoleConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  }

  return { supabaseUrl, serviceRoleKey };
}

// Typed service role client — for tables defined in Database type.
// Bypasses RLS. Use ONLY in API routes, never in client code.
export function createAdminClient() {
  const { supabaseUrl, serviceRoleKey } = getServiceRoleConfig();
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Untyped service role client — for tables NOT in Database type (e.g. promo_codes).
// Bypasses RLS. Use ONLY in API routes, never in client code.
export function createUntypedAdminClient() {
  const { supabaseUrl, serviceRoleKey } = getServiceRoleConfig();
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
