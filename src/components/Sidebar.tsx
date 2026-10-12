import {
  BarChart3,
  CalendarCheck2,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  FileBarChart,
  FileSignature,
  LayoutDashboard,
  PackageSearch,
  Settings,
  ShieldAlert,
  UsersRound,
  X,
} from "lucide-react";
import { navigation } from "../data/navigation";
import { visibleModules } from "../lib/access";
import type { DemoAccount, ModuleKey } from "../types";

const icons: Record<ModuleKey, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  attendance: CalendarCheck2,
  leave: ClipboardCheck,
  skp: FileSignature,
  programs: BarChart3,
  sellout: PackageSearch,
  expenses: CircleDollarSign,
  violations: ShieldAlert,
  reports: FileBarChart,
  users: UsersRound,
  "master-data": PackageSearch,
  settings: Settings,
};

interface SidebarProps {
  account: DemoAccount;
  active: ModuleKey;
  open: boolean;
  onClose: () => void;
  onNavigate: (key: ModuleKey) => void;
}

export function Sidebar({ account, active, open, onClose, onNavigate }: SidebarProps) {
  const allowed = visibleModules(account);

  return (
    <>
      {open && <button className="sidebar-scrim" aria-label="Tutup navigasi" onClick={onClose} />}
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true"><span /><span /></div>
          <div>
            <strong>FieldForce</strong>
            <small>HUB</small>
          </div>
          <button className="sidebar-close" onClick={onClose} aria-label="Tutup menu"><X size={20} /></button>
        </div>

        <div className="workspace-chip">
          <div className="workspace-icon">FF</div>
          <div><small>Workspace</small><strong>East Java Bali Nusra</strong></div>
          <ChevronDown size={15} />
        </div>

        <nav className="navigation" aria-label="Navigasi utama">
          {navigation.map((group) => {
            const items = group.items.filter((item) => allowed.includes(item.key));
            if (!items.length) return null;
            return (
              <div className="nav-group" key={group.label}>
                <p className="nav-group-label">{group.label}</p>
                <div className="nav-items">
                  {items.map((item) => {
                    const Icon = icons[item.key];
                    const isActive = active === item.key;
                    return (
                      <div className={`nav-item-wrap ${isActive ? "active" : ""}`} key={item.key}>
                        <button
                          className={`nav-link ${isActive ? "active" : ""}`}
                          onClick={() => { onNavigate(item.key); onClose(); }}
                        >
                          <Icon size={19} strokeWidth={1.8} />
                          <span>{item.label}</span>
                        </button>
                        {isActive && (
                          <div className="nav-submenu" aria-label={`Submenu ${item.label}`}>
                            <span className="sub-link active">Overview</span>
                            <span className="sub-link">Aktivitas</span>
                            <span className="sub-link">Laporan</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="live-dot"><span /> Sistem aktif</div>
          <small>FieldForce Hub v0.1</small>
        </div>
      </aside>
    </>
  );
}
