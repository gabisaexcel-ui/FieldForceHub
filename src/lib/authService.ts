import { supabase, isSupabaseConfigured } from "./supabase";
import type { AccountLevel, DemoAccount, OperationalRole } from "../types";

export interface RegisterParams {
  username: string;
  password: string;
  fullName: string;
  division: OperationalRole;
  level: AccountLevel;
  area: string;
  phone?: string;
  position?: string;
}

const AUTH_STORAGE_KEY = "fieldforce:auth_session";

export const operationalDivisions: OperationalRole[] = [
  "FC",
  "MD",
  "MDPS",
  "Salesman",
  "TS",
  "KAM",
];

export const divisionMeta: Record<
  OperationalRole,
  { name: string; tag: string; description: string; color: string }
> = {
  ALL: {
    name: "All Divisions",
    tag: "ALL",
    description: "Seluruh divisi operasional",
    color: "#4f46e5",
  },
  FC: {
    name: "Field Coordinator",
    tag: "FC",
    description: "Koordinator lapangan & review approval operasional",
    color: "#2563eb",
  },
  MD: {
    name: "Merchandiser",
    tag: "MD",
    description: "Pajangan toko, display produk & presensi toko",
    color: "#059669",
  },
  MDPS: {
    name: "Merchandiser Product Specialist",
    tag: "MDPS",
    description: "Spesialis display & edukasi produk modern outlet",
    color: "#0891b2",
  },
  Salesman: {
    name: "Sales Representative",
    tag: "SALES",
    description: "Penjualan toko, rute kunjungan & program SKP",
    color: "#d97706",
  },
  TS: {
    name: "Territory Sales",
    tag: "TS",
    description: "Negosiasi program toko, tanda tangan SKP & budget",
    color: "#7c3aed",
  },
  KAM: {
    name: "Key Account Manager",
    tag: "KAM",
    description: "Manajemen akun toko ritel nasional & evaluasi program",
    color: "#db2777",
  },
};

// Akun default cepat untuk kemudahan demonstrasi
export const quickAccounts = [
  { username: "fc_user", pass: "123", role: "FC", level: "user", name: "Siti Firdaus" },
  { username: "fc_admin", pass: "123", role: "FC", level: "admin", name: "Admin Koordinator Wilayah" },
  { username: "md_user", pass: "123", role: "MD", level: "user", name: "Muhamad Faizal Kako Djata" },
  { username: "mdps_user", pass: "123", role: "MDPS", level: "user", name: "Sindy Ayu Rahmawati" },
  { username: "sales_user", pass: "123", role: "Salesman", level: "user", name: "Mochamad Hanif Aziz" },
  { username: "ts_user", pass: "123", role: "TS", level: "user", name: "TS Surabaya & Sekitar" },
  { username: "kam_user", pass: "123", role: "KAM", level: "user", name: "Bayu Maki (NAM)" },
];

export function getSession(): DemoAccount | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (_) {}
  return null;
}

export function saveSession(account: DemoAccount): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(account));
  } catch (_) {}
}

export function clearSession(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (_) {}
}

/**
 * LOGIN DENGAN USERNAME & PASSWORD MURNI DARI SUPABASE
 */
export async function loginWithCredentials(
  usernameInput: string,
  passwordInput: string
): Promise<DemoAccount> {
  const usernameClean = usernameInput.trim().toLowerCase();
  const passwordClean = passwordInput.trim();

  if (!usernameClean || !passwordClean) {
    throw new Error("Silakan masukkan username dan password!");
  }

  // 1. Cek langsung ke database Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      let data: any = null;
      let error: any = null;

      // Coba query kolom username dan user_code
      const res = await supabase
        .from("profiles")
        .select("*")
        .or(`username.ilike.${usernameClean},user_code.ilike.${usernameClean}`)
        .maybeSingle();

      data = res.data;
      error = res.error;

      // Jika kolom 'username' belum ada di skema database, fallback ke query 'user_code'
      if (error && error.code === "42703") {
        const fallbackRes = await supabase
          .from("profiles")
          .select("*")
          .ilike("user_code", usernameClean)
          .maybeSingle();

        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (!error && data) {
        // Validasi password jika kolom password ada di Supabase
        if (data.password && data.password !== passwordClean) {
          throw new Error("Password yang Anda masukkan salah!");
        }

        const role = (data.operational_role as OperationalRole) || "FC";
        const level = (data.account_level as AccountLevel) || "user";
        const initials = (data.full_name || usernameClean)
          .split(" ")
          .map((p: string) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();

        const account: DemoAccount = {
          id: data.id || `user-${usernameClean}`,
          code: data.user_code || usernameClean,
          username: data.username || data.user_code || usernameClean,
          password: data.password || passwordClean,
          name: data.full_name || usernameClean,
          initials,
          level,
          role,
          division: data.division_code || role,
          area: data.area_code || "Surabaya",
          position: data.position || (level === "admin" ? `Admin Divisi ${role}` : `Manpower ${role}`),
          phone: data.phone || "083854377989",
          gender: (data.gender as any) || "Laki-laki",
          address: data.address || "Surabaya",
          mapsUrl: data.maps_url || "https://maps.google.com/?q=-7.2575,112.7521",
          joinDate: data.join_date || new Date().toLocaleDateString("id-ID"),
        };

        saveSession(account);
        return account;
      }
    } catch (err: any) {
      if (err.message && err.message.includes("Password")) {
        throw err;
      }
      console.warn("Supabase auth query fallback:", err);
    }
  }

  // 2. Fallback ke quickAccounts jika belum ada di database
  const matchedQuick = quickAccounts.find(
    (q) => q.username.toLowerCase() === usernameClean
  );

  if (matchedQuick) {
    if (matchedQuick.pass !== passwordClean) {
      throw new Error("Password salah! (Gunakan password default: 123)");
    }

    const role = matchedQuick.role as OperationalRole;
    const level = matchedQuick.level as AccountLevel;
    const initials = matchedQuick.name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const account: DemoAccount = {
      id: `${matchedQuick.username}-id`,
      code: matchedQuick.username,
      username: matchedQuick.username,
      password: matchedQuick.pass,
      name: matchedQuick.name,
      initials,
      level,
      role,
      division: role,
      area: "Surabaya",
      position: level === "admin" ? `Admin Divisi ${role}` : `Manpower ${role}`,
      phone: "083854377989",
      gender: "Laki-laki",
      joinDate: new Date().toLocaleDateString("id-ID"),
      address: `Surabaya Area ${role}`,
      mapsUrl: "https://maps.google.com/?q=-7.2575,112.7521",
    };

    saveSession(account);
    return account;
  }

  throw new Error("Akun dengan username tersebut belum terdaftar! Silakan klik tab 'Buat Akun Baru'.");
}

/**
 * DAFTAR / BUAT AKUN BARU KE DATABASE SUPABASE
 */
export async function registerNewAccount(params: RegisterParams): Promise<DemoAccount> {
  const usernameClean = params.username.trim().toLowerCase();
  const passwordClean = params.password.trim();

  if (!usernameClean) throw new Error("Username tidak boleh kosong!");
  if (!passwordClean) throw new Error("Password tidak boleh kosong!");
  if (!params.fullName.trim()) throw new Error("Nama lengkap harus diisi!");

  const initials = params.fullName
    .trim()
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "US";

  const position =
    params.position ||
    (params.level === "admin"
      ? `Admin Divisi ${params.division}`
      : `${divisionMeta[params.division]?.name || params.division} Lapangan`);

  let newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined;

  // Simpan langsung ke database Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Cek apakah username atau user_code sudah ada
      let existing = null;
      try {
        const checkRes = await supabase
          .from("profiles")
          .select("id, user_code")
          .or(`user_code.ilike.${usernameClean}`)
          .maybeSingle();
        existing = checkRes.data;
      } catch (_) {}

      if (existing) {
        throw new Error(`Username "${usernameClean}" sudah dipakai! Silakan pilih username lain.`);
      }

      // 2. Siapkan payload
      const payload: any = {
        user_code: usernameClean,
        username: usernameClean,
        password: passwordClean,
        full_name: params.fullName.trim(),
        operational_role: params.division,
        division_code: params.division,
        account_level: params.level,
        position,
        area_code: params.area || "Surabaya",
        phone: params.phone || "",
        gender: "Laki-laki",
        address: `Basecamp ${params.division} - ${params.area || "Surabaya"}`,
        maps_url: "https://maps.google.com/?q=-7.2575,112.7521",
        join_date: new Date().toISOString().split("T")[0],
      };

      if (newId) payload.id = newId;

      let { data: inserted, error } = await supabase
        .from("profiles")
        .insert(payload)
        .select("*")
        .single();

      // Jika gagal karena kolom username/password belum dibuat di Supabase
      if (error && error.code === "42703") {
        delete payload.username;
        delete payload.password;
        const retryRes = await supabase
          .from("profiles")
          .insert(payload)
          .select("*")
          .single();
        inserted = retryRes.data;
        error = retryRes.error;
      }

      if (error) {
        console.warn("Supabase register error:", error.message);
      } else if (inserted) {
        newId = inserted.id;
      }
    } catch (err: any) {
      if (err.message && err.message.includes("sudah dipakai")) {
        throw err;
      }
      console.warn("Supabase register exception:", err);
    }
  }

  const account: DemoAccount = {
    id: newId || `user-${usernameClean}`,
    code: usernameClean,
    username: usernameClean,
    password: passwordClean,
    name: params.fullName.trim(),
    initials,
    level: params.level,
    role: params.division,
    division: params.division,
    area: params.area || "Surabaya",
    position,
    phone: params.phone || "",
    gender: "Laki-laki",
    joinDate: new Date().toLocaleDateString("id-ID"),
    address: `Basecamp ${params.division} - ${params.area || "Surabaya"}`,
    mapsUrl: "https://maps.google.com/?q=-7.2575,112.7521",
  };

  saveSession(account);
  return account;
}

/**
 * AMBIL SEMUA AKUN DARI SUPABASE (UNTUK MENU KELOLA AKUN)
 */
export async function fetchAllAccounts(): Promise<DemoAccount[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id || d.user_code,
          code: d.user_code,
          username: d.username || d.user_code,
          password: d.password || "123",
          name: d.full_name || d.user_code,
          initials: (d.full_name || d.user_code)
            .split(" ")
            .map((p: string) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase(),
          level: (d.account_level as AccountLevel) || "user",
          role: (d.operational_role as OperationalRole) || "FC",
          division: d.division_code || d.operational_role || "FC",
          area: d.area_code || "Surabaya",
          phone: d.phone || "",
          position: d.position || "",
          gender: d.gender || "Laki-laki",
          address: d.address || "",
          mapsUrl: d.maps_url || "",
          joinDate: d.join_date || "",
        }));
      }
    } catch (err) {
      console.warn("fetchAllAccounts error:", err);
    }
  }

  // Fallback demo accounts jika Supabase offline
  return quickAccounts.map((q) => ({
    id: `${q.username}-id`,
    code: q.username,
    username: q.username,
    password: q.pass,
    name: q.name,
    initials: q.name.split(" ").map((p) => p[0]).slice(0, 2).join(""),
    level: q.level as AccountLevel,
    role: q.role as OperationalRole,
    division: q.role,
    area: "Surabaya",
    position: `${q.role} ${q.level.toUpperCase()}`,
    phone: "083854377989",
    gender: "Laki-laki",
    address: `Area ${q.role} Surabaya`,
    joinDate: "01/07/2024",
  }));
}

/**
 * UPDATE KREDENSIAL / PASSWORD AKUN DI SUPABASE
 */
export async function updateAccountCredentials(
  userId: string,
  userCode: string,
  newPassword: string,
  newRole?: OperationalRole,
  newLevel?: AccountLevel
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const updateObj: any = { password: newPassword };
    if (newRole) updateObj.operational_role = newRole;
    if (newLevel) updateObj.account_level = newLevel;

    const { error } = await supabase
      .from("profiles")
      .update(updateObj)
      .eq("user_code", userCode);

    if (error) {
      console.warn("Gagal update password akun:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Exception updateAccountCredentials:", err);
    return false;
  }
}

/**
 * HAPUS AKUN DARI SUPABASE
 */
export async function deleteAccount(userCode: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("user_code", userCode);

    if (error) {
      console.warn("Gagal menghapus akun:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Exception deleteAccount:", err);
    return false;
  }
}
