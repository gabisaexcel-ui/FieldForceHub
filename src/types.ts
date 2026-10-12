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
  code?: string;
  username?: string;
  password?: string;
  phone?: string;
  position?: string;
  gender?: "Laki-laki" | "Perempuan";
  address?: string;
  mapsUrl?: string;
  joinDate?: string;
}

export interface NavigationItem {
  key: ModuleKey;
  label: string;
  description: string;
  subItems?: string[];
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

export type LeaveType = "annual_leave" | "sick" | "off_swap" | "adjustment" | "cancellation";

export interface LeaveRequest {
  id: string;
  employee: string;
  role: OperationalRole;
  area: string;
  type: LeaveType;
  typeLabel: string;
  dates: string;
  days: number;
  reason: string;
  status: RequestStatus;
  updatedAt: string;
  evidenceUrl?: string;
  fcSignature?: string;
  hoSignatureUploaded?: boolean;
}

export interface ExpenseClaim {
  id: string;
  employee: string;
  role: OperationalRole;
  position: string;
  area: string;
  type: "ATK" | "Parkir" | "PARKIR";
  amount: number;
  date: string;
  receiptPhoto?: string;
  status: "Pending" | "Approved" | "Rejected" | "Proses" | "Selesai";
  transferProof?: string;
}

export interface MonthlyAttendanceRecord {
  no: number;
  name: string;
  area: string;
  role: OperationalRole;
  days: Record<number, "1" | "OFF" | "C" | "SKD" | "i">;
  hk: number;
  drc: number;
  cuti: number;
  off: number;
  s: number;
  total: number;
}

export interface SkpDocument {
  id: string;
  skpNumber: string;
  store: string;
  city: string;
  program: string;
  budgetNumber: string;
  budgetAmount: number;
  ts: string;
  salesman: string;
  status: "Draft FC" | "Menunggu TTD TS" | "Sudah TTD" | "Program Jalan" | "Program Tidak Jalan";
  claimStatus: "Belum" | "Sudah";
  claimAmount?: number;
  notRunningReason?: string;
}

export interface ProgramTrackerItem {
  id: string;
  store: string;
  owner: string;
  city: string;
  program: string;
  status: "Jalan" | "Tidak Jalan";
  claim: "Sudah" | "Belum" | "—";
  photos: string[];
  notes: string;
  lastUpdated: string;
}

export interface ViolationRecord {
  id: string;
  employee: string;
  role: OperationalRole;
  area: string;
  date: string;
  category: "Absensi" | "Cuti" | "Program" | "Aturan Kerja";
  description: string;
  severity: "Ringan" | "Sedang" | "Berat";
  evidence?: string;
}

export interface ManpowerMaster {
  role: OperationalRole;
  userCode: string;
  fullName: string;
  area: string;
  position: string;
  joinDate: string;
  phone: string;
  address: string;
  status: "Aktif" | "Nonaktif";
}
