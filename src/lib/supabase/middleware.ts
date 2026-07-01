import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

const PUBLIC_AUTH_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/forgot-pin",
  "/reset-password",
  "/reset-pin",
  "/auth/callback",
  "/pin",
];

const RECOVERY_PATHS = ["/forgot-password", "/forgot-pin", "/reset-password", "/reset-pin"];

function matchesPath(pathname: string, paths: string[]) {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function updateSession(request: NextRequest) {
  const env = getSupabaseEnv();
  const { pathname } = request.nextUrl;

  if (!env) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(env.url, env.key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isPublicAuth = matchesPath(pathname, PUBLIC_AUTH_PATHS);
    const isRecovery = matchesPath(pathname, RECOVERY_PATHS);
    const isLoginOrSignup = pathname.startsWith("/login") || pathname.startsWith("/signup");

    if (!user && !isPublicAuth && pathname !== "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (user && isLoginOrSignup && !isRecovery) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    if (user && pathname.startsWith("/dashboard")) {
      const pinVerified = request.cookies.get("pin_verified")?.value === user.id;
      if (!pinVerified) {
        const { data: settings } = await supabase
          .from("user_settings")
          .select("pin_enabled")
          .eq("user_id", user.id)
          .maybeSingle();

        if (settings?.pin_enabled) {
          const url = request.nextUrl.clone();
          url.pathname = "/pin";
          return NextResponse.redirect(url);
        }
      }
    }
  } catch {
    return NextResponse.next({ request });
  }

  return supabaseResponse;
}
