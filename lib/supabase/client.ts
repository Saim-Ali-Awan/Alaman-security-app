"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/components/types/database";

export function createClient() {
  const supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey: string | undefined =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl === undefined || supabaseAnonKey === undefined) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (locally) or in your host's Environment Variables (deployed), then restart the dev server or redeploy."
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}