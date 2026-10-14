import { supabase, isSupabaseConfigured } from "./supabase";
import type { DemoAccount } from "../types";

export interface LiveAttendanceItem {
  id?: string;
  userId?: string;
  name: string;
  role: string;
  area: string;
  checkIn: string;
  status: string;
  rawStatus?: string;
  note: string;
  userCode?: string;
  selfiePath?: string;
  latitude?: number;
  longitude?: number;
  workDate?: string;
  divisionCode?: string;
}

export interface AttendanceSubmitPayload {
  workDate?: string;
  checkInTime?: string;
  checkInTimestamp?: string;
  latitude?: number;
  longitude?: number;
  area?: string;
  division?: string;
  status?: string;
  note?: string;
  selfiePath?: string;
  userCode?: string;
  userName?: string;
  userRole?: string;
}

export interface AttendanceSettings {
  id?: string;
  settingKey: string;
  settingName: string;
  workStartTime: string;
  safeGraceMinutes: number;
  alertThresholdMinutes: number;
  warningThresholdMinutes: number;
  description?: string;
}

export const DEFAULT_ATTENDANCE_SETTINGS: AttendanceSettings = {
  settingKey: "DEFAULT",
  settingName: "Master Aturan Jam Masuk & Toleransi Lapangan",
  workStartTime: "08:00:00",
  safeGraceMinutes: 2,
  alertThresholdMinutes: 2,
  warningThresholdMinutes: 30,
  description: "Great (<= 08:00 WIB), Safe (<= 2 mnt), Alert (> 2 mnt), Warning (> 30 mnt)",
};

export async function fetchAttendanceSettings(division?: string): Promise<AttendanceSettings> {
  if (!isSupabaseConfigured || !supabase) {
    return getLocalSettings() || DEFAULT_ATTENDANCE_SETTINGS;
  }
  try {
    const { data, error } = await supabase
      .from("attendance_settings")
      .select("*")
      .in("setting_key", division ? [division, "DEFAULT"] : ["DEFAULT"])
      .eq("is_active", true)
      .order("setting_key", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const s: AttendanceSettings = {
        id: data.id,
        settingKey: data.setting_key,
        settingName: data.setting_name || DEFAULT_ATTENDANCE_SETTINGS.settingName,
        workStartTime: data.work_start_time || "08:00:00",
        safeGraceMinutes: Number(data.safe_grace_minutes ?? 2),
        alertThresholdMinutes: Number(data.alert_threshold_minutes ?? 2),
        warningThresholdMinutes: Number(data.warning_threshold_minutes ?? 30),
        description: data.description,
      };
      saveLocalSettings(s);
      return s;
    }
  } catch (err) {
    console.warn("fetchAttendanceSettings error:", err);
  }
  return getLocalSettings() || DEFAULT_ATTENDANCE_SETTINGS;
}

function getLocalSettings(): AttendanceSettings | null {
  try {
    const raw = localStorage.getItem("fieldforce:attendance_settings");
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

function saveLocalSettings(settings: AttendanceSettings) {
  try {
    localStorage.setItem("fieldforce:attendance_settings", JSON.stringify(settings));
  } catch (_) {}
}

export function computeAttendanceStatus(
  timeStr: string,
  settings: AttendanceSettings = DEFAULT_ATTENDANCE_SETTINGS
): {
  statusKey: "great" | "safe" | "alert" | "warning";
  label: string;
  diffMinutes: number;
  description: string;
} {
  const [h, m] = timeStr.split(":").map(Number);
  const checkInMinutes = (h || 0) * 60 + (m || 0);

  const startParts = (settings.workStartTime || "08:00").split(":").map(Number);
  const startMinutes = (startParts[0] || 8) * 60 + (startParts[1] || 0);

  const diffMinutes = checkInMinutes - startMinutes;

  // 1. Tepat Waktu (<= Jam Masuk) -> Great
  if (diffMinutes <= 0) {
    return {
      statusKey: "great",
      label: "Great • Tepat Waktu",
      diffMinutes,
      description: `Tepat waktu (hadir sebelum atau pukul ${settings.workStartTime.slice(0, 5)} WIB).`,
    };
  }

  // 2. Dalam toleransi (<= safeGraceMinutes, misal <= 2 menit) -> Safe
  if (diffMinutes <= settings.safeGraceMinutes) {
    return {
      statusKey: "safe",
      label: "Safe • Toleransi",
      diffMinutes,
      description: `Toleransi aman (+${diffMinutes} menit dari jam ${settings.workStartTime.slice(0, 5)} WIB, maks ${settings.safeGraceMinutes} mnt).`,
    };
  }

  // 3. Melebihi batas alert tapi belum lewat warning (misal > 2 mnt s/d 30 mnt) -> Alert
  if (diffMinutes <= settings.warningThresholdMinutes) {
    return {
      statusKey: "alert",
      label: "Alert • Terlambat",
      diffMinutes,
      description: `Terlambat +${diffMinutes} menit (> ${settings.alertThresholdMinutes} menit dari jam kerja).`,
    };
  }

  // 4. Melebihi warningThresholdMinutes (misal > 30 menit / setengah jam) -> Warning
  return {
    statusKey: "warning",
    label: "Warning • Sangat Terlambat",
    diffMinutes,
    description: `Sangat terlambat +${diffMinutes} menit (> ${settings.warningThresholdMinutes} menit / setengah jam).`,
  };
}

const statusMap: Record<string, string> = {
  great: "Great",
  safe: "Safe",
  alert: "Alert",
  warning: "Warning",
  off: "OFF",
  leave: "Cuti",
  sick: "Sakit",
};

/**
 * READ (R) - Mengambil data presensi hari ini murni dari database Supabase
 */
export async function fetchTodayAttendance(targetDate?: string): Promise<LiveAttendanceItem[]> {
  const queryDate = targetDate || new Date().toISOString().split("T")[0];

  if (!isSupabaseConfigured || !supabase) {
    // Fallback ambil dari cache lokal jika supabase belum ada
    return getLocalAttendanceRecords(queryDate);
  }

  try {
    const { data, error } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("work_date", queryDate)
      .order("check_in_at", { ascending: false });

    if (error) {
      console.warn("fetchTodayAttendance Supabase query error:", error.message);
      return getLocalAttendanceRecords(queryDate);
    }

    // Jika Supabase berhasil query (walau data kosong []), gunakan data Supabase sebagai sumber kebenaran utama
    const mapped: LiveAttendanceItem[] = (data || []).map((item) => {
      const timeStr = item.check_in_at
        ? new Date(item.check_in_at).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—";

      return {
        id: item.id,
        userId: item.user_id,
        name: item.user_name || "Manpower",
        role: item.user_role || "MD",
        area: item.area_code || "Surabaya",
        checkIn: timeStr,
        status: statusMap[item.status?.toLowerCase()] || item.status || "Great",
        rawStatus: item.status?.toLowerCase() || "great",
        note: item.notes || "Presensi GPS",
        userCode: item.user_code,
        selfiePath: item.selfie_path,
        latitude: item.latitude != null ? Number(item.latitude) : undefined,
        longitude: item.longitude != null ? Number(item.longitude) : undefined,
        workDate: item.work_date,
        divisionCode: item.division_code,
      };
    });

    // Sinkronkan cache lokal dengan data Supabase
    try {
      localStorage.setItem(`fieldforce:attendance_records:${queryDate}`, JSON.stringify(mapped));
    } catch (_) {}

    return mapped;
  } catch (err) {
    console.warn("fetchTodayAttendance exception:", err);
    return getLocalAttendanceRecords(queryDate);
  }
}

/**
 * Helper fallback cache lokal jika offline
 */
function getLocalAttendanceRecords(workDate: string): LiveAttendanceItem[] {
  try {
    const raw = localStorage.getItem(`fieldforce:attendance_records:${workDate}`);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [];
}

/**
 * READ (R) - Memeriksa status presensi user hari ini dari Supabase
 */
export async function checkUserCheckedInToday(
  account: DemoAccount,
  targetDate?: string
): Promise<{
  checkedIn: boolean;
  id?: string;
  time?: string;
  note?: string;
  status?: string;
  selfiePath?: string;
  record?: LiveAttendanceItem;
}> {
  const queryDate = targetDate || new Date().toISOString().split("T")[0];
  const userCode = account.code || account.id;

  // Cek langsung ke database Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("work_date", queryDate)
        .eq("user_code", userCode)
        .order("check_in_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const timeStr = data.check_in_at
          ? new Date(data.check_in_at).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "08:00";

        const rec: LiveAttendanceItem = {
          id: data.id,
          userId: data.user_id,
          name: data.user_name || account.name,
          role: data.user_role || account.role,
          area: data.area_code || account.area,
          checkIn: timeStr,
          status: statusMap[data.status?.toLowerCase()] || data.status || "Great",
          rawStatus: data.status?.toLowerCase() || "great",
          note: data.notes || "",
          userCode: data.user_code,
          selfiePath: data.selfie_path,
          latitude: data.latitude != null ? Number(data.latitude) : undefined,
          longitude: data.longitude != null ? Number(data.longitude) : undefined,
          workDate: data.work_date,
          divisionCode: data.division_code,
        };

        return {
          checkedIn: true,
          id: data.id,
          time: timeStr,
          note: data.notes,
          status: data.status,
          selfiePath: data.selfie_path,
          record: rec,
        };
      }
    } catch (_) {}
  }

  // Fallback cache lokal jika offline
  const localKey = `fieldforce:checkin:${userCode}:${queryDate}`;
  const localVal = localStorage.getItem(localKey);
  if (localVal) {
    try {
      const parsed = JSON.parse(localVal);
      return {
        checkedIn: true,
        id: parsed.id,
        time: parsed.time,
        note: parsed.note,
        status: parsed.status,
        selfiePath: parsed.selfiePath,
      };
    } catch (_) {}
  }

  return { checkedIn: false };
}

/**
 * CREATE (C) - Mengirim data presensi baru ke database Supabase
 */
export async function submitAttendance(
  account: DemoAccount,
  options?: AttendanceSubmitPayload
): Promise<{ success: boolean; record: LiveAttendanceItem; error?: string }> {
  const now = new Date();
  const workDate = options?.workDate || now.toISOString().split("T")[0];

  let checkInAtIso = options?.checkInTimestamp;
  if (!checkInAtIso) {
    if (options?.checkInTime) {
      // Buat timestamp dari workDate + checkInTime
      const [h, m] = options.checkInTime.split(":");
      const d = new Date(workDate);
      d.setHours(Number(h) || 8, Number(m) || 0, 0, 0);
      checkInAtIso = d.toISOString();
    } else {
      checkInAtIso = now.toISOString();
    }
  }

  const timeStr = new Date(checkInAtIso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const userCode = options?.userCode || account.code || account.id;
  const userName = options?.userName || account.name;
  const userRole = options?.userRole || account.role;
  const areaCode = options?.area || account.area || "Surabaya";
  const divisionCode = options?.division || account.division || "FC";
  const statusRaw = (options?.status || "great").toLowerCase();
  const notesText = options?.note || "Presensi GPS & Selfie tepat waktu";
  const latVal = options?.latitude ?? -7.2575;
  const lngVal = options?.longitude ?? 112.7521;
  const selfiePathVal = options?.selfiePath || null;

  let insertedId: string | undefined = undefined;
  let resolvedUserId: string | undefined = undefined;

  // Simpan langsung ke database Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Dapatkan UUID user_id valid dari tabel profiles atau Supabase Auth
      const isUuid = (val?: string) =>
        Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

      if (isUuid(account.id)) {
        resolvedUserId = account.id;
      } else {
        // Cari profil berdasarkan user_code atau nama lengkap
        try {
          const { data: prof } = await supabase
            .from("profiles")
            .select("id")
            .or(`user_code.eq.${userCode},full_name.eq.${userName}`)
            .limit(1)
            .maybeSingle();
          if (prof?.id && isUuid(prof.id)) {
            resolvedUserId = prof.id;
          }
        } catch (_) {}
      }

      // Jika belum ditemukan, coba ambil user ID dari session Supabase Auth
      if (!resolvedUserId) {
        try {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user?.id && isUuid(authData.user.id)) {
            resolvedUserId = authData.user.id;
          }
        } catch (_) {}
      }

      const payload: Record<string, any> = {
        work_date: workDate,
        check_in_at: checkInAtIso,
        latitude: latVal,
        longitude: lngVal,
        status: statusRaw,
        notes: notesText,
        area_code: areaCode,
        division_code: divisionCode,
        user_code: userCode,
        user_name: userName,
        user_role: userRole,
      };

      if (resolvedUserId) {
        payload.user_id = resolvedUserId;
      }

      if (selfiePathVal) {
        payload.selfie_path = selfiePathVal;
      }

      // Selalu lakukan INSERT record baru (bisa berkali-kali check-in per hari)
      let { data: inserted, error: insertErr } = await supabase
        .from("attendance_records")
        .insert(payload)
        .select("id, user_id")
        .single();

      // Jika error foreign key 23503 atau unique constraint 23505 (karena migrasi drop unique key belum dijalankan di Supabase)
      if (insertErr && (insertErr.code === "23503" || insertErr.code === "23505")) {
        const fallbackPayload = { ...payload };
        if (insertErr.code === "23503") {
          delete fallbackPayload.area_code;
          delete fallbackPayload.division_code;
        } else if (insertErr.code === "23505") {
          // Unique constraint pada (user_id, work_date): hapus user_id agar check-in berkali-kali tetap tembus
          delete fallbackPayload.user_id;
        }

        let retryRes = await supabase
          .from("attendance_records")
          .insert(fallbackPayload)
          .select("id, user_id")
          .single();

        // Jika masih error (kombinasi FK dan unique constraint)
        if (retryRes.error && (retryRes.error.code === "23503" || retryRes.error.code === "23505")) {
          delete fallbackPayload.area_code;
          delete fallbackPayload.division_code;
          delete fallbackPayload.user_id;
          retryRes = await supabase
            .from("attendance_records")
            .insert(fallbackPayload)
            .select("id, user_id")
            .single();
        }

        inserted = retryRes.data;
        insertErr = retryRes.error;
      }

      if (insertErr) {
        throw new Error(insertErr.message || "Gagal menyimpan presensi ke Supabase");
      }

      if (inserted?.id) {
        insertedId = inserted.id;
        if (inserted.user_id) {
          resolvedUserId = inserted.user_id;
        }
      }

      // Broadcast update realtime ke channel
      void supabase.channel("scope:all").send({
        type: "broadcast",
        event: "data_changed",
        payload: { action: "attendance_inserted", userCode, workDate, id: insertedId },
      });
    } catch (err: any) {
      console.error("attendance submit error:", err);
      return {
        success: false,
        record: {} as any,
        error: err?.message || "Gagal menyimpan presensi ke Supabase",
      };
    }
  }

  const record: LiveAttendanceItem = {
    id: insertedId || `local-${Date.now()}`,
    userId: resolvedUserId || undefined,
    name: userName,
    role: userRole,
    area: areaCode,
    checkIn: timeStr,
    status: statusMap[statusRaw] || "Great",
    rawStatus: statusRaw,
    note: notesText,
    userCode,
    selfiePath: selfiePathVal || undefined,
    latitude: latVal,
    longitude: lngVal,
    workDate,
    divisionCode,
  };

  // Simpan ke localStorage sebagai fast cache (menambahkan ke daftar, tidak menghapus yang sebelumnya)
  try {
    const existingList = getLocalAttendanceRecords(workDate);
    const updatedList = [
      record,
      ...existingList.filter((item) => item.id !== record.id),
    ];
    localStorage.setItem(`fieldforce:attendance_records:${workDate}`, JSON.stringify(updatedList));
  } catch (_) {}

  // Picu event UI
  window.dispatchEvent(new CustomEvent("fieldforce:attendance-updated", { detail: record }));
  window.dispatchEvent(new CustomEvent("fieldforce:data-changed"));

  return { success: true, record };
}

/**
 * UPDATE (U) - Memperbarui catatan atau status presensi di database Supabase
 */
export async function updateAttendanceRecord(
  id: string,
  updates: {
    note?: string;
    status?: string;
    latitude?: number;
    longitude?: number;
    selfiePath?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: "Supabase belum terhubung" };
  }

  try {
    const payload: Record<string, any> = {};
    if (updates.note !== undefined) payload.notes = updates.note;
    if (updates.status !== undefined) payload.status = updates.status.toLowerCase();
    if (updates.latitude !== undefined) payload.latitude = updates.latitude;
    if (updates.longitude !== undefined) payload.longitude = updates.longitude;
    if (updates.selfiePath !== undefined) payload.selfie_path = updates.selfiePath;

    const { error } = await supabase.from("attendance_records").update(payload).eq("id", id);

    if (error) throw error;

    // Broadcast ke realtime
    void supabase.channel("scope:all").send({
      type: "broadcast",
      event: "data_changed",
      payload: { action: "attendance_updated", id },
    });

    window.dispatchEvent(new CustomEvent("fieldforce:attendance-updated"));
    window.dispatchEvent(new CustomEvent("fieldforce:data-changed"));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Gagal memperbarui presensi" };
  }
}

/**
 * DELETE (D) - Menghapus data presensi dari database Supabase
 */
export async function deleteAttendanceRecord(
  id?: string,
  userCode?: string,
  targetDate?: string
): Promise<{ success: boolean; error?: string }> {
  const queryDate = targetDate || new Date().toISOString().split("T")[0];

  // 1. Hapus dari database Supabase jika ID adalah UUID valid atau berdasarkan userCode
  if (isSupabaseConfigured && supabase) {
    try {
      const isUuid = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUuid) {
        const { error } = await supabase.from("attendance_records").delete().eq("id", id);
        if (error) {
          console.warn("Gagal hapus record di Supabase:", error);
        }
      } else if (userCode && !id) {
        const { error } = await supabase
          .from("attendance_records")
          .delete()
          .eq("user_code", userCode)
          .eq("work_date", queryDate);
        if (error) {
          console.warn("Gagal hapus record by userCode di Supabase:", error);
        }
      }
    } catch (err: any) {
      console.warn("Exception hapus di Supabase:", err);
    }
  }

  // 2. Hapus juga dari cache localStorage secara bersih
  try {
    const localKey = `fieldforce:attendance_records:${queryDate}`;
    const list = getLocalAttendanceRecords(queryDate);
    const updated = list.filter((item) => {
      if (id) return item.id !== id;
      if (userCode) return item.userCode !== userCode;
      return true;
    });
    localStorage.setItem(localKey, JSON.stringify(updated));
    if (userCode) {
      localStorage.removeItem(`fieldforce:checkin:${userCode}:${queryDate}`);
    }
  } catch (_) {}

  // Broadcast update realtime
  if (isSupabaseConfigured && supabase) {
    void supabase.channel("scope:all").send({
      type: "broadcast",
      event: "data_changed",
      payload: { action: "attendance_deleted", id, userCode },
    });
  }

  window.dispatchEvent(new CustomEvent("fieldforce:attendance-updated"));
  window.dispatchEvent(new CustomEvent("fieldforce:data-changed"));
  return { success: true };
}
