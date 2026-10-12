export type AccountLevel = "master" | "admin" | "user";

export type OperationalRole =
  | "ALL"
  | "FC"
  | "MD"
  | "MDPS"
  | "Salesman"
  | "TS"
  | "KAM";

export type ModuleKey =
  | "dashboard"
  | "attendance"
  | "leave"
  | "skp"
  | "programs"
  | "sellout"
  | "expenses"
  | "violations"
  | "reports"
  | "users"
  | "master-data"
  | "settings";

export interface DemoAccount {
  id: string;
  name: string;
  initials: string;
  level: AccountLevel;
  role: OperationalRole;
  division: string;
  area: string;
}

export interface NavigationItem {
  key: ModuleKey;
  label: string;
  description: string;
}

export interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

export type RequestStatus =
  | "Pending"
  | "FC Review"
  | "Approved"
  | "Rejected"
  | "Menunggu HO TTD"
  | "Final Approved";

export interface LeaveRequest {
  id: string;
  employee: string;
  role: OperationalRole;
  area: string;
  dates: string;
  days: number;
  status: RequestStatus;
  updatedAt: string;
}

export interface ExpenseClaim {
  id: string;
  employee: string;
  type: "ATK" | "Parkir";
  amount: number;
  date: string;
  status: "Pending" | "Approved" | "Rejected" | "Selesai";
}
