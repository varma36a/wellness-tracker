import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/login",
    "/signup",
    "/pin",
    "/forgot-password",
    "/forgot-pin",
    "/reset-password",
    "/reset-pin",
    "/auth/callback",
  ],
};
