import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin-dvpn/posts";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if the user is in the admins table
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: admin } = await supabase
          .from("admins")
          .select("id")
          .eq("email", user.email!)
          .single();

        if (admin) {
          // Valid admin — redirect to admin panel
          return NextResponse.redirect(`${origin}${next}`);
        }
      }

      // Not an admin — sign out and redirect to home
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/?error=unauthorized`);
    }
  }

  // Auth error — redirect to login
  return NextResponse.redirect(`${origin}/admin-dvpn/login?error=auth`);
}
