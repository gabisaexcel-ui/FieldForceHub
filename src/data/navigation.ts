import type { NavigationGroup } from "../types";

export const navigation: NavigationGroup[] = [
  {
    label: "Ringkasan",
    items: [{ key: "dashboard", label: "Dashboard", description: "Ringkasan aktivitas dan prioritas" }],
  },
  {
    label: "Workforce",
    items: [
      { key: "attendance", label: "Absensi", description: "Check-in, monitoring, dan adjustment" },
      { key: "leave", label: "Cuti & Izin", description: "Cuti, SKD, tukar off, dan approval" },
    ],
  },
  {
    label: "Program",
    items: [
      { key: "skp", label: "SKP Otomatis", description: "Generate, distribusi, dan tanda tangan SKP" },
      { key: "programs", label: "Program Tracker", description: "Status program dan dokumentasi toko" },
      { key: "sellout", label: "Sell Out", description: "Kompilasi data sell out" },
    ],
  },
  {
    label: "Operasional",
    items: [
      { key: "expenses", label: "Expenses", description: "Klaim nota dan rekap bulanan" },
      { key: "violations", label: "Pelanggaran", description: "Catatan dan rekap pelanggaran" },
      { key: "reports", label: "Reports", description: "Export dan laporan per orang" },
    ],
  },
  {
    label: "Administrasi",
    items: [
      { key: "users", label: "Akun & Role", description: "Kelola hierarki dan akses akun" },
      { key: "master-data", label: "Master Data", description: "Manpower, area, SKU, dan hari libur" },
      { key: "settings", label: "Pengaturan", description: "Konfigurasi sistem dan audit" },
    ],
  },
];
