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
  ],
  MD: ["dashboard", "attendance", "leave", "programs", "expenses", "violations", "reports"],
  MDPS: ["dashboard", "attendance", "leave", "programs", "expenses", "violations", "reports"],
  Salesman: ["dashboard", "attendance", "leave", "skp", "programs", "expenses", "violations", "reports"],
  TS: ["dashboard", "skp", "programs", "reports"],
  KAM: ["dashboard", "skp", "programs", "reports"],
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
  if (account.level === "master") return "Seluruh divisi & area";
  if (account.level === "admin") return `${account.division} • ${account.area}`;
  return `Data pribadi • ${account.area}`;
}
