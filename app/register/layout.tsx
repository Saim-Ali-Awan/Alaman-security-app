import type { ReactNode } from "react";
import RestrictedAccess from "@/components/restricted-access";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Register a Point",
};

export default async function RegisterLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return <RestrictedAccess />;
  }

  return <>{children}</>;
}