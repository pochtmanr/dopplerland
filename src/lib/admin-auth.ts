import { createClient } from "@/lib/supabase/server";

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
      error: null;
    }
  | {
      admin: null;
      supabase: Awaited<ReturnType<typeof createClient>>;
      error: string;
    };

/**
 * Server-side admin gate. Validates:
 * 1. Valid Supabase session (JWT verified server-side via getUser())
 * 2. Corresponding row in admins table matched by user_id (NOT email)
 * 3. Optionally checks minimum required role
 */
export async function requireAdmin(
  minimumRole?: AdminRole
): Promise<RequireAdminResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { admin: null, supabase, error: "Not authenticated" };
  }

  const { data: admin } = await supabase
    .from("admins")
    .select("id, user_id, email, role")
    .eq("user_id", user.id)
    .single<AdminRecord>();

  if (!admin) {
    return { admin: null, supabase, error: "Not authorized" };
  }

  if (minimumRole === "admin" && admin.role !== "admin") {
    return { admin: null, supabase, error: "Insufficient permissions" };
  }

  return { admin, supabase, error: null };
}
