import type { ProfileRecord } from "../lib/domain";
import type { RealtimeConnectionStatus } from "../lib/supabase/realtime";

export type CustomerPortalProduct = {
  id: number | string;
  name: string;
  category: string;
  price: number;
  stock: number;
  emoji: string;
  tone: string;
  imageUrl?: string | null;
};

export type CustomerPortalProps = {
  profile: ProfileRecord;
  catalog: CustomerPortalProduct[];
  onLogout: () => void | Promise<void>;
  realtimeStatus: RealtimeConnectionStatus;
};
