import { CheckCircle2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LoginPage } from "./components/LoginPage";
import { PageContent } from "./components/PageContent";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { navigation } from "./data/navigation";
import { useRealtimeSync } from "./hooks/useRealtimeSync";
import { visibleModules } from "./lib/access";
import {
  clearSession,
  getSession,
  operationalDivisions,
  saveSession,
} from "./lib/authService";
import { fetchProfile } from "./lib/profileService";
import type { DemoAccount, ModuleKey, OperationalRole } from "./types";

const validModules: ModuleKey[] = [
  "dashboard",
  "attendance",
  "leave",
  "skp",
  "programs",
  "sellout",
  "expenses",
  "violations",
  "reports",
  "users",
  "master-data",
  "settings",
];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [account, setAccount] = useState<DemoAccount | null>(() => getSession());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Parse path: /:division or /:division/:module
  const { currentDivision, currentModule } = useMemo(() => {
    const rawSegments = location.pathname.split("/").filter(Boolean);
    const defaultRole = account?.role || "FC";

    if (rawSegments.length === 0) {
      return { currentDivision: defaultRole, currentModule: "dashboard" as ModuleKey };
    }

    const first = rawSegments[0];
    const matchedDiv = operationalDivisions.find(
      (d) => d.toLowerCase() === first.toLowerCase()
    );

    if (matchedDiv) {
      const second = rawSegments[1] as ModuleKey | undefined;
      const mod = second && validModules.includes(second) ? second : "dashboard";
      return { currentDivision: matchedDiv, currentModule: mod };
    }

    // Direct module path e.g. /attendance
    if (validModules.includes(first as ModuleKey)) {
      return { currentDivision: defaultRole, currentModule: first as ModuleKey };
    }

    return { currentDivision: defaultRole, currentModule: "dashboard" as ModuleKey };
  }, [location.pathname, account?.role]);

  const activeModule = currentModule;

  // Realtime hook
  const sync = useCallback(
    () => window.dispatchEvent(new CustomEvent("fieldforce:data-changed")),
    []
  );
  const dummyAccount: DemoAccount = account || {
    id: "guest",
    name: "Guest",
    initials: "GU",
    level: "user",
    role: "FC",
    division: "FC",
    area: "Nasional",
  };
  const realtimeConnected = useRealtimeSync(dummyAccount, sync);

  // Jika belum login, pastikan diarahkan ke /login
  useEffect(() => {
    if (!account) {
      if (location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
    }
  }, [account, location.pathname, navigate]);

  // Jika sudah login tapi buka /login atau root '/', arahkan ke /:division
  useEffect(() => {
    if (account) {
      if (location.pathname === "/" || location.pathname === "/login") {
        navigate(`/${account.role}`, { replace: true });
      }
    }
  }, [account, location.pathname, navigate]);

  // Sinkronisasi rute divisi jika user mengetik URL divisi lain (misal /MD atau /FC)
  useEffect(() => {
    if (account && currentDivision !== account.role) {
      const updated: DemoAccount = {
        ...account,
        role: currentDivision,
        division: currentDivision,
      };
      setAccount(updated);
      saveSession(updated);
    }
  }, [currentDivision, account]);

  // Sinkronisasi data profil dari Supabase saat akun berubah
  useEffect(() => {
    if (!account) return;
    let cancelled = false;
    void fetchProfile(account).then((loaded) => {
      if (!cancelled && JSON.stringify(loaded) !== JSON.stringify(account)) {
        setAccount(loaded);
        saveSession(loaded);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [account?.id]);

  // Event listener saat profil diperbarui
  useEffect(() => {
    const handleProfileUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<DemoAccount>;
      if (customEvent.detail && account && customEvent.detail.id === account.id) {
        setAccount(customEvent.detail);
        saveSession(customEvent.detail);
      }
    };
    window.addEventListener("fieldforce:profile-updated", handleProfileUpdated);
    return () => {
      window.removeEventListener("fieldforce:profile-updated", handleProfileUpdated);
    };
  }, [account]);

  // Timeout toast
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  // Validasi hak akses modul yang diizinkan untuk divisi & level ini
  useEffect(() => {
    if (!account) return;
    const allowed = visibleModules(account);
    if (!allowed.includes(activeModule)) {
      navigate(`/${account.role}`, { replace: true });
    }
  }, [account, activeModule, navigate]);

  // Navigasi dengan prefix divisi URL (cth: /FC/attendance atau /MD/programs)
  const navigateTo = (key: ModuleKey) => {
    if (!account) return;
    const target = key === "dashboard" ? `/${account.role}` : `/${account.role}/${key}`;
    navigate(target);
  };

  const handleLoginSuccess = (newAccount: DemoAccount, divisionPath: string) => {
    setAccount(newAccount);
    navigate(divisionPath, { replace: true });
    setToast(`Selamat datang, ${newAccount.name} (${newAccount.role} • ${newAccount.level.toUpperCase()})!`);
  };

  const handleLogout = () => {
    clearSession();
    setAccount(null);
    navigate("/login", { replace: true });
    setToast("Berhasil keluar dari sesi akun.");
  };

  // Tampilkan halaman Login jika belum login
  if (!account) {
    return (
      <>
        <LoginPage onLoginSuccess={handleLoginSuccess} />
        {toast && (
          <div className="toast" role="status">
            <CheckCircle2 size={19} />
            <span>{toast}</span>
            <button onClick={() => setToast(null)} aria-label="Tutup">
              <X size={16} />
            </button>
          </div>
        )}
      </>
    );
  }

  const activeMeta = navigation
    .flatMap((group) => group.items)
    .find((item) => item.key === activeModule);

  return (
    <div className="app-shell">
      <Sidebar
        account={account}
        active={activeModule}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={navigateTo}
        onLogout={handleLogout}
      />
      <div className="app-main">
        <Topbar
          account={account}
          realtimeConnected={realtimeConnected}
          onAccountChange={(updated) => {
            setAccount(updated);
            saveSession(updated);
          }}
          onOpenMenu={() => setSidebarOpen(true)}
          onToast={setToast}
          onLogout={handleLogout}
        />
        <main className="page-content" aria-label={activeMeta?.label}>
          <PageContent
            active={activeModule}
            account={account}
            onToast={setToast}
            onNavigate={navigateTo}
            onAccountChange={(updated) => {
              setAccount(updated);
              saveSession(updated);
            }}
          />
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          <span>{toast}</span>
          <button onClick={() => setToast(null)} aria-label="Tutup">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
