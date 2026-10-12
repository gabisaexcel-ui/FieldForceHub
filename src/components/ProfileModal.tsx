import { MapPin, Phone, Save, User, X, ExternalLink, ShieldCheck } from "lucide-react";
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
  const [name, setName] = useState(account.name);
  const [position, setPosition] = useState(account.position || account.role);
  const [area, setArea] = useState(account.area);
  const [gender, setGender] = useState<"Laki-laki" | "Perempuan">(
    account.gender || "Laki-laki"
  );
  const [phone, setPhone] = useState(account.phone || "");
  const [address, setAddress] = useState(account.address || "");
  const [mapsUrl, setMapsUrl] = useState(account.mapsUrl || "");
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
    }
  }, [account, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await saveProfileData(account, {
        name,
        position,
        area,
        gender,
        phone,
        address,
        mapsUrl,
      });

      onSave(res.updatedAccount);
      onToast("Data diri berhasil diperbarui dan tersimpan!");
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
            <h3>Edit Data Diri Mandiri</h3>
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
              <span>Bergabung:</span>
              <strong>{account.joinDate || "01/07/2024"}</strong>
            </div>
          </div>

          {/* Form fields: Nama, posisi, area, gender, alamat, lokasi/maps */}
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
                placeholder="Contoh: Merchandiser Lapangan"
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
              <Save size={15} /> {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
