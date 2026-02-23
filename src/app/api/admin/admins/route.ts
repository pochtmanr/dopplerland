import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { admin, error } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status: 401 });

  const supabase = createAdminClient();
  const { data, error: dbError } = await supabase
    .from("admins")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: true });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  // Only role: "admin" can create new admins — not editors
  const { admin, error } = await requireAdmin("admin");
  if (!admin) return NextResponse.json({ error }, { status: 401 });

  const body = await request.json();
  const { email, password, role } = body as {
    email?: string;
    password?: string;
    role?: "admin" | "editor";
  };

  if (!email || !password) {
    return NextResponse.json(
      { error: "email and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 12) {
    return NextResponse.json(
      { error: "Password must be at least 12 characters" },
      { status: 400 }
    );
  }

  const validRoles = ["admin", "editor"] as const;
  const assignedRole = validRoles.includes(role as (typeof validRoles)[number])
    ? role!
    : "editor";

  const supabase = createAdminClient();

  // Step 1: Create the Supabase Auth user
  const { data: authUser, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Step 2: Insert the admin record with user_id link
  const { data: adminRecord, error: adminError } = await supabase
    .from("admins")
    .insert({
      user_id: authUser.user.id,
      email: authUser.user.email!,
      role: assignedRole,
    })
    .select("id, email, role, created_at")
    .single();

  if (adminError) {
    // Rollback: delete the auth user if admin record insert fails
    await supabase.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: adminError.message }, { status: 500 });
  }

  return NextResponse.json(adminRecord, { status: 201 });
}
