import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Shield,
  ShieldAlert,
  User,
  UserCheck,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { hierarchyAccounts, loginWithCredentials } from "../lib/authService";
import type { DemoAccount } from "../types";

interface LoginPageProps {
  onLoginSuccess: (account: DemoAccount, divisionPath: string) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State Login Form
  const [loginUsername, setLoginUsername] = useState("fc_user");
  const [loginPassword, setLoginPassword] = useState("123");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const account = await loginWithCredentials(loginUsername, loginPassword);
      // Redirect sesuai divisi (Master ke /FC atau /master, lainnya ke /:role)
      const targetPath = account.level === "master" ? "/FC" : `/${account.role}`;
      onLoginSuccess(account, targetPath);
    } catch (err: any) {
      setErrorMessage(err?.message || "Gagal masuk. Periksa username dan password Anda.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillQuickAccount = (item: typeof hierarchyAccounts[0]) => {
    setLoginUsername(item.username);
    setLoginPassword(item.pass);
    setErrorMessage(null);
  };

  // Kelompokkan akun untuk tombol instan
  const groupedAccounts = [
    {
      role: "FC",
      title: "Field Coordinator",
      items: hierarchyAccounts.filter((h) => h.role === "FC"),
    },
    {
      role: "MD",
      title: "Merchandiser",
      items: hierarchyAccounts.filter((h) => h.role === "MD"),
    },
    {
      role: "MDPS",
      title: "MD Product Specialist",
      items: hierarchyAccounts.filter((h) => h.role === "MDPS"),
    },
    {
      role: "Salesman",
      title: "Sales Representative",
      items: hierarchyAccounts.filter((h) => h.role === "Salesman"),
    },
    {
      role: "TS",
      title: "Territory Sales",
      items: hierarchyAccounts.filter((h) => h.role === "TS"),
    },
    {
      role: "KAM",
      title: "Key Account Manager",
      items: hierarchyAccounts.filter((h) => h.role === "KAM"),
    },
    {
      role: "ALL",
      title: "Master Administrator",
      items: hierarchyAccounts.filter((h) => h.role === "ALL"),
    },
  ];

  return (
    <div className="login-page-container">
      <div className="login-card-wrapper">
        {/* Header Branding */}
        <div className="login-header-section">
          <div className="login-brand-badge">
            <Zap size={22} className="login-brand-icon" />
            <div className="login-brand-text">
              <h2>CORP NAME</h2>
              <span>FieldForce Hub</span>
            </div>
          </div>
          <h1>Masuk ke Sistem</h1>
          <p className="login-subtitle">
            Gunakan username dan password yang telah didaftarkan oleh Admin Divisi atau Master.
          </p>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="auth-error-banner">
            <strong>Perhatian:</strong> {errorMessage}
          </div>
        )}

        {/* Form Login Langsung */}
        <form onSubmit={handleLoginSubmit} className="login-form-main">
          <div className="login-inputs-grid">
            <div className="login-input-group full-width">
              <label>Username Anda:</label>
              <div className="input-with-icon">
                <User size={16} className="text-muted" />
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Contoh: fc_user / md_admin"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="login-input-group full-width">
              <label>Password:</label>
              <div className="input-with-icon">
                <Lock size={16} className="text-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  required
                />
                <button
                  type="button"
                  className="btn-toggle-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-login-submit"
            disabled={loading}
            style={{ marginTop: "18px" }}
          >
            {loading ? (
              "Memverifikasi Akun di Supabase..."
            ) : (
              <>
                <span>Masuk ke Akun Saya</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {/* Quick Accounts Helper Grouped By Role */}
          <div className="quick-accounts-card" style={{ marginTop: "24px" }}>
            <div className="quick-accounts-head">
              <KeyRound size={15} className="text-muted" />
              <strong>Pilih Akun Contoh (1 Akun = 1 Role & Status Tetap):</strong>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
              {groupedAccounts.map((group) => (
                <div
                  key={group.role}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    background: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    flexWrap: "wrap",
                    gap: "6px",
                  }}
                >
                  <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#334155" }}>
                    {group.role} <span style={{ fontWeight: 400, color: "#64748b" }}>({group.title})</span>
                  </div>

                  <div style={{ display: "flex", gap: "6px" }}>
                    {group.items.map((item) => {
                      const isSelected = loginUsername.toLowerCase() === item.username.toLowerCase();
                      const isAdmin = item.level === "admin" || item.level === "master";

                      return (
                        <button
                          type="button"
                          key={item.username}
                          className="quick-chip-btn"
                          style={
                            isSelected
                              ? { borderColor: "#2563eb", background: "#eff6ff" }
                              : {}
                          }
                          onClick={() => handleFillQuickAccount(item)}
                          title={`${item.name} (${item.position})`}
                        >
                          {isAdmin ? <Shield size={12} className="text-primary" /> : <UserCheck size={12} className="text-muted" />}
                          <strong>{item.username}</strong>
                          <span style={{ fontSize: "10px", textTransform: "uppercase", color: isAdmin ? "#2563eb" : "#64748b" }}>
                            {item.level}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <small
              className="muted-text"
              style={{ display: "block", marginTop: "12px", fontSize: "11px", textAlign: "center" }}
            >
              *Setiap akun di atas memiliki password default: <code>123</code>. Tidak ada registrasi publik; akun baru dibuat sesuai hierarki di panel internal.
            </small>
          </div>
        </form>
      </div>
    </div>
  );
}
