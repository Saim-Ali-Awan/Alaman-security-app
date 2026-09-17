import type { ReactNode } from "react";
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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not signed in (or token invalid): never render the registry —
  // show the incharge-only page with a Login button instead.
  if (user === null) {
    return <RestrictedAccess />;
  }

  return <div className="flex flex-1 flex-col">{children}</div>;
}