import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

async function getAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: admin } = await supabase
    .from("admins")
    .select("id, email, role")
    .eq("user_id", user.id)
    .single<{ id: string; email: string; role: string }>();

  return admin;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdmin();

  if (!admin) {
    redirect("/admin-dvpn/login");
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar adminEmail={admin.email} adminRole={admin.role} />
      <main className="flex-1 min-w-0 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
