import {
  ArrowDownToLine,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Filter,
  MapPin,
  MoreHorizontal,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  activities,
  attendanceRows,
  initialExpenses,
  initialLeaveRequests,
  manpowerRows,
  programRows,
  skpRows,
} from "../data/mockData";
import { scopeLabel } from "../lib/access";
import type { DemoAccount, ExpenseClaim, LeaveRequest, ModuleKey } from "../types";
import { StatusBadge } from "./StatusBadge";

interface PageContentProps {
  active: ModuleKey;
  account: DemoAccount;
  onToast: (message: string) => void;
}

const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </div>
  );
}

function StatCard({ label, value, delta, icon, tone }: { label: string; value: string; delta: string; icon: ReactNode; tone: string }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <div className="stat-copy"><span>{label}</span><strong>{value}</strong><small><ArrowUpRight size={13} />{delta}</small></div>
      <svg className={`sparkline ${tone}`} viewBox="0 0 72 28" aria-hidden="true">
        <path d="M2 24 C 12 22, 13 13, 23 16 S 35 23, 43 12 S 55 6, 70 4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </article>
  );
}

function Dashboard({ account }: { account: DemoAccount }) {
  const isPersonal = account.level === "user" && account.role !== "FC";
  const firstName = account.name.split(" ")[0];

  return (
    <>
      <PageHeader
        eyebrow={`${account.level.toUpperCase()} WORKSPACE`}
        title={`Selamat datang, ${firstName}`}
        description={`${scopeLabel(account)} • Senin, 12 Oktober 2026`}
        actions={<button className="button secondary"><CalendarDays size={16} /> Oktober 2026</button>}
      />

      <section className="stat-grid">
        {isPersonal ? (
          <>
            <StatCard label="Kehadiran bulan ini" value="24 hari" delta="96% attendance" icon={<UserCheck />} tone="blue" />
            <StatCard label="Saldo cuti" value="8 hari" delta="Tersedia" icon={<CalendarDays />} tone="purple" />
            <StatCard label="Program aktif" value="12" delta="2 perlu update" icon={<PackageCheck />} tone="green" />
            <StatCard label="Klaim berjalan" value="Rp730K" delta="3 transaksi" icon={<CircleDollarSign />} tone="orange" />
          </>
        ) : (
          <>
            <StatCard label="Total manpower" value="48" delta="3 bulan ini" icon={<UsersRound />} tone="blue" />
            <StatCard label="Hadir hari ini" value="43" delta="89,6% hadir" icon={<UserCheck />} tone="green" />
            <StatCard label="Perlu persetujuan" value="12" delta="5 prioritas" icon={<FileCheck2 />} tone="orange" />
            <StatCard label="Program berjalan" value="126" delta="8 minggu ini" icon={<PackageCheck />} tone="purple" />
          </>
        )}
      </section>

      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="panel-heading">
            <div><span className="section-kicker">ATTENDANCE TREND</span><h2>Aktivitas 7 hari terakhir</h2></div>
            <div className="chart-legend"><span><i className="legend-blue" />Hadir</span><span><i className="legend-mint" />Program</span></div>
          </div>
          <div className="hero-chart">
            <svg viewBox="0 0 760 235" preserveAspectRatio="none" role="img" aria-label="Grafik aktivitas mingguan">
              <defs>
                <linearGradient id="areaBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#268fe5" stopOpacity=".26" />
                  <stop offset="100%" stopColor="#268fe5" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="areaMint" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#35c89f" stopOpacity=".15" />
                  <stop offset="100%" stopColor="#35c89f" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[36, 84, 132, 180].map((y) => <line key={y} x1="0" x2="760" y1={y} y2={y} stroke="#edf1f7" strokeWidth="1" />)}
              <path d="M0 184 C45 166 70 114 122 130 S196 175 246 112 S328 102 369 130 S438 139 475 86 S555 62 596 105 S676 92 760 38 L760 235 L0 235Z" fill="url(#areaBlue)" />
              <path d="M0 184 C45 166 70 114 122 130 S196 175 246 112 S328 102 369 130 S438 139 475 86 S555 62 596 105 S676 92 760 38" fill="none" stroke="#268fe5" strokeWidth="4" strokeLinecap="round" />
              <path d="M0 199 C62 194 94 157 145 169 S229 191 281 157 S374 151 425 163 S515 133 563 150 S658 157 760 104" fill="none" stroke="#35c89f" strokeWidth="3" strokeLinecap="round" strokeDasharray="7 8" />
            </svg>
            <div className="chart-days"><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span></div>
          </div>
        </article>

        <article className="panel focus-panel">
          <div className="panel-heading"><div><span className="section-kicker">FOCUS HARI INI</span><h2>Butuh perhatian</h2></div><span className="count-pill">4</span></div>
          <div className="focus-list">
            <button><span className="focus-icon orange"><Clock3 /></span><span><strong>5 approval cuti</strong><small>Menunggu review FC</small></span><ChevronRight /></button>
            <button><span className="focus-icon blue"><FileText /></span><span><strong>3 SKP menunggu TTD</strong><small>Perlu tindak lanjut TS</small></span><ChevronRight /></button>
            <button><span className="focus-icon red"><ShieldCheck /></span><span><strong>1 absensi warning</strong><small>Belum check-in hari ini</small></span><ChevronRight /></button>
            <button><span className="focus-icon green"><CircleDollarSign /></span><span><strong>Rekap expenses</strong><small>Siap diekspor</small></span><ChevronRight /></button>
          </div>
        </article>
      </section>

      <section className="dashboard-grid lower">
        <article className="panel activity-panel">
          <div className="panel-heading"><div><span className="section-kicker">LIVE UPDATES</span><h2>Aktivitas terbaru</h2></div><button className="text-button">Lihat semua <ChevronRight size={15} /></button></div>
          <div className="activity-list">
            {activities.map((activity) => (
              <div className="activity-row" key={`${activity.name}-${activity.time}`}>
                <span className={`avatar mini ${activity.tone}`}>{activity.initials}</span>
                <span><strong>{activity.name}</strong><small>{activity.action}</small></span>
                <time>{activity.time}</time>
              </div>
            ))}
          </div>
        </article>
        <article className="panel area-panel">
          <div className="panel-heading"><div><span className="section-kicker">AREA COVERAGE</span><h2>Performa area</h2></div><button className="icon-button"><MoreHorizontal size={19} /></button></div>
          <div className="area-list">
            {[{n:"Surabaya",v:94},{n:"Denpasar",v:88},{n:"Malang",v:81},{n:"Jember",v:76}].map((area) => (
              <div className="area-row" key={area.n}><span>{area.n}</span><div><i style={{width:`${area.v}%`}} /></div><strong>{area.v}%</strong></div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}

function TableToolbar({ placeholder = "Cari data...", action, onAction }: { placeholder?: string; action?: string; onAction?: () => void }) {
  return (
    <div className="table-toolbar">
      <label className="mini-search"><Search size={16} /><input placeholder={placeholder} /></label>
      <div><button className="button secondary"><Filter size={15} /> Filter</button>{action && <button className="button primary" onClick={onAction}><Plus size={16} /> {action}</button>}</div>
    </div>
  );
}

function AttendancePage({ account, onToast }: Omit<PageContentProps, "active">) {
  return (
    <>
      <PageHeader eyebrow="WORKFORCE" title="Absensi" description={`Monitoring kehadiran, GPS, selfie, dan adjustment • ${scopeLabel(account)}`} actions={<button className="button primary" onClick={() => onToast("Rekap absensi sedang disiapkan")}><ArrowDownToLine size={16} /> Export report</button>} />
      <section className="mini-stats"><div><strong>43</strong><span>Hadir</span></div><div><strong>2</strong><span>Cuti</span></div><div><strong>1</strong><span>SKD</span></div><div><strong>2</strong><span>Belum check-in</span></div></section>
      <article className="panel table-panel">
        <TableToolbar placeholder="Cari nama atau area..." />
        <div className="table-scroll"><table><thead><tr><th>Manpower</th><th>Role</th><th>Area</th><th>Check-in</th><th>Status</th><th>Catatan</th><th /></tr></thead><tbody>{attendanceRows.map((row) => <tr key={row.name}><td><div className="name-cell"><span className="avatar mini blue">{row.name.split(" ").map((part) => part[0]).slice(0,2).join("")}</span><strong>{row.name}</strong></div></td><td>{row.role}</td><td><MapPin size={14} /> {row.area}</td><td>{row.checkIn}</td><td><StatusBadge status={row.status} /></td><td className="muted">{row.note}</td><td><button className="icon-button"><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div>
      </article>
    </>
  );
}

function LeavePage({ account, onToast }: Omit<PageContentProps, "active">) {
  const [requests, setRequests] = useState<LeaveRequest[]>(initialLeaveRequests);
  const canApprove = account.level !== "user" || account.role === "FC";
  const advance = (id: string) => {
    setRequests((rows) => rows.map((row) => row.id === id ? { ...row, status: row.status === "FC Review" ? "Menunggu HO TTD" : "Final Approved", updatedAt: "Baru saja" } : row));
    onToast("Status cuti diperbarui dan tersinkron realtime");
  };
  return (
    <>
      <PageHeader eyebrow="WORKFORCE" title="Cuti & Izin" description="Cuti, SKD, tukar off, pembatalan, dan adjustment dalam satu alur." actions={<button className="button primary" onClick={() => onToast("Form pengajuan cuti dibuka")}><Plus size={16} /> Ajukan cuti</button>} />
      <article className="workflow-banner">
        <div className="workflow-title"><span><Sparkles size={18} /></span><div><strong>Alur cuti yang berlaku</strong><small>HO tidak memiliki akun sistem; tanda tangan dilakukan manual setelah dokumen dicetak.</small></div></div>
        <div className="workflow-steps">
          {["Submit", "Validation", account.role === "FC" ? "Input TTD FC" : "FC Approval", "Export & Cetak", "HO TTD manual", "Upload", "Final Approved"].map((step, index) => <div className={index < 3 ? "done" : index === 3 ? "current" : ""} key={step}><span>{index < 3 ? <Check size={13} /> : index + 1}</span><small>{step}</small></div>)}
        </div>
      </article>
      <article className="panel table-panel">
        <TableToolbar placeholder="Cari pengajuan cuti..." />
        <div className="table-scroll"><table><thead><tr><th>ID</th><th>Nama</th><th>Role / Area</th><th>Tanggal</th><th>Durasi</th><th>Status</th><th>Update</th><th /></tr></thead><tbody>{requests.map((row) => <tr key={row.id}><td><strong>{row.id}</strong></td><td>{row.employee}</td><td><strong>{row.role}</strong><br/><small className="muted">{row.area}</small></td><td>{row.dates}</td><td>{row.days} hari</td><td><StatusBadge status={row.status} /></td><td className="muted">{row.updatedAt}</td><td>{canApprove && (row.status === "FC Review" || row.status === "Menunggu HO TTD") ? <button className="table-action" onClick={() => advance(row.id)}>{row.status === "FC Review" ? "Approve" : "Konfirmasi upload"}</button> : <button className="icon-button"><MoreHorizontal size={17}/></button>}</td></tr>)}</tbody></table></div>
      </article>
    </>
  );
}

function SkpPage({ onToast }: Pick<PageContentProps, "onToast">) {
  return <><PageHeader eyebrow="PROGRAM" title="SKP Otomatis" description="Generate SKP per toko, review FC, tanda tangan TS, dan distribusi ke Salesman." actions={<><button className="button secondary"><ArrowDownToLine size={16}/> Download template</button><button className="button primary" onClick={() => onToast("Pilih file Excel untuk generate SKP")}><Upload size={16}/> Upload Excel</button></>} /><section className="process-cards"><div><span>01</span><strong>Upload Excel</strong><small>Data toko & program</small></div><ChevronRight/><div><span>02</span><strong>Review FC</strong><small>Validasi dan revisi</small></div><ChevronRight/><div><span>03</span><strong>TTD TS</strong><small>Sesuai mapping kota</small></div><ChevronRight/><div><span>04</span><strong>Distribusi</strong><small>Masuk akun Salesman</small></div></section><article className="panel table-panel"><TableToolbar placeholder="Cari nomor atau toko..." action="Tambah toko" onAction={() => onToast("Form tambah toko program dibuka")} /><div className="table-scroll"><table><thead><tr><th>Nomor SKP</th><th>Nama toko</th><th>Kota</th><th>Program</th><th>TS</th><th>Status</th><th /></tr></thead><tbody>{skpRows.map((row) => <tr key={row.id}><td><strong>{row.id}</strong></td><td>{row.store}</td><td>{row.city}</td><td>{row.program}</td><td>{row.ts}</td><td><StatusBadge status={row.status}/></td><td><button className="table-action" onClick={() => onToast(`${row.id} dibuka`)}>Detail</button></td></tr>)}</tbody></table></div></article></>;
}

function ProgramsPage({ onToast }: Pick<PageContentProps, "onToast">) {
  return <><PageHeader eyebrow="PROGRAM" title="Program Tracker" description="Pantau program jalan/tidak jalan, dokumentasi foto, dan status klaim per toko." actions={<button className="button primary" onClick={() => onToast("Form dokumentasi program dibuka")}><Upload size={16}/> Upload dokumentasi</button>} /><section className="mini-stats"><div><strong>126</strong><span>Program aktif</span></div><div><strong>98</strong><span>Berjalan</span></div><div><strong>14</strong><span>Tidak berjalan</span></div><div><strong>62%</strong><span>Klaim selesai</span></div></section><article className="panel table-panel"><TableToolbar placeholder="Cari toko atau kota..."/><div className="table-scroll"><table><thead><tr><th>Toko</th><th>Salesman</th><th>Kota</th><th>Status program</th><th>Status klaim</th><th>Dokumentasi</th><th /></tr></thead><tbody>{programRows.map((row) => <tr key={row.store}><td><strong>{row.store}</strong></td><td>{row.owner}</td><td>{row.city}</td><td><StatusBadge status={row.status}/></td><td>{row.claim}</td><td>{row.photos} foto</td><td><button className="table-action" onClick={() => onToast(`Dokumentasi ${row.store} dibuka`)}>Lihat</button></td></tr>)}</tbody></table></div></article></>;
}

function ExpensesPage({ account, onToast }: Omit<PageContentProps, "active">) {
  const [claims, setClaims] = useState<ExpenseClaim[]>(initialExpenses);
  const canApprove = account.level !== "user" || account.role === "FC";
  const approve = (id: string) => { setClaims((rows) => rows.map((row) => row.id === id ? {...row, status:"Approved"} : row)); onToast("Klaim disetujui dan user menerima notifikasi"); };
  const total = useMemo(() => claims.filter((row) => row.status !== "Rejected").reduce((sum, row) => sum + row.amount, 0), [claims]);
  return <><PageHeader eyebrow="OPERASIONAL" title="Report Expenses" description="Input nota, approval FC, rekap bulanan, PDF personal, dan status pencairan." actions={<button className="button primary" onClick={() => onToast("Form klaim baru dibuka")}><Plus size={16}/> Input nota</button>} /><section className="mini-stats"><div><strong>{currency.format(total)}</strong><span>Total klaim aktif</span></div><div><strong>12</strong><span>Pending approval</span></div><div><strong>41</strong><span>Approved</span></div><div><strong>18</strong><span>Selesai cair</span></div></section><article className="panel table-panel"><TableToolbar placeholder="Cari klaim atau manpower..."/><div className="table-scroll"><table><thead><tr><th>ID</th><th>Manpower</th><th>Jenis</th><th>Tanggal</th><th>Nominal</th><th>Status</th><th /></tr></thead><tbody>{claims.map((row) => <tr key={row.id}><td><strong>{row.id}</strong></td><td>{row.employee}</td><td>{row.type}</td><td>{row.date}</td><td><strong>{currency.format(row.amount)}</strong></td><td><StatusBadge status={row.status}/></td><td>{canApprove && row.status === "Pending" ? <button className="table-action" onClick={() => approve(row.id)}>Approve</button> : <button className="icon-button"><MoreHorizontal size={17}/></button>}</td></tr>)}</tbody></table></div></article></>;
}

function UsersPage({ account, onToast }: Omit<PageContentProps, "active">) {
  return <><PageHeader eyebrow="ADMINISTRASI" title="Akun & Role" description={account.level === "master" ? "Kelola seluruh akun, level akses, divisi, area, dan status pengguna." : `Kelola akun hanya dalam scope ${account.division} • ${account.area}.`} actions={<button className="button primary" onClick={() => onToast("Form akun baru dibuka")}><Plus size={16}/> Tambah akun</button>} /><article className="hierarchy-panel"><div className="hierarchy-node master"><span>M</span><div><strong>Master</strong><small>Seluruh sistem</small></div></div><i/><div className="hierarchy-row"><div className="hierarchy-node admin"><span>A</span><div><strong>Admin divisi</strong><small>Data dalam scope</small></div></div><i/><div className="hierarchy-node user"><span>U</span><div><strong>User role</strong><small>Fungsi operasional</small></div></div></div></article><article className="panel table-panel"><TableToolbar placeholder="Cari nama, kode, atau role..."/><div className="table-scroll"><table><thead><tr><th>Kode</th><th>Nama</th><th>Level</th><th>Role</th><th>Area</th><th>Status</th><th /></tr></thead><tbody>{manpowerRows.map((row, index) => <tr key={row.code}><td><strong>{row.code}</strong></td><td>{row.name}</td><td>{index === 0 ? "Admin" : "User"}</td><td>{row.role}</td><td>{row.area}</td><td><StatusBadge status={row.status}/></td><td><button className="table-action" onClick={() => onToast(`Pengaturan ${row.name} dibuka`)}>Kelola</button></td></tr>)}</tbody></table></div></article></>;
}

const genericConfig: Partial<Record<ModuleKey, { eyebrow: string; title: string; description: string; cards: Array<{ title: string; text: string; icon: ReactNode }> }>> = {
  sellout: { eyebrow: "PROGRAM", title: "Compile Data Sell Out", description: "Kompilasi dan validasi data sell out dari seluruh area.", cards: [{title:"Upload data",text:"Import file sell out berdasarkan periode.",icon:<Upload/>},{title:"Validasi",text:"Temukan duplikat dan data yang tidak lengkap.",icon:<ShieldCheck/>},{title:"Kompilasi",text:"Gabungkan data seluruh area secara otomatis.",icon:<FileSpreadsheet/>}] },
  violations: { eyebrow: "COMPLIANCE", title: "Catat Pelanggaran", description: "Rekap pelanggaran attendance, program, dan aturan kerja per manpower.", cards: [{title:"Pelanggaran absensi",text:"Keterlambatan dan ketidakhadiran.",icon:<Clock3/>},{title:"Pelanggaran program",text:"Dokumentasi atau program tidak sesuai.",icon:<PackageCheck/>},{title:"Rekap personal",text:"Riwayat dapat dilihat manpower terkait.",icon:<UsersRound/>}] },
  reports: { eyebrow: "REPORTING", title: "Reports", description: "Rekap personal, bulanan, dokumen cuti, SKD, expenses, dan program.", cards: [{title:"Attendance report",text:"Excel/PDF bulanan sesuai format.",icon:<CalendarDays/>},{title:"Personal report",text:"Absensi, cuti, SKD, program, dan klaim.",icon:<FileText/>},{title:"Document export",text:"PDF per orang dan ZIP dokumen.",icon:<ArrowDownToLine/>}] },
  "master-data": { eyebrow: "ADMINISTRASI", title: "Master Data", description: "Kelola manpower, area, posisi, SKU, mapping TS, dan hari libur.", cards: [{title:"Data manpower",text:"Role, kode, nama, area, dan kontak.",icon:<UsersRound/>},{title:"Data SKU",text:"Barcode dan nama produk untuk SKP.",icon:<PackageCheck/>},{title:"Holiday setting",text:"Libur nasional dan libur area.",icon:<CalendarDays/>}] },
  settings: { eyebrow: "SYSTEM", title: "Pengaturan", description: "Konfigurasi permission, notifikasi, workflow, dan audit sistem.", cards: [{title:"Permission matrix",text:"Atur akses Master, Admin, dan User.",icon:<ShieldCheck/>},{title:"Notification rules",text:"Atur notifikasi approval dan reminder.",icon:<Sparkles/>},{title:"Audit trail",text:"Pantau perubahan data sensitif.",icon:<FileCheck2/>}] },
};

function GenericPage({ active, onToast }: Pick<PageContentProps, "active" | "onToast">) {
  const config = genericConfig[active]!;
  return <><PageHeader eyebrow={config.eyebrow} title={config.title} description={config.description} actions={<button className="button primary" onClick={() => onToast(`Aksi ${config.title} dibuka`)}><Plus size={16}/> Aksi baru</button>} /><div className="feature-grid">{config.cards.map((card) => <article className="feature-card" key={card.title}><span>{card.icon}</span><div><strong>{card.title}</strong><p>{card.text}</p></div><button><ChevronRight size={18}/></button></article>)}</div><article className="panel empty-state"><span><FileSpreadsheet size={28}/></span><h2>Workspace {config.title}</h2><p>Struktur modul sudah siap dan akan menggunakan data Supabase sesuai scope akun yang aktif.</p><button className="button secondary" onClick={() => onToast("Integrasi Supabase siap dikonfigurasi")}>Lihat konfigurasi</button></article></>;
}

export function PageContent({ active, account, onToast }: PageContentProps) {
  if (active === "dashboard") return <Dashboard account={account} />;
  if (active === "attendance") return <AttendancePage account={account} onToast={onToast} />;
  if (active === "leave") return <LeavePage account={account} onToast={onToast} />;
  if (active === "skp") return <SkpPage onToast={onToast} />;
  if (active === "programs") return <ProgramsPage onToast={onToast} />;
  if (active === "expenses") return <ExpensesPage account={account} onToast={onToast} />;
  if (active === "users") return <UsersPage account={account} onToast={onToast} />;
  return <GenericPage active={active} onToast={onToast} />;
}
