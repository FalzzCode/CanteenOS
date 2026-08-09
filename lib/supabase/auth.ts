import type { AuthError } from "@supabase/supabase-js";

import type { ProfileRecord } from "../domain";
import { supabase } from "./client";

export type AuthResult = {
  error: AuthError | Error | null;
  demoMode: boolean;
};

export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  if (!supabase) return { error: null, demoMode: true };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error, demoMode: false };
}

export async function signInWithGoogle(): Promise<AuthResult> {
  if (!supabase) return { error: null, demoMode: true };

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
  return { error, demoMode: false };
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  if (!supabase) return { error: null, demoMode: true };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { error, demoMode: false };
}

export async function signOut(): Promise<AuthResult> {
  if (!supabase) return { error: null, demoMode: true };

  const { error } = await supabase.auth.signOut();
  return { error, demoMode: false };
}

export async function getActiveProfile(): Promise<ProfileRecord | null> {
  if (!supabase) return null;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, status, default_outlet_id")
    .eq("id", userData.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    fullName: data.full_name,
    role: data.role,
    status: data.status,
    defaultOutletId: data.default_outlet_id,
  };
}
