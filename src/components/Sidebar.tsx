import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  BarChart3,
  CalendarCheck2,
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
  const navRef = useRef<HTMLElement>(null);
  const [indicatorTop, setIndicatorTop] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Kalkulasi posisi vertikal tombol aktif agar gelombang meluncur mulus
  const updateIndicator = () => {
    if (!navRef.current) return;
    const activeEl = navRef.current.querySelector<HTMLElement>(".nav-link.active");
    if (!activeEl) {
      setIndicatorTop(null);
      return;
    }
    const navRect = navRef.current.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    // Tambahkan navRef.current.scrollTop agar posisi absolut di dalam scroll container selalu pas saat di-scroll
    const relativeTop = activeRect.top - navRect.top + navRef.current.scrollTop;
    const centerY = relativeTop + activeRect.height / 2;
    // Tinggi gelombang 180px (luwes & mengalir), titik tengah lengkungan tepat di 90px
    const targetTop = Math.round(centerY - 90);
    setIndicatorTop((prev) => (prev === targetTop ? prev : targetTop));
    setIsReady(true);
  };

  useLayoutEffect(() => {
    updateIndicator();
    const activeWrap = navRef.current?.querySelector<HTMLElement>(".nav-item-wrap.active");
    if (activeWrap) {
      activeWrap.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    const raf = requestAnimationFrame(updateIndicator);
    const t1 = setTimeout(updateIndicator, 40);
    const t2 = setTimeout(updateIndicator, 140);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active]);

  useEffect(() => {
    if (!navRef.current) return;
    const navEl = navRef.current;
    const onScroll = () => updateIndicator();
    navEl.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateIndicator);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => updateIndicator());
      ro.observe(navEl);
      const groups = navEl.querySelectorAll(".nav-group");
      groups.forEach((g) => ro?.observe(g));
    }

    return () => {
      navEl.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateIndicator);
      ro?.disconnect();
    };
  }, [active]);

  return (
    <>
      {open && <button className="sidebar-scrim" aria-label="Tutup navigasi" onClick={onClose} />}
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
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
        <nav className="navigation" ref={navRef} aria-label="Navigasi sistem">
          {/* Floating Organic Wave Indicator: Meluncur mulus mengikuti menu yang aktif */}
          <div
            className="floating-wave-indicator"
            style={{
              transform: indicatorTop !== null ? `translate3d(0, ${indicatorTop}px, 0)` : "translate3d(0, -999px, 0)",
              opacity: isReady && indicatorTop !== null ? 1 : 0,
            }}
            aria-hidden="true"
          >
            <svg viewBox="0 0 52 180" preserveAspectRatio="none">
              <defs>
                <linearGradient id="waveRimGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
                  <stop offset="35%" stopColor="rgba(255, 255, 255, 0.45)" />
                  <stop offset="50%" stopColor="rgba(56, 189, 248, 0.8)" />
                  <stop offset="65%" stopColor="rgba(255, 255, 255, 0.45)" />
                  <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                </linearGradient>
              </defs>
              {/* Gelombang putih menyatu dengan page background */}
              <path
                d="M 52,0 C 52,42 12,48 12,90 C 12,132 52,138 52,180 L 52,0 Z"
                fill="var(--page-bg)"
              />
              {/* Rim light / kilauan halus di bibir gelombang agar terasa hidup */}
              <path
                d="M 52,0 C 52,42 12,48 12,90 C 12,132 52,138 52,180"
                fill="none"
                stroke="url(#waveRimGlow)"
                strokeWidth="1.8"
              />
            </svg>
          </div>

          {/* Quick Home item */}
          <div className="nav-group">
            <button
              className="nav-link"
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
            <button
              className={`nav-link ${active === "settings" ? "active" : ""}`}
              onClick={() => {
                onNavigate("settings");
                onClose();
              }}
            >
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
