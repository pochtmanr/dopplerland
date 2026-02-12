import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { admin: null, supabase, error: "Not authenticated" } as const;
  }

  const { data: admin } = await supabase
    .from("admins")
    .select("id, email, role")
    .eq("email", user.email)
    .single<{ id: string; email: string; role: string }>();

  if (!admin) {
    return { admin: null, supabase, error: "Not authorized" } as const;
  }

  return { admin, supabase, error: null } as const;
}
