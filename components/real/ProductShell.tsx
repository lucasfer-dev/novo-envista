import AppShell from "@/components/layout/AppShell";
import type { ReactNode } from "react";
import type { User } from "@/types";

export default function ProductShell({ user, children }: { user: User; children: ReactNode; title?: string; variant?: "default" | "legacyDark" }) {
  return <AppShell user={user} role={user.role === "investor" ? "investor" : "participant"}>{children}</AppShell>;
}
