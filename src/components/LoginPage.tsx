import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  MapPin,
  Phone,
  Shield,
  ShieldAlert,
  User,
  UserCheck,
  UserPlus,
  Zap,
} from "lucide-react";
import { useState } from "react";
import {
  divisionMeta,
  loginWithCredentials,
  operationalDivisions,
  quickAccounts,
  registerNewAccount,
} from "../lib/authService";
import type { AccountLevel, DemoAccount, OperationalRole } from "../types";

interface LoginPageProps {
  onLoginSuccess: (account: DemoAccount, divisionPath: string) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State Login Form
  const [loginUsername, setLoginUsername] = useState("fc_user");
  const [loginPassword, setLoginPassword] = useState("123");

  // State Register Form
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regDivision, setRegDivision] = useState<OperationalRole>("FC");
  const [regLevel, setRegLevel] = useState<AccountLevel>("user");
  const [regArea, setRegArea] = useState("Surabaya");
  const [regPhone, setRegPhone] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const account = await loginWithCredentials(loginUsername, loginPassword);
      onLoginSuccess(account, `/${account.role}`);
    } catch (err: any) {
      setErrorMessage(err?.message || "Gagal masuk. Periksa username dan password Anda.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const account = await registerNewAccount({
        username: regUsername,
        password: regPassword,
        fullName: regFullName,
        division: regDivision,
        level: regLevel,
        area: regArea,
        phone: regPhone,
      });

      onLoginSuccess(account, `/${account.role}`);
    } catch (err: any) {
      setErrorMessage(err?.message || "Gagal mendaftar akun baru.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillQuickAccount = (item: typeof quickAccounts[0]) => {
    setLoginUsername(item.username);
    setLoginPassword(item.pass);
    setErrorMessage(null);
  };

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
          <h1>{mode === "login" ? "Masuk dengan Akun Anda" : "Pendaftaran Akun Baru"}</h1>
          <p className="login-subtitle">
            {mode === "login"
              ? "Gunakan username & password pribadi Anda untuk masuk ke sistem divisi."
              : "Buat akun manpower baru yang langsung tersimpan di database Supabase."}
          </p>

          {/* Mode Switcher Tabs */}
          <div className="auth-tab-segmented" style={{ marginTop: "18px" }}>
            <button
              type="button"
              className={`auth-tab-btn ${mode === "login" ? "active" : ""}`}
              onClick={() => {
                setMode("login");
                setErrorMessage(null);
              }}
            >
              <LogIn size={15} /> Masuk (Login)
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${mode === "register" ? "active" : ""}`}
              onClick={() => {
                setMode("register");
                setErrorMessage(null);
              }}
            >
              <UserPlus size={15} /> Buat Akun Baru
            </button>
          </div>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="auth-error-banner">
            <strong>Perhatian:</strong> {errorMessage}
          </div>
        )}

        {mode === "login" ? (
          /* ================= FORM LOGIN ================= */
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
                    placeholder="Contoh: fc_user / budi_md"
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
              style={{ marginTop: "16px" }}
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

            {/* Quick Demo Accounts Helper */}
            <div className="quick-accounts-card" style={{ marginTop: "24px" }}>
              <div className="quick-accounts-head">
                <KeyRound size={14} className="text-muted" />
                <strong>Akun Contoh Cepat (Testing Instan):</strong>
              </div>
              <div className="quick-chips-wrapper">
                {quickAccounts.map((item) => (
                  <button
                    type="button"
                    key={item.username}
                    className="quick-chip-btn"
                    onClick={() => handleFillQuickAccount(item)}
                    title={`Login sebagai ${item.name} (${item.role} ${item.level})`}
                  >
                    <strong>{item.username}</strong>
                    <small>({item.role} {item.level})</small>
                  </button>
                ))}
              </div>
              <small className="muted-text" style={{ display: "block", marginTop: "8px", fontSize: "11px" }}>
                *Password akun contoh di atas adalah: <code>123</code>
              </small>
            </div>
          </form>
        ) : (
          /* ================= FORM REGISTER / BUAT AKUN ================= */
          <form onSubmit={handleRegisterSubmit} className="login-form-main">
            {/* 1. Pilih Divisi Kerja */}
            <div className="login-section-block">
              <label className="login-field-label">
                <Building2 size={16} /> 1. Divisi Kerja Manpower:
              </label>
              <div className="division-grid-selector">
                {operationalDivisions.map((div) => {
                  const item = divisionMeta[div];
                  const isSelected = regDivision === div;
                  return (
                    <button
                      type="button"
                      key={div}
                      className={`division-card-btn ${isSelected ? "selected" : ""}`}
                      onClick={() => setRegDivision(div)}
                      style={
                        isSelected
                          ? { borderColor: item.color, background: `${item.color}10` }
                          : {}
                      }
                    >
                      <div className="division-card-pill" style={{ background: item.color }}>
                        {item.tag}
                      </div>
                      <strong className="division-card-title">{item.name}</strong>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Pilih Level Akses: Admin / User */}
            <div className="login-section-block">
              <label className="login-field-label">
                <Shield size={16} /> 2. Level Akses (Admin / User):
              </label>
              <div className="level-segmented-selector">
                <button
                  type="button"
                  className={`level-option-btn ${regLevel === "user" ? "active user" : ""}`}
                  onClick={() => setRegLevel("user")}
                >
                  <UserCheck size={16} />
                  <div>
                    <strong>User Lapangan</strong>
                    <small>Presensi GPS, Cuti & Tugas Kerja Mandiri</small>
                  </div>
                </button>
                <button
                  type="button"
                  className={`level-option-btn ${regLevel === "admin" ? "active admin" : ""}`}
                  onClick={() => setRegLevel("admin")}
                >
                  <ShieldAlert size={16} />
                  <div>
                    <strong>Admin Divisi</strong>
                    <small>Akses Approval, Data Manpower & Master</small>
                  </div>
                </button>
              </div>
            </div>

            {/* 3. Data Kredensial & Identitas Akun */}
            <div className="login-section-block">
              <label className="login-field-label">
                <User size={16} /> 3. Data Akun & Profil Pribadi:
              </label>
              <div className="login-inputs-grid">
                <div className="login-input-group">
                  <label>Username Baru:</label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Contoh: firda_fc / dedi_md"
                    required
                  />
                </div>

                <div className="login-input-group">
                  <label>Password:</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Buat password baru"
                    required
                  />
                </div>

                <div className="login-input-group">
                  <label>Nama Lengkap:</label>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Nama lengkap manpower"
                    required
                  />
                </div>

                <div className="login-input-group">
                  <label>Kota / Area Penugasan:</label>
                  <input
                    type="text"
                    value={regArea}
                    onChange={(e) => setRegArea(e.target.value)}
                    placeholder="Contoh: Surabaya / Denpasar"
                    required
                  />
                </div>

                <div className="login-input-group full-width">
                  <label>Nomor Telepon / WhatsApp:</label>
                  <div className="input-with-icon">
                    <Phone size={15} className="text-muted" />
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="Contoh: 083854377989"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Box */}
            <div className="login-preview-box">
              <div className="preview-header">
                <CheckCircle2 size={16} className="text-green" />
                <span>Rute Otomatis Akun Baru:</span>
              </div>
              <div className="preview-details">
                <div className="preview-item">
                  <span>Rute URL Divisi:</span>
                  <strong className="text-primary-link">/{regDivision}</strong>
                </div>
                <div className="preview-item">
                  <span>Status Level:</span>
                  <span className={`badge-level-chip ${regLevel}`}>
                    {regLevel.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Register Button */}
            <button
              type="submit"
              className="btn-login-submit"
              disabled={loading}
            >
              {loading ? (
                "Menyimpan Akun ke Supabase..."
              ) : (
                <>
                  <span>Daftar & Masuk ke /{regDivision}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
