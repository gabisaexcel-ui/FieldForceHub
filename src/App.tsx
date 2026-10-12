import { CheckCircle2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageContent } from "./components/PageContent";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { demoAccounts } from "./data/mockData";
import { navigation } from "./data/navigation";
import { useRealtimeSync } from "./hooks/useRealtimeSync";
import { visibleModules } from "./lib/access";
import type { DemoAccount, ModuleKey } from "./types";

const pathByModule: Record<ModuleKey, string> = {
  dashboard: "/dashboard",
  attendance: "/attendance",
  leave: "/leave",
  skp: "/skp",
  programs: "/programs",
  sellout: "/sellout",
  expenses: "/expenses",
  violations: "/violations",
  reports: "/reports",
  users: "/users",
  "master-data": "/master-data",
  settings: "/settings",
};

const moduleByPath = Object.fromEntries(Object.entries(pathByModule).map(([key, value]) => [value, key])) as Record<string, ModuleKey>;

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [account, setAccount] = useState<DemoAccount>(demoAccounts[0]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const active = moduleByPath[location.pathname] ?? "dashboard";
  const sync = useCallback(() => window.dispatchEvent(new CustomEvent("fieldforce:data-changed")), []);
  const realtimeConnected = useRealtimeSync(account, sync);

  useEffect(() => {
    if (location.pathname === "/" || !moduleByPath[location.pathname]) navigate("/dashboard", { replace: true });
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!visibleModules(account).includes(active)) navigate("/dashboard", { replace: true });
  }, [account, active, navigate]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const navigateTo = (key: ModuleKey) => navigate(pathByModule[key]);
  const activeMeta = navigation.flatMap((group) => group.items).find((item) => item.key === active);

  return (
    <div className="app-shell">
      <Sidebar account={account} active={active} open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNavigate={navigateTo} />
      <div className="app-main">
        <Topbar account={account} realtimeConnected={realtimeConnected} onAccountChange={setAccount} onOpenMenu={() => setSidebarOpen(true)} />
        <main className="page-content" aria-label={activeMeta?.label}>
          <PageContent active={active} account={account} onToast={setToast} />
        </main>
      </div>
      {toast && <div className="toast" role="status"><CheckCircle2 size={19}/><span>{toast}</span><button onClick={() => setToast(null)} aria-label="Tutup"><X size={16}/></button></div>}
    </div>
  );
}
