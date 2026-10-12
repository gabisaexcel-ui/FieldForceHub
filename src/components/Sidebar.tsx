import {
  BarChart3,
  CalendarCheck2,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  FileBarChart,
  FileSignature,
  FolderTree,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PackageSearch,
  Settings,
  ShieldAlert,
  UsersRound,
  X,
  Zap,
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
  onLogout?: () => void;
}

export function Sidebar({ account, active, open, onClose, onNavigate, onLogout }: SidebarProps) {
  const allowed = visibleModules(account);

  return (
    <>
      {open && <button className="sidebar-scrim" aria-label="Tutup navigasi" onClick={onClose} />}
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        {/* Organic wave cutout decorative SVG that creates the flowing curved silhouette on right edge */}
        <div className="sidebar-wave-decor" aria-hidden="true">
          <svg viewBox="0 0 40 900" preserveAspectRatio="none">
            <path
              d="M0,0 C20,120 40,240 28,340 C16,440 38,580 20,700 C8,790 35,850 40,900 L0,900 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Brand Header with Lightning Bolt Icon */}
        <div className="brand-row">
          <div className="brand-mark-circle">
            <Zap size={19} className="brand-zap-icon" />
          </div>
          <div className="brand-text">
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <strong>CORP NAME</strong>
              <span className={`badge-level-chip ${account.level}`} style={{ fontSize: "9px", padding: "1px 5px" }}>
                {account.role} • {account.level.toUpperCase()}
              </span>
            </div>
            <small>FieldForce Hub</small>
          </div>
          <button className="sidebar-close" onClick={onClose} aria-label="Tutup menu">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tree */}
        <nav className="navigation" aria-label="Navigasi sistem">
          {/* Quick Home item */}
          <div className="nav-group">
            <button
              className={`nav-link ${active === "dashboard" ? "active" : ""}`}
              onClick={() => {
                onNavigate("dashboard");
                onClose();
              }}
            >
              <Home size={18} strokeWidth={1.9} />
              <span>Home</span>
            </button>
          </div>

          {navigation.map((group) => {
            const items = group.items.filter((item) => allowed.includes(item.key));
            if (!items.length) return null;
            return (
              <div className="nav-group" key={group.label}>
                <p className="nav-group-label">{group.label}</p>
                <div className="nav-items">
                  {items.map((item) => {
                    const Icon = icons[item.key] || FolderTree;
                    const isActive = active === item.key;
                    const subItems = item.subItems || ["Overview", "Aktivitas", "Laporan"];

                    return (
                      <div className={`nav-item-wrap ${isActive ? "active" : ""}`} key={item.key}>
                        <button
                          className={`nav-link ${isActive ? "active" : ""}`}
                          onClick={() => {
                            onNavigate(item.key);
                            onClose();
                          }}
                        >
                          <Icon size={18} strokeWidth={1.9} />
                          <span>{item.label}</span>
                        </button>

                        {/* Tree branches submenu with clean connecting lines */}
                        {isActive && (
                          <div className="nav-tree" aria-label={`Submenu ${item.label}`}>
                            {subItems.map((sub, index) => (
                              <div
                                key={sub}
                                className={`tree-item ${index === 0 ? "active" : ""}`}
                                onClick={() => {
                                  onNavigate(item.key);
                                  onClose();
                                }}
                              >
                                <span className="tree-branch" />
                                <span className="tree-label">{sub}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Additional bottom navigation items matching mockup */}
          <div className="nav-group secondary-group">
            <p className="nav-group-label">Help & Support</p>
            <button className="nav-link" onClick={() => onNavigate("settings")}>
              <Settings size={18} strokeWidth={1.8} />
              <span>Settings</span>
            </button>
            <button
              className="nav-link"
              onClick={() => alert("Fitur Pesan & Notifikasi Terhubung dengan Supabase Realtime")}
            >
              <MessageSquare size={18} strokeWidth={1.8} />
              <span>Messages</span>
            </button>
            <button
              className="nav-link"
              onClick={() =>
                alert("FieldForce Hub Guide: Hubungi Field Coordinator atau Admin Divisi jika butuh bantuan.")
              }
            >
              <HelpCircle size={18} strokeWidth={1.8} />
              <span>Help</span>
            </button>
            {onLogout && (
              <button
                className="nav-link"
                style={{ color: "#ef4444", marginTop: "4px" }}
                onClick={() => {
                  if (window.confirm("Yakin ingin keluar (logout)?")) {
                    onLogout();
                    onClose();
                  }
                }}
              >
                <LogOut size={18} strokeWidth={1.8} />
                <span>Keluar (Logout)</span>
              </button>
            )}
          </div>
        </nav>

        {/* Sidebar Footer matching mockup copyright */}
        <div className="sidebar-footer">
          <small className="copyright-tag">Copyright by Daysheet</small>
        </div>
      </aside>
    </>
  );
}
