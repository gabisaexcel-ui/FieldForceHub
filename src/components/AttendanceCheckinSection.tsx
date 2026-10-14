import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Camera,
  CheckCircle2,
  Clock,
  Edit2,
  ExternalLink,
  Image as ImageIcon,
  MapPin,
  Navigation,
  RefreshCw,
  Save,
  Trash2,
  User,
  Video,
  VideoOff,
  X,
  AlertTriangle,
  Calendar,
  Sparkles,
  Eye,
  ShieldCheck,
  Lock,
  Info,
  Map,
  HelpCircle,
} from "lucide-react";
import type { DemoAccount } from "../types";
import {
  submitAttendance,
  deleteAttendanceRecord,
  updateAttendanceRecord,
  checkUserCheckedInToday,
  fetchAttendanceSettings,
  computeAttendanceStatus,
  DEFAULT_ATTENDANCE_SETTINGS,
  type AttendanceSettings,
  type LiveAttendanceItem,
} from "../lib/attendanceService";
import {
  saveSelfieLocally,
  getSelfieLocally,
  generateSelfieKey,
  compressImageToDataUrl,
} from "../lib/selfieStorageService";

interface AttendanceCheckinSectionProps {
  account: DemoAccount;
  liveList: LiveAttendanceItem[];
  onToast: (msg: string) => void;
  onRefresh: () => Promise<void>;
}

export function AttendanceCheckinSection({
  account,
  liveList,
  onToast,
  onRefresh,
}: AttendanceCheckinSectionProps) {
  // 1. FORM STATE
  const todayStr = new Date().toISOString().split("T")[0];
  const [workDate, setWorkDate] = useState(todayStr);

  // Live real-time clock ticking every second
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimeStr = (d: Date) => {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const formatTimeFull = (d: Date) => {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  };

  // Master Attendance Settings
  const [settings, setSettings] = useState<AttendanceSettings>(DEFAULT_ATTENDANCE_SETTINGS);

  useEffect(() => {
    let isMounted = true;
    void fetchAttendanceSettings(account.division).then((res) => {
      if (isMounted && res) {
        setSettings(res);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [account.division]);

// Koordinat default referensi per wilayah penugasan
const DEFAULT_AREA_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Surabaya: { lat: -7.2575, lng: 112.7521 },
  Malang: { lat: -7.9785, lng: 112.6318 },
  Sidoarjo: { lat: -7.4726, lng: 112.7136 },
  Denpasar: { lat: -8.6705, lng: 115.2126 },
  Banyuwangi: { lat: -8.2192, lng: 114.3692 },
  Probolinggo: { lat: -7.7543, lng: 113.2159 },
  "East Java Bali Nusra": { lat: -7.2812, lng: 112.6934 },
  Nasional: { lat: -7.2575, lng: 112.7521 },
};

  // GPS Coordinates & Status (Presisi Tinggi)
  const initialCoord = DEFAULT_AREA_COORDINATES[account.area || ""] || { lat: -7.2575, lng: 112.7521 };
  const [latitude, setLatitude] = useState<number>(initialCoord.lat);
  const [longitude, setLongitude] = useState<number>(initialCoord.lng);
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
  const [areaCode, setAreaCode] = useState<string>(account.area || "Surabaya");
  const [gpsStatus, setGpsStatus] = useState<string>("Mengunci satelit GPS...");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showMapPreview, setShowMapPreview] = useState(true);
  const [showGpsHelp, setShowGpsHelp] = useState(false);

  // Parser pintar jika user mem-paste format gabungan koordinat "lat, lng" dari Google Maps
  const handleCoordsChange = (valStr: string, isLat: boolean) => {
    if (valStr.includes(",") || (valStr.includes(" ") && valStr.trim().split(/\s+/).length >= 2)) {
      const parts = valStr.split(/[,\s]+/).map(Number);
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const parsedLat = Number(parts[0].toFixed(6));
        const parsedLng = Number(parts[1].toFixed(6));
        setLatitude(parsedLat);
        setLongitude(parsedLng);
        setAccuracyMeters(5);
        setGpsStatus(`Koordinat Google Maps disalin: ${parsedLat}, ${parsedLng}`);
        onToast("Titik koordinat dari Google Maps berhasil diterapkan!");
        void fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${parsedLat}&lon=${parsedLng}&zoom=18&addressdetails=1`,
          { headers: { "Accept-Language": "id" } }
        )
          .then((res) => res.json())
          .then((data) => {
            if (data?.display_name) setDetectedAddress(data.display_name);
          })
          .catch(() => {});
        return;
      }
    }
    const num = Number(valStr);
    if (!isNaN(num)) {
      if (isLat) setLatitude(num);
      else setLongitude(num);
      setGpsStatus("Koordinat disesuaikan manual");
    }
  };

  // Catatan Operasional
  const [notes, setNotes] = useState("");

  // Foto Selfie (Hanya Realtime Kamera)
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  const [selfieKey, setSelfieKey] = useState<string>("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Form submission
  const [submitting, setSubmitting] = useState(false);

  // Preview Modal untuk foto selfie di tabel
  const [previewModalItem, setPreviewModalItem] = useState<{
    item: LiveAttendanceItem;
    photoUrl: string | null;
  } | null>(null);

  // Thumbnail photo cache untuk tabel
  const [tablePhotoMap, setTablePhotoMap] = useState<Record<string, string>>({});

  // Media Stream & Video Element Ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Hitung status otomatis berdasarkan jam realtime & master settings
  const liveCheckInTimeStr = formatTimeStr(currentTime);
  const computedStatus = computeAttendanceStatus(liveCheckInTimeStr, settings);

  // Filter cakupan presensi:
  // - Level user (manpower lapangan): HANYA melihat presensi miliknya sendiri
  // - Level admin/master: default melihat presensi miliknya sendiri, dengan opsi tombol toggle melihat semua manpower
  const [scopeFilter, setScopeFilter] = useState<"MY" | "ALL">("MY");

  const isCurrentUserRecord = useCallback(
    (item: LiveAttendanceItem) => {
      const activeCode = (account.code || account.id || "").toLowerCase().trim();
      const activeName = (account.name || "").toLowerCase().trim();
      const itemCode = (item.userCode || "").toLowerCase().trim();
      const itemName = (item.name || "").toLowerCase().trim();

      if (itemCode && activeCode && itemCode === activeCode) return true;
      if (itemName && activeName && (itemName === activeName || itemName.includes(activeName) || activeName.includes(itemName))) return true;
      if (item.userId && account.id && item.userId === account.id) return true;
      return false;
    },
    [account.code, account.id, account.name]
  );

  const myAttendanceList = useMemo(() => {
    return liveList.filter(isCurrentUserRecord);
  }, [liveList, isCurrentUserRecord]);

  const displayedList = useMemo(() => {
    // Manpower level user HANYA boleh melihat presensi miliknya sendiri
    if (account.level === "user" || scopeFilter === "MY") {
      return myAttendanceList;
    }
    return liveList;
  }, [account.level, scopeFilter, myAttendanceList, liveList]);

  // Muat foto thumbnail untuk tabel dari local storage
  useEffect(() => {
    displayedList.forEach((item) => {
      if (item.selfiePath && !tablePhotoMap[item.selfiePath]) {
        void getSelfieLocally(item.selfiePath).then((url) => {
          if (url) {
            setTablePhotoMap((prev) => ({ ...prev, [item.selfiePath!]: url }));
          }
        });
      }
    });
  }, [displayedList, tablePhotoMap]);

  // 2. KAMERA / WEBCAM REALTIME HANDLERS (DIPERBAIKI)
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Callback ref untuk elemen video agar langsung mengikat stream saat dirender
  const attachVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
      node.play().catch((err) => {
        console.warn("Video play error:", err);
      });
    }
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Browser tidak mendukung akses kamera langsung atau membutuhkan koneksi aman (HTTPS / localhost)."
        );
      }

      // Hentikan stream lama jika sedang berjalan
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      let stream: MediaStream;
      try {
        // Coba kamera depan (user)
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 720 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        // Fallback constraint umum jika kamera depan spesifik tidak merespon
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setSelfieDataUrl(null); // Reset foto lama agar layar langsung aktif menampilkan kamera
      setCameraActive(true);

      // Jika elemen video sudah ada di DOM, segera pasang stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn("Gagal membuka kamera:", err);
      setCameraError(
        err.message ||
          "Izin kamera ditolak atau perangkat kamera sedang digunakan oleh aplikasi lain."
      );
      setCameraActive(false);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const vWidth = video.videoWidth || 640;
    const vHeight = video.videoHeight || 480;
    const side = Math.min(vWidth, vHeight);
    const startX = (vWidth - side) / 2;
    const startY = (vHeight - side) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = side;
    canvas.height = side;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip horizontal agar hasil foto selfie tidak terbalik (mirror natural)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, startX, startY, side, side, 0, 0, side, side);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform untuk teks watermark

    // Watermark identitas operasional pada foto persegi
    const timeNow = new Date().toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "medium",
    });
    const barHeight = Math.max(50, Math.round(side * 0.09));
    ctx.fillStyle = "rgba(10, 25, 47, 0.82)";
    ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

    const titleFontSize = Math.max(13, Math.round(side * 0.026));
    const metaFontSize = Math.max(10, Math.round(side * 0.021));

    ctx.fillStyle = "#38bdf8";
    ctx.font = `bold ${titleFontSize}px sans-serif`;
    ctx.fillText(`FieldForce • ${account.name} (${account.role})`, 14, canvas.height - (barHeight * 0.52));

    ctx.fillStyle = "#ffffff";
    ctx.font = `${metaFontSize}px monospace`;
    ctx.fillText(
      `${timeNow} WIB • GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      14,
      canvas.height - (barHeight * 0.18)
    );

    const rawDataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const optimized = await compressImageToDataUrl(rawDataUrl, 720, 0.82);

    setSelfieDataUrl(optimized);
    stopCamera();
    onToast("Foto selfie realtime berhasil diambil!");
  };

  // Bersihkan stream kamera saat unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // 3. GEOLOCATION HANDLERS (GPS SATELIT PRESISI TINGGI & MULTI-SAMPLING)
  const handleGetLiveGps = useCallback(() => {
    if (!navigator.geolocation) {
      onToast("Geolocation tidak didukung oleh browser Anda.");
      return;
    }

    setGpsLoading(true);
    setGpsStatus("Mengunci satelit GPS presisi tinggi...");

    let bestAcc = Infinity;
    let watchId: number | null = null;
    let fallbackTimer: any = null;

    const stopTracking = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
    };

    const applyPosition = (pos: GeolocationPosition) => {
      const lat = Number(pos.coords.latitude.toFixed(6));
      const lng = Number(pos.coords.longitude.toFixed(6));
      const acc = Math.round(pos.coords.accuracy);

      setLatitude(lat);
      setLongitude(lng);
      setAccuracyMeters(acc);

      let quality = "Sangat Akurat (Satelit)";
      if (acc > 50) quality = "Akurasi Standar";
      else if (acc > 20) quality = "Akurasi Baik";

      setGpsStatus(`GPS Live: ${lat}, ${lng} (±${acc}m • ${quality})`);

      // Reverse geocoding alamat lokasi secara asynchronous
      void fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "id" } }
      )
        .then((res) => res.json())
        .then((data) => {
          if (data?.display_name) {
            setDetectedAddress(data.display_name);
          }
        })
        .catch(() => {});
    };

    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const acc = pos.coords.accuracy;
          if (acc < bestAcc) {
            bestAcc = acc;
            applyPosition(pos);
          }
          // Jika sudah sangat akurat (<= 15 meter), langsung kunci posisi
          if (acc <= 15) {
            stopTracking();
            setGpsLoading(false);
            onToast(`🎯 GPS terkunci presisi tinggi (±${Math.round(acc)}m)!`);
          }
        },
        (err) => {
          console.warn("Watch position error, fallback:", err.message);
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              applyPosition(pos);
              stopTracking();
              setGpsLoading(false);
              onToast(`Titik GPS berhasil terdeteksi (±${Math.round(pos.coords.accuracy)}m)`);
            },
            (err2) => {
              stopTracking();
              setGpsLoading(false);
              setGpsStatus("Gagal mendeteksi GPS langsung. Pastikan izin lokasi browser aktif.");
              onToast("Izin GPS tidak diberikan: " + err2.message);
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
          );
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      // Batas waktu settling 6 detik
      fallbackTimer = setTimeout(() => {
        stopTracking();
        setGpsLoading(false);
        if (bestAcc < Infinity) {
          onToast(`Titik GPS berhasil dikunci (Akurasi ±${Math.round(bestAcc)}m).`);
        } else {
          setGpsStatus("Sinyal GPS lemah, silakan klik 'Deteksi GPS Saya' kembali.");
        }
      }, 6000);
    } catch (e: any) {
      setGpsLoading(false);
      setGpsStatus("Gagal memulai deteksi GPS: " + e.message);
    }
  }, [onToast]);

  // Auto-detect GPS satelit saat halaman dibuka
  useEffect(() => {
    handleGetLiveGps();
  }, [handleGetLiveGps]);

  // 4. SUBMIT / SIMPAN KE SUPABASE & LOCAL STORAGE (BISA BERKALI-KALI)
  const handleSaveAttendance = async () => {
    setSubmitting(true);
    try {
      const userCode = account.code || account.id;
      const now = new Date();
      const exactCheckInTime = formatTimeStr(now);
      const finalStatus = computedStatus.statusKey;

      // 1. Simpan foto selfie ke local storage (IndexedDB) jika ada
      let savedPath = selfieKey;
      if (selfieDataUrl && (!savedPath || savedPath.startsWith("data:"))) {
        savedPath = `${generateSelfieKey(userCode, workDate)}_${Date.now()}`;
        await saveSelfieLocally(savedPath, selfieDataUrl);
        setSelfieKey(savedPath);
      }

      // 2. Simpan record ke database Supabase dengan status otomatis
      const res = await submitAttendance(account, {
        workDate,
        checkInTime: exactCheckInTime,
        checkInTimestamp: now.toISOString(),
        latitude,
        longitude,
        area: areaCode,
        division: account.division || "FC",
        status: finalStatus,
        note: notes.trim() || `Presensi Realtime (${computedStatus.label})`,
        selfiePath: savedPath || undefined,
        userCode,
        userName: account.name,
        userRole: account.role,
      });

      if (!res.success) {
        throw new Error(res.error || "Gagal menyimpan presensi ke Supabase");
      }

      // Refresh data dari database Supabase
      await onRefresh();

      // Reset foto selfie dan catatan agar siap untuk presensi kunjungan berikutnya
      setSelfieDataUrl(null);
      setSelfieKey("");
      setNotes("");

      onToast(
        `✅ Presensi berhasil ditambahkan ke Supabase! (Waktu: ${res.record.checkIn} WIB, Status: ${res.record.status})`
      );
    } catch (err: any) {
      console.error("Save attendance error:", err);
      onToast("Gagal simpan presensi: " + (err?.message || "Kesalahan koneksi"));
    } finally {
      setSubmitting(false);
    }
  };

  // Hapus data presensi dari Supabase (berdasarkan ID spesifik)
  const handleDeleteAttendance = async (id?: string, userCode?: string) => {
    if (!window.confirm("Yakin ingin menghapus data presensi ini dari Supabase?")) return;
    try {
      const targetCode = userCode || account.code || account.id;
      const res = await deleteAttendanceRecord(id, targetCode, workDate);
      if (res.success) {
        onToast("Data presensi berhasil dihapus dari Supabase!");
        await onRefresh();
      } else {
        onToast(res.error || "Gagal menghapus presensi");
      }
    } catch (err: any) {
      onToast("Error hapus presensi: " + (err?.message || err));
    }
  };

  // Edit catatan cepat
  const handleQuickEdit = async (item: LiveAttendanceItem) => {
    const newNote = window.prompt(`Ubah catatan presensi untuk ${item.name}:`, item.note);
    if (newNote === null || newNote === item.note) return;
    if (!item.id) {
      onToast("ID presensi tidak valid di Supabase");
      return;
    }
    const res = await updateAttendanceRecord(item.id, { note: newNote });
    if (res.success) {
      onToast("Catatan presensi berhasil diperbarui di Supabase!");
      await onRefresh();
    } else {
      onToast(res.error || "Gagal memperbarui catatan");
    }
  };

  // Buka popup modal foto
  const handleOpenPhotoPreview = async (item: LiveAttendanceItem) => {
    let photoUrl = item.selfiePath ? tablePhotoMap[item.selfiePath] : null;
    if (!photoUrl && item.selfiePath) {
      photoUrl = await getSelfieLocally(item.selfiePath);
    }
    setPreviewModalItem({ item, photoUrl });
  };

  return (
    <div className="attendance-checkin-container">
      {/* CARD 1: FORM INPUT PRESENSI GPS & SELFIE */}
      <article className="panel checkin-card-advanced">
        <div className="checkin-head-row">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h2 className="panel-title">Presensi Harian GPS & Foto Selfie</h2>
              <span className="badge-pill-live">
                <span className="live-pulse-dot" /> SUPABASE LIVE
              </span>
            </div>
            <p className="panel-subtext">
              Presensi kehadiran realtime manpower lapangan dengan verifikasi kamera langsung, GPS satelit, dan penentuan status otomatis master.
            </p>
          </div>
        </div>

        {/* GRID DUA KOLOM: KIRI FORM INPUT, KANAN KAMERA & FOTO */}
        <div className="checkin-two-col-grid">
          {/* KOLOM KIRI: INPUT METADATA, WAKTU OTOMATIS, GPS, STATUS OTOMATIS */}
          <div className="checkin-form-fields-col">
            {/* 1. INFORMASI MANPOWER */}
            <div className="checkin-user-identity-mini">
              <div className="mini-user-avatar">{account.initials}</div>
              <div className="mini-user-details">
                <strong>{account.name}</strong>
                <span>
                  {account.role} • {account.division} • Kode: {account.code || account.id} • Area: {account.area}
                </span>
              </div>
            </div>

            {/* 2. TANGGAL & WAKTU (OTOMATIS & TERKUNCI) */}
            <div className="input-row-dual">
              <div className="input-group">
                <label>
                  <Calendar size={13} /> Tanggal Kerja (Work Date):
                </label>
                <input
                  type="date"
                  value={workDate}
                  onChange={(e) => setWorkDate(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* JAM CHECK-IN OTOMATIS TERKUNCI */}
              <div className="input-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label>
                    <Clock size={13} /> Jam Check-In (Otomatis):
                  </label>
                  <span className="badge-lock-indicator">
                    <Lock size={10} /> Terkunci
                  </span>
                </div>
                <div className="locked-time-display-box" title="Jam check-in dikunci realtime otomatis sesuai waktu server/perangkat">
                  <div className="locked-time-left">
                    <Clock size={15} className="text-blue" />
                    <strong className="locked-time-text">
                      {formatTimeFull(currentTime)} WIB
                    </strong>
                  </div>
                  <span className="locked-time-pill">
                    Live Realtime
                  </span>
                </div>
              </div>
            </div>

            {/* 3. KOORDINAT GPS (PRESISI TINGGI & SATELIT REALTIME) */}
            <div className="checkin-gps-card-box">
              <div className="gps-header-row">
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <MapPin size={15} className="text-blue" />
                  <strong>Koordinat Titik Lokasi GPS</strong>
                  {accuracyMeters !== null && (
                    <span
                      className={
                        accuracyMeters <= 20
                          ? "badge-accuracy-high"
                          : accuracyMeters <= 50
                          ? "badge-accuracy-medium"
                          : "badge-accuracy-low"
                      }
                      title={`Toleransi radius akurasi: ±${accuracyMeters} meter`}
                    >
                      ±{accuracyMeters}m {accuracyMeters <= 20 ? "Satelit Akurat" : "Toleransi"}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn-gps-detect"
                  disabled={gpsLoading}
                  onClick={handleGetLiveGps}
                  title="Deteksi ulang lokasi koordinat presisi via GPS satelit perangkat"
                >
                  <Navigation size={13} className={gpsLoading ? "spin-icon" : ""} />
                  {gpsLoading ? "Mengunci Satelit..." : "Deteksi GPS Saya"}
                </button>
              </div>

              {/* Status info GPS */}
              <div className="gps-status-bar">
                <span className={`gps-dot-indicator ${accuracyMeters && accuracyMeters <= 25 ? "accurate" : ""}`} />
                <small>{gpsStatus}</small>
                <a
                  href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="maps-preview-external"
                  title="Buka titik koordinat langsung di Google Maps"
                >
                  <ExternalLink size={11} /> Buka di Maps
                </a>
              </div>

              {/* Alamat Fisik Terdeteksi Secara Nyata */}
              {detectedAddress && (
                <div className="gps-address-detected-box">
                  <MapPin size={13} className="text-blue" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <small><strong>Lokasi Terdeteksi:</strong> {detectedAddress}</small>
                </div>
              )}

              {/* Pratinjau Peta Interaktif Langsung */}
              {showMapPreview && (
                <div className="gps-map-embed-container">
                  <iframe
                    title="Pratinjau Peta Google Maps"
                    src={`https://maps.google.com/maps?q=${latitude},${longitude}&hl=id&z=16&output=embed`}
                    className="gps-map-iframe"
                    loading="lazy"
                  />
                  <div className="gps-map-overlay-badge">
                    <MapPin size={12} style={{ color: "#ef4444" }} />
                    <span>Titik Pin: {latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
                  </div>
                </div>
              )}

              {/* Tombol Kontrol Peta & Panduan */}
              <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "6px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn-toggle-map"
                  onClick={() => setShowMapPreview(!showMapPreview)}
                  title="Tampilkan atau sembunyikan jendela peta langsung"
                >
                  <Map size={12} /> {showMapPreview ? "Sembunyikan Peta" : "Lihat Peta Langsung"}
                </button>

                <button
                  type="button"
                  className="btn-toggle-map"
                  style={{ color: "#0284c7", background: "#f0f9ff", borderColor: "#bae6fd" }}
                  onClick={() => setShowGpsHelp(!showGpsHelp)}
                  title="Klik untuk melihat cara mendapatkan titik koordinat dari Google Maps"
                >
                  <HelpCircle size={12} /> Cara Cocokkan di Google Maps
                </button>
              </div>

              {/* Panduan Bantuan Cara Cocokkan Titik di Google Maps */}
              {showGpsHelp && (
                <div className="gps-helper-banner">
                  <strong>💡 Cara Mencocokkan Titik Lokasi Anda dengan Google Maps:</strong>
                  <ol style={{ margin: "4px 0 0", paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "3px" }}>
                    <li>
                      Klik tombol <strong>"Buka di Maps"</strong> di atas atau buka Google Maps di browser/ponsel Anda.
                    </li>
                    <li>
                      <strong>Klik kanan</strong> (atau <strong>tekan & tahan</strong> di HP) persis di titik toko/kantor/rumah Anda hingga muncul Pin Merah.
                    </li>
                    <li>
                      Klik angka koordinat di paling atas (misal: <code>-7.765432, 110.378901</code>) untuk menyalin.
                    </li>
                    <li>
                      <strong>Paste langsung</strong> ke kolom Latitude di bawah. Kolom Longitude akan otomatis terisi dan peta di atas langsung bergeser ke titik tersebut!
                    </li>
                  </ol>
                  <small style={{ display: "block", marginTop: "5px", color: "#64748b" }}>
                    <em>Catatan: Di laptop/PC, browser mendeteksi IP Wi-Fi ISP sehingga radius toleransi bisa puluhan km. Di HP/ponsel dengan GPS aktif, satelit langsung mengunci radius 5–15 meter.</em>
                  </small>
                </div>
              )}

              {/* Input Lat & Long dengan Smart Paste */}
              <div className="input-row-dual" style={{ marginTop: "6px" }}>
                <div className="input-group" style={{ marginBottom: "0" }}>
                  <label style={{ fontSize: "10px" }}>Latitude (Lintang) / Paste "Lat, Lng":</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={latitude}
                    onChange={(e) => handleCoordsChange(e.target.value, true)}
                    placeholder="Contoh: -7.7575 atau paste format gabungan"
                    className="input-field-compact"
                  />
                </div>
                <div className="input-group" style={{ marginBottom: "0" }}>
                  <label style={{ fontSize: "10px" }}>Longitude (Bujur):</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={longitude}
                    onChange={(e) => handleCoordsChange(e.target.value, false)}
                    placeholder="Contoh: 110.3998"
                    className="input-field-compact"
                  />
                </div>
              </div>
            </div>

            {/* 4. STATUS KEHADIRAN (OTOMATIS SISTEM DARI MASTER RULES - TANPA PILIHAN MANUAL) */}
            <div className="input-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ margin: 0 }}>Status Kehadiran Manpower (Otomatis):</label>
                <span className="badge-rule-pill">
                  <Sparkles size={11} /> Aturan Master Level
                </span>
              </div>

              {/* CARD STATUS OTOMATIS */}
              <div className={`auto-status-card-box ${computedStatus.statusKey}`}>
                <div className="auto-status-top-row">
                  <div className="auto-status-badge-visual">
                    <span className="auto-status-glow-dot" />
                    <strong>{computedStatus.label}</strong>
                  </div>
                  <span className="auto-status-time-diff">
                    {computedStatus.diffMinutes <= 0
                      ? `Tepat Waktu (<= ${settings.workStartTime.slice(0, 5)})`
                      : `+${computedStatus.diffMinutes} menit dari jam ${settings.workStartTime.slice(0, 5)} WIB`}
                  </span>
                </div>

                <p className="auto-status-explanation">
                  {computedStatus.description}
                </p>

                <div className="auto-status-footer-rule">
                  <Info size={12} className="text-muted" />
                  <small>
                    <strong>Master Rule:</strong> Jam Masuk {settings.workStartTime.slice(0, 5)} WIB • Toleransi Safe &le; {settings.safeGraceMinutes} mnt • Alert &gt; {settings.alertThresholdMinutes} mnt • Warning &gt; {settings.warningThresholdMinutes} mnt (setengah jam).
                  </small>
                </div>
              </div>
            </div>

            {/* 5. CATATAN / KETERANGAN */}
            <div className="input-group">
              <label>Catatan / Keterangan Kunjungan / Alasan:</label>
              <textarea
                rows={2}
                placeholder="Contoh: Kunjungan toko pertama, display rak promo aman."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* KOLOM KANAN: KAMERA REALTIME (TANPA UPLOAD FILE) */}
          <div className="checkin-camera-col">
            <div className="camera-widget-card">
              <div className="camera-widget-header">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Camera size={16} className="text-blue" />
                  <strong>Foto Selfie Manpower</strong>
                </div>
                <span className="badge-r2-pill" title="Disimpan secara realtime di IndexedDB browser lokal & Cloudflare R2 Ready">
                  <ShieldCheck size={12} /> Realtime Camera Only
                </span>
              </div>

              {/* VIEWPORT KAMERA / PREVIEW FOTO */}
              <div className="camera-viewport-frame">
                {cameraActive ? (
                  <div className="video-stream-box">
                    <video
                      ref={attachVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="live-camera-video"
                    />
                    <div className="face-guide-oval">
                      <span>Posisikan Wajah</span>
                    </div>
                  </div>
                ) : selfieDataUrl ? (
                  <div className="selfie-preview-box">
                    <img src={selfieDataUrl} alt="Foto Selfie Presensi" className="selfie-preview-img" />
                    <div className="selfie-meta-overlay">
                      <span>{account.name}</span>
                      <small>
                        {formatTimeStr(currentTime)} WIB • GPS Terverifikasi
                      </small>
                    </div>
                  </div>
                ) : (
                  <div className="camera-empty-placeholder">
                    <div className="camera-icon-circle">
                      <Camera size={32} />
                    </div>
                    <strong>Kamera Realtime Lapangan</strong>
                    <p>Klik tombol di bawah untuk membuka kamera dan mengambil foto selfie verifikasi secara langsung.</p>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="camera-error-banner">
                  <AlertTriangle size={14} />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* KONTROL KAMERA (TANPA UPLOAD FILE) */}
              <div className="camera-actions-row">
                {cameraActive ? (
                  <>
                    <button type="button" className="btn-camera-capture" onClick={capturePhoto}>
                      <Camera size={16} /> Ambil Foto (Capture)
                    </button>
                    <button type="button" className="btn-camera-stop" onClick={stopCamera}>
                      <VideoOff size={15} /> Batal
                    </button>
                  </>
                ) : selfieDataUrl ? (
                  <button
                    type="button"
                    className="btn-camera-start"
                    onClick={startCamera}
                    title="Buka kembali kamera untuk mengambil ulang foto"
                  >
                    <RefreshCw size={15} /> Ambil Ulang (Kamera)
                  </button>
                ) : (
                  <button type="button" className="btn-camera-start" onClick={startCamera}>
                    <Video size={15} /> Buka Kamera
                  </button>
                )}
              </div>

              {/* INFO PENYIMPANAN FOTO */}
              <div className="r2-storage-info-box">
                <small>
                  <strong>Realtime Camera Security:</strong> Foto diambil secara langsung di lokasi saat check-in tanpa unggahan file eksternal untuk menjamin integritas data lapangan.
                </small>
              </div>
            </div>

            {/* TOMBOL SIMPAN KE SUPABASE */}
            <div className="submit-section-box">
              <button
                type="button"
                className="btn-save-attendance-full"
                disabled={submitting}
                onClick={handleSaveAttendance}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={18} className="spin-icon" />
                    Menyimpan ke Supabase...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Simpan Presensi ke Supabase
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* CARD 2: TABEL DATA PRESENSI HARI INI DI SUPABASE */}
      <article className="panel attendance-live-table-panel" style={{ marginTop: "24px" }}>
        <div className="panel-top-row">
          <div>
            <h2 className="panel-title">
              {account.level === "user" || scopeFilter === "MY"
                ? `Data Presensi Saya Hari Ini (${workDate})`
                : `Data Presensi Seluruh Manpower (${workDate})`}
            </h2>
            <p className="panel-subtext">
              {account.level === "user" || scopeFilter === "MY"
                ? `Daftar seluruh riwayat check-in kehadiran ${account.name} hari ini yang tersinkronisasi realtime dengan database Supabase.`
                : `Daftar presensi seluruh manpower lapangan tersinkronisasi realtime dengan database Supabase.`}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Opsi Tab Scope untuk Admin & Master */}
            {account.level !== "user" && (
              <div className="role-tabs-segmented" style={{ margin: 0 }}>
                <button
                  type="button"
                  className={scopeFilter === "MY" ? "active" : ""}
                  onClick={() => setScopeFilter("MY")}
                >
                  Presensi Saya ({myAttendanceList.length})
                </button>
                <button
                  type="button"
                  className={scopeFilter === "ALL" ? "active" : ""}
                  onClick={() => setScopeFilter("ALL")}
                >
                  Semua Manpower ({liveList.length})
                </button>
              </div>
            )}

            <span className="count-pill">
              {account.level === "user" || scopeFilter === "MY"
                ? `${displayedList.length} Waktu Check-In Terdata`
                : `${displayedList.length} Manpower Terdata`}
            </span>
            <button
              type="button"
              className="btn-soft-action"
              style={{ fontSize: "11px", padding: "6px 12px", gap: "6px" }}
              onClick={async () => {
                await onRefresh();
                onToast("Data presensi Supabase berhasil di-refresh!");
              }}
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        <div className="table-scroll">
          <table className="attendance-styled-table">
            <thead>
              <tr>
                <th style={{ width: "65px", textAlign: "center" }}>Foto Selfie</th>
                <th>Nama Manpower</th>
                <th>Role & Divisi</th>
                <th>Area</th>
                <th>Jam Check-In</th>
                <th>Titik Lokasi GPS</th>
                <th>Status</th>
                <th>Catatan</th>
                <th style={{ textAlign: "center", width: "120px" }}>Aksi CRUD</th>
              </tr>
            </thead>
            <tbody>
              {displayedList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-table-cell">
                    <div className="empty-attendance-box">
                      <Clock size={28} className="text-muted" />
                      <p>
                        {account.level === "user" || scopeFilter === "MY"
                          ? `Anda (${account.name}) belum memiliki data presensi untuk tanggal ${workDate} di database Supabase.`
                          : `Belum ada data presensi untuk tanggal ${workDate} di database Supabase.`}
                      </p>
                      <small>Gunakan form di atas lalu klik "Simpan Presensi ke Supabase".</small>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedList.map((r, idx) => {
                  const photoUrl = r.selfiePath ? tablePhotoMap[r.selfiePath] : null;

                  return (
                    <tr key={r.id || `${r.name}-${r.checkIn}-${idx}`}>
                      {/* 1. THUMBNAIL FOTO SELFIE */}
                      <td style={{ textAlign: "center" }}>
                        {photoUrl ? (
                          <button
                            type="button"
                            className="thumbnail-photo-btn"
                            title="Klik untuk melihat foto selfie ukuran penuh"
                            onClick={() => handleOpenPhotoPreview(r)}
                          >
                            <img src={photoUrl} alt="Selfie" className="thumbnail-selfie-img" />
                          </button>
                        ) : r.selfiePath ? (
                          <button
                            type="button"
                            className="thumbnail-photo-btn empty"
                            title="Foto di storage lokal: klik untuk cek"
                            onClick={() => handleOpenPhotoPreview(r)}
                          >
                            <ImageIcon size={16} />
                          </button>
                        ) : (
                          <div className="no-photo-badge" title="Tanpa foto selfie">
                            <User size={14} />
                          </div>
                        )}
                      </td>

                      {/* 2. NAMA & USER CODE */}
                      <td>
                        <strong>{r.name}</strong>
                        {r.userCode && <small className="code-sub-badge">{r.userCode}</small>}
                      </td>

                      {/* 3. ROLE & DIVISI */}
                      <td>
                        <span className="role-tag-pill">{r.role}</span>
                        {r.divisionCode && <small style={{ marginLeft: "4px", color: "#64748b" }}>({r.divisionCode})</small>}
                      </td>

                      {/* 4. AREA */}
                      <td>{r.area}</td>

                      {/* 5. JAM CHECK-IN */}
                      <td>
                        <strong>{r.checkIn}</strong>
                        <small style={{ color: "#64748b", display: "block", fontSize: "10px" }}>WIB</small>
                      </td>

                      {/* 6. LOKASI GPS */}
                      <td>
                        {r.latitude != null && r.longitude != null ? (
                          <a
                            href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="gps-table-link"
                          >
                            <MapPin size={12} className="text-blue" />
                            <span>
                              {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                            </span>
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span className="muted-text">—</span>
                        )}
                      </td>

                      {/* 7. STATUS OTOMATIS */}
                      <td>
                        <span className={`status-badge-custom ${r.rawStatus || "great"}`}>
                          {r.status}
                        </span>
                      </td>

                      {/* 8. CATATAN */}
                      <td className="table-notes-cell" title={r.note}>
                        {r.note || "—"}
                      </td>

                      {/* 9. AKSI CRUD */}
                      <td>
                        <div className="table-actions-flex">
                          {photoUrl && (
                            <button
                              type="button"
                              className="btn-table-action"
                              title="Lihat Foto Selfie Penuh"
                              onClick={() => handleOpenPhotoPreview(r)}
                            >
                              <Eye size={12} />
                            </button>
                          )}
                          {(isCurrentUserRecord(r) || account.level === "admin" || account.level === "master") && (
                            <>
                              <button
                                type="button"
                                className="btn-table-action"
                                title="Edit Catatan (UPDATE di Supabase)"
                                onClick={() => handleQuickEdit(r)}
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                type="button"
                                className="btn-table-action danger"
                                title="Hapus Baris (DELETE dari Supabase)"
                                onClick={() => handleDeleteAttendance(r.id, r.userCode)}
                              >
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* TAMPILAN KARTU PRESENSI KHUSUS SMARTPHONE (MOBILE-FRIENDLY CARDS) */}
        <div className="attendance-mobile-cards-list">
          {displayedList.length === 0 ? (
            <div className="empty-attendance-box">
              <Clock size={28} className="text-muted" />
              <p>
                {account.level === "user" || scopeFilter === "MY"
                  ? `Anda (${account.name}) belum memiliki data presensi untuk tanggal ${workDate} di database Supabase.`
                  : `Belum ada data presensi untuk tanggal ${workDate} di database Supabase.`}
              </p>
              <small>Gunakan form di atas lalu klik "Simpan Presensi ke Supabase".</small>
            </div>
          ) : (
            displayedList.map((r, idx) => {
              const photoUrl = r.selfiePath ? tablePhotoMap[r.selfiePath] : null;
              const canManage = isCurrentUserRecord(r) || account.level === "admin" || account.level === "master";

              return (
                <article className="mobile-attendance-card" key={r.id || `${r.name}-${r.checkIn}-${idx}`}>
                  <div className="mobile-card-top-row">
                    <div className="mobile-card-user-info">
                      {photoUrl ? (
                        <button
                          type="button"
                          className="mobile-avatar-thumbnail-btn"
                          onClick={() => handleOpenPhotoPreview(r)}
                          title="Klik untuk melihat foto selfie penuh"
                        >
                          <img src={photoUrl} alt="Selfie" className="mobile-avatar-selfie-img" />
                        </button>
                      ) : (
                        <div className="avatar-circle mini">
                          {r.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="mobile-card-name-block">
                        <strong>{r.name}</strong>
                        <span className="mobile-card-sub-info">
                          {r.role} • {r.area} {r.userCode ? `• ${r.userCode}` : ""}
                        </span>
                      </div>
                    </div>

                    <span className={`status-badge-custom ${r.rawStatus || "great"}`}>
                      {r.status}
                    </span>
                  </div>

                  <div className="mobile-card-details-grid">
                    <div className="mobile-detail-item">
                      <Clock size={12} className="text-muted" />
                      <span>Jam: <strong>{r.checkIn} WIB</strong></span>
                    </div>
                    {r.latitude != null && r.longitude != null && (
                      <a
                        href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mobile-detail-item link"
                      >
                        <MapPin size={12} className="text-blue" />
                        <span>GPS: <strong>{r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}</strong></span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>

                  {r.note && (
                    <div className="mobile-card-note-box">
                      <small><strong>Catatan:</strong> {r.note}</small>
                    </div>
                  )}

                  <div className="mobile-card-actions-row">
                    {photoUrl && (
                      <button
                        type="button"
                        className="btn-mobile-card-action view"
                        onClick={() => handleOpenPhotoPreview(r)}
                      >
                        <Eye size={13} /> Foto Selfie
                      </button>
                    )}
                    {canManage && (
                      <>
                        <button
                          type="button"
                          className="btn-mobile-card-action edit"
                          onClick={() => handleQuickEdit(r)}
                        >
                          <Edit2 size={13} /> Ubah Catatan
                        </button>
                        <button
                          type="button"
                          className="btn-mobile-card-action delete"
                          onClick={() => handleDeleteAttendance(r.id, r.userCode)}
                        >
                          <Trash2 size={13} /> Hapus
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </article>

      {/* MODAL POPUP PREVIEW FOTO SELFIE LENGKAP */}
      {previewModalItem && (
        <div className="modal-backdrop" onClick={() => setPreviewModalItem(null)}>
          <div className="modal-card modal-selfie-preview" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Camera size={18} className="text-blue" />
                <h3>Verifikasi Foto Selfie Presensi</h3>
              </div>
              <button
                type="button"
                className="btn-icon-tiny"
                onClick={() => setPreviewModalItem(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="selfie-modal-content">
              {previewModalItem.photoUrl ? (
                <div className="modal-photo-wrapper">
                  <img
                    src={previewModalItem.photoUrl}
                    alt={`Selfie ${previewModalItem.item.name}`}
                    className="modal-photo-full"
                  />
                  <div className="modal-photo-watermark-overlay">
                    <strong>{previewModalItem.item.name} ({previewModalItem.item.role})</strong>
                    <span>
                      {previewModalItem.item.workDate || todayStr} • {previewModalItem.item.checkIn} WIB • Status: {previewModalItem.item.status}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="modal-photo-empty-box">
                  <ImageIcon size={48} className="text-muted" />
                  <p>Foto disimpan di local storage perangkat pengirim dengan path:</p>
                  <code>{previewModalItem.item.selfiePath}</code>
                  <small style={{ marginTop: "8px", color: "#64748b" }}>
                    Saat binding Cloudflare R2 diaktifkan, foto akan otomatis disinkronkan ke cloud CDN bucket.
                  </small>
                </div>
              )}

              {/* Rincian Check-In */}
              <div className="modal-attendance-details-grid">
                <div>
                  <span>Nama Manpower:</span>
                  <strong>{previewModalItem.item.name}</strong>
                </div>
                <div>
                  <span>Role & Divisi:</span>
                  <strong>{previewModalItem.item.role} ({previewModalItem.item.divisionCode || "FC"})</strong>
                </div>
                <div>
                  <span>Waktu Check-In:</span>
                  <strong>{previewModalItem.item.checkIn} WIB</strong>
                </div>
                <div>
                  <span>Status:</span>
                  <strong>{previewModalItem.item.status}</strong>
                </div>
                <div>
                  <span>Wilayah Area:</span>
                  <strong>{previewModalItem.item.area}</strong>
                </div>
                <div>
                  <span>Titik GPS:</span>
                  <strong>
                    {previewModalItem.item.latitude != null
                      ? `${previewModalItem.item.latitude.toFixed(4)}, ${previewModalItem.item.longitude?.toFixed(4)}`
                      : "—"}
                  </strong>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <span>Catatan:</span>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#334155" }}>
                    {previewModalItem.item.note || "Tidak ada catatan."}
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPreviewModalItem(null)}
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
