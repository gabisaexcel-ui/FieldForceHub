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
  creatorAccount?: DemoAccount;
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
    name: "Master Administrator",
    tag: "MASTER",
    description: "Seluruh divisi operasional & manajemen nasional",
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

/**
 * HASH PASSWORD DENGAN STANDAR KRIPTOGRAFI SHA-256
 */
export async function hashPassword(plain: string): Promise<string> {
  const clean = plain.trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(clean);

  if (typeof crypto !== "undefined" && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  return clean;
}

/**
 * VERIFIKASI PASSWORD (MENDUKUNG HASH SHA-256 DAN FALLBACK PLAIN TEXT)
 */
export async function verifyPassword(
  inputPassword: string,
  storedHashOrPlain: string
): Promise<boolean> {
  if (!storedHashOrPlain) return false;
  // Cek kecocokan jika database masih menyimpan plain text
  if (inputPassword.trim() === storedHashOrPlain.trim()) return true;
  // Verifikasi hash SHA-256
  const inputHashed = await hashPassword(inputPassword);
  return inputHashed.toLowerCase() === storedHashOrPlain.trim().toLowerCase();
}

/**
 * DAFTAR RESMI 13 AKUN HIERARKI (1 AKUN = 1 ROLE & 1 STATUS TETAP)
 */
export const hierarchyAccounts = [
  // 1. Master Administrator
  {
    username: "master_admin",
    altCode: "master.all",
    pass: "123",
    role: "ALL" as OperationalRole,
    level: "master" as AccountLevel,
    name: "Siti Firdaus (Master)",
    area: "Nasional",
    position: "Master Administrator",
  },
  // 2. Field Coordinator (FC)
  {
    username: "fc_admin",
    altCode: "admin.fc",
    pass: "123",
    role: "FC" as OperationalRole,
    level: "admin" as AccountLevel,
    name: "Admin Koordinator FC",
    area: "East Java Bali Nusra",
    position: "Admin Divisi FC",
  },
  {
    username: "fc_user",
    altCode: "field.coordinator",
    pass: "123",
    role: "FC" as OperationalRole,
    level: "user" as AccountLevel,
    name: "Siti Firdaus",
    area: "East Java Bali Nusra",
    position: "Field Coordinator Lapangan",
  },
  // 3. Merchandiser (MD)
  {
    username: "md_admin",
    altCode: "admin.md",
    pass: "123",
    role: "MD" as OperationalRole,
    level: "admin" as AccountLevel,
    name: "Admin Merchandiser",
    area: "Surabaya",
    position: "Admin Divisi MD",
  },
  {
    username: "md_user",
    altCode: "GSKMD320",
    pass: "123",
    role: "MD" as OperationalRole,
    level: "user" as AccountLevel,
    name: "Muhamad Faizal Kako Djata",
    area: "Denpasar",
    position: "Merchandiser Lapangan",
  },
  // 4. MD Product Specialist (MDPS)
  {
    username: "mdps_admin",
    altCode: "admin.mdps",
    pass: "123",
    role: "MDPS" as OperationalRole,
    level: "admin" as AccountLevel,
    name: "Admin MDPS",
    area: "Surabaya",
    position: "Admin Divisi MDPS",
  },
  {
    username: "mdps_user",
    altCode: "GSKMD342",
    pass: "123",
    role: "MDPS" as OperationalRole,
    level: "user" as AccountLevel,
    name: "Sindy Ayu Rahmawati",
    area: "Surabaya",
    position: "MD Product Specialist Lapangan",
  },
  // 5. Sales Representative (Salesman)
  {
    username: "sales_admin",
    altCode: "admin.sales",
    pass: "123",
    role: "Salesman" as OperationalRole,
    level: "admin" as AccountLevel,
    name: "Admin Salesman",
    area: "Surabaya",
    position: "Admin Divisi Sales",
  },
  {
    username: "sales_user",
    altCode: "34Q4001",
    pass: "123",
    role: "Salesman" as OperationalRole,
    level: "user" as AccountLevel,
    name: "Mochamad Hanif Aziz",
    area: "Surabaya",
    position: "Sales Representative Lapangan",
  },
  // 6. Territory Sales (TS)
  {
    username: "ts_admin",
    altCode: "admin.ts",
    pass: "123",
    role: "TS" as OperationalRole,
    level: "admin" as AccountLevel,
    name: "Admin Territory Sales",
    area: "Surabaya",
    position: "Admin Divisi TS",
  },
  {
    username: "ts_user",
    altCode: "TS1",
    pass: "123",
    role: "TS" as OperationalRole,
    level: "user" as AccountLevel,
    name: "TS Surabaya & Sekitar",
    area: "Surabaya",
    position: "Territory Sales Lapangan",
  },
  // 7. Key Account Manager (KAM)
  {
    username: "kam_admin",
    altCode: "admin.kam",
    pass: "123",
    role: "KAM" as OperationalRole,
    level: "admin" as AccountLevel,
    name: "Admin Key Account Manager",
    area: "Nasional",
    position: "Admin Divisi KAM",
  },
  {
    username: "kam_user",
    altCode: "KAM1",
    pass: "123",
    role: "KAM" as OperationalRole,
    level: "user" as AccountLevel,
    name: "Bayu Maki (NAM)",
    area: "Nasional",
    position: "National Account Manager Lapangan",
  },
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
 * LOGIN DENGAN USERNAME & PASSWORD MURNI SESUAI IDENTITAS DATABASE
 * Memverifikasi hash cryptographic SHA-256
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

  // Cari apakah input username cocok dengan alias akun hierarki
  const mappedHierarchy = hierarchyAccounts.find(
    (h) =>
      h.username.toLowerCase() === usernameClean ||
      h.altCode.toLowerCase() === usernameClean
  );

  const lookupCodes = mappedHierarchy
    ? [mappedHierarchy.username, mappedHierarchy.altCode]
    : [usernameClean];

  // 1. Cari data murni di database Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      let data: any = null;

      // Coba query kolom username dan user_code
      for (const code of lookupCodes) {
        const res = await supabase
          .from("profiles")
          .select("*")
          .or(`user_code.ilike.${code},username.ilike.${code}`)
          .maybeSingle();

        if (res.data) {
          data = res.data;
          break;
        }
      }

      if (data) {
        // Validasi password terenkripsi / hash SHA-256
        if (data.password) {
          const isMatch = await verifyPassword(passwordClean, data.password);
          if (!isMatch) {
            throw new Error("Password yang Anda masukkan salah!");
          }
        }

        const role = (data.operational_role as OperationalRole) || mappedHierarchy?.role || "FC";
        const level = (data.account_level as AccountLevel) || mappedHierarchy?.level || "user";
        const initials = (data.full_name || usernameClean)
          .split(" ")
          .map((p: string) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();

        const account: DemoAccount = {
          id: data.id || `user-${usernameClean}`,
          code: data.user_code || usernameClean,
          username: mappedHierarchy?.username || data.username || data.user_code || usernameClean,
          password: data.password || passwordClean,
          name: data.full_name || usernameClean,
          initials,
          level,
          role,
          division: data.division_code || role,
          area: data.area_code || "Surabaya",
          position:
            data.position ||
            (level === "master"
              ? "Master Administrator"
              : level === "admin"
              ? `Admin Divisi ${role}`
              : `Manpower ${role} Lapangan`),
          phone: data.phone || "083854377989",
          gender: (data.gender as any) || "Laki-laki",
          address: data.address || `Area ${role}`,
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

  // 2. Fallback ke akun hierarki jika Supabase offline / belum tersinkron
  if (mappedHierarchy) {
    if (mappedHierarchy.pass !== passwordClean) {
      throw new Error("Password salah! (Password default: 123)");
    }

    const initials = mappedHierarchy.name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const account: DemoAccount = {
      id: `${mappedHierarchy.username}-id`,
      code: mappedHierarchy.altCode,
      username: mappedHierarchy.username,
      password: mappedHierarchy.pass,
      name: mappedHierarchy.name,
      initials,
      level: mappedHierarchy.level,
      role: mappedHierarchy.role,
      division: mappedHierarchy.role,
      area: mappedHierarchy.area,
      position: mappedHierarchy.position,
      phone: "083854377989",
      gender: "Laki-laki",
      joinDate: new Date().toLocaleDateString("id-ID"),
      address: `Basecamp ${mappedHierarchy.role} - ${mappedHierarchy.area}`,
      mapsUrl: "https://maps.google.com/?q=-7.2575,112.7521",
    };

    saveSession(account);
    return account;
  }

  throw new Error(
    `Akun "${usernameClean}" tidak terdaftar! Hubungi Admin Divisi atau Master untuk pembuatan akun.`
  );
}

/**
 * CEK HAK AKSES PEMBUATAN AKUN SESUAI HIERARKI
 */
export function canRegisterAccount(
  creator: DemoAccount,
  targetDivision: OperationalRole,
  targetLevel: AccountLevel
): { allowed: boolean; reason?: string } {
  if (creator.level === "master") {
    return { allowed: true };
  }

  if (creator.level === "admin") {
    if (targetLevel === "admin" || targetLevel === "master") {
      return {
        allowed: false,
        reason: "Admin divisi tidak dapat membuat akun Admin lain atau Master. Hanya Master yang memiliki hak akses ini.",
      };
    }
    if (targetDivision !== creator.role) {
      return {
        allowed: false,
        reason: `Admin divisi ${creator.role} hanya dapat membuat akun User untuk divisi ${creator.role}.`,
      };
    }
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "User lapangan tidak memiliki izin untuk mendaftarkan akun baru.",
  };
}

/**
 * REGISTRASI AKUN BARU DENGAN PASSWORD TERHASH KE SUPABASE
 */
export async function registerNewAccount(params: RegisterParams): Promise<DemoAccount> {
  const usernameClean = params.username.trim().toLowerCase();
  const passwordClean = params.password.trim();

  if (!usernameClean) throw new Error("Username tidak boleh kosong!");
  if (!passwordClean) throw new Error("Password tidak boleh kosong!");
  if (!params.fullName.trim()) throw new Error("Nama lengkap harus diisi!");

  // Validasi hierarki jika ada akun pembuat
  if (params.creatorAccount) {
    const check = canRegisterAccount(
      params.creatorAccount,
      params.division,
      params.level
    );
    if (!check.allowed) {
      throw new Error(check.reason);
    }
  }

  const initials =
    params.fullName
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

  // Hash password sebelum disimpan
  const hashedPassword = await hashPassword(passwordClean);

  if (isSupabaseConfigured && supabase) {
    try {
      // Cek apakah user_code atau username sudah ada
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .or(`user_code.eq.${usernameClean},username.eq.${usernameClean}`)
        .maybeSingle();

      if (existing) {
        throw new Error(`Username "${usernameClean}" sudah digunakan! Silakan gunakan username lain.`);
      }

      const payload: any = {
        user_code: usernameClean,
        username: usernameClean,
        password: hashedPassword,
        full_name: params.fullName.trim(),
        operational_role: params.division,
        division_code: params.division === "Salesman" ? "SALES" : params.division,
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

      const { data: inserted, error } = await supabase
        .from("profiles")
        .insert(payload)
        .select("*")
        .single();

      if (error) {
        console.warn("Supabase register warning:", error.message);
      } else if (inserted) {
        newId = inserted.id;
      }
    } catch (err: any) {
      if (err.message && err.message.includes("sudah digunakan")) {
        throw err;
      }
      console.warn("Supabase register error:", err);
    }
  }

  const newAccount: DemoAccount = {
    id: newId || `user-${usernameClean}`,
    code: usernameClean,
    username: usernameClean,
    password: hashedPassword,
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

  return newAccount;
}

/**
 * AMBIL SEMUA AKUN DARI SUPABASE UNTUK PANEL KELOLA AKUN
 */
export async function fetchAllAccounts(): Promise<DemoAccount[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => {
          const matched = hierarchyAccounts.find(
            (h) => h.altCode === d.user_code || h.username === d.user_code || h.username === d.username
          );

          const username = d.username || matched?.username || d.user_code;
          const role = (d.operational_role as OperationalRole) || matched?.role || "FC";
          const level = (d.account_level as AccountLevel) || matched?.level || "user";

          return {
            id: d.id || d.user_code,
            code: d.user_code,
            username,
            password: d.password || "••••••••",
            name: d.full_name || d.user_code,
            initials: (d.full_name || d.user_code)
              .split(" ")
              .map((p: string) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase(),
            level,
            role,
            division: d.division_code || role,
            area: d.area_code || "Surabaya",
            phone: d.phone || "",
            position: d.position || (level === "admin" ? `Admin ${role}` : `${role} Lapangan`),
            gender: d.gender || "Laki-laki",
            address: d.address || "",
            mapsUrl: d.maps_url || "",
            joinDate: d.join_date || "",
          };
        });
      }
    } catch (err) {
      console.warn("fetchAllAccounts error:", err);
    }
  }

  // Fallback
  return hierarchyAccounts.map((h) => ({
    id: `${h.username}-id`,
    code: h.altCode,
    username: h.username,
    password: h.pass,
    name: h.name,
    initials: h.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase(),
    level: h.level,
    role: h.role,
    division: h.role,
    area: h.area,
    position: h.position,
    phone: "083854377989",
    gender: "Laki-laki",
    address: `Basecamp ${h.role} - ${h.area}`,
    joinDate: "01/07/2024",
  }));
}

/**
 * UPDATE KREDENSIAL / PASSWORD AKUN DI SUPABASE (DENGAN ENKRIPSI HASH)
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
    const updateObj: any = {};
    if (newPassword) {
      updateObj.password = await hashPassword(newPassword);
    }
    if (newRole) updateObj.operational_role = newRole;
    if (newLevel) updateObj.account_level = newLevel;

    const { error } = await supabase
      .from("profiles")
      .update(updateObj)
      .eq("user_code", userCode);

    if (error) {
      console.warn("Gagal update credentials akun:", error.message);
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
