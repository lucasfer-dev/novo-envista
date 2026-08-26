import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);

const checks = [
  {
    name: "Supabase secret key",
    pattern: /sb_secret_[A-Za-z0-9_-]{20,}/g,
  },
  {
    name: "Supabase privileged key assignment",
    pattern: /SUPABASE_(?:SECRET|SERVICE_ROLE)_KEY\s*=\s*[^\s#"']{12,}/g,
  },
  {
    name: "Private key material",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
  },
];

const findings = [];

for (const file of tracked) {
  let stat;
  try {
    stat = statSync(file);
  } catch {
    continue;
  }
  if (!stat.isFile() || stat.size > 2 * 1024 * 1024) continue;

  const buffer = readFileSync(file);
  if (buffer.includes(0)) continue;
  const text = buffer.toString("utf8");

  for (const check of checks) {
    check.pattern.lastIndex = 0;
    if (check.pattern.test(text)) findings.push(`${file}: ${check.name}`);
  }
}

if (findings.length) {
  console.error("Possível segredo privilegiado encontrado em arquivo versionado:");
  for (const finding of findings) console.error(`- ${finding}`);
  console.error("O valor não é exibido para evitar vazamento adicional nos logs de CI.");
  process.exit(1);
}

console.log("Secret scan: nenhum segredo privilegiado conhecido encontrado.");
