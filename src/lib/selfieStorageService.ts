/**
 * =========================================================================
 * FieldForce Hub - Selfie Local Storage Service
 * Penyimpanan lokal foto presensi (IndexedDB + Memory Cache + Fallback)
 * Menampung foto selfie sebelum integrasi langsung Cloudflare R2
 * =========================================================================
 */

const DB_NAME = "fieldforce_hub_storage";
const DB_VERSION = 1;
const STORE_NAME = "attendance_selfies";

// In-memory cache agar foto dapat langsung tampil secara sinkron & cepat
const memoryCache = new Map<string, string>();

/**
 * Membuka koneksi IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB tidak didukung pada lingkungan ini"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Menyimpan data foto selfie (DataURL) ke penyimpanan lokal
 * @param key identifier path, misal: r2://attendance/selfies/MD1_2026-10-13_160000.jpg
 * @param dataUrl base64 string gambar
 */
export async function saveSelfieLocally(key: string, dataUrl: string): Promise<string> {
  // Simpan di memori terlebih dahulu
  memoryCache.set(key, dataUrl);

  // Simpan juga ke localStorage sebagai secondary backup (jika muat)
  try {
    localStorage.setItem(`ff_selfie:${key}`, dataUrl);
  } catch (_) {
    // Abaikan jika localStorage penuh
  }

  // Simpan ke IndexedDB untuk persistensi jangka panjang tanpa limit 5MB
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ key, dataUrl, savedAt: new Date().toISOString() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Gagal simpan selfie ke IndexedDB:", err);
  }

  return key;
}

/**
 * Mengambil data foto selfie dari penyimpanan lokal
 */
export async function getSelfieLocally(key: string): Promise<string | null> {
  if (!key) return null;

  // 1. Cek memory cache
  if (memoryCache.has(key)) {
    return memoryCache.get(key) || null;
  }

  // 2. Cek localStorage backup
  const localVal = localStorage.getItem(`ff_selfie:${key}`);
  if (localVal) {
    memoryCache.set(key, localVal);
    return localVal;
  }

  // 3. Ambil dari IndexedDB
  try {
    const db = await openDB();
    const result = await new Promise<{ key: string; dataUrl: string } | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (result?.dataUrl) {
      memoryCache.set(key, result.dataUrl);
      return result.dataUrl;
    }
  } catch (err) {
    console.warn("Gagal membaca selfie dari IndexedDB:", err);
  }

  return null;
}

/**
 * Menghapus foto selfie dari penyimpanan lokal
 */
export async function deleteSelfieLocally(key: string): Promise<void> {
  memoryCache.delete(key);
  try {
    localStorage.removeItem(`ff_selfie:${key}`);
  } catch (_) {}

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Gagal hapus selfie dari IndexedDB:", err);
  }
}

/**
 * Generate key unik standar Cloudflare R2 untuk selfie presensi
 */
export function generateSelfieKey(userCode: string, workDate: string): string {
  const cleanCode = (userCode || "user").replace(/[^a-zA-Z0-9_-]/g, "_");
  const timestamp = Date.now();
  return `r2://attendance/selfies/${cleanCode}_${workDate}_${timestamp}.jpg`;
}

/**
 * Kompres gambar (file atau blob) menjadi DataURL JPEG optimal
 */
export function compressImageToDataUrl(
  fileOrBlob: Blob | File | string,
  maxWidth = 720,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof fileOrBlob === "string") {
      // Jika sudah berupa dataUrl
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(fileOrBlob);

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(fileOrBlob);
      img.src = fileOrBlob;
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(src);

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.onerror = reject;
    reader.readAsDataURL(fileOrBlob);
  });
}
