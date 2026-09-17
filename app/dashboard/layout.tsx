import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import RestrictedAccess from "@/components/restricted-access";
import { createClient } from "@/lib/supabase/server";

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
    // Never crash the route — log it (shows up in Vercel Runtime Logs)
    // and fail closed to the restricted page.
    console.error("Dashboard auth check failed:", error);
  }

  if (user === null) {
    return <RestrictedAccess />;
  }

  return <div className="flex flex-1 flex-col">{children}</div>;
}