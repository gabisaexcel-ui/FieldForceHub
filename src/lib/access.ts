import type { AccountLevel, DemoAccount, ModuleKey, OperationalRole } from "../types";

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
    "users",
    "master-data",
  ],
  MD: ["dashboard", "attendance", "leave", "programs", "expenses", "violations", "reports", "users"],
  MDPS: ["dashboard", "attendance", "leave", "programs", "expenses", "violations", "reports", "users"],
  Salesman: ["dashboard", "attendance", "leave", "skp", "programs", "expenses", "violations", "reports", "users"],
  TS: ["dashboard", "skp", "programs", "reports", "users"],
  KAM: ["dashboard", "skp", "programs", "expenses", "reports", "users"],
};

const administrationModules: ModuleKey[] = ["users", "master-data", "settings"];

export function visibleModules(account: DemoAccount): ModuleKey[] {
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

  if (account.level === "admin") {
    return [...new Set([...userModules[account.role], "users", "master-data"])] as ModuleKey[];
  }

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
