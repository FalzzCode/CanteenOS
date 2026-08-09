import { supabase } from "./client";

export type OpenShift = {
  id: string;
  outletId: string;
};

export async function getOpenShift(outletId: string): Promise<OpenShift | null> {
  if (!supabase || !outletId) return null;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;

  const { data, error } = await supabase
    .from("shifts")
    .select("id, outlet_id")
    .eq("outlet_id", outletId)
    .eq("cashier_id", userData.user.id)
    .eq("status", "open")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return { id: data.id, outletId: data.outlet_id };
}
