import { supabase, isSupabaseConfigured } from "./supabase";
import type { DemoAccount } from "../types";

export interface LiveAttendanceItem {
  id?: string;
  name: string;
  role: string;
  area: string;
  checkIn: string;
  status: string;
  note: string;
  userCode?: string;
}

/**
 * READ (R) - Mengambil data presensi hari ini murni dari database Supabase
 */
export async function fetchTodayAttendance(): Promise<LiveAttendanceItem[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  try {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("work_date", today)
      .order("check_in_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return [];
    }

    // Pemetaan data murni dari Supabase
    return data.map((item) => {
      const timeStr = item.check_in_at
        ? new Date(item.check_in_at).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—";

      const statusMap: Record<string, string> = {
        great: "Great",
        safe: "Safe",
        alert: "Alert",
        warning: "Warning",
        off: "OFF",
        leave: "Cuti",
        sick: "Sakit",
      };

      return {
        id: item.id,
        name: item.user_name || "Manpower",
        role: item.user_role || "MD",
        area: item.area_code || "Surabaya",
        checkIn: timeStr,
        status: statusMap[item.status?.toLowerCase()] || item.status || "Great",
        note: item.notes || "Presensi GPS",
        userCode: item.user_code,
      };
    });
  } catch (err) {
    console.warn("fetchTodayAttendance error:", err);
    return [];
  }
}

/**
 * READ (R) - Memeriksa status presensi user hari ini dari Supabase
 */
export async function checkUserCheckedInToday(
  account: DemoAccount
): Promise<{ checkedIn: boolean; id?: string; time?: string; note?: string }> {
  const today = new Date().toISOString().split("T")[0];
  const userCode = account.code || account.id;

  // Cek langsung ke database Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("id, check_in_at, notes")
        .eq("work_date", today)
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
        return { checkedIn: true, id: data.id, time: timeStr, note: data.notes };
      }
    } catch (_) {}
  }

  // Fallback cache lokal jika offline
  const localKey = `fieldforce:checkin:${userCode}:${today}`;
  const localVal = localStorage.getItem(localKey);
  if (localVal) {
    try {
      const parsed = JSON.parse(localVal);
      return { checkedIn: true, id: parsed.id, time: parsed.time, note: parsed.note };
    } catch (_) {}
  }

  return { checkedIn: false };
}

/**
 * CREATE (C) - Mengirim data presensi baru ke database Supabase
 */
export async function submitAttendance(
  account: DemoAccount,
  options?: {
    note?: string;
    latitude?: number;
    longitude?: number;
  }
): Promise<{ success: boolean; record: LiveAttendanceItem; error?: string }> {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const timeStr = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const userCode = account.code || account.id;

  let insertedId: string | undefined = undefined;

  // Simpan langsung ke database Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const payload = {
        work_date: today,
        check_in_at: now.toISOString(),
        latitude: options?.latitude ?? -7.2575,
        longitude: options?.longitude ?? 112.7521,
        status: "great",
        notes: options?.note || "Presensi GPS & Selfie tepat waktu",
        area_code: account.area || "Surabaya",
        division_code: account.division || "FC",
        user_code: userCode,
        user_name: account.name,
        user_role: account.role,
      };

      const { data, error } = await supabase
        .from("attendance_records")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        console.warn("Supabase attendance insert error:", error.message);
      } else if (data) {
        insertedId = data.id;
      }

      // Broadcast update realtime ke channel
      const topic = account.level === "master"
        ? "scope:all"
        : `scope:${account.division.toLowerCase()}:${account.area.toLowerCase()}`;
      void supabase.channel(topic).send({
        type: "broadcast",
        event: "data_changed",
        payload: { action: "attendance_inserted", userCode },
      });
    } catch (err: any) {
      console.warn("attendance submit exception:", err?.message || err);
    }
  }

  const record: LiveAttendanceItem = {
    id: insertedId,
    name: account.name,
    role: account.role,
    area: account.area,
    checkIn: timeStr,
    status: "Great",
    note: options?.note || "Presensi GPS & Selfie Akurat",
    userCode,
  };

  // Simpan ke localStorage sebagai fast cache
  try {
    const localKey = `fieldforce:checkin:${userCode}:${today}`;
    localStorage.setItem(localKey, JSON.stringify({ id: insertedId, time: timeStr, note: record.note }));
  } catch (_) {}

  // Picu event UI
  window.dispatchEvent(
    new CustomEvent("fieldforce:attendance-updated", { detail: record })
  );

  return { success: true, record };
}

/**
 * UPDATE (U) - Memperbarui catatan atau status presensi di database Supabase
 */
export async function updateAttendanceRecord(
  id: string,
  updates: { note?: string; status?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: "Supabase belum terhubung" };
  }

  try {
    const payload: any = {};
    if (updates.note !== undefined) payload.notes = updates.note;
    if (updates.status !== undefined) payload.status = updates.status.toLowerCase();

    const { error } = await supabase
      .from("attendance_records")
      .update(payload)
      .eq("id", id);

    if (error) throw error;

    // Broadcast ke realtime
    void supabase.channel("scope:all").send({
      type: "broadcast",
      event: "data_changed",
      payload: { action: "attendance_updated", id },
    });

    window.dispatchEvent(new CustomEvent("fieldforce:attendance-updated"));
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
  userCode?: string
): Promise<{ success: boolean; error?: string }> {
  const today = new Date().toISOString().split("T")[0];

  // Hapus dari cache localStorage jika ada
  if (userCode) {
    try {
      localStorage.removeItem(`fieldforce:checkin:${userCode}:${today}`);
    } catch (_) {}
  }

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from("attendance_records").delete();
      if (id) {
        query = query.eq("id", id);
      } else if (userCode) {
        query = query.eq("user_code", userCode).eq("work_date", today);
      } else {
        return { success: false, error: "ID presensi tidak valid" };
      }

      const { error } = await query;
      if (error) throw error;

      // Broadcast update realtime
      void supabase.channel("scope:all").send({
        type: "broadcast",
        event: "data_changed",
        payload: { action: "attendance_deleted", id, userCode },
      });
    } catch (err: any) {
      console.warn("Gagal hapus di Supabase:", err);
      return { success: false, error: err?.message || "Gagal menghapus presensi" };
    }
  }

  window.dispatchEvent(new CustomEvent("fieldforce:attendance-updated"));
  return { success: true };
}
