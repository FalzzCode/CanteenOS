import { supabase } from "./client";

export type RealtimeConnectionStatus = "demo" | "connecting" | "connected" | "reconnecting" | "error";

export type RealtimeArea = "sales" | "inventory" | "catalog" | "shift" | "purchasing" | "profile" | "all";

export type OutletRealtimeEvent = {
  area: RealtimeArea;
  table: string;
  eventType: string;
  receivedAt: number;
};

type OutletRealtimeOptions = {
  outletId: string;
  profileId?: string;
  shiftId?: string;
  onEvent: (event: OutletRealtimeEvent) => void;
  onStatus: (status: RealtimeConnectionStatus) => void;
};

const outletTables: Array<{ table: string; area: RealtimeArea }> = [
  { table: "sales", area: "sales" },
  { table: "inventory_items", area: "inventory" },
  { table: "products", area: "catalog" },
  { table: "shifts", area: "shift" },
  { table: "purchase_orders", area: "purchasing" },
  { table: "refund_requests", area: "sales" },
  { table: "stock_movements", area: "inventory" },
  { table: "expenses", area: "purchasing" },
];

export function subscribeToOutletRealtime({ outletId, profileId, shiftId, onEvent, onStatus }: OutletRealtimeOptions): () => void {
  if (!supabase || outletId === "demo") {
    onStatus("demo");
    return () => undefined;
  }

  const client = supabase;
  const channelId = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let channel = client.channel(`kantinkita-outlet-${outletId}-${channelId}`);

  for (const subscription of outletTables) {
    channel = channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: subscription.table,
        filter: `outlet_id=eq.${outletId}`,
      },
      (payload) => onEvent({
        area: subscription.area,
        table: subscription.table,
        eventType: payload.eventType,
        receivedAt: Date.now(),
      }),
    );
  }

  if (profileId) {
    channel = channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "profiles",
        filter: `id=eq.${profileId}`,
      },
      (payload) => onEvent({
        area: "profile",
        table: "profiles",
        eventType: payload.eventType,
        receivedAt: Date.now(),
      }),
    );
  }

  if (shiftId && shiftId !== "demo") {
    channel = channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "cash_movements",
        filter: `shift_id=eq.${shiftId}`,
      },
      (payload) => onEvent({
        area: "shift",
        table: "cash_movements",
        eventType: payload.eventType,
        receivedAt: Date.now(),
      }),
    );
  }

  onStatus("connecting");
  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") onStatus("connected");
    else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") onStatus("error");
    else if (status === "CLOSED" && navigator.onLine) onStatus("reconnecting");
  });

  const handleOffline = () => onStatus("reconnecting");
  const handleOnline = () => {
    onStatus("connecting");
    onEvent({ area: "all", table: "connection", eventType: "RESYNC", receivedAt: Date.now() });
  };
  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      onEvent({ area: "all", table: "visibility", eventType: "RESYNC", receivedAt: Date.now() });
    }
  };

  window.addEventListener("offline", handleOffline);
  window.addEventListener("online", handleOnline);
  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
    window.removeEventListener("offline", handleOffline);
    window.removeEventListener("online", handleOnline);
    document.removeEventListener("visibilitychange", handleVisibility);
    void client.removeChannel(channel);
  };
}

export const realtimeStatusCopy: Record<RealtimeConnectionStatus, string> = {
  demo: "Demo lokal",
  connecting: "Menghubungkan realtime",
  connected: "Realtime aktif",
  reconnecting: "Menyambung ulang",
  error: "Sinkronisasi terganggu",
};

export function subscribeToAuthChanges(onChange: (event: string) => void): () => void {
  if (!supabase) return () => undefined;
  const { data } = supabase.auth.onAuthStateChange((event) => onChange(event));
  return () => data.subscription.unsubscribe();
}
