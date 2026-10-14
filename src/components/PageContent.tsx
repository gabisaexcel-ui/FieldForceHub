import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpRight,
  Calendar,
  CalendarDays,
  Camera,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Clock3,
  Download,
  Edit2,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck2,
  FileDown,
  FileSpreadsheet,
  FileText,
  Filter,
  KeyRound,
  Layers,
  Lock,
  MapPin,
  MoreHorizontal,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  UserPen,
  UserPlus,
  Users,
  UsersRound,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  activities,
  attendanceRows,
  demoAccounts,
  initialExpenses,
  initialLeaveRequests,
  initialMonthlyAttendance,
  initialProgramTracker,
  initialSkpDocuments,
  initialViolations,
  rawManpowerMaster,
} from "../data/mockData";
import { canManageUsers, scopeLabel } from "../lib/access";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import {
  fetchTodayAttendance,
  submitAttendance,
  checkUserCheckedInToday,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  type LiveAttendanceItem,
} from "../lib/attendanceService";
import { fetchProfile } from "../lib/profileService";
import {
  fetchAllAccounts,
  registerNewAccount,
  updateAccountCredentials,
  deleteAccount,
  operationalDivisions,
  divisionMeta,
} from "../lib/authService";
import type { AccountLevel } from "../types";
import type {
  DemoAccount,
  ExpenseClaim,
  LeaveRequest,
  LeaveType,
  ModuleKey,
  MonthlyAttendanceRecord,
  OperationalRole,
  ProgramTrackerItem,
  SkpDocument,
  ViolationRecord,
} from "../types";
import { ProfileModal } from "./ProfileModal";
import { StatusBadge } from "./StatusBadge";
import { AttendanceCheckinSection } from "./AttendanceCheckinSection";

interface PageContentProps {
  active: ModuleKey;
  account: DemoAccount;
  onToast: (message: string) => void;
  onNavigate?: (key: ModuleKey) => void;
  onAccountChange?: (account: DemoAccount) => void;
}

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/* =========================================================================
   1. DASHBOARD OVERVIEW (SESUAI GAMBAR MOCKUP DESAIN)
   ========================================================================= */
function DashboardOverview({
  account,
  onToast,
  onNavigate,
}: {
  account: DemoAccount;
  onToast: (message: string) => void;
  onNavigate?: (key: ModuleKey) => void;
}) {
  const [filterPeriod, setFilterPeriod] = useState("Filter Sep-2026");
  const [filterDropdown, setFilterDropdown] = useState(false);

  return (
    <div className="dashboard-view-container">
      {/* Header bar with Title and Filter Dropdown Pill */}
      <div className="dashboard-header-row">
        <div>
          <h1 className="dashboard-title">Dashboard Overview</h1>
          <p className="dashboard-subtitle">
            {scopeLabel(account)} • Monitoring Operasional Terpadu
          </p>
        </div>

        <div className="period-filter-wrapper">
          <button
            className="filter-pill-dropdown-btn"
            onClick={() => setFilterDropdown((prev) => !prev)}
          >
            <span>{filterPeriod}</span>
            <ChevronDown size={14} />
          </button>
          {filterDropdown && (
            <div className="filter-dropdown-menu">
              {["Filter Sep-2026", "Filter Okt-2026", "Filter Ags-2026"].map((p) => (
                <button
                  key={p}
                  className={`filter-dropdown-item ${filterPeriod === p ? "active" : ""}`}
                  onClick={() => {
                    setFilterPeriod(p);
                    setFilterDropdown(false);
                    onToast(`Periode diganti ke ${p}`);
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3 Stat Cards Row matching mockup */}
      <section className="stat-cards-triad" aria-label="Statistik utama">
        {/* Card 1: Visitors / Total Manpower */}
        <article className="triad-card">
          <div className="triad-icon-circle blue">
            <Users size={20} />
          </div>
          <div className="triad-content">
            <div className="triad-value-row">
              <strong className="triad-number">48</strong>
              <span className="triad-badge-delta green">
                <ArrowUpRight size={12} /> 5,63K
              </span>
            </div>
            <span className="triad-label">Total Manpower Lapangan</span>
          </div>
          {/* Mini vertical bar chart */}
          <div className="mini-bars-graphic blue">
            <span style={{ height: "40%" }} />
            <span style={{ height: "65%" }} />
            <span style={{ height: "50%" }} />
            <span style={{ height: "85%" }} />
            <span style={{ height: "70%" }} />
            <span style={{ height: "95%" }} />
            <span style={{ height: "80%" }} />
          </div>
        </article>

        {/* Card 2: New Sales / Presensi Hadir */}
        <article className="triad-card">
          <div className="triad-icon-circle coral">
            <ShoppingBag size={20} />
          </div>
          <div className="triad-content">
            <div className="triad-value-row">
              <strong className="triad-number">43</strong>
              <span className="triad-badge-delta green">
                <ArrowUpRight size={12} /> 89,6%
              </span>
            </div>
            <span className="triad-label">Hadir Hari Ini (Check-in)</span>
          </div>
          {/* Mini coral vertical bar chart */}
          <div className="mini-bars-graphic coral">
            <span style={{ height: "55%" }} />
            <span style={{ height: "75%" }} />
            <span style={{ height: "60%" }} />
            <span style={{ height: "90%" }} />
            <span style={{ height: "80%" }} />
            <span style={{ height: "100%" }} />
            <span style={{ height: "85%" }} />
          </div>
        </article>

        {/* Card 3: Revenue / Expenses Terpakai */}
        <article className="triad-card">
          <div className="triad-icon-circle mint">
            <CircleDollarSign size={20} />
          </div>
          <div className="triad-content">
            <div className="triad-value-row">
              <strong className="triad-number">Rp730,5K</strong>
              <span className="triad-badge-delta green">
                <ArrowUpRight size={12} /> Plafon Aman
              </span>
            </div>
            <span className="triad-label">Klaim Terpakai (Sisa Rp1,26M)</span>
          </div>
          {/* Mini mint vertical bar chart */}
          <div className="mini-bars-graphic mint">
            <span style={{ height: "35%" }} />
            <span style={{ height: "50%" }} />
            <span style={{ height: "65%" }} />
            <span style={{ height: "45%" }} />
            <span style={{ height: "80%" }} />
            <span style={{ height: "75%" }} />
            <span style={{ height: "90%" }} />
          </div>
        </article>
      </section>

      {/* Big Hero Chart Card: "Visualisasi Data" matching mockup */}
      <article className="panel hero-chart-panel">
        <div className="panel-top-row">
          <div>
            <h2 className="panel-title">Visualisasi Data</h2>
            <small className="panel-subtext">Tren Kehadiran & Aktivitas Lapangan 7 Hari Terakhir</small>
          </div>
          <div className="chart-legend-tags">
            <span className="legend-tag">
              <i className="dot blue" /> Hadir
            </span>
            <span className="legend-tag">
              <i className="dot mint" /> Program Berjalan
            </span>
          </div>
        </div>

        {/* Smooth Bezier Wave Chart */}
        <div className="hero-svg-chart-container">
          <svg viewBox="0 0 880 220" preserveAspectRatio="none" className="wave-chart-svg">
            <defs>
              <linearGradient id="blueGlowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#258fe5" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#258fe5" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Subtle horizontal grid lines */}
            {[40, 90, 140, 180].map((y) => (
              <line key={y} x1="0" y1={y} x2="880" y2={y} stroke="#edf2f8" strokeWidth="1" />
            ))}

            {/* Filled smooth gradient area */}
            <path
              d="M0,165 C70,160 120,80 190,140 C260,200 330,85 410,130 C490,175 560,40 640,110 C720,180 790,60 880,75 L880,220 L0,220 Z"
              fill="url(#blueGlowGradient)"
            />

            {/* Smooth glowing top wave curve line */}
            <path
              d="M0,165 C70,160 120,80 190,140 C260,200 330,85 410,130 C490,175 560,40 640,110 C720,180 790,60 880,75"
              fill="none"
              stroke="#268fe5"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>

          {/* Day ticks along bottom */}
          <div className="chart-horizontal-days">
            <span>Senin</span>
            <span>Selasa</span>
            <span>Rabu</span>
            <span>Kamis</span>
            <span>Jumat</span>
            <span>Sabtu</span>
            <span>Minggu</span>
          </div>
        </div>
      </article>

      {/* Bottom Row Grid: Recent Activities & Tugas matching mockup */}
      <section className="dashboard-bottom-dual-grid">
        {/* Left: Recent Activities Table */}
        <article className="panel activities-panel">
          <div className="panel-top-row">
            <h2 className="panel-title">Recent Activities</h2>
            <button className="text-link-btn" onClick={() => onToast("Membuka seluruh log aktivitas")}>
              Lihat semua <ChevronRight size={14} />
            </button>
          </div>

          <div className="activities-table-styled">
            <div className="act-header-row">
              <span>Pengguna</span>
              <span>Status</span>
              <span>Penanda waktu</span>
            </div>
            {activities.map((act) => (
              <div className="act-data-row" key={act.name}>
                <div className="act-user-col">
                  <div className={`avatar-circle mini ${act.tone}`}>{act.initials}</div>
                  <div className="act-user-text">
                    <strong>{act.name}</strong>
                    <small>{act.action}</small>
                  </div>
                </div>
                <div className="act-status-col">
                  <span className={`status-pill ${act.tone}`}>Selesai</span>
                </div>
                <div className="act-time-col">
                  <time>{act.time}</time>
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Right: Tugas / Tasks Checklist Card matching mockup */}
        <article className="panel tasks-panel">
          <div className="panel-top-row">
            <h2 className="panel-title">Tugas</h2>
            <span className="tasks-count-badge">4 Aktif</span>
          </div>

          <div className="tasks-checklist">
            <button
              className="task-item-btn"
              onClick={() => onNavigate?.("leave")}
              title="Buka modul Cuti"
            >
              <div className="check-circle-icon green">
                <Check size={14} />
              </div>
              <div className="task-text-info">
                <strong>Compare coput aktivity terbaru</strong>
                <small>5 Approval cuti menunggu review FC</small>
              </div>
              <ChevronRight size={15} className="task-arrow" />
            </button>

            <button
              className="task-item-btn"
              onClick={() => onNavigate?.("skp")}
              title="Buka modul SKP"
            >
              <div className="check-circle-icon blue">
                <Check size={14} />
              </div>
              <div className="task-text-info">
                <strong>Planrier nut objectic terbaru</strong>
                <small>3 SKP toko baru menunggu tanda tangan TS</small>
              </div>
              <ChevronRight size={15} className="task-arrow" />
            </button>

            <button
              className="task-item-btn"
              onClick={() => onNavigate?.("expenses")}
              title="Buka modul Expenses"
            >
              <div className="check-circle-icon orange">
                <Check size={14} />
              </div>
              <div className="task-text-info">
                <strong>Activity edtor business terbaru</strong>
                <small>Rekap klaim expenses GFF Blesscom siap ekspor</small>
              </div>
              <ChevronRight size={15} className="task-arrow" />
            </button>

            <button
              className="task-item-btn"
              onClick={() => onNavigate?.("attendance")}
              title="Buka modul Absensi"
            >
              <div className="check-circle-icon red">
                <Clock3 size={14} />
              </div>
              <div className="task-text-info">
                <strong>Verifikasi presensi warning</strong>
                <small>1 Manpower Probolinggo belum check-in</small>
              </div>
              <ChevronRight size={15} className="task-arrow" />
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}

/* =========================================================================
   2. MODUL ABSENSI & FORMAT REKAP ABSEN BULANAN (SESUAI GAMBAR 3)
   ========================================================================= */
function AttendanceModule({
  account,
  onToast,
  onAccountChange,
}: {
  account: DemoAccount;
  onToast: (message: string) => void;
  onAccountChange?: (account: DemoAccount) => void;
}) {
  const [tab, setTab] = useState<"rekap" | "checkin">("rekap");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [records] = useState<MonthlyAttendanceRecord[]>(initialMonthlyAttendance);
  const [checkInDone, setCheckInDone] = useState(false);
  const [checkInTime, setCheckInTime] = useState("07:54");
  const [lateReason, setLateReason] = useState("");
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [liveAttendanceList, setLiveAttendanceList] = useState<LiveAttendanceItem[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Muat data presensi hari ini dan periksa status check-in user
  const loadAttendance = useCallback(async () => {
    try {
      const list = await fetchTodayAttendance();
      setLiveAttendanceList(list);

      const status = await checkUserCheckedInToday(account);
      if (status.checkedIn) {
        setCheckInDone(true);
        if (status.time) setCheckInTime(status.time);
      } else {
        setCheckInDone(false);
      }
    } catch (err) {
      console.warn("Gagal refresh presensi:", err);
    }
  }, [account]);

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  // Sinkronisasi otomatis saat ada event broadcast data_changed atau attendance-updated
  useEffect(() => {
    const handleSync = () => {
      void loadAttendance();
    };
    window.addEventListener("fieldforce:attendance-updated", handleSync);
    window.addEventListener("fieldforce:data-changed", handleSync);
    return () => {
      window.removeEventListener("fieldforce:attendance-updated", handleSync);
      window.removeEventListener("fieldforce:data-changed", handleSync);
    };
  }, [loadAttendance]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchRole =
        roleFilter === "ALL"
          ? true
          : roleFilter === "MD_MDPS"
          ? r.role === "MD" || r.role === "MDPS"
          : r.role === roleFilter;
      const matchSearch =
        search === "" ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.area.toLowerCase().includes(search.toLowerCase());
      return matchRole && matchSearch;
    });
  }, [records, roleFilter, search]);

  const handleSimulateCheckin = async () => {
    setLoadingAttendance(true);
    try {
      const res = await submitAttendance(account, {
        note: lateReason || "Presensi GPS & Selfie Akurat",
      });

      setCheckInDone(true);
      setCheckInTime(res.record.checkIn);
      setLiveAttendanceList((prev) => [
        res.record,
        ...prev.filter((p) => p.userCode !== (account.code || account.id) && p.name !== account.name),
      ]);

      onToast(`Presensi GPS & Selfie untuk ${account.name} (${res.record.checkIn} WIB) berhasil tersimpan ke Supabase!`);
    } catch (err: any) {
      onToast("Presensi tersimpan: " + (err?.message || "Sukses"));
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleDeleteAttendance = async (id?: string, userCode?: string) => {
    if (!window.confirm("Yakin ingin menghapus data presensi ini dari Supabase?")) return;
    const res = await deleteAttendanceRecord(id, userCode);
    if (res.success) {
      onToast("Data presensi berhasil dihapus dari database Supabase!");
      if (userCode === (account.code || account.id) || !id) {
        setCheckInDone(false);
      }
      void loadAttendance();
    } else {
      onToast(res.error || "Gagal menghapus presensi");
    }
  };

  const handleEditAttendance = async (item: LiveAttendanceItem) => {
    const newNote = window.prompt("Ubah catatan presensi untuk " + item.name + ":", item.note);
    if (newNote === null || newNote === item.note) return;
    if (!item.id) {
      onToast("ID presensi tidak ditemukan di Supabase.");
      return;
    }
    const res = await updateAttendanceRecord(item.id, { note: newNote });
    if (res.success) {
      onToast("Catatan presensi berhasil diperbarui di database Supabase!");
      void loadAttendance();
    } else {
      onToast(res.error || "Gagal memperbarui catatan");
    }
  };

  return (
    <div className="module-container">
      {/* Kartu Profil & Identitas Manpower Presensi (Sesuai CSV: Role & Data Master) */}
      <article className="panel user-profile-identity-card">
        <div className="identity-card-left">
          <div className={`avatar-circle large level-${account.level}`}>
            {account.initials}
          </div>
          <div className="identity-info-block">
            <div className="identity-name-row">
              <h2>{account.name}</h2>
              <span className={`role-tag-pill ${account.role.toLowerCase()}`}>
                {account.role} • {account.level.toUpperCase()}
              </span>
              <span className="gender-badge-pill">
                {account.gender || "Laki-laki"}
              </span>
            </div>
            <div className="identity-tags-row">
              <span><strong>Posisi:</strong> {account.position || account.role}</span>
              <span><strong>Area:</strong> {account.area}</span>
              <span><strong>Kode:</strong> {account.code || account.id}</span>
              <span><strong>WA:</strong> {account.phone || "—"}</span>
            </div>
            <div className="identity-address-row">
              <MapPin size={14} className="text-blue" />
              <span>{account.address || "Alamat domisili belum diatur"}</span>
              {account.mapsUrl && (
                <a
                  href={account.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-maps-pill"
                >
                  <ExternalLink size={12} /> Buka Titik Maps
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="identity-card-right">
          <button
            className="btn-edit-profile-action"
            onClick={() => setProfileModalOpen(true)}
          >
            <UserPen size={15} /> Edit Data Diri Saya
          </button>
        </div>
      </article>

      <div className="module-header-row">
        <div>
          <span className="eyebrow-tag">WORKFORCE MANAGEMENT</span>
          <h1 className="module-title">Absensi & Format Rekap Absen</h1>
          <p className="module-desc">
            Monitoring kehadiran 30 hari, selfie check-in, GPS latitude-longitude, dan Format Rekap Absen September 2026.
          </p>
        </div>

        <div className="header-action-group">
          <button
            className={`pill-tab-toggle ${tab === "rekap" ? "active" : ""}`}
            onClick={() => setTab("rekap")}
          >
            <FileSpreadsheet size={15} /> Format Rekap Excel (30 Hari)
          </button>
          <button
            className={`pill-tab-toggle ${tab === "checkin" ? "active" : ""}`}
            onClick={() => setTab("checkin")}
          >
            <Camera size={15} /> Presensi Harian & GPS
          </button>
        </div>
      </div>

      {tab === "rekap" ? (
        <>
          {/* Legend and Summary Banner */}
          <div className="rekap-legend-banner">
            <div className="legend-items-row">
              <span className="legend-pill"><strong className="box-code green">1</strong> Masuk / Hadir</span>
              <span className="legend-pill"><strong className="box-code gray">OFF</strong> Libur Mingguan</span>
              <span className="legend-pill"><strong className="box-code blue">C</strong> Cuti (Latar Biru)</span>
              <span className="legend-pill"><strong className="box-code yellow">SKD</strong> Izin Sakit (Surat Dokter)</span>
              <span className="legend-pill"><strong className="box-code purple">i</strong> Ijin</span>
            </div>

            <div className="rekap-export-actions">
              <button
                className="btn-soft-action"
                onClick={() => onToast("Mengekspor laporan Format Rekap Absen Sep-26 ke Excel (.xlsx)...")}
              >
                <FileDown size={15} /> Download Excel Rekap
              </button>
              <button
                className="btn-soft-action"
                onClick={() => onToast("Menyiapkan PDF Rekap Absensi Bulanan...")}
              >
                <Download size={15} /> Export PDF
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="table-controls-bar">
            <div className="search-field-rounded">
              <Search size={15} />
              <input
                placeholder="Cari nama manpower atau area..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="role-tabs-segmented">
              <button
                className={roleFilter === "ALL" ? "active" : ""}
                onClick={() => setRoleFilter("ALL")}
              >
                Semua ({records.length})
              </button>
              <button
                className={roleFilter === "MD_MDPS" ? "active" : ""}
                onClick={() => setRoleFilter("MD_MDPS")}
              >
                MD & MDPS (Digabung)
              </button>
              <button
                className={roleFilter === "FC" ? "active" : ""}
                onClick={() => setRoleFilter("FC")}
              >
                FC Saja
              </button>
            </div>
          </div>

          {/* Matrix Table: Format Rekap Absen September 2026 (Gambar 3 Excel) */}
          <article className="panel matrix-table-panel">
            <div className="mobile-table-scroll-hint">
              <span>👉 Geser horizontal untuk melihat tanggal 1 s/d 30</span>
            </div>
            <div className="matrix-table-scroll-wrapper">
              <table className="excel-matrix-table">
                <thead>
                  <tr>
                    <th className="sticky-col col-no">No</th>
                    <th className="sticky-col col-name">Nama Manpower</th>
                    <th className="sticky-col col-area">Area</th>
                    {/* Columns 1 to 30 */}
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                      <th key={day} className="col-day">
                        <span className="day-num">{day}</span>
                      </th>
                    ))}
                    <th className="col-calc">HK</th>
                    <th className="col-calc">DRC</th>
                    <th className="col-calc">CUTI</th>
                    <th className="col-calc">OFF</th>
                    <th className="col-calc">S</th>
                    <th className="col-calc">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((row) => (
                    <tr key={row.no}>
                      <td className="sticky-col col-no">{row.no}</td>
                      <td className="sticky-col col-name">
                        <strong>{row.name}</strong>
                        <span className="role-badge-sub">{row.role}</span>
                      </td>
                      <td className="sticky-col col-area">{row.area}</td>
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
                        const val = row.days[day] || "1";
                        const cellClass =
                          val === "C"
                            ? "cell-cuti"
                            : val === "SKD"
                            ? "cell-skd"
                            : val === "OFF"
                            ? "cell-off"
                            : val === "i"
                            ? "cell-ijin"
                            : "cell-masuk";
                        return (
                          <td key={day} className={`cell-matrix ${cellClass}`}>
                            {val}
                          </td>
                        );
                      })}
                      <td className="col-calc text-bold">{row.hk}</td>
                      <td className="col-calc text-bold text-green">{row.drc}</td>
                      <td className="col-calc text-blue">{row.cuti || "-"}</td>
                      <td className="col-calc">{row.off}</td>
                      <td className="col-calc text-yellow">{row.s || "-"}</td>
                      <td className="col-calc text-bold">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </>
      ) : (
        /* Presensi Check-In Harian GPS & Foto Selfie (Supabase Live & Local R2 Storage) */
        <AttendanceCheckinSection
          account={account}
          liveList={liveAttendanceList}
          onToast={onToast}
          onRefresh={loadAttendance}
        />
      )}

      {/* Profile Modal for Self Editing */}
      <ProfileModal
        account={account}
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onSave={(updated) => onAccountChange?.(updated)}
        onToast={onToast}
      />
    </div>
  );
}

/* =========================================================================
   3. MODUL CUTI & IZIN (7-STEP WORKFLOW, SKD, TUKAR OFF, ADJUSTMENT)
   ========================================================================= */
function LeaveModule({
  account,
  onToast,
}: {
  account: DemoAccount;
  onToast: (message: string) => void;
}) {
  const [requests, setRequests] = useState<LeaveRequest[]>(initialLeaveRequests);
  const [modalOpen, setModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>("annual_leave");
  const [dates, setDates] = useState("");
  const [days, setDays] = useState(1);
  const [reason, setReason] = useState("");
  const [evidenceName, setEvidenceName] = useState("");

  const advanceStep = (id: string) => {
    setRequests((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        let nextStatus: LeaveRequest["status"] = item.status;
        if (item.status === "Pending") nextStatus = "FC Review";
        else if (item.status === "FC Review") nextStatus = "Menunggu HO TTD";
        else if (item.status === "Menunggu HO TTD") nextStatus = "Final Approved";
        return { ...item, status: nextStatus, updatedAt: "Baru saja" };
      })
    );
    onToast("Status cuti berhasil dimajukan dan disinkronkan ke seluruh sistem!");
  };

  const handleCreateLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dates || !reason) {
      alert("Harap lengkapi tanggal dan alasan!");
      return;
    }

    const typeLabels: Record<LeaveType, string> = {
      annual_leave: "Cuti Tahunan",
      sick: "Izin Sakit (SKD)",
      off_swap: "Tukar Off Day",
      adjustment: "Adjustment Absensi",
      cancellation: "Pembatalan Cuti",
    };

    const newReq: LeaveRequest = {
      id: `CUT-${Math.floor(1000 + Math.random() * 9000)}`,
      employee: account.name,
      role: account.role === "ALL" ? "FC" : account.role,
      area: account.area,
      type: leaveType,
      typeLabel: typeLabels[leaveType],
      dates,
      days: Number(days),
      reason,
      status: account.role === "FC" ? "Menunggu HO TTD" : "FC Review",
      updatedAt: "Baru saja",
      evidenceUrl: evidenceName || undefined,
    };

    setRequests([newReq, ...requests]);
    setModalOpen(false);
    setDates("");
    setReason("");
    setEvidenceName("");
    onToast(`Pengajuan ${typeLabels[leaveType]} berhasil disubmit!`);
  };

  return (
    <div className="module-container">
      <div className="module-header-row">
        <div>
          <span className="eyebrow-tag">WORKFORCE • LEAVE & PERMIT</span>
          <h1 className="module-title">Cuti & Izin Operasional</h1>
          <p className="module-desc">
            Alur hybrid terpadu: Cuti tahunan, izin sakit (SKD dokter), tukar off, adjustment, dan pembatalan cuti.
          </p>
        </div>

        <button className="btn-primary-action" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Ajukan Cuti / Izin Baru
        </button>
      </div>

      {/* 7-Step Workflow Banner */}
      <article className="workflow-banner-card">
        <div className="workflow-card-head">
          <Sparkles size={18} className="text-blue" />
          <div>
            <strong>Alur Standar Otorisasi Cuti</strong>
            <small>HO tidak memiliki akun sistem; verifikasi HO dilakukan secara fisik & diupload kembali.</small>
          </div>
        </div>

        <div className="workflow-seven-steps">
          {[
            "1. Submit Form",
            "2. Validasi Kuota",
            account.role === "FC" ? "3. TTD Digital FC" : "3. FC Approval",
            "4. Cetak Surat",
            "5. HO TTD Manual",
            "6. Upload Scan",
            "7. Final Approved",
          ].map((st, i) => (
            <div key={st} className={`step-node ${i <= 3 ? "done" : i === 4 ? "current" : ""}`}>
              <span className="step-circle">{i < 3 ? <Check size={12} /> : i + 1}</span>
              <small>{st}</small>
            </div>
          ))}
        </div>
      </article>

      {/* Stats summary */}
      <section className="triad-summary-bar">
        <div>
          <strong>8 Hari</strong>
          <span>Sisa Saldo Cuti (Max 2 hari/bulan)</span>
        </div>
        <div>
          <strong>2 Dokumen</strong>
          <span>Menunggu FC Review</span>
        </div>
        <div>
          <strong>1 Dokumen</strong>
          <span>Menunggu HO TTD Manual</span>
        </div>
        <div>
          <strong>3 Dokumen</strong>
          <span>Final Approved (Bulan Ini)</span>
        </div>
      </section>

      {/* Table of Leave Requests */}
      <article className="panel">
        <div className="panel-top-row">
          <h2 className="panel-title">Daftar Pengajuan Cuti & Izin</h2>
          <span className="count-pill">{requests.length} Pengajuan</span>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Manpower</th>
                <th>Jenis Izin</th>
                <th>Tanggal</th>
                <th>Durasi</th>
                <th>Alasan</th>
                <th>Status</th>
                <th>Aksi Otorisasi</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.id}</strong></td>
                  <td>
                    <strong>{r.employee}</strong>
                    <br />
                    <small className="muted-text">{r.role} • {r.area}</small>
                  </td>
                  <td>
                    <span className="leave-type-chip">{r.typeLabel}</span>
                  </td>
                  <td>{r.dates}</td>
                  <td>{r.days} hari</td>
                  <td className="muted-text" style={{ maxWidth: 220 }}>{r.reason}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    {r.status === "FC Review" && (
                      <button className="btn-table-action" onClick={() => advanceStep(r.id)}>
                        Approve FC
                      </button>
                    )}
                    {r.status === "Menunggu HO TTD" && (
                      <button className="btn-table-action green" onClick={() => advanceStep(r.id)}>
                        Konfirmasi Upload HO
                      </button>
                    )}
                    {r.status === "Final Approved" && (
                      <button
                        className="btn-table-action outline"
                        onClick={() => onToast(`Surat cuti resmi ${r.id} didownload`)}
                      >
                        <Download size={13} /> Unduh PDF
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      {/* Modal Ajukan Cuti Baru */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-head">
              <h3>Form Pengajuan Cuti / Izin</h3>
              <button className="close-btn" onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateLeave}>
              <div className="input-group">
                <label>Jenis Pengajuan:</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                >
                  <option value="annual_leave">Cuti Tahunan (Max 2 hari/bulan)</option>
                  <option value="sick">Izin Sakit (Wajib Surat Dokter / SKD)</option>
                  <option value="off_swap">Tukar Off Day</option>
                  <option value="adjustment">Adjustment Presensi</option>
                  <option value="cancellation">Pembatalan Cuti</option>
                </select>
              </div>

              <div className="input-row-dual">
                <div className="input-group">
                  <label>Tanggal Pelaksanaan:</label>
                  <input
                    placeholder="Contoh: 18–19 Oktober 2026"
                    value={dates}
                    onChange={(e) => setDates(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Jumlah Hari:</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Alasan Lengkap:</label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan alasan pengajuan secara jelas..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              {leaveType === "sick" && (
                <div className="input-group">
                  <label>Lampirkan Surat Keterangan Dokter (SKD):</label>
                  <input
                    type="text"
                    placeholder="Nama file / upload foto surat dokter (dr_surya.pdf)"
                    value={evidenceName}
                    onChange={(e) => setEvidenceName(e.target.value)}
                  />
                </div>
              )}

              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary-action">
                  Submit Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   4. MODUL SKP OTOMATIS (SURAT KESEPAKATAN PROGRAM TOKO)
   ========================================================================= */
function SkpModule({
  account,
  onToast,
}: {
  account: DemoAccount;
  onToast: (message: string) => void;
}) {
  const [skpList, setSkpList] = useState<SkpDocument[]>(initialSkpDocuments);
  const [reasonModal, setReasonModal] = useState<string | null>(null);
  const [notRunningReason, setNotRunningReason] = useState("");

  const handleTsSign = (id: string) => {
    setSkpList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Sudah TTD" } : item
      )
    );
    onToast("SKP berhasil ditandatangani TS dan didistribusikan ke akun Salesman!");
  };

  const handleSalesmanReportRunning = (id: string) => {
    setSkpList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Program Jalan" } : item
      )
    );
    onToast("Laporan Toko Jalan diterima! Menunggu verifikasi FC.");
  };

  const submitNotRunning = () => {
    if (!reasonModal) return;
    setSkpList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Program Tidak Jalan", notRunningReason } : item
      )
    );
    setReasonModal(null);
    setNotRunningReason("");
    onToast("Laporan Toko Tidak Jalan beserta alasan berhasil disimpan!");
  };

  const id = reasonModal || "";

  return (
    <div className="module-container">
      <div className="module-header-row">
        <div>
          <span className="eyebrow-tag">PROGRAM • SKP OTOMATIS</span>
          <h1 className="module-title">Surat Kesepakatan Program (SKP)</h1>
          <p className="module-desc">
            Generate SKP otomatis dari file Excel, review FC, tanda tangan digital TS, dan distribusi ke akun Salesman.
          </p>
        </div>

        <button
          className="btn-primary-action"
          onClick={() => onToast("Pilih file Excel format template SKP untuk digenerate...")}
        >
          <Upload size={16} /> Upload Excel Baru
        </button>
      </div>

      {/* 4-Step Flow Indicator */}
      <div className="process-flow-banner">
        <div className="process-step-chip">
          <span>01</span>
          <div>
            <strong>Upload Excel</strong>
            <small>Data toko & program</small>
          </div>
        </div>
        <ChevronRight size={16} />
        <div className="process-step-chip">
          <span>02</span>
          <div>
            <strong>Review FC</strong>
            <small>Validasi mapping budget</small>
          </div>
        </div>
        <ChevronRight size={16} />
        <div className="process-step-chip">
          <span>03</span>
          <div>
            <strong>TTD Digital TS</strong>
            <small>Sesuai mapping kota</small>
          </div>
        </div>
        <ChevronRight size={16} />
        <div className="process-step-chip">
          <span>04</span>
          <div>
            <strong>Distribusi Salesman</strong>
            <small>Lapor jalan / tidak jalan</small>
          </div>
        </div>
      </div>

      {/* Table of SKP Documents */}
      <article className="panel">
        <div className="panel-top-row">
          <h2 className="panel-title">Daftar SKP Toko</h2>
          <span className="count-pill">{skpList.length} Toko</span>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nomor SKP</th>
                <th>Nama Toko</th>
                <th>Kota</th>
                <th>Program</th>
                <th>Budget</th>
                <th>TS Penanggungjawab</th>
                <th>Salesman PIC</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {skpList.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.skpNumber}</strong></td>
                  <td><strong>{item.store}</strong></td>
                  <td>{item.city}</td>
                  <td>{item.program}</td>
                  <td>{currency.format(item.budgetAmount)}</td>
                  <td>{item.ts}</td>
                  <td>{item.salesman}</td>
                  <td><StatusBadge status={item.status} /></td>
                  <td>
                    {item.status === "Menunggu TTD TS" && (
                      <button className="btn-table-action" onClick={() => handleTsSign(item.id)}>
                        Tanda Tangani TS
                      </button>
                    )}
                    {item.status === "Sudah TTD" && (
                      <div className="action-buttons-cell">
                        <button
                          className="btn-table-action green"
                          onClick={() => handleSalesmanReportRunning(item.id)}
                        >
                          Lapor Jalan
                        </button>
                        <button
                          className="btn-table-action danger"
                          onClick={() => setReasonModal(item.id)}
                        >
                          Tidak Jalan
                        </button>
                      </div>
                    )}
                    {(item.status === "Program Jalan" || item.status === "Program Tidak Jalan") && (
                      <button
                        className="btn-table-action outline"
                        onClick={() => onToast(`Melihat detail SKP ${item.skpNumber}`)}
                      >
                        <Eye size={13} /> Lihat
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      {/* Modal Alasan Toko Tidak Jalan */}
      {reasonModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-head">
              <h3>Alasan Program Tidak Berjalan</h3>
              <button className="close-btn" onClick={() => setReasonModal(null)}><X size={18} /></button>
            </div>
            <div className="input-group">
              <label>Keterangan Wajib (Alasan penolakan / kendala toko):</label>
              <textarea
                rows={4}
                placeholder="Contoh: Toko menolak display karena keterbatasan ruang gondola..."
                value={notRunningReason}
                onChange={(e) => setNotRunningReason(e.target.value)}
                required
              />
            </div>
            <div className="modal-foot">
              <button className="btn-secondary" onClick={() => setReasonModal(null)}>Batal</button>
              <button className="btn-primary-action danger" onClick={submitNotRunning}>
                Simpan Alasan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   5. MODUL REPORT EXPENSES (FORMAT GFF BLESSCOM - SESUAI GAMBAR 4)
   ========================================================================= */
function ExpensesModule({
  account,
  onToast,
}: {
  account: DemoAccount;
  onToast: (message: string) => void;
}) {
  const [claims, setClaims] = useState<ExpenseClaim[]>(initialExpenses);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [claimType, setClaimType] = useState<"ATK" | "Parkir">(
    account.role === "Salesman" || account.role === "MD" ? "ATK" : "ATK"
  );
  const [amount, setAmount] = useState(50000);
  const [photoName, setPhotoName] = useState("");

  const cashAdvance = 2000000;
  const totalClaim = useMemo(
    () => claims.reduce((sum, item) => sum + item.amount, 0),
    [claims]
  );
  const balance = cashAdvance - totalClaim;

  const canApprove = account.level !== "user" || account.role === "FC";

  const handleApprove = (id: string) => {
    setClaims((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "Approved" } : c))
    );
    onToast("Klaim nota disetujui FC dan saldo terpotong otomatis!");
  };

  const handleCreateClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const newClaim: ExpenseClaim = {
      id: `EXP-${Math.floor(100 + Math.random() * 900)}`,
      employee: account.name,
      role: account.role === "ALL" ? "FC" : account.role,
      position: account.role === "FC" ? "Field Coordinator" : account.role,
      area: account.area,
      type: claimType,
      amount: Number(amount),
      date: "12/10/2026",
      status: "Pending",
    };
    setClaims([newClaim, ...claims]);
    setModalOpen(false);
    onToast("Nota klaim baru berhasil diinput dan masuk antrean approval!");
  };

  const filteredClaims = useMemo(() => {
    if (filterType === "ALL") return claims;
    return claims.filter((c) => c.type === filterType);
  }, [claims, filterType]);

  return (
    <div className="module-container">
      {/* Official Header matching Gambar 4 Excel */}
      <article className="official-report-header-card">
        <div className="report-title-center">
          <h2>PROJECT EXPENSES REPORT GFF BLESSCOM</h2>
        </div>

        <div className="report-meta-grid">
          <div>
            <span>NAME:</span>
            <strong>SITI FIRDAUS (FIELD COORDINATOR)</strong>
          </div>
          <div>
            <span>AREA COVERAGE:</span>
            <strong>EAST JAVA BALI NUSRA</strong>
          </div>
          <div>
            <span>PERIODE:</span>
            <strong>September 2026 (Sep-26)</strong>
          </div>
        </div>

        {/* Financial Summary Triad */}
        <div className="financial-boxes-row">
          <div className="fin-box">
            <span>CASH ADVANCE (PLAFON)</span>
            <strong>{currency.format(cashAdvance)}</strong>
          </div>
          <div className="fin-box highlight">
            <span>TOTAL NOMINAL CLAIM</span>
            <strong>{currency.format(totalClaim)}</strong>
          </div>
          <div className="fin-box balance">
            <span>SISA BALANCE (KAS)</span>
            <strong>{currency.format(balance)}</strong>
          </div>
        </div>
      </article>

      {/* Action Toolbar */}
      <div className="table-controls-bar">
        <div className="role-tabs-segmented">
          <button
            className={filterType === "ALL" ? "active" : ""}
            onClick={() => setFilterType("ALL")}
          >
            Semua ({claims.length})
          </button>
          <button
            className={filterType === "ATK" ? "active" : ""}
            onClick={() => setFilterType("ATK")}
          >
            Khusus ATK
          </button>
          <button
            className={filterType === "PARKIR" ? "active" : ""}
            onClick={() => setFilterType("PARKIR")}
          >
            Khusus Parkir
          </button>
        </div>

        <div className="action-button-duo">
          <button
            className="btn-soft-action"
            onClick={() => onToast("Menyiapkan Kompilasi PDF Nota Per Orang...")}
          >
            <Download size={14} /> Download PDF Kompilasi
          </button>
          <button className="btn-primary-action" onClick={() => setModalOpen(true)}>
            <Plus size={15} /> Input Nota Baru
          </button>
        </div>
      </div>

      {/* Expenses Table matching Gambar 4 Excel */}
      <article className="panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Deskripsi</th>
                <th>Posisi</th>
                <th>Area</th>
                <th>Claim Atas Nama</th>
                <th>Nominal Claim</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>
                    <span className={`expense-type-badge ${item.type.toLowerCase()}`}>
                      {item.type}
                    </span>
                  </td>
                  <td>{item.position}</td>
                  <td>{item.area}</td>
                  <td><strong>{item.employee}</strong></td>
                  <td>
                    <strong>{item.amount > 0 ? currency.format(item.amount) : "Rp 0"}</strong>
                  </td>
                  <td><StatusBadge status={item.status} /></td>
                  <td>
                    {canApprove && item.status === "Pending" && (
                      <button className="btn-table-action" onClick={() => handleApprove(item.id)}>
                        Approve Nota
                      </button>
                    )}
                    {item.status === "Approved" && (
                      <button
                        className="btn-table-action outline"
                        onClick={() => onToast(`Nota ${item.id} sudah siap dicairkan`)}
                      >
                        Terverifikasi
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      {/* Sign-off Box matching Gambar 4 Excel */}
      <article className="signoff-trio-card">
        <div className="sign-col">
          <span className="sign-label">PREPARED by:</span>
          <div className="sign-signature-space" />
          <strong>SITI FIRDAUS</strong>
          <small>FIELD COORDINATOR</small>
        </div>

        <div className="sign-col">
          <span className="sign-label">APPROVED by:</span>
          <div className="sign-signature-space" />
          <strong>BAYU MAKI</strong>
          <small>NATIONAL ACCOUNT MANAGER (NAM)</small>
        </div>

        <div className="sign-col">
          <span className="sign-label">APPROVED by:</span>
          <div className="sign-signature-space" />
          <strong>TRADE MARKETING</strong>
          <small>MANAGEMENT</small>
        </div>
      </article>

      {/* Modal Input Nota Klaim Baru */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-head">
              <h3>Input Nota Klaim Baru</h3>
              <button className="close-btn" onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateClaim}>
              <div className="input-group">
                <label>Jenis Nota / Klaim:</label>
                {account.role === "Salesman" || account.role === "MD" ? (
                  <div>
                    <input value="ATK" readOnly className="readonly-input" />
                    <small className="muted-text">Role {account.role} dibatasi hanya untuk klaim ATK.</small>
                  </div>
                ) : (
                  <select
                    value={claimType}
                    onChange={(e) => setClaimType(e.target.value as "ATK" | "Parkir")}
                  >
                    <option value="ATK">ATK</option>
                    <option value="PARKIR">Parkir (Hanya FC & MDPS)</option>
                  </select>
                )}
              </div>

              <div className="input-group">
                <label>Nominal Nota (Rupiah):</label>
                <input
                  type="number"
                  step="1000"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                />
              </div>

              <div className="input-group">
                <label>Upload Foto Bukti Nota Fisik (Wajib):</label>
                <input
                  placeholder="nota_atk_12okt.jpg"
                  value={photoName}
                  onChange={(e) => setPhotoName(e.target.value)}
                  required
                />
              </div>

              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary-action">
                  Simpan Klaim Nota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   6. MODUL KELOLA AKUN & MANPOWER (SUPABASE USERNAMES & PASSWORDS CRUD)
   ========================================================================= */
function UsersModule({
  account,
  onToast,
}: {
  account: DemoAccount;
  onToast: (message: string) => void;
}) {
  const isMaster = account.level === "master";
  const isAdmin = account.level === "admin";
  const isUser = account.level === "user";
  const canCreate = isMaster || isAdmin;

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [accountsList, setAccountsList] = useState<DemoAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // State Modal Buat Akun Baru (Hierarki)
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("123");
  const [newFullName, setNewFullName] = useState("");
  const [newDivision, setNewDivision] = useState<OperationalRole>(
    isAdmin ? (account.role as OperationalRole) : "FC"
  );
  const [newLevel, setNewLevel] = useState<AccountLevel>("user");
  const [newArea, setNewArea] = useState(account.area || "Surabaya");
  const [newPhone, setNewPhone] = useState("");
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // State Modal Edit / Ganti Password
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [targetAccount, setTargetAccount] = useState<DemoAccount | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [editDivision, setEditDivision] = useState<OperationalRole>("FC");
  const [editLevel, setEditLevel] = useState<AccountLevel>("user");
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllAccounts();
      setAccountsList(data);
    } catch (err) {
      console.warn("Gagal memuat daftar akun:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const togglePasswordVisibility = (code: string) => {
    setShowPasswords((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const handleOpenCreateModal = () => {
    if (isAdmin) {
      setNewDivision((account.role as OperationalRole) || "FC");
      setNewLevel("user");
    } else if (isMaster) {
      setNewDivision("FC");
      setNewLevel("user");
    }
    setNewPassword("123");
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCreate(true);
    try {
      await registerNewAccount({
        username: newUsername,
        password: newPassword,
        fullName: newFullName,
        division: isAdmin ? (account.role as OperationalRole) : newDivision,
        level: isAdmin ? "user" : newLevel,
        area: newArea,
        phone: newPhone,
        creatorAccount: account,
      });

      onToast(`Akun @${newUsername} berhasil didaftarkan sesuai hierarki!`);
      setCreateModalOpen(false);
      setNewUsername("");
      setNewPassword("123");
      setNewFullName("");
      setNewPhone("");
      await loadAccounts();
    } catch (err: any) {
      alert(err?.message || "Gagal membuat akun.");
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleOpenEdit = (acc: DemoAccount) => {
    setTargetAccount(acc);
    setEditPassword(acc.password || "123");
    setEditDivision((acc.role as OperationalRole) || "FC");
    setEditLevel(acc.level || "user");
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAccount) return;
    setSubmittingEdit(true);

    try {
      const success = await updateAccountCredentials(
        targetAccount.id,
        targetAccount.code || targetAccount.username || targetAccount.id,
        editPassword,
        isMaster ? editDivision : undefined,
        isMaster ? editLevel : undefined
      );

      if (success) {
        onToast(`Kredensial akun @${targetAccount.username || targetAccount.code} berhasil diperbarui!`);
        setEditModalOpen(false);
        await loadAccounts();
      } else {
        alert("Gagal memperbarui akun di Supabase.");
      }
    } catch (err: any) {
      alert(err?.message || "Terjadi kesalahan saat update akun.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDelete = async (acc: DemoAccount) => {
    const confirmDelete = window.confirm(
      `Yakin ingin menghapus akun @${acc.username || acc.code} (${acc.name}) dari Supabase?`
    );
    if (!confirmDelete) return;

    const success = await deleteAccount(acc.code || acc.username || acc.id);
    if (success) {
      onToast(`Akun @${acc.username || acc.code} berhasil dihapus dari Supabase.`);
      await loadAccounts();
    } else {
      alert("Gagal menghapus akun di Supabase.");
    }
  };

  // Cek apakah user saat ini boleh mengedit/menghapus akun tertentu
  const canManageTarget = (target: DemoAccount) => {
    if (isMaster) return true;
    if (isAdmin) {
      // Admin hanya bisa mengelola User dari divisinya sendiri
      return target.role === account.role && target.level === "user";
    }
    return false;
  };

  const filtered = useMemo(() => {
    return accountsList.filter((m) => {
      const matchRole = roleFilter === "ALL" || m.role === roleFilter;
      const matchLevel = levelFilter === "ALL" || m.level === levelFilter;
      const matchSearch =
        search === "" ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.username && m.username.toLowerCase().includes(search.toLowerCase())) ||
        (m.code && m.code.toLowerCase().includes(search.toLowerCase())) ||
        m.area.toLowerCase().includes(search.toLowerCase());
      return matchRole && matchLevel && matchSearch;
    });
  }, [accountsList, roleFilter, levelFilter, search]);

  return (
    <div className="module-container">
      <div className="module-header-row">
        <div>
          <span className="eyebrow-tag">ADMINISTRASI • HIERARKI AKUN</span>
          <h1 className="module-title">Daftar Akun Resmi & Hak Akses</h1>
          <p className="module-desc">
            {isMaster
              ? "Akses Master: Anda dapat mendaftarkan Admin dan User untuk seluruh divisi operasional."
              : isAdmin
              ? `Akses Admin Divisi ${account.role}: Anda dapat mendaftarkan User Lapangan untuk divisi ${account.role}.`
              : `Akses User Lapangan ${account.role}: Anda dapat melihat daftar akun resmi yang terdaftar.`}
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            className="btn-soft-action"
            onClick={() => void loadAccounts()}
            title="Muat Ulang Data Akun dari Supabase"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Data
          </button>
          {canCreate && (
            <button
              className="btn-primary-action"
              onClick={handleOpenCreateModal}
            >
              <UserPlus size={15} /> Buat Akun Baru
            </button>
          )}
        </div>
      </div>

      {/* Info Banner Hierarki Akun */}
      <div className="account-info-banner">
        <div className="account-info-icon">
          <KeyRound size={20} />
        </div>
        <div className="account-info-content">
          <strong>Aturan Hierarki Akun (1 Akun = 1 Role & Status Tetap)</strong>
          <p>
            {isMaster ? (
              <>👑 <strong>Akses Master:</strong> Anda memiliki wewenang penuh untuk mendaftarkan akun Admin Divisi maupun User Lapangan ke seluruh divisi.</>
            ) : isAdmin ? (
              <>🛡️ <strong>Akses Admin Divisi ({account.role}):</strong> Anda berwenang mendaftarkan akun User Lapangan untuk divisi <strong>{account.role}</strong>. Akun Admin diregistrasikan oleh Master.</>
            ) : (
              <>👤 <strong>Akses User Lapangan ({account.role}):</strong> Setiap akun terikat dengan 1 role dan status tetap. Pembuatan akun dilakukan oleh Admin atau Master.</>
            )}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="table-controls-bar">
        <div className="search-field-rounded">
          <Search size={15} />
          <input
            placeholder="Cari username (@), nama lengkap, kota, nomor WA..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="role-tabs-segmented">
          {["ALL", "FC", "MD", "MDPS", "Salesman", "TS", "KAM"].map((r) => (
            <button
              key={r}
              className={roleFilter === r ? "active" : ""}
              onClick={() => setRoleFilter(r)}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="role-tabs-segmented" style={{ marginLeft: "auto" }}>
          <button
            className={levelFilter === "ALL" ? "active" : ""}
            onClick={() => setLevelFilter("ALL")}
          >
            Semua
          </button>
          <button
            className={levelFilter === "admin" ? "active" : ""}
            onClick={() => setLevelFilter("admin")}
          >
            Admin
          </button>
          <button
            className={levelFilter === "user" ? "active" : ""}
            onClick={() => setLevelFilter("user")}
          >
            User
          </button>
        </div>
      </div>

      {/* Accounts Table */}
      <article className="panel">
        <div className="panel-top-row">
          <h2 className="panel-title">Daftar Akun Personil Terdaftar</h2>
          <span className="count-pill">{filtered.length} Akun Aktif</span>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Divisi & Role</th>
                <th>Username Akun</th>
                <th>Password</th>
                <th>Nama Lengkap</th>
                <th>Area Penugasan</th>
                <th>Jabatan / Posisi</th>
                <th>WhatsApp</th>
                {canCreate && <th style={{ textAlign: "right" }}>Aksi Akun</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canCreate ? 8 : 7} style={{ textAlign: "center", padding: "32px", color: "var(--color-muted)" }}>
                    <RefreshCw size={20} className="spin" style={{ margin: "0 auto 8px" }} />
                    <div>Memuat akun dari Supabase database...</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={canCreate ? 8 : 7} style={{ textAlign: "center", padding: "32px", color: "var(--color-muted)" }}>
                    Tidak ada akun yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const accCode = item.code || item.username || item.id;
                  const isPassVisible = Boolean(showPasswords[accCode]);
                  const passVal = item.password || "123";
                  const canEditThisRow = canManageTarget(item);

                  return (
                    <tr key={accCode}>
                      <td>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <span className={`role-tag-pill ${item.role.toLowerCase()}`}>{item.role}</span>
                          <span className={`badge-level-chip ${item.level}`} style={{ fontSize: "10px", padding: "2px 6px" }}>
                            {item.level.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <KeyRound size={13} className="text-muted" />
                          <strong style={{ color: "var(--color-primary-link)" }}>
                            @{item.username || item.code}
                          </strong>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <code style={{ background: "rgba(0,0,0,0.05)", padding: "2px 6px", borderRadius: "4px" }}>
                            {isPassVisible ? passVal : "••••••"}
                          </code>
                          <button
                            type="button"
                            className="btn-icon-tiny"
                            onClick={() => togglePasswordVisibility(accCode)}
                            title={isPassVisible ? "Sembunyikan password" : "Lihat password"}
                          >
                            {isPassVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div className="avatar-chip small">{item.initials}</div>
                          <strong>{item.name}</strong>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <MapPin size={13} className="text-muted" />
                          <span>{item.area}</span>
                        </div>
                      </td>
                      <td>{item.position || "—"}</td>
                      <td>{item.phone || "—"}</td>
                      {canCreate && (
                        <td style={{ textAlign: "right" }}>
                          {canEditThisRow ? (
                            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                              <button
                                className="btn-table-action"
                                onClick={() => handleOpenEdit(item)}
                                title="Ubah Password atau Data"
                              >
                                <Edit2 size={13} /> Edit
                              </button>
                              <button
                                className="btn-table-action danger"
                                onClick={() => void handleDelete(item)}
                                title="Hapus Akun Ini"
                              >
                                <Trash2 size={13} /> Hapus
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: "11px", color: "var(--color-muted)" }}>
                              Terkunci
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </article>

      {/* ================= MODAL BUAT AKUN BARU SESUAI HIERARKI ================= */}
      {createModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: "560px" }}>
            <div className="modal-head">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <UserPlus size={18} className="text-primary-link" />
                <h3>Buat Akun Baru ({isAdmin ? `User Divisi ${account.role}` : "Hierarki"})</h3>
              </div>
              <button className="close-btn" onClick={() => setCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ padding: "16px 20px" }}>
              <div
                style={{
                  background: isAdmin ? "#eff6ff" : "#f0fdf4",
                  border: `1px solid ${isAdmin ? "#bfdbfe" : "#bbf7d0"}`,
                  borderRadius: "8px",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  fontSize: "12px",
                  color: isAdmin ? "#1e40af" : "#166534",
                }}
              >
                {isAdmin ? (
                  <>📌 <strong>Hak Akses Admin {account.role}:</strong> Akun yang didaftarkan otomatis berstatus <strong>User Lapangan</strong> untuk divisi <strong>{account.role}</strong>.</>
                ) : (
                  <>👑 <strong>Hak Akses Master:</strong> Anda dapat mendaftarkan akun untuk divisi dan level mana saja.</>
                )}
              </div>

              <div className="login-inputs-grid">
                <div className="login-input-group">
                  <label>Username Baru:</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Contoh: rudi_md / budi_fc"
                    required
                    autoFocus
                  />
                </div>

                <div className="login-input-group">
                  <label>Password:</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Password akun (default: 123)"
                    required
                  />
                </div>

                <div className="login-input-group full-width">
                  <label>Nama Lengkap:</label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="Nama personil manpower"
                    required
                  />
                </div>

                <div className="login-input-group">
                  <label>Divisi Kerja:</label>
                  {isAdmin ? (
                    <input
                      type="text"
                      value={`${account.role} (${divisionMeta[account.role]?.name || account.role})`}
                      disabled
                      className="readonly-input"
                    />
                  ) : (
                    <select
                      value={newDivision}
                      onChange={(e) => setNewDivision(e.target.value as OperationalRole)}
                    >
                      {operationalDivisions.map((d) => (
                        <option key={d} value={d}>
                          {d} — {divisionMeta[d]?.name || d}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="login-input-group">
                  <label>Level Akses:</label>
                  {isAdmin ? (
                    <input
                      type="text"
                      value="User Lapangan"
                      disabled
                      className="readonly-input"
                    />
                  ) : (
                    <select
                      value={newLevel}
                      onChange={(e) => setNewLevel(e.target.value as AccountLevel)}
                    >
                      <option value="user">User Lapangan</option>
                      <option value="admin">Admin Divisi</option>
                    </select>
                  )}
                </div>

                <div className="login-input-group">
                  <label>Kota / Area Wilayah:</label>
                  <input
                    type="text"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    placeholder="Contoh: Surabaya / Malang"
                    required
                  />
                </div>

                <div className="login-input-group">
                  <label>Nomor Telepon / WhatsApp:</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>

              <div className="modal-foot" style={{ marginTop: "20px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                  disabled={submittingCreate}
                >
                  {submittingCreate ? "Menyimpan ke Supabase..." : "Daftarkan Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL EDIT / GANTI PASSWORD ================= */}
      {editModalOpen && targetAccount && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: "480px" }}>
            <div className="modal-head">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <KeyRound size={18} className="text-primary-link" />
                <h3>Ubah Password Akun</h3>
              </div>
              <button className="close-btn" onClick={() => setEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ padding: "16px 20px" }}>
              <div style={{ background: "rgba(0,0,0,0.03)", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
                <div style={{ fontSize: "13px" }}>
                  Akun: <strong>@{targetAccount.username || targetAccount.code}</strong>
                </div>
                <div style={{ fontSize: "13px", color: "var(--color-muted)" }}>
                  Nama: <strong>{targetAccount.name}</strong> ({targetAccount.role} • {targetAccount.level.toUpperCase()})
                </div>
              </div>

              <div className="login-inputs-grid">
                <div className="login-input-group full-width">
                  <label>Password Baru:</label>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Masukkan password baru"
                    required
                  />
                </div>

                {isMaster && (
                  <>
                    <div className="login-input-group">
                      <label>Ubah Divisi:</label>
                      <select
                        value={editDivision}
                        onChange={(e) => setEditDivision(e.target.value as OperationalRole)}
                      >
                        {operationalDivisions.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="login-input-group">
                      <label>Ubah Level:</label>
                      <select
                        value={editLevel}
                        onChange={(e) => setEditLevel(e.target.value as AccountLevel)}
                      >
                        <option value="user">User Lapangan</option>
                        <option value="admin">Admin Divisi</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-foot" style={{ marginTop: "20px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                  disabled={submittingEdit}
                >
                  {submittingEdit ? "Menyimpan Perubahan..." : "Simpan Password Baru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   7. MODUL PROGRAM TRACKER & CATAT PELANGGARAN
   ========================================================================= */
function ProgramsModule({ onToast }: { onToast: (m: string) => void }) {
  const [items] = useState<ProgramTrackerItem[]>(initialProgramTracker);

  return (
    <div className="module-container">
      <div className="module-header-row">
        <div>
          <span className="eyebrow-tag">PROGRAM TRACKER</span>
          <h1 className="module-title">Monitoring Dokumentasi Toko</h1>
          <p className="module-desc">Dokumentasi display toko, foto rak, planogram gondola, dan status klaim.</p>
        </div>

        <button className="btn-primary-action" onClick={() => onToast("Form upload foto toko dibuka")}>
          <Upload size={15} /> Upload Foto Dokumentasi
        </button>
      </div>

      <div className="program-cards-grid">
        {items.map((item) => (
          <article className="panel program-store-card" key={item.id}>
            <div className="store-card-head">
              <div>
                <h3>{item.store}</h3>
                <small>{item.city} • PIC: {item.owner}</small>
              </div>
              <StatusBadge status={item.status} />
            </div>

            <p className="program-notes">{item.notes}</p>

            <div className="photo-preview-thumbnails">
              {item.photos.map((ph, idx) => (
                <div key={idx} className="photo-placeholder-box">
                  <Camera size={16} />
                  <span>Foto {idx + 1}</span>
                </div>
              ))}
            </div>

            <div className="store-card-foot">
              <span>Status Klaim: <strong>{item.claim}</strong></span>
              <small>{item.lastUpdated}</small>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ViolationsModule({ onToast }: { onToast: (m: string) => void }) {
  const [violations, setViolations] = useState<ViolationRecord[]>(initialViolations);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ViolationRecord["category"]>("Absensi");
  const [desc, setDesc] = useState("");

  const handleAddViolation = (e: React.FormEvent) => {
    e.preventDefault();
    const newV: ViolationRecord = {
      id: `VIO-00${violations.length + 1}`,
      employee: name,
      role: "MD",
      area: "Surabaya",
      date: "12/10/2026",
      category,
      description: desc,
      severity: "Sedang",
    };
    setViolations([newV, ...violations]);
    setModalOpen(false);
    setName("");
    setDesc("");
    onToast("Pelanggaran baru berhasil dicatat dan masuk ke riwayat personal!");
  };

  return (
    <div className="module-container">
      <div className="module-header-row">
        <div>
          <span className="eyebrow-tag">COMPLIANCE & DISIPLIN</span>
          <h1 className="module-title">Catat Pelanggaran Manpower</h1>
          <p className="module-desc">Pencatatan pelanggaran absensi, cuti, program, dan aturan kerja.</p>
        </div>

        <button className="btn-primary-action danger" onClick={() => setModalOpen(true)}>
          <ShieldAlert size={15} /> Catat Pelanggaran Baru
        </button>
      </div>

      <article className="panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Manpower</th>
                <th>Tanggal</th>
                <th>Kategori</th>
                <th>Tingkat</th>
                <th>Deskripsi Pelanggaran</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {violations.map((v) => (
                <tr key={v.id}>
                  <td><strong>{v.id}</strong></td>
                  <td><strong>{v.employee}</strong></td>
                  <td>{v.date}</td>
                  <td><span className="violation-cat-tag">{v.category}</span></td>
                  <td><span className={`severity-tag ${v.severity.toLowerCase()}`}>{v.severity}</span></td>
                  <td>{v.description}</td>
                  <td><StatusBadge status="Tercatat" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-head">
              <h3>Catat Pelanggaran Baru</h3>
              <button className="close-btn" onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddViolation}>
              <div className="input-group">
                <label>Nama Manpower:</label>
                <input
                  placeholder="Pilih atau ketik nama manpower..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label>Kategori Pelanggaran:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ViolationRecord["category"])}
                >
                  <option value="Absensi">Absensi (Keterlambatan / Tanpa Kabar)</option>
                  <option value="Cuti">Cuti (Izin tidak sah)</option>
                  <option value="Program">Program (Display / Foto tidak sesuai)</option>
                  <option value="Aturan Kerja">Aturan Kerja</option>
                </select>
              </div>
              <div className="input-group">
                <label>Deskripsi Pelanggaran:</label>
                <textarea
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  required
                />
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
                <button type="submit" className="btn-primary-action danger">Simpan Catatan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   ROUTER SWITCHER KONTEN UTAMA
   ========================================================================= */
export function PageContent({ active, account, onToast, onNavigate, onAccountChange }: PageContentProps) {
  if (active === "dashboard") {
    return <DashboardOverview account={account} onToast={onToast} onNavigate={onNavigate} />;
  }
  if (active === "attendance") {
    return (
      <AttendanceModule
        account={account}
        onToast={onToast}
        onAccountChange={onAccountChange}
      />
    );
  }
  if (active === "leave") {
    return <LeaveModule account={account} onToast={onToast} />;
  }
  if (active === "skp") {
    return <SkpModule account={account} onToast={onToast} />;
  }
  if (active === "expenses") {
    return <ExpensesModule account={account} onToast={onToast} />;
  }
  if (active === "users") {
    return <UsersModule account={account} onToast={onToast} />;
  }
  if (active === "programs") {
    return <ProgramsModule onToast={onToast} />;
  }
  if (active === "violations") {
    return <ViolationsModule onToast={onToast} />;
  }

  // Generic Module Handler (Sell Out, Reports, Master Data, Settings)
  return (
    <div className="module-container">
      <div className="module-header-row">
        <div>
          <span className="eyebrow-tag">MODUL SISTEM</span>
          <h1 className="module-title" style={{ textTransform: "capitalize" }}>
            {active.replace("-", " ")}
          </h1>
          <p className="module-desc">Modul operasional terhubung dengan Supabase dan hak akses {account.level}.</p>
        </div>

        <button
          className="btn-primary-action"
          onClick={() => onToast(`Aksi baru pada modul ${active} dijalankan`)}
        >
          <Plus size={15} /> Tambah Data
        </button>
      </div>

      <article className="panel generic-card-panel">
        <Sparkles size={36} className="text-blue" />
        <h2>Modul {active.toUpperCase()} Siap Digunakan</h2>
        <p className="muted-text">
          Struktur data Supabase PostgreSQL telah disiapkan dan data akan disaring otomatis sesuai cakupan wilayah ({account.area}).
        </p>
        <button
          className="btn-soft-action"
          onClick={() => onToast("Koneksi Supabase siap dikonfigurasi")}
        >
          Lihat Skema Data
        </button>
      </article>
    </div>
  );
}
