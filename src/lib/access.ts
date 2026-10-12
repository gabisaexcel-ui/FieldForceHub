import type { AccountLevel, DemoAccount, ModuleKey, OperationalRole } from "../types";

// Modul untuk User Lapangan (Hanya Operasional Mandiri)
const userModules: Record<OperationalRole, ModuleKey[]> = {
  ALL: ["dashboard"],
  FC: [
    "dashboard",
    "attendance",
    "leave",
    "skp",
    "programs",
    "sellout",
    "expenses",
    "violations",
    "reports",
  ],
  MD: ["dashboard", "attendance", "leave", "programs", "expenses", "violations", "reports"],
  MDPS: ["dashboard", "attendance", "leave", "programs", "expenses", "violations", "reports"],
  Salesman: ["dashboard", "attendance", "leave", "skp", "programs", "expenses", "violations", "reports"],
  TS: ["dashboard", "skp", "programs", "reports"],
  KAM: ["dashboard", "skp", "programs", "expenses", "reports"],
};

// Modul khusus Administrasi & Pengelolaan Akun
const administrationModules: ModuleKey[] = ["users", "master-data", "settings"];

export function visibleModules(account: DemoAccount): ModuleKey[] {
  // Master Administrator: Akses seluruh modul sistem
  if (account.level === "master") {
    return [
      "dashboard",
      "attendance",
      "leave",
      "skp",
      "programs",
      "sellout",
      "expenses",
      "violations",
      "reports",
      ...administrationModules,
    ];
  }

  // Admin Divisi: Modul operasional divisinya + Kelola Akun User & Master Data
  if (account.level === "admin") {
    return [...new Set([...userModules[account.role], "users", "master-data"])] as ModuleKey[];
  }

  // User Lapangan: Hanya modul operasional tugas lapangan mandiri (TIDAK ADA Kelola Akun/Master Data)
  return userModules[account.role];
}

export function canManageUsers(level: AccountLevel) {
  return level === "master" || level === "admin";
}

export function scopeLabel(account: DemoAccount) {
  if (account.level === "master") return "Seluruh divisi & area (Nasional)";
  if (account.level === "admin") return `${account.division} • ${account.area}`;
  return `${account.role} Lapangan • ${account.area}`;
}
