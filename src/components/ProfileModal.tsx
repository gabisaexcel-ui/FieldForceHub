import {
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  MapPin,
  Phone,
  Save,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { saveProfileData } from "../lib/profileService";
import type { DemoAccount } from "../types";

interface ProfileModalProps {
  account: DemoAccount;
  open: boolean;
  onClose: () => void;
  onSave: (updated: DemoAccount) => void;
  onToast: (message: string) => void;
}

export function ProfileModal({
  account,
  open,
  onClose,
  onSave,
  onToast,
}: ProfileModalProps) {
  // State Data Diri
  const [name, setName] = useState(account.name);
  const [position, setPosition] = useState(account.position || account.role);
  const [area, setArea] = useState(account.area);
  const [gender, setGender] = useState<"Laki-laki" | "Perempuan">(
    account.gender || "Laki-laki"
  );
  const [phone, setPhone] = useState(account.phone || "");
  const [address, setAddress] = useState(account.address || "");
  const [mapsUrl, setMapsUrl] = useState(account.mapsUrl || "");

  // State Kredensial Login (Username & Password)
  const [username, setUsername] = useState(account.username || account.code || "");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [saving, setSaving] = useState(false);

  // Sinkronkan data form setiap kali akun berubah atau modal dibuka
  useEffect(() => {
    if (open) {
      setName(account.name || "");
      setPosition(account.position || account.role || "");
      setArea(account.area || "");
      setGender(account.gender || "Laki-laki");
      setPhone(account.phone || "");
      setAddress(account.address || "");
      setMapsUrl(account.mapsUrl || "");
      setUsername(account.username || account.code || "");
      setNewPassword("");
      setShowPassword(false);
    }
  }, [account, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatesPayload: any = {
        name,
        position,
        area,
        gender,
        phone,
        address,
        mapsUrl,
        username,
      };

      if (newPassword.trim()) {
        updatesPayload.password = newPassword.trim();
      }

      const res = await saveProfileData(account, updatesPayload);

      onSave(res.updatedAccount);
      onToast(
        newPassword.trim()
          ? `Profil & password baru berhasil disimpan dengan aman (terenkripsi hash)!`
          : `Profil (@${res.updatedAccount.username || username}) berhasil diperbarui!`
      );
      onClose();
    } catch (err: any) {
      alert("Gagal menyimpan data diri: " + (err?.message || "Terjadi kesalahan"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card profile-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title-with-badge">
            <h3>Edit Data Diri & Kredensial Akun</h3>
            <span className={`role-tag-pill ${account.role.toLowerCase()}`}>
              {account.role} • {account.level.toUpperCase()}
            </span>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="profile-form-body">
          {/* Readonly info tag */}
          <div className="profile-readonly-banner">
            <div>
              <span>User Code:</span>
              <strong>{account.code || account.id}</strong>
            </div>
            <div>
              <span>Divisi:</span>
              <strong>{account.division}</strong>
            </div>
            <div>
              <span>Status Level:</span>
              <strong>{account.level.toUpperCase()}</strong>
            </div>
          </div>

          {/* Bagian Kredensial Login (Username & Password) */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "14px 16px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
                color: "#1e293b",
                fontWeight: 700,
                fontSize: "13px",
              }}
            >
              <KeyRound size={16} className="text-primary-link" />
              <span>Kredensial Login Pribadi Anda</span>
            </div>

            <div className="input-row-dual">
              <div className="input-group">
                <label>Username Anda:</label>
                <div className="input-with-icon">
                  <User size={15} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username login"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Password Baru (Opsional):</label>
                <div className="input-with-icon">
                  <Lock size={15} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Kosongkan jika tidak diubah"
                  />
                  <button
                    type="button"
                    className="btn-toggle-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>
            <small className="muted-text" style={{ fontSize: "11px", display: "block", marginTop: "6px" }}>
              *Password disimpan terenkripsi dengan aman (SHA-256). Kosongkan kolom password bila tidak ingin mengubahnya.
            </small>
          </div>

          {/* Form fields: Nama, posisi, area, gender, nomor telepon, alamat */}
          <div className="input-group">
            <label>Nama Lengkap:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Siti Firdaus"
              required
            />
          </div>

          <div className="input-row-dual">
            <div className="input-group">
              <label>Posisi / Jabatan:</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Contoh: Field Coordinator Lapangan"
                required
              />
            </div>

            <div className="input-group">
              <label>Area Penugasan:</label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Contoh: Surabaya / Denpasar"
                required
              />
            </div>
          </div>

          <div className="input-row-dual">
            <div className="input-group">
              <label>Jenis Kelamin (Gender):</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as "Laki-laki" | "Perempuan")}
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div className="input-group">
              <label>Nomor Telepon / WhatsApp:</label>
              <div className="input-with-icon">
                <Phone size={15} />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 083854377989"
                />
              </div>
            </div>
          </div>

          <div className="input-group">
            <label>Alamat Domisili:</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Contoh: Jl. Manyar Kertoarjo No. 45, Surabaya"
              required
            />
          </div>

          <div className="input-group">
            <div className="label-with-action">
              <label>Lokasi / Tautan Google Maps (Pin Rumah/Base):</label>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-preview-maps"
                >
                  <ExternalLink size={12} /> Buka di Maps
                </a>
              )}
            </div>
            <div className="input-with-icon">
              <MapPin size={15} />
              <input
                type="text"
                value={mapsUrl}
                onChange={(e) => setMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/?q=-7.2798,112.7663"
              />
            </div>
            <small className="muted-text">
              Masukkan link Google Maps atau koordinat GPS untuk verifikasi titik presensi & operasional.
            </small>
          </div>

          <div className="modal-foot">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Batal
            </button>
            <button type="submit" className="btn-primary-action" disabled={saving}>
              <Save size={15} /> {saving ? "Menyimpan ke Supabase..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
