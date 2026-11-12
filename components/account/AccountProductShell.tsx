import type { ReactNode } from "react";
import LegacySocialShell from "@/components/social/LegacySocialShell";
import SettingsWorkspace, { settingsStyles } from "@/components/account/SettingsWorkspace";
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
  userId, profile, pathname, title, description, children,
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
  const active = pathname.includes("/security") ? "security" :
    pathname.includes("/privacy") ? "privacy" :
    pathname.includes("/feedback") ? "support" : "profile";

  return (
    <LegacySocialShell user={shellUser} role={role} pathname={pathname}>
      <SettingsWorkspace active={active} title={title} description={description}>
        <div className={settingsStyles.legacyContent}>{children}</div>
      </SettingsWorkspace>
    </LegacySocialShell>
  );
}
