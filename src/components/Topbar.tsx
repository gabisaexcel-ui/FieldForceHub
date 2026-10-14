import { Bell, ChevronDown, LogOut, Menu, Search, UserPen, Wifi } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DemoAccount } from "../types";
import { ProfileModal } from "./ProfileModal";

interface TopbarProps {
  account: DemoAccount;
  realtimeConnected: boolean;
  onAccountChange: (account: DemoAccount) => void;
  onOpenMenu: () => void;
  onToast?: (message: string) => void;
  onLogout?: () => void;
}

export function Topbar({
  account,
  realtimeConnected,
  onAccountChange,
  onOpenMenu,
  onToast,
  onLogout,
}: TopbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleToast = (msg: string) => {
    if (onToast) onToast(msg);
  };

  return (
    <>
      <header className="topbar">
        <button className="mobile-menu" onClick={onOpenMenu} aria-label="Buka navigasi">
          <Menu size={20} />
        </button>

        {/* Brand & Page Context Header for Mobile Devices */}
        <div className="mobile-topbar-title">
          <div className="mobile-brand-heading">
            <span className="mobile-brand-dot" />
            <strong>CORP NAME</strong>
          </div>
          <small>{account.role} • {account.area || account.division}</small>
        </div>

        {/* Modern pill search bar matching mockup */}
        <div className="search-pill-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            aria-label="Search dashboard"
            placeholder="Search..."
            className="search-input"
          />
        </div>

        <div className="topbar-actions">
          {/* Realtime Live Indicator */}
          <div
            className={`realtime-pill ${realtimeConnected ? "connected" : ""}`}
            title="Koneksi Supabase Realtime"
          >
            <Wifi size={13} />
            <span>Live Sync</span>
          </div>

          {/* Division and Access Level Chip */}
          <div
            className={`badge-level-chip ${account.level}`}
            style={{ padding: "5px 10px", fontSize: "11px", fontWeight: 700 }}
          >
            {account.role} • {account.level.toUpperCase()}
          </div>

          {/* Rounded Notification Button with Badge */}
          <button
            className="notification-pill-btn"
            aria-label="Notifikasi"
            onClick={() =>
              handleToast("Notifikasi terbaru: Anda telah login sebagai " + account.name)
            }
          >
            <Bell size={18} />
            <span className="notification-badge-dot" />
          </button>

          {/* User Avatar Circle with Account Profile Dropdown (HANYA AKUN PENGGUNA SENDIRI) */}
          <div className="profile-switcher" ref={profileRef}>
            <button
              className="profile-pill-btn"
              onClick={() => setProfileOpen((value) => !value)}
              aria-expanded={profileOpen}
              aria-label="Menu akun"
            >
              <div className={`avatar-circle level-${account.level}`}>
                {account.initials}
              </div>
              <div className="profile-info-text">
                <strong>{account.name}</strong>
                <small>{account.role} • {account.area}</small>
              </div>
              <ChevronDown size={14} className="profile-chevron" />
            </button>

            {profileOpen && (
              <div className="profile-dropdown-menu" style={{ width: "260px" }}>
                {/* Informasi Data Diri Akun Pengguna Aktif */}
                <div className="dropdown-self-section">
                  <div className="dropdown-current-user" style={{ marginBottom: "12px" }}>
                    <div className={`avatar-circle level-${account.level}`}>
                      {account.initials}
                    </div>
                    <div>
                      <strong style={{ fontSize: "13.5px", color: "var(--color-navy-dark)" }}>
                        {account.name}
                      </strong>
                      <div style={{ fontSize: "11px", color: "var(--color-muted)", marginTop: "2px" }}>
                        {account.position || `${account.role} Lapangan`}
                      </div>
                      <div style={{ fontSize: "10.5px", color: "var(--color-primary-link)", marginTop: "2px", fontWeight: 600 }}>
                        {account.role} • {account.level.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Tombol Edit Data Diri Mandiri */}
                  <button
                    className="btn-edit-self-profile"
                    onClick={() => {
                      setProfileModalOpen(true);
                      setProfileOpen(false);
                    }}
                  >
                    <UserPen size={14} /> Edit Data Diri Saya
                  </button>

                  {/* Tombol Keluar / Logout */}
                  {onLogout && (
                    <button
                      className="btn-edit-self-profile"
                      style={{
                        marginTop: "8px",
                        background: "#fff1f2",
                        color: "#e11d48",
                        borderColor: "#fecdd3",
                      }}
                      onClick={() => {
                        if (window.confirm("Yakin ingin keluar dari akun Anda?")) {
                          onLogout();
                        }
                      }}
                    >
                      <LogOut size={14} /> Keluar (Logout Akun)
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Profile Edit Modal */}
      <ProfileModal
        account={account}
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onSave={onAccountChange}
        onToast={handleToast}
      />
    </>
  );
}
