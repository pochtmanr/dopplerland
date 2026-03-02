import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminRole = "admin" | "editor";

interface AdminRecord {
  id: string;
  user_id: string;
  email: string;
  role: AdminRole;
}

type RequireAdminResult =
  | {
      admin: AdminRecord;
      supabase: Awaited<ReturnType<typeof createClient>>;
      adminClient: ReturnType<typeof createAdminClient>;
      error: null;
    }
  | {
      admin: null;
      supabase: Awaited<ReturnType<typeof createClient>>;
      adminClient: ReturnType<typeof createAdminClient>;
      error: string;
    };

/**
 * Server-side admin gate. Validates:
 * 1. Valid Supabase session (JWT verified server-side via getUser())
 * 2. Corresponding row in admins table matched by user_id (NOT email)
 * 3. Optionally checks minimum required role
 *
 * Returns both the session-bound client (supabase) and a service-role
 * client (adminClient) that bypasses RLS for data queries.
 */
export async function requireAdmin(
  minimumRole?: AdminRole
): Promise<RequireAdminResult> {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { admin: null, supabase, adminClient, error: "Not authenticated" };
  }

  const { data: admin } = await supabase
    .from("admins")
    .select("id, user_id, email, role")
    .eq("user_id", user.id)
    .single<AdminRecord>();

  if (!admin) {
    return { admin: null, supabase, adminClient, error: "Not authorized" };
  }

  if (minimumRole === "admin" && admin.role !== "admin") {
    return { admin: null, supabase, adminClient, error: "Insufficient permissions" };
  }

  return { admin, supabase, adminClient, error: null };
}
