import type { ReactNode } from "react";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import { parseProductRole } from "@/lib/auth/validation";
import type { User } from "@/types";

export type AccountShellProfile = {
  username?: string | null;
  display_name?: string | null;
  role?: string | null;
  avatar_path?: string | null;
};

type Props = {
  userId: string;
  profile: AccountShellProfile;
  pathname: string;
  title: string;
  description: string;
  children: ReactNode;
};

export default function AccountProductShell({
  userId,
  profile,
  pathname,
  title,
  description,
  children,
}: Props) {
  const role = parseProductRole(profile.role);
  const displayName = profile.display_name || profile.username || "Usuário Envista";
  const shellUser: User = {
    id: userId,
    username: profile.username || "usuario",
    name: displayName,
    role,
    avatar: profile.avatar_path || undefined,
  };

  return (
    <LegacySocialShell user={shellUser} role={role} pathname={pathname}>
      <div className="page-head account-page-head">
        <div>
          <span className="account-page-kicker">CONTA</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
      <section className="panel account-page-panel">{children}</section>
    </LegacySocialShell>
  );
}
