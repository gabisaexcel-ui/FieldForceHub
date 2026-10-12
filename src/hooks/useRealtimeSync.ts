import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { DemoAccount } from "../types";

export function useRealtimeSync(account: DemoAccount, onChange: () => void) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setConnected(true);
      return;
    }

    const topic = account.level === "master"
      ? "scope:all"
      : `scope:${account.division.toLowerCase()}:${account.area.toLowerCase()}`;

    const channel = client
      .channel(topic, { config: { private: true } })
      .on("broadcast", { event: "data_changed" }, () => onChange())
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    return () => {
      void client.removeChannel(channel);
    };
  }, [account, onChange]);

  return connected;
}
