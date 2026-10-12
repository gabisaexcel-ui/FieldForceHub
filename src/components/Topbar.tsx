import { Bell, ChevronDown, Menu, Search, Wifi } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { demoAccounts } from "../data/mockData";
import type { DemoAccount } from "../types";

interface TopbarProps {
  account: DemoAccount;
  realtimeConnected: boolean;
  onAccountChange: (account: DemoAccount) => void;
  onOpenMenu: () => void;
}

export function Topbar({ account, realtimeConnected, onAccountChange, onOpenMenu }: TopbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={onOpenMenu} aria-label="Buka navigasi"><Menu size={21} /></button>
      <label className="search-box">
        <Search size={18} />
        <input aria-label="Cari di FieldForce Hub" placeholder="Cari manpower, dokumen, atau program..." />
        <kbd>⌘ K</kbd>
      </label>
      <div className="topbar-actions">
        <div className={`realtime-pill ${realtimeConnected ? "connected" : ""}`}>
          <Wifi size={14} /> <span>Realtime</span>
        </div>
        <button className="icon-button notification-button" aria-label="Notifikasi">
          <Bell size={19} /><span className="notification-dot" />
        </button>
        <div className="profile-switcher" ref={profileRef}>
          <button className="profile-button" onClick={() => setProfileOpen((value) => !value)}>
            <span className={`avatar level-${account.level}`}>{account.initials}</span>
            <span className="profile-copy"><strong>{account.name}</strong><small>{account.level} • {account.role}</small></span>
            <ChevronDown size={16} />
          </button>
          {profileOpen && (
            <div className="profile-menu">
              <div className="profile-menu-head"><strong>Demo akses akun</strong><small>Ganti untuk melihat UI tiap role</small></div>
              {demoAccounts.map((candidate) => (
                <button
                  className={candidate.id === account.id ? "selected" : ""}
                  key={candidate.id}
                  onClick={() => { onAccountChange(candidate); setProfileOpen(false); }}
                >
                  <span className={`avatar mini level-${candidate.level}`}>{candidate.initials}</span>
                  <span><strong>{candidate.name}</strong><small>{candidate.level} • {candidate.role} • {candidate.area}</small></span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
