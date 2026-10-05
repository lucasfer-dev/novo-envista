import AppShell from "@/components/layout/AppShell";
import type { ReactNode } from "react";
import type { User } from "@/types";
import type { ProductRole } from "@/lib/auth/require-product-user";

// Compatibility entry point: all product pages render the same AppShell.
export default function LegacySocialShell(props: { user: User; role: ProductRole; pathname?: string; children: ReactNode }) {
  return <AppShell {...props} />;
}
