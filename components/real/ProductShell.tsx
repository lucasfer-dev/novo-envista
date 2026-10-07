"use client";

import { usePathname } from "next/navigation";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import type { User } from "@/types";

type Props = {
  user: User;
  children: React.ReactNode;
  title?: string;
  variant?: "default" | "legacyDark";
};

/** Compatibility entry point. All product routes share navigation and mobile controls. */
export default function ProductShell({ user, children }: Props) {
  const pathname = usePathname() || "/home";
  return (
    <LegacySocialShell
      user={user}
      role={user.role === "investor" ? "investor" : "participant"}
      pathname={pathname}
    >
      {children}
    </LegacySocialShell>
  );
}
