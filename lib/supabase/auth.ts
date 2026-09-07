import type { AuthError, User } from "@supabase/supabase-js";

import type { AccountRole, AppRole, ProfileRecord, ProfileStatus } from "../domain";
import { supabase } from "./client";

const googleAuthIntentStorageKey = "kantinkita:google-auth-intent";
const googleAuthIntentQueryKey = "auth";
const googleCustomerOnlyMessage = "Login Google hanya tersedia untuk pelanggan. Admin gunakan email dan password kerja.";

function clearGoogleAuthIntent() {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(googleAuthIntentStorageKey);
    const url = new URL(window.location.href);
    if (url.searchParams.get(googleAuthIntentQueryKey) !== "google") return;

    url.searchParams.delete(googleAuthIntentQueryKey);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // Private browsing can block sessionStorage/history; the provider metadata check still applies.
  }
}

function markGoogleAuthIntent() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(googleAuthIntentStorageKey, "1");
  } catch {
    // OAuth can continue without the browser marker; Supabase metadata remains the source of truth.
  }
}

function consumeGoogleAuthIntent(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const url = new URL(window.location.href);
    const queryIntent = url.searchParams.get(googleAuthIntentQueryKey) === "google";
    const storedIntent = window.sessionStorage.getItem(googleAuthIntentStorageKey) === "1";
    window.sessionStorage.removeItem(googleAuthIntentStorageKey);

    if (queryIntent) {
      url.searchParams.delete(googleAuthIntentQueryKey);
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }

    return queryIntent || storedIntent;
  } catch {
    return false;
  }
}

function isGoogleAuthenticatedUser(user: User): boolean {
  // app_metadata is managed by Supabase, unlike raw_user_meta_data. The browser intent
  // closes the gap for an email-first account that later signs in through Google.
  const browserIntent = consumeGoogleAuthIntent();
  return user.app_metadata?.provider === "google" || browserIntent;
}

export type AuthResult = {
  error: AuthError | Error | null;
  demoMode: boolean;
  sessionCreated?: boolean;
};

export type AccessFailureReason =
  | "not_authenticated"
  | "profile_missing"
  | "profile_inactive"
  | "role_mismatch"
  | "role_escalation_blocked"
  | "google_admin_blocked"
  | "admin_requirements"
  | "profile_lookup_failed";

export type AuthorizedProfileResult = {
  profile: ProfileRecord | null;
  error: AuthError | Error | null;
  reason?: AccessFailureReason;
  message?: string;
};

export type ProfileUpdateResult = {
  profile: ProfileRecord | null;
  error: AuthError | Error | null;
  demoMode: boolean;
};

export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  clearGoogleAuthIntent();
  if (!supabase) return { error: null, demoMode: true };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error, demoMode: false };
}

export async function signInWithGoogle(accountRole: AccountRole = "customer"): Promise<AuthResult> {
  if (accountRole !== "customer") {
    return { error: new Error(googleCustomerOnlyMessage), demoMode: false };
  }

  if (!supabase) return { error: null, demoMode: true };

  markGoogleAuthIntent();
  const redirectTo = new URL(window.location.origin);
  redirectTo.searchParams.set(googleAuthIntentQueryKey, "google");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectTo.toString() },
  });
  if (error) clearGoogleAuthIntent();
  return { error, demoMode: false };
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  if (!supabase) return { error: null, demoMode: true };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { error, demoMode: false };
}

export async function signUpAsCustomer(fullName: string, email: string, password: string): Promise<AuthResult> {
  if (!supabase) return { error: null, demoMode: true };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  return { error, demoMode: false, sessionCreated: Boolean(data.session) };
}

export async function signOut(): Promise<AuthResult> {
  if (!supabase) return { error: null, demoMode: true };

  const { error } = await supabase.auth.signOut();
  return { error, demoMode: false };
}

export async function getAuthorizedProfile(expectedRole?: AccountRole): Promise<AuthorizedProfileResult> {
  if (!supabase) {
    return {
      profile: null,
      error: null,
      reason: "not_authenticated",
      message: "Autentikasi Supabase belum dikonfigurasi.",
    };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return {
      profile: null,
      error: userError,
      reason: "not_authenticated",
      message: "Sesi login tidak ditemukan.",
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, account_role, status, employee_code, admin_approved_at, default_outlet_id")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (error) {
    return {
      profile: null,
      error,
      reason: "profile_lookup_failed",
      message: "Profil akun belum siap. Pastikan migration role akun sudah diterapkan.",
    };
  }

  if (!data) {
    return {
      profile: null,
      error: null,
      reason: "profile_missing",
      message: "Profil akun belum dibuat. Hubungi administrator sekolah.",
    };
  }

  const accountRole = data.account_role as AccountRole;
  const profile: ProfileRecord = {
    id: data.id,
    fullName: data.full_name,
    avatarUrl: data.avatar_url ?? null,
    role: data.role as AppRole,
    accountRole,
    status: data.status as ProfileStatus,
    employeeCode: data.employee_code ?? null,
    adminApprovedAt: data.admin_approved_at ?? null,
    defaultOutletId: data.default_outlet_id ?? null,
  };

  if (isGoogleAuthenticatedUser(userData.user) && profile.accountRole !== "customer") {
    return {
      profile: null,
      error: null,
      reason: "google_admin_blocked",
      message: googleCustomerOnlyMessage,
    };
  }

  if (profile.status !== "active") {
    return {
      profile: null,
      error: null,
      reason: "profile_inactive",
      message: "Akun belum aktif. Minta administrator sekolah mengaktifkannya terlebih dahulu.",
    };
  }

  if (expectedRole && profile.accountRole !== expectedRole) {
    const customerRequestedAdmin = expectedRole === "admin" && profile.accountRole === "customer";
    return {
      profile: null,
      error: null,
      reason: customerRequestedAdmin ? "role_escalation_blocked" : "role_mismatch",
      message: customerRequestedAdmin
        ? "Akses admin ditolak. Akun pelanggan tidak dapat menjadi admin sekolah."
        : "Akun ini adalah akun operasional sekolah, bukan akun pelanggan.",
    };
  }

  if (profile.accountRole === "admin") {
    const missingAdminRequirement = !userData.user.email_confirmed_at
      ? "Email admin belum terverifikasi."
      : !profile.employeeCode
        ? "Employee code admin belum diisi."
        : !profile.adminApprovedAt
          ? "Akun admin belum disetujui administrator."
          : !profile.defaultOutletId
            ? "Outlet default admin belum ditetapkan."
            : null;

    if (missingAdminRequirement) {
      return {
        profile: null,
        error: null,
        reason: "admin_requirements",
        message: missingAdminRequirement,
      };
    }
  }

  return {
    profile,
    error: null,
  };
}

export async function getActiveProfile(): Promise<ProfileRecord | null> {
  return (await getAuthorizedProfile()).profile;
}

export async function updateProfileSettings(fullName: string, avatarFile?: File): Promise<ProfileUpdateResult> {
  if (!supabase) return { profile: null, error: null, demoMode: true };

  const normalizedName = fullName.trim();
  if (normalizedName.length < 2) {
    return { profile: null, error: new Error("Nama minimal 2 karakter."), demoMode: false };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { profile: null, error: userError ?? new Error("Sesi login tidak ditemukan."), demoMode: false };
  }

  let avatarUrl: string | undefined;
  if (avatarFile) {
    const extension = avatarFile.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const avatarPath = `${userData.user.id}/profile.${extension}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(avatarPath, avatarFile, {
      cacheControl: "3600",
      contentType: avatarFile.type,
      upsert: true,
    });
    if (uploadError) return { profile: null, error: uploadError, demoMode: false };
    const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(avatarPath);
    avatarUrl = `${publicUrl.publicUrl}?v=${Date.now()}`;
  }

  const updates: { full_name: string; avatar_url?: string } = { full_name: normalizedName };
  if (avatarUrl) updates.avatar_url = avatarUrl;
  const { error: profileError } = await supabase.from("profiles").update(updates).eq("id", userData.user.id);
  if (profileError) return { profile: null, error: profileError, demoMode: false };

  const authorization = await getAuthorizedProfile();
  return { profile: authorization.profile, error: authorization.error, demoMode: false };
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<AuthResult> {
  if (!supabase) return { error: null, demoMode: true };
  if (newPassword.length < 8) return { error: new Error("Password baru minimal 8 karakter."), demoMode: false };

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const email = userData.user?.email;
  if (userError || !email) return { error: userError ?? new Error("Email akun tidak ditemukan."), demoMode: false };

  const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  if (verifyError) return { error: new Error("Password saat ini tidak sesuai."), demoMode: false };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error, demoMode: false };
}
