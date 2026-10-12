import type { NavigationGroup } from "../types";

export const navigation: NavigationGroup[] = [
  {
    label: "Main",
    items: [
      {
        key: "dashboard",
        label: "Dashboard",
        description: "Dashboard overview, tren aktivitas, dan tugas prioritas",
        subItems: ["Overview", "Visualisasi Data", "Recent Activities"],
      },
    ],
  },
  {
    label: "Workforce",
    items: [
      {
        key: "attendance",
        label: "Absensi & Rekap",
        description: "Check-in GPS, status kehadiran, dan Format Rekap Absen September",
        subItems: ["Check-in Live", "Format Rekap Absen (30 Hari)", "Filter Role"],
      },
      {
        key: "leave",
        label: "Cuti & Izin",
        description: "Cuti tahunan, SKD dokter, tukar off, adjustment, dan approval",
        subItems: ["Alur 7 Langkah", "Daftar Pengajuan", "Ajukan Cuti/SKD"],
      },
    ],
  },
  {
    label: "Program",
    items: [
      {
        key: "skp",
        label: "SKP Otomatis",
        description: "Generate otomatis per toko, TTD TS, dan laporan Salesman",
        subItems: ["Daftar SKP Toko", "TTD TS Digital", "Tambah Toko Program"],
      },
      {
        key: "programs",
        label: "Program Tracker",
        description: "Dokumentasi display toko, foto rak, dan status klaim",
        subItems: ["Monitoring Display", "Galeri Foto", "Status Klaim"],
      },
      {
        key: "sellout",
        label: "Data Sell Out",
        description: "Kompilasi dan validasi data penjualan per area",
        subItems: ["Kompilasi Area", "Validasi Duplikasi"],
      },
    ],
  },
  {
    label: "Operasional",
    items: [
      {
        key: "expenses",
        label: "Report Expenses",
        description: "Format GFF BLESSCOM, plafon Rp 2M, klaim ATK & Parkir",
        subItems: ["Format GFF BLESSCOM", "Input Nota Baru", "Pencairan Bukti TF"],
      },
      {
        key: "violations",
        label: "Pelanggaran",
        description: "Catatan pelanggaran absensi, cuti, dan program",
        subItems: ["Catat Pelanggaran", "Rekap Personal"],
      },
      {
        key: "reports",
        label: "Reports & Rekap",
        description: "Export berkas bulanan, PDF personal, dan ZIP dokumen",
        subItems: ["Rekap Bulanan", "Export PDF Personal"],
      },
    ],
  },
  {
    label: "Administrasi",
    items: [
      {
        key: "users",
        label: "Akun & Role",
        description: "Data master seluruh 48 manpower dan tingkat hak akses",
        subItems: ["Data Role Manpower", "Detail Kontak WA"],
      },
      {
        key: "master-data",
        label: "Master Data",
        description: "Master SKU barang, mapping TS per kota, dan hari libur",
        subItems: ["Data SKU Produk", "Holiday Setting"],
      },
      {
        key: "settings",
        label: "Settings",
        description: "Pengaturan permission matrix dan audit trail",
        subItems: ["Matrix Akses", "Audit Sistem"],
      },
    ],
  },
];
