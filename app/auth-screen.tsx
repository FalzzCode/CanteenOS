"use client";

import { useState, type FormEvent } from "react";

import {
  requestPasswordReset,
  signInWithGoogle,
  signInWithPassword,
} from "../lib/supabase/auth";
import { isSupabaseConfigured } from "../lib/supabase/client";

export function AuthScreen({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const finishDemoLogin = () => {
    setNotice("Demo mode aktif. Workspace dibuka dengan data contoh.");
    window.setTimeout(onLoginSuccess, 450);
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
      if (result.error) setError(result.error.message);
      else if (result.demoMode) finishDemoLogin();
      else onLoginSuccess();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login gagal. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const result = await signInWithGoogle();
      if (result.error) setError(result.error.message);
      else if (result.demoMode) finishDemoLogin();
      else setNotice("Mengarahkan ke Google untuk verifikasi akun...");
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
      setError("Masukkan email kerja untuk menerima tautan reset password.");
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

  return (
    <main className="login-screen">
      <section className="login-art">
        <div className="login-brand"><span className="brand-mark">KS</span><span><strong>Kantin<span>Kita</span></strong><small>Sistem Kantin Digital Sekolah</small></span></div>
        <div className="login-art-content"><span className="art-orbit orbit-one" /><span className="art-orbit orbit-two" /><div className="art-plate"><span className="food-icon">🍱</span><span className="food-leaf">✦</span><span className="food-dot dot-one" /><span className="food-dot dot-two" /><span className="food-dot dot-three" /></div><h1>Operasional kantin,<br /><em>lebih rapi.</em></h1><p>Layani antrean dengan cepat. Pantau stok dan kas dengan tenang.</p></div>
        <span className="login-footer">© 2026 KantinKita · Untuk sekolah yang terus bertumbuh</span>
      </section>
      <section className="login-form-side">
        <div className="login-form-wrap">
          <span className="section-kicker">Portal operasional</span>
          <h2>Selamat datang</h2>
          <p>Masuk untuk melanjutkan ke workspace kantin sekolah.</p>
          <button className="google-button" type="button" onClick={handleGoogleLogin} disabled={busy}><span className="google-g">G</span>{busy ? "Memproses..." : "Lanjutkan dengan Google"}</button>
          <div className="form-divider"><span>atau masuk dengan email</span></div>
          <form onSubmit={handlePasswordLogin}>
            <label>Email kerja<input type="email" autoComplete="email" placeholder="nama@sekolah.sch.id" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label>Password<div className="password-input"><input type="password" autoComplete="current-password" placeholder="Masukkan password" value={password} onChange={(event) => setPassword(event.target.value)} /><span>◉</span></div></label>
            <button className="login-button" type="submit" disabled={busy}>{busy ? "Memverifikasi..." : "Masuk ke dashboard"} <span>→</span></button>
          </form>
          <button className="forgot-button" type="button" onClick={handlePasswordReset} disabled={busy}>Lupa password?</button>
          {error && <div className="login-error" role="alert">{error}</div>}
          {notice && <div className="login-success" role="status">{notice}</div>}
          <div className="login-note"><span>i</span><span>{isSupabaseConfigured ? "Akses hanya aktif untuk akun yang sudah diverifikasi dan disetujui admin." : "Demo mode aktif. Isi env Supabase untuk mengaktifkan autentikasi live."}</span></div>
        </div>
      </section>
    </main>
  );
}
