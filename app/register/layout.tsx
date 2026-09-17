import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
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
  let user: User | null = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error: unknown) {
    console.error("Register auth check failed:", error);
  }

  if (user === null) {
    return <RestrictedAccess />;
  }

  return <>{children}</>;
}