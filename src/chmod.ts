export interface Permission {
  read: boolean;
  write: boolean;
  execute: boolean;
}

export interface ParsedChmod {
  valid: true;
  owner: Permission;
  group: Permission;
  other: Permission;
  octal: string;
  symbolic: string;
  summary: string;
  commonName?: string;
  useCases: string[];
}

export interface FailedChmod {
  valid: false;
  error: string;
}

function digitToPerm(d: number): Permission {
  return { read: (d & 4) !== 0, write: (d & 2) !== 0, execute: (d & 1) !== 0 };
}

function permToDigit(p: Permission): number {
  return (p.read ? 4 : 0) + (p.write ? 2 : 0) + (p.execute ? 1 : 0);
}

function permToStr(p: Permission): string {
  return `${p.read ? "r" : "-"}${p.write ? "w" : "-"}${p.execute ? "x" : "-"}`;
}

function lsCharToPerm(s: string): Permission {
  return {
    read: s[0] === "r",
    write: s[1] === "w",
    execute: s[2] === "x" || s[2] === "s" || s[2] === "t",
  };
}

const COMMON: Record<string, { name: string; useCases: string[] }> = {
  "777": { name: "World-writable", useCases: ["Temp directories shared across users", "Dev environments (avoid in production)"] },
  "775": { name: "Group-writable directory", useCases: ["Shared project directories", "Team collaboration folders"] },
  "755": { name: "Standard directory / executable", useCases: ["Web server document roots", "Public directories", "CLI executables"] },
  "700": { name: "Private directory", useCases: ["Home directories", "Private application data"] },
  "666": { name: "World-readable and writable", useCases: ["Shared temp files (no execute)", "Named pipes"] },
  "664": { name: "Group-writable file", useCases: ["Shared source files", "Collaborative config files"] },
  "644": { name: "Standard file", useCases: ["Web content and HTML files", "Config files", "Source code"] },
  "640": { name: "Group-readable file", useCases: ["App config with sensitive data", "Log files"] },
  "600": { name: "Private file", useCases: ["SSH private keys (~/.ssh/id_rsa)", "Password files", "Secret environment files"] },
  "400": { name: "Read-only", useCases: ["SSH authorized_keys", "Immutable config files", "Backup files"] },
  "444": { name: "Read-only for everyone", useCases: ["Published static assets", "Shared reference files"] },
};

function describeEntity(name: string, p: Permission): string {
  const has = [p.read && "read", p.write && "write", p.execute && "execute"].filter(Boolean) as string[];
  if (has.length === 0) return `${name} has no permissions`;
  if (has.length === 3) return `${name} has full control`;
  return `${name} can ${has.join(" and ")}`;
}

function buildSummary(owner: Permission, group: Permission, other: Permission): string {
  const parts = [
    describeEntity("Owner", owner),
    describeEntity("Group", group),
    describeEntity("Others", other),
  ];
  return parts.join(". ") + ".";
}

function normalizeInput(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^chmod\s+/, "")   // strip "chmod " prefix
    .replace(/\s+\S+$/, "")     // strip trailing filename
    .trim();
}

export function parseChmod(input: string): ParsedChmod | FailedChmod {
  const t = normalizeInput(input);

  // Octal: 755, 0755
  const octalMatch = t.match(/^0?([0-7]{3})$/);
  if (octalMatch) {
    const [o, g, x] = octalMatch[1].split("").map(Number);
    const owner = digitToPerm(o);
    const group = digitToPerm(g);
    const other = digitToPerm(x);
    const octal = octalMatch[1];
    const common = COMMON[octal];
    return {
      valid: true,
      owner,
      group,
      other,
      octal,
      symbolic: permToStr(owner) + permToStr(group) + permToStr(other),
      summary: buildSummary(owner, group, other),
      commonName: common?.name,
      useCases: common?.useCases ?? [],
    };
  }

  // ls -l format: -rwxr-xr-x or rwxr-xr-x
  const lsMatch = t.match(/^[-dlcbps]?([r-][w-][xss-][r-][w-][xss-][r-][w-][xtt-])$/);
  if (lsMatch) {
    const s = lsMatch[1];
    const owner = lsCharToPerm(s.slice(0, 3));
    const group = lsCharToPerm(s.slice(3, 6));
    const other = lsCharToPerm(s.slice(6, 9));
    const octal = `${permToDigit(owner)}${permToDigit(group)}${permToDigit(other)}`;
    const common = COMMON[octal];
    return {
      valid: true,
      owner,
      group,
      other,
      octal,
      symbolic: permToStr(owner) + permToStr(group) + permToStr(other),
      summary: buildSummary(owner, group, other),
      commonName: common?.name,
      useCases: common?.useCases ?? [],
    };
  }

  return {
    valid: false,
    error: `"${t}" is not a recognized permission format. Try an octal like 755 or ls format like -rwxr-xr-x.`,
  };
}
