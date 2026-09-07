"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import type { AccountRole, ProfileRecord } from "../lib/domain";
import {
  getAuthorizedProfile,
  requestPasswordReset,
  signInWithGoogle,
  signInWithPassword,
  signOut,
  signUpAsCustomer,
} from "../lib/supabase/auth";
import { isSupabaseConfigured } from "../lib/supabase/client";
import { prepareAuthMotion } from "./page-motion";
import { CanteenOSMark, UiIcon } from "./ui-icons";

const demoAdminEmail = ((import.meta.env.VITE_DEMO_ADMIN_EMAIL as string | undefined) ?? "admin@sekolah.sch.id")
  .trim()
  .toLowerCase();

const demoAdminProfile: ProfileRecord = {
  id: "demo-admin",
  fullName: "Ayu Nuraini",
  role: "manager",
  accountRole: "admin",
  status: "active",
  employeeCode: "DEMO-ADMIN",
  adminApprovedAt: "2026-01-01T00:00:00.000Z",
  defaultOutletId: "demo",
};

const makeDemoCustomerProfile = (fullName: string): ProfileRecord => ({
  id: "demo-customer",
  fullName: fullName || "Pelanggan Demo",
  role: "viewer",
  accountRole: "customer",
  status: "active",
  defaultOutletId: "demo",
});

export function AuthScreen({ onLoginSuccess, initialError = "" }: { onLoginSuccess: (profile?: ProfileRecord) => void | Promise<void>; initialError?: string }) {
  const [accountRole, setAccountRole] = useState<AccountRole>("admin");
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState("");
  const authScreenRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const screen = authScreenRef.current;
    if (!screen) return;
    let cleanup: (() => void) | undefined;
    const frame = window.requestAnimationFrame(() => {
      cleanup = prepareAuthMotion(screen);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      cleanup?.();
    };
  }, [accountRole, isSignUp]);

  const selectRole = (nextRole: AccountRole) => {
    setAccountRole(nextRole);
    setIsSignUp(false);
    setError("");
    setNotice("");
  };

  const finishDemoLogin = (authMethod: "password" | "google" = "password") => {
    if (authMethod === "password" && password.length < 8) {
      setError("Mode demo membutuhkan password minimal 8 karakter.");
      return;
    }

    if (accountRole === "admin" && email.trim().toLowerCase() !== demoAdminEmail) {
      setError("Akses admin ditolak. Gunakan akun admin demo yang sudah disediakan sekolah.");
      return;
    }

    const profile = accountRole === "admin" ? demoAdminProfile : makeDemoCustomerProfile(fullName.trim());
    setNotice(accountRole === "admin" ? "Demo admin aktif. Workspace operasional dibuka." : "Demo pelanggan aktif. Portal menu dibuka.");
    window.setTimeout(() => onLoginSuccess(profile), 450);
  };

  const handlePasswordLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    setBusy(true);
    try {
      const result = await signInWithPassword(email.trim(), password);
      if (result.error) {
        setError(result.error.message);
      } else if (result.demoMode) {
        finishDemoLogin("password");
      } else {
        const authorization = await getAuthorizedProfile(accountRole);
        if (authorization.profile) {
          onLoginSuccess(authorization.profile);
        } else {
          await signOut();
          setError(authorization.message ?? "Akun belum memiliki akses ke portal ini.");
        }
      }
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login gagal. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  const handleCustomerSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!fullName.trim() || !email.trim() || !password) {
      setError("Nama, email, dan password wajib diisi.");
      return;
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setBusy(true);
    try {
      const result = await signUpAsCustomer(fullName.trim(), email.trim(), password);
      if (result.error) {
        setError(result.error.message);
      } else if (result.demoMode) {
        setIsSignUp(false);
        setNotice("Demo: akun pelanggan siap. Masuk dengan email dan password yang sama.");
      } else if (result.sessionCreated) {
        const authorization = await getAuthorizedProfile("customer");
        if (authorization.profile) onLoginSuccess(authorization.profile);
        else setNotice("Akun dibuat. Cek email untuk verifikasi sebelum masuk.");
      } else {
        setIsSignUp(false);
        setNotice("Akun pelanggan dibuat. Cek email untuk verifikasi sebelum masuk.");
      }
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : "Pendaftaran gagal. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setNotice("");
    if (accountRole !== "customer") {
      setError("Login Google hanya tersedia untuk pelanggan. Pilih tab Pelanggan terlebih dahulu.");
      return;
    }
    setBusy(true);
    try {
      const result = await signInWithGoogle(accountRole);
      if (result.error) setError(result.error.message);
      else if (result.demoMode) finishDemoLogin("google");
      else setNotice("Mengarahkan ke Google. Akses akan diperiksa setelah akun kembali ke aplikasi...");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Google login gagal. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordReset = async () => {
    setError("");
    setNotice("");
    if (!email.trim()) {
      setError("Masukkan email terlebih dahulu untuk menerima tautan reset password.");
      return;
    }

    setBusy(true);
    try {
      const result = await requestPasswordReset(email.trim());
      if (result.error) setError(result.error.message);
      else setNotice(result.demoMode ? "Demo mode: reset password siap dihubungkan." : "Tautan reset password sudah dikirim.");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Reset password gagal. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  const title = isSignUp ? "Buat akun pelanggan" : accountRole === "admin" ? "Selamat datang" : "Pesan lebih mudah";
  const description = isSignUp
    ? "Daftar untuk melihat menu dan menyiapkan pesanan kantin."
    : accountRole === "admin"
      ? "Masuk untuk melanjutkan ke workspace kantin sekolah."
      : "Masuk untuk melihat menu dan keranjang pesananmu.";

  return (
    <main ref={authScreenRef} className="login-screen">
      <section className="login-art" aria-hidden="true">
        <div className="login-art-brand"><span className="brand-mark"><CanteenOSMark size={39} /></span><strong>Canteen<span>OS</span></strong></div>
        <div className="login-art-copy">
          <span className="section-kicker">Ruang kerja yang tenang</span>
          <h1>Operasional kantin,<br /><em>lebih rapi.</em></h1>
          <p>Kelola antrean, stok, kas, dan laporan sekolah dari satu workspace yang mudah dipahami.</p>
          <div className="login-art-visual">
            <span className="login-art-visual-main"><UiIcon name="store" size={28} /></span>
            <span><UiIcon name="chartLine" size={18} /></span>
            <span><UiIcon name="receipt" size={18} /></span>
          </div>
        </div>
        <small className="login-art-footer">Sistem kantin digital sekolah · CanteenOS</small>
      </section>
      <section className="login-form-side">
        <div className="login-form-wrap">
          <div className="login-brand"><span className="brand-mark"><CanteenOSMark size={39} /></span><span><strong>Canteen<span>OS</span></strong><small>Sistem Kantin Digital Sekolah</small></span></div>
          <div className="auth-context"><span className="section-kicker">Portal operasional</span><span className="auth-context-label">Akses aman untuk workspace kantin.</span></div>
          <h2>{title}</h2>
          <p>{description}</p>
          <div className="auth-role-switch" role="tablist" aria-label="Pilih jenis akun">
            <button type="button" role="tab" aria-selected={accountRole === "admin"} className={accountRole === "admin" ? "auth-role-button active" : "auth-role-button"} onClick={() => selectRole("admin")}><strong>Admin sekolah</strong><small>Kelola operasional</small></button>
            <button type="button" role="tab" aria-selected={accountRole === "customer"} className={accountRole === "customer" ? "auth-role-button active" : "auth-role-button"} onClick={() => selectRole("customer")}><strong>Pelanggan</strong><small>Lihat menu &amp; pesanan</small></button>
          </div>
          {accountRole === "customer" ? (
            <button className="google-button" type="button" onClick={handleGoogleLogin} disabled={busy}>{busy ? "Memproses..." : "Lanjutkan dengan Google"}</button>
          ) : (
            <div className="login-note google-customer-note" role="note"><span><UiIcon name="info" size={14} /></span><span>Login Google hanya tersedia untuk akun pelanggan.</span></div>
          )}
          <div className="form-divider"><span>atau masuk dengan email</span></div>
          <form className="auth-form" onSubmit={isSignUp ? handleCustomerSignup : handlePasswordLogin}>
            {isSignUp && <label>Nama lengkap<input type="text" autoComplete="name" placeholder="Nama kamu" value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>}
            <label>{accountRole === "admin" ? "Email kerja" : "Email"}<input type="email" autoComplete="email" placeholder={accountRole === "admin" ? "nama@sekolah.sch.id" : "nama@email.com"} value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label>Password<div className="password-input"><input type={passwordVisible ? "text" : "password"} autoComplete={isSignUp ? "new-password" : "current-password"} placeholder="Masukkan password" value={password} onChange={(event) => setPassword(event.target.value)} /><button className="password-toggle" type="button" onClick={() => setPasswordVisible((current) => !current)} aria-label={passwordVisible ? "Sembunyikan password" : "Tampilkan password"}><UiIcon name={passwordVisible ? "eyeOff" : "eye"} size={15} /></button></div></label>
            <button className="login-button" type="submit" disabled={busy}>{busy ? (isSignUp ? "Membuat akun..." : "Memproses...") : isSignUp ? "Daftar sebagai pelanggan" : accountRole === "admin" ? "Masuk ke dashboard" : "Masuk ke menu"} <UiIcon name="arrowRight" size={16} /></button>
          </form>
          {!isSignUp && <button className="forgot-button" type="button" onClick={handlePasswordReset} disabled={busy}>Lupa password?</button>}
          {accountRole === "customer" && <button className="auth-switch-link" type="button" onClick={() => { setIsSignUp((current) => !current); setError(""); setNotice(""); }}>{isSignUp ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar sebagai pelanggan"}</button>}
          {accountRole === "admin" && <p className="auth-provision-note">Akun admin dibuat oleh sekolah dan harus memenuhi verifikasi email, employee code, outlet default, status aktif, serta persetujuan administrator.</p>}
          {error && <div className="login-error" role="alert">{error}</div>}
          {notice && <div className="login-success" role="status">{notice}</div>}
          <div className="login-note"><span><UiIcon name="info" size={14} /></span><span>{isSupabaseConfigured ? "Akses akun diperiksa dari profil database. Metadata browser tidak menentukan role." : "Demo mode aktif. Hanya akun admin demo yang disediakan sekolah yang dapat membuka workspace; pelanggan tidak dapat menaikkan role sendiri."}</span></div>
        </div>
      </section>
    </main>
  );
}
