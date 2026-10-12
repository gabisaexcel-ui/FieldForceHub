import { supabase, isSupabaseConfigured } from "./supabase";
import type { DemoAccount } from "../types";

export interface ProfileUpdatePayload {
  full_name: string;
  position: string;
  area_code: string;
  phone: string;
  gender: "Laki-laki" | "Perempuan";
  address: string;
  maps_url: string;
}

/**
 * READ (R) - Mengambil profil user aktif dari database Supabase
 */
export async function fetchProfile(defaultAccount: DemoAccount): Promise<DemoAccount> {
  const userCode = defaultAccount.code || defaultAccount.id;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_code", userCode)
        .maybeSingle();

      if (!error && data) {
        const initials = (data.full_name || defaultAccount.name)
          .split(" ")
          .map((part: string) => part[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();

        const merged: DemoAccount = {
          ...defaultAccount,
          id: data.id || defaultAccount.id,
          name: data.full_name || defaultAccount.name,
          position: data.position || defaultAccount.position,
          area: data.area_code || defaultAccount.area,
          gender: (data.gender as "Laki-laki" | "Perempuan") || defaultAccount.gender || "Laki-laki",
          phone: data.phone || defaultAccount.phone,
          address: data.address || defaultAccount.address,
          mapsUrl: data.maps_url || defaultAccount.mapsUrl,
          joinDate: data.join_date || defaultAccount.joinDate,
          initials,
        };

        try {
          localStorage.setItem(`fieldforce:profile:${defaultAccount.id}`, JSON.stringify(merged));
        } catch (_) {}

        return merged;
      }
    } catch (err) {
      console.warn("fetchProfile Supabase fallback:", err);
    }
  }

  // Fallback cache
  return getSavedProfile(defaultAccount);
}

/**
 * READ ALL (R) - Mengambil seluruh profil dari database Supabase
 */
export async function fetchAllProfiles(): Promise<DemoAccount[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });

    if (error || !data || data.length === 0) {
      return [];
    }

    return data.map((d) => ({
      id: d.id || d.user_code,
      name: d.full_name,
      initials: (d.full_name || "SF")
        .split(" ")
        .map((p: string) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase(),
      level: (d.account_level as any) || "user",
      role: (d.operational_role as any) || "FC",
      division: d.division_code || "FC",
      area: d.area_code || "Surabaya",
      code: d.user_code,
      phone: d.phone || "",
      position: d.position || "",
      gender: (d.gender as any) || "Laki-laki",
      address: d.address || "",
      mapsUrl: d.maps_url || "",
      joinDate: d.join_date || "01/07/2024",
    }));
  } catch (err) {
    console.warn("fetchAllProfiles error:", err);
    return [];
  }
}

/**
 * CREATE / UPDATE (C & U) - Menyimpan pembaruan data diri mandiri ke Supabase (upsert)
 */
export async function saveProfileData(
  currentAccount: DemoAccount,
  updates: Partial<{
    name: string;
    position: string;
    area: string;
    gender: "Laki-laki" | "Perempuan";
    address: string;
    mapsUrl: string;
    phone: string;
  }>
): Promise<{ success: boolean; updatedAccount: DemoAccount; error?: string }> {
  const userCode = currentAccount.code || currentAccount.id;

  // Update objek akun lokal
  const updatedAccount: DemoAccount = {
    ...currentAccount,
    name: updates.name ?? currentAccount.name,
    position: updates.position ?? currentAccount.position,
    area: updates.area ?? currentAccount.area,
    gender: updates.gender ?? currentAccount.gender,
    address: updates.address ?? currentAccount.address,
    mapsUrl: updates.mapsUrl ?? currentAccount.mapsUrl,
    phone: updates.phone ?? currentAccount.phone,
    initials: updates.name
      ? updates.name
          .split(" ")
          .map((part) => part[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : currentAccount.initials,
  };

  // Simpan ke localStorage
  try {
    localStorage.setItem(`fieldforce:profile:${updatedAccount.id}`, JSON.stringify(updatedAccount));
  } catch (_) {}

  // Simpan langsung ke Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      // Ambil id existing jika ada
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_code", userCode)
        .maybeSingle();

      const newId = existing?.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined);

      const payload: any = {
        user_code: userCode,
        full_name: updatedAccount.name,
        position: updatedAccount.position || "",
        area_code: updatedAccount.area || "Surabaya",
        phone: updatedAccount.phone || "",
        gender: (updatedAccount.gender as "Laki-laki" | "Perempuan") || "Laki-laki",
        address: updatedAccount.address || "",
        maps_url: updatedAccount.mapsUrl || "",
        account_level: updatedAccount.level,
        operational_role: updatedAccount.role === "ALL" ? "FC" : updatedAccount.role,
      };

      if (newId) {
        payload.id = newId;
      }

      const { error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "user_code" });

      if (error) {
        console.warn("Supabase profile upsert warning:", error.message);
      } else {
        // Broadcast pembaruan profil ke realtime
        const topic = updatedAccount.level === "master"
          ? "scope:all"
          : `scope:${updatedAccount.division.toLowerCase()}:${updatedAccount.area.toLowerCase()}`;
        void supabase.channel(topic).send({
          type: "broadcast",
          event: "data_changed",
          payload: { action: "profile_updated", userCode },
        });
      }
    } catch (err: any) {
      console.warn("Supabase update exception:", err?.message || err);
    }
  }

  // Trigger event sinkronisasi data lokal
  window.dispatchEvent(
    new CustomEvent("fieldforce:profile-updated", { detail: updatedAccount })
  );

  return { success: true, updatedAccount };
}

/**
 * DELETE (D) - Menghapus profil dari database Supabase
 */
export async function deleteProfile(userCode: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("user_code", userCode);
    if (error) throw error;
    window.dispatchEvent(new CustomEvent("fieldforce:profile-updated"));
    return true;
  } catch (err) {
    console.warn("Gagal hapus profil di Supabase:", err);
    return false;
  }
}

/**
 * Mengambil profil tersimpan dari localStorage atau default
 */
export function getSavedProfile(defaultAccount: DemoAccount): DemoAccount {
  try {
    const raw = localStorage.getItem(`fieldforce:profile:${defaultAccount.id}`);
    if (raw) {
      return { ...defaultAccount, ...JSON.parse(raw) };
    }
  } catch (_) {}
  return defaultAccount;
}
