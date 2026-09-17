import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import RestrictedAccess from "@/components/restricted-access";
import { createClient } from "@/lib/supabase/server";

// THIS is the fix — tells Next.js: "always render at request time,
// never try to statically prerender this route (it uses cookies)."
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Points Registry",
};

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  let user: User | null = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error: unknown) {
    console.error("Dashboard auth check failed:", error);
  }

  if (user === null) {
    return <RestrictedAccess />;
  }

  return <div className="flex flex-1 flex-col">{children}</div>;
}