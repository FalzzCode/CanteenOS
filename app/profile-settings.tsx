"use client";
/* eslint-disable @next/next/no-img-element -- avatar URLs and local blob previews are user-generated at runtime. */

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";

import type { ProfileRecord } from "../lib/domain";
import { changePassword, updateProfileSettings } from "../lib/supabase/auth";
import { isSupabaseConfigured } from "../lib/supabase/client";
import { UiIcon } from "./ui-icons";

type SettingsTab = "profile" | "security";

type ProfileSettingsProps = {
  profile: ProfileRecord;
  initialTab: SettingsTab;
  onClose: () => void;
  onProfileChanged: (profile: ProfileRecord) => void;
  onLogout: () => void | Promise<void>;
};

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "KS";

export function ProfileAvatar({ profile, className, fallbackImageSrc }: { profile: ProfileRecord; className: string; fallbackImageSrc?: string }) {
  const imageSrc = profile.avatarUrl || fallbackImageSrc;

  return imageSrc
    ? <span className={`${className} profile-avatar-photo`}><img src={imageSrc} alt="" /></span>
    : <span className={className}>{initials(profile.fullName)}</span>;
}

export function ProfileSettings({ profile, initialTab, onClose, onProfileChanged, onLogout }: ProfileSettingsProps) {
  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const [fullName, setFullName] = useState(profile.fullName);
  const [avatarFile, setAvatarFile] = useState<File>();
  const [avatarPreview, setAvatarPreview] = useState(profile.avatarUrl ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => () => {
    if (avatarPreview.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const chooseAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      setMessage("Gunakan foto JPG, PNG, atau WebP maksimal 2 MB.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setMessage("");
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedName = fullName.trim();
    if (normalizedName.length < 2) {
      setMessage("Nama minimal 2 karakter.");
      return;
    }
    setBusy(true);
    const result = await updateProfileSettings(normalizedName, avatarFile);
    if (result.error) {
      setMessage(result.error.message);
    } else if (result.demoMode) {
      onProfileChanged({ ...profile, fullName: normalizedName, avatarUrl: avatarPreview || profile.avatarUrl });
      setMessage("Profil demo berhasil diperbarui.");
    } else if (result.profile) {
      onProfileChanged(result.profile);
      setMessage("Profil berhasil diperbarui.");
    }
    setBusy(false);
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("Konfirmasi password belum sama.");
      return;
    }
    if (newPassword.length < 8) {
      setMessage("Password baru minimal 8 karakter.");
      return;
    }
    setBusy(true);
    const result = await changePassword(currentPassword, newPassword);
    if (result.error) setMessage(result.error.message);
    else {
      setMessage(result.demoMode ? "Demo: alur perubahan password berhasil diuji." : "Password berhasil diperbarui.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setBusy(false);
  };

  return (
    <AnimatePresence>
      <motion.div className="profile-settings-backdrop" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <motion.section className="profile-settings-sheet" role="dialog" aria-modal="true" aria-labelledby="profile-settings-title" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ type: "spring", stiffness: 360, damping: 34 }}>
          <header className="profile-settings-head"><div><span className="section-kicker">Akun & keamanan</span><h2 id="profile-settings-title">Pengaturan profil</h2></div><button ref={closeButtonRef} className="modal-close profile-settings-close" type="button" onClick={onClose} aria-label="Tutup pengaturan"><UiIcon name="arrowLeft" size={17} /></button></header>
          <div className="profile-settings-tabs" role="tablist" aria-label="Bagian pengaturan"><button type="button" role="tab" aria-selected={tab === "profile"} className={tab === "profile" ? "active" : ""} onClick={() => { setTab("profile"); setMessage(""); }}><UiIcon name="user" size={16} />Profil</button><button type="button" role="tab" aria-selected={tab === "security"} className={tab === "security" ? "active" : ""} onClick={() => { setTab("security"); setMessage(""); }}><UiIcon name="settings" size={16} />Password</button></div>

          {tab === "profile" ? <form className="profile-settings-form" onSubmit={saveProfile}>
            <div className="avatar-editor"><span className="avatar-preview">{avatarPreview ? <img src={avatarPreview} alt="Pratinjau foto profil" /> : initials(fullName)}</span><span><strong>Foto profil</strong><small>JPG, PNG, atau WebP · maksimal 2 MB</small><button className="secondary-button" type="button" onClick={() => fileInput.current?.click()}><UiIcon name="user" size={15} />Ganti foto</button></span><input ref={fileInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseAvatar} /></div>
            <label className="settings-field"><span>Nama lengkap</span><input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" /></label>
            <div className="profile-readonly-grid"><span><small>Peran</small><strong>{profile.role.replace("_", " ")}</strong></span><span><small>Kode pegawai</small><strong>{profile.employeeCode || "Belum diisi"}</strong></span></div>
            <p className="settings-note"><UiIcon name="info" size={15} />Perubahan nama dan foto tidak mengubah role maupun hak akses akun.</p>
            {message && <p className="settings-message" role="status">{message}</p>}
            <button className="primary-button settings-submit" type="submit" disabled={busy}>{busy ? "Menyimpan..." : "Simpan perubahan"}<UiIcon name="arrowRight" size={16} /></button>
          </form> : <form className="profile-settings-form" onSubmit={savePassword}>
            <div className="security-intro"><span><UiIcon name="settings" size={20} /></span><div><strong>Perbarui password</strong><small>Gunakan minimal 8 karakter dan jangan gunakan password yang sama dengan akun lain.</small></div></div>
            <label className="settings-field"><span>Password saat ini</span><input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required={isSupabaseConfigured} placeholder={isSupabaseConfigured ? "Masukkan password saat ini" : "Demo mode"} /></label>
            <label className="settings-field"><span>Password baru</span><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></label>
            <label className="settings-field"><span>Ulangi password baru</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></label>
            {message && <p className="settings-message" role="status">{message}</p>}
            <button className="primary-button settings-submit" type="submit" disabled={busy}>{busy ? "Memperbarui..." : "Perbarui password"}<UiIcon name="arrowRight" size={16} /></button>
          </form>}

          <footer className="profile-settings-footer"><span><small>Masuk sebagai</small><strong>{profile.fullName}</strong></span><button type="button" onClick={onLogout}><UiIcon name="arrowLeft" size={15} />Keluar dari akun</button></footer>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
