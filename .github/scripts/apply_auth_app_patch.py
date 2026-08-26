from pathlib import Path

path = Path("components/EnvistaApp.tsx")
text = path.read_text(encoding="utf-8")

def replace(old: str, new: str, label: str, count=None):
    global text
    found = text.count(old)
    if found == 0:
        raise SystemExit(f"pattern not found: {label}")
    if count is not None and found != count:
        raise SystemExit(f"unexpected count for {label}: {found} != {count}")
    text = text.replace(old, new)

replace(
    'export default function EnvistaApp() {',
    'export default function EnvistaApp({ authenticatedProfile }: { authenticatedProfile?: User } = {}) {',
    'component props', 1,
)
replace(
    'const [role, setRole] = useState<Role>("participant");',
    'const [role, setRole] = useState<Role>(authenticatedProfile?.role || "participant");',
    'initial role', 1,
)
replace(
    'setRole(storage.get<Role>("role", "participant"));',
    'setRole(authenticatedProfile?.role || storage.get<Role>("role", "participant"));',
    'mounted role', 1,
)
replace(
'''  const baseMe =
    activeRole === "investor"
      ? investor
      : activeRole === "admin"
        ? adminUser
        : participant;
  const accountSettings = storage.get(`settings-${activeRole}`, {name:baseMe.name,username:baseMe.username});
  void accountVersion;
  const me = {...baseMe,name:accountSettings.name || baseMe.name,username:accountSettings.username || baseMe.username};''',
'''  const baseMe =
    activeRole === "admin"
      ? adminUser
      : authenticatedProfile && authenticatedProfile.role === activeRole
        ? authenticatedProfile
        : activeRole === "investor"
          ? investor
          : participant;
  const accountSettings = authenticatedProfile && activeRole !== "admin"
    ? {name: baseMe.name, username: baseMe.username}
    : storage.get(`settings-${activeRole}`, {name:baseMe.name,username:baseMe.username});
  void accountVersion;
  const me = authenticatedProfile && activeRole !== "admin"
    ? baseMe
    : {...baseMe,name:accountSettings.name || baseMe.name,username:accountSettings.username || baseMe.username};''',
    'authenticated me', 1,
)
replace(
'''  const logout = () => {
    storage.remove("role");
    router.push("/login");
  };''',
'''  const logout = async () => {
    storage.remove("role");
    if (authenticatedProfile) {
      await fetch("/auth/signout", { method: "POST", credentials: "same-origin" });
      window.location.assign("/login");
      return;
    }
    router.push("/login");
  };''',
    'real logout', 1,
)
replace(
    'router.push("/app/profile/lucasfer")',
    'router.push(`/app/profile/${me.username}`)',
    'participant profile links',
)
replace(
    'activeRole === "participant" ? "/app/profile/lucasfer" :',
    'activeRole === "participant" ? `/app/profile/${me.username}` :',
    'header profile links',
)
replace(
    'return <Profile {...props} user={investor} isOwn />;',
    'return <Profile {...props} user={props.me} isOwn />;',
    'investor own profile', 1,
)
replace(
    'return <Profile {...props} user={participant} isOwn />;',
    'return <Profile {...props} user={props.me} isOwn />;',
    'participant own profile', 1,
)
replace(
    '<button className="secondary" onClick={() => setEditing(true)}>Editar perfil</button>',
    '<button className="secondary" onClick={() => go("/account/profile")}>Editar perfil</button>',
    'real profile editor', 1,
)
replace(
    '<p className="security-note">Backend Java preparado para autenticação, autorização e persistência. A integração Supabase será ligada na próxima etapa; não há alegação de criptografia ponta a ponta.</p>',
    '<p className="security-note">Autenticação e perfil usam Supabase Auth + RLS. Mensagens ainda são simuladas nesta etapa e não há alegação de criptografia ponta a ponta.</p>',
    'security note', 1,
)

path.write_text(text, encoding="utf-8")
