import type { DemoAccount, ExpenseClaim, LeaveRequest } from "../types";

export const demoAccounts: DemoAccount[] = [
  {
    id: "master-1",
    name: "Siti Firdaus",
    initials: "SF",
    level: "master",
    role: "ALL",
    division: "All Divisions",
    area: "Nasional",
  },
  {
    id: "admin-fc",
    name: "Admin Field Coordinator",
    initials: "AF",
    level: "admin",
    role: "FC",
    division: "Field Coordinator",
    area: "East Java Bali Nusra",
  },
  {
    id: "fc-1",
    name: "Siti Firdaus",
    initials: "SF",
    level: "user",
    role: "FC",
    division: "Field Coordinator",
    area: "East Java Bali Nusra",
  },
  {
    id: "md-1",
    name: "Muhamad Faizal Kako Djata",
    initials: "MF",
    level: "user",
    role: "MD",
    division: "Merchandiser",
    area: "Denpasar",
  },
  {
    id: "sales-1",
    name: "Mochamad Hanif Aziz",
    initials: "MH",
    level: "user",
    role: "Salesman",
    division: "Sales",
    area: "Surabaya",
  },
  {
    id: "ts-1",
    name: "Belum Tau",
    initials: "TS",
    level: "user",
    role: "TS",
    division: "Territory Sales",
    area: "East Java",
  },
];

export const attendanceRows = [
  { name: "Dedy Permana", role: "MD", area: "Surabaya", checkIn: "07:54", status: "Great", note: "Tepat waktu" },
  { name: "Sindy Ayu Rahmawati", role: "MDPS", area: "Surabaya", checkIn: "08:03", status: "Safe", note: "Dalam toleransi" },
  { name: "Ni Made Nuraini", role: "MDPS", area: "Denpasar", checkIn: "08:17", status: "Alert", note: "Traffic padat" },
  { name: "Achmad Rional Al Kubri", role: "Salesman", area: "Probolinggo", checkIn: "—", status: "Warning", note: "Belum check-in" },
  { name: "Indah Sriwahyu", role: "MDPS", area: "Banyuwangi", checkIn: "07:49", status: "Great", note: "Tepat waktu" },
];

export const initialLeaveRequests: LeaveRequest[] = [
  { id: "CUT-1028", employee: "Muhamad Faizal Kako Djata", role: "MD", area: "Denpasar", dates: "14–15 Okt 2026", days: 2, status: "FC Review", updatedAt: "2 menit lalu" },
  { id: "CUT-1027", employee: "Siti Firdaus", role: "FC", area: "East Java Bali Nusra", dates: "20 Okt 2026", days: 1, status: "Menunggu HO TTD", updatedAt: "18 menit lalu" },
  { id: "CUT-1026", employee: "Mochamad Hanif Aziz", role: "Salesman", area: "Surabaya", dates: "22 Okt 2026", days: 1, status: "Pending", updatedAt: "1 jam lalu" },
  { id: "CUT-1025", employee: "Ni Made Nuraini", role: "MDPS", area: "Denpasar", dates: "8 Okt 2026", days: 1, status: "Final Approved", updatedAt: "Kemarin" },
];

export const skpRows = [
  { id: "SKP-0939", store: "Apotek Sehat Surabaya", city: "Surabaya", program: "Rafraksi Sell Out", ts: "TS 01", status: "Menunggu TTD TS" },
  { id: "SKP-0938", store: "Toko Denpasar Farma", city: "Denpasar", program: "Promo Fund", ts: "TS 03", status: "Sudah TTD" },
  { id: "SKP-0937", store: "Banyuwangi Mart", city: "Banyuwangi", program: "Visibility", ts: "TS 02", status: "Draft FC" },
];

export const programRows = [
  { store: "Apotek Sehat Surabaya", owner: "Mochamad Hanif Aziz", city: "Surabaya", status: "Jalan", claim: "Belum", photos: 4 },
  { store: "Toko Denpasar Farma", owner: "Ni Putu Yuni Sartika", city: "Denpasar", status: "Jalan", claim: "Sudah", photos: 6 },
  { store: "Banyuwangi Mart", owner: "Indah Sriwahyu", city: "Banyuwangi", status: "Tidak Jalan", claim: "—", photos: 2 },
];

export const initialExpenses: ExpenseClaim[] = [
  { id: "EXP-2041", employee: "Dedy Permana", type: "ATK", amount: 51500, date: "12 Okt 2026", status: "Pending" },
  { id: "EXP-2040", employee: "Ni Irfan Rohmattulla", type: "ATK", amount: 139500, date: "11 Okt 2026", status: "Approved" },
  { id: "EXP-2039", employee: "Siti Firdaus", type: "Parkir", amount: 126000, date: "10 Okt 2026", status: "Selesai" },
  { id: "EXP-2038", employee: "Hubaidil Ahror", type: "ATK", amount: 64000, date: "9 Okt 2026", status: "Rejected" },
];

export const activities = [
  { initials: "MF", name: "Muhamad Faizal", action: "mengajukan cuti 2 hari", time: "2 menit lalu", tone: "blue" },
  { initials: "SF", name: "Siti Firdaus", action: "export rekap absensi", time: "12 menit lalu", tone: "purple" },
  { initials: "MH", name: "Mochamad Hanif", action: "upload SKP toko", time: "29 menit lalu", tone: "green" },
  { initials: "NS", name: "Nurul Eka Safitri", action: "mengirim nota ATK", time: "46 menit lalu", tone: "orange" },
];

export const manpowerRows = [
  { code: "GSKMD236", name: "Anak Agung Sagung Dinda Andarini", role: "MD", area: "Denpasar", status: "Aktif" },
  { code: "GSKMD67", name: "Made Rosa Wulandari", role: "MD", area: "Denpasar", status: "Aktif" },
  { code: "GSKMD325", name: "Elok Faixkotul Fazriah", role: "MD", area: "Jember", status: "Aktif" },
  { code: "GSKMD367", name: "Indah Sriwahyu", role: "MDPS", area: "Banyuwangi", status: "Aktif" },
  { code: "34Q4001", name: "Mochamad Hanif Aziz", role: "Salesman", area: "Surabaya", status: "Aktif" },
];
