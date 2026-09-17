// proxy.ts — Next.js 16's replacement for middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/components/types/database";

export async function proxy(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Verifies the JWT with the auth server and refreshes expired tokens.
  // (No redirects — the protected layouts render the Restricted Access
  // page themselves via their own server-side getUser() check.)
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/register/:path*"],
};