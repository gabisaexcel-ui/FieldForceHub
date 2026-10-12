import { Bell, ChevronDown, LogOut, Menu, RotateCcw, Search, UserPen, Wifi } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { demoAccounts } from "../data/mockData";
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
          <div className={`badge-level-chip ${account.level}`} style={{ padding: "5px 10px", fontSize: "11px", fontWeight: 700 }}>
            {account.role} • {account.level.toUpperCase()}
          </div>

          {/* Rounded Notification Button with Badge */}
          <button
            className="notification-pill-btn"
            aria-label="Notifikasi"
            onClick={() =>
              handleToast("Notifikasi terbaru: Ada 5 approval cuti dan 3 SKP menunggu tanda tangan.")
            }
          >
            <Bell size={18} />
            <span className="notification-badge-dot" />
          </button>

          {/* User Avatar Circle with Account Switcher Dropdown */}
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
              <div className="profile-dropdown-menu">
                {/* Direct action to edit self profile */}
                <div className="dropdown-self-section">
                  <div className="dropdown-current-user">
                    <div className={`avatar-circle level-${account.level}`}>
                      {account.initials}
                    </div>
                    <div>
                      <strong>{account.name}</strong>
                      <small>{account.position || account.role} • {account.gender || "Laki-laki"}</small>
                    </div>
                  </div>
                  <button
                    className="btn-edit-self-profile"
                    onClick={() => {
                      setProfileModalOpen(true);
                      setProfileOpen(false);
                    }}
                  >
                    <UserPen size={14} /> Edit Data Diri Saya
                  </button>
                  <button
                    className="btn-edit-self-profile"
                    style={{
                      marginTop: "6px",
                      background: "#fef2f2",
                      color: "#dc2626",
                      borderColor: "#fecaca",
                    }}
                    onClick={() => {
                      localStorage.clear();
                      if (onToast) onToast("Semua data lokal & cache Chrome berhasil dibersihkan!");
                      setProfileOpen(false);
                      setTimeout(() => window.location.reload(), 400);
                    }}
                    title="Menghapus seluruh cache & riwayat localStorage di browser"
                  >
                    <RotateCcw size={14} /> Hapus & Reset Data Lokal Chrome
                  </button>

                  {onLogout && (
                    <button
                      className="btn-edit-self-profile"
                      style={{
                        marginTop: "6px",
                        background: "#fff1f2",
                        color: "#e11d48",
                        borderColor: "#fecdd3",
                      }}
                      onClick={() => {
                        if (window.confirm("Yakin ingin keluar (logout)?")) {
                          onLogout();
                        }
                      }}
                    >
                      <LogOut size={14} /> Keluar (Logout Akun)
                    </button>
                  )}
                </div>

                <div className="dropdown-header">
                  <strong>Simulasi Role Lain</strong>
                  <small>Ganti sudut pandang untuk mencoba fungsi role</small>
                </div>
                <div className="dropdown-list">
                  {demoAccounts.map((candidate) => (
                    <button
                      key={candidate.id}
                      className={`dropdown-item ${candidate.id === account.id ? "active" : ""}`}
                      onClick={() => {
                        onAccountChange(candidate);
                        setProfileOpen(false);
                      }}
                    >
                      <div className={`avatar-circle mini level-${candidate.level}`}>
                        {candidate.initials}
                      </div>
                      <div className="dropdown-item-info">
                        <strong>{candidate.name}</strong>
                        <small>
                          {candidate.level.toUpperCase()} • {candidate.role} • {candidate.area}
                        </small>
                      </div>
                    </button>
                  ))}
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
