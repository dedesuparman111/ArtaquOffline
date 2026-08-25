/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  Palette, 
  Database, 
  Trash2, 
  Download, 
  Upload, 
  FileJson, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Smartphone, 
  HardDrive, 
  ShieldCheck,
  RefreshCw,
  Info,
  Clock,
  Bell,
  BellRing,
  BellOff,
  Sparkles
} from 'lucide-react';
import { apiService, BackupPayload } from '../lib/supabase';
import { AppUser, NotificationSetting } from '../types';
import { notificationService } from '../lib/notificationService';

interface SettingsProps {
  theme: 'light' | 'dark';
  onSetTheme: (theme: 'light' | 'dark') => void;
  accent: string;
  onSetAccent: (accent: string) => void;
  user: AppUser | null;
  onUpdateUser: (user: AppUser) => void;
  onResetData: () => Promise<void>;
  onDataRestored: () => Promise<void>;
  totalTransactionsCount: number;
  totalInstallmentsCount: number;
  totalSavingsCount: number;
  totalAssetsCount: number;
  onTriggerTestNotification?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  theme,
  onSetTheme,
  accent,
  onSetAccent,
  user,
  onUpdateUser,
  onResetData,
  onDataRestored,
  totalTransactionsCount,
  totalInstallmentsCount,
  totalSavingsCount,
  totalAssetsCount,
  onTriggerTestNotification,
}) => {
  // Notification Settings State
  const [notifSettings, setNotifSettings] = useState<NotificationSetting>(() => notificationService.getSettings());
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>(() => notificationService.getBrowserPermission());
  const [notifSuccessMsg, setNotifSuccessMsg] = useState<string | null>(null);

  // User profile edit state
  const [usernameInput, setUsernameInput] = useState(user?.username || 'Pengguna ArtaQu');
  const [emailInput, setEmailInput] = useState(user?.email || 'lokal@artaqu.app');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Backup & Restore State
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [pendingBackup, setPendingBackup] = useState<BackupPayload | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [isProcessingImport, setIsProcessingImport] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset database confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const lastBackupStr = typeof window !== 'undefined' ? localStorage.getItem('ArtaQu_last_backup_time') : null;

  useEffect(() => {
    setBrowserPermission(notificationService.getBrowserPermission());
  }, []);

  const handleToggleNotifEnabled = (enabled: boolean) => {
    const updated = notificationService.saveSettings({ enabled });
    setNotifSettings(updated);
    setNotifSuccessMsg(enabled ? 'Pengingat cicilan diaktifkan.' : 'Pengingat cicilan dinonaktifkan.');
    setTimeout(() => setNotifSuccessMsg(null), 3000);
  };

  const handleToggleBrowserNotif = async (browserNotification: boolean) => {
    if (browserNotification && browserPermission !== 'granted') {
      const perm = await notificationService.requestBrowserPermission();
      setBrowserPermission(perm);
      if (perm !== 'granted') {
        const updated = notificationService.saveSettings({ browserNotification: false });
        setNotifSettings(updated);
        setNotifSuccessMsg('Izin notifikasi belum diberikan di pengaturan browser Anda.');
        setTimeout(() => setNotifSuccessMsg(null), 4000);
        return;
      }
    }
    const updated = notificationService.saveSettings({ browserNotification });
    setNotifSettings(updated);
    setNotifSuccessMsg(browserNotification ? 'Notifikasi web browser diaktifkan.' : 'Notifikasi web browser dinonaktifkan.');
    setTimeout(() => setNotifSuccessMsg(null), 3000);
  };

  const handleChangeDaysAhead = (days: number) => {
    const updated = notificationService.saveSettings({ daysAhead: days });
    setNotifSettings(updated);
    setNotifSuccessMsg(`Rentang pengingat disetel ke ${days} hari sebelum jatuh tempo.`);
    setTimeout(() => setNotifSuccessMsg(null), 3000);
  };

  const handleRequestPermission = async () => {
    const perm = await notificationService.requestBrowserPermission();
    setBrowserPermission(perm);
    if (perm === 'granted') {
      notificationService.saveSettings({ browserNotification: true });
      setNotifSettings(notificationService.getSettings());
      setNotifSuccessMsg('Izin notifikasi browser berhasil diaktifkan!');
      // Send a welcoming gentle web notification
      notificationService.sendBrowserNotification('ArtaQu: Notifikasi Aktif', {
        body: 'Pengingat jatuh tempo cicilan harian Anda siap bekerja secara otomatis.',
      });
    } else {
      setNotifSuccessMsg('Izin ditolak oleh browser. Anda dapat mengubahnya di icon gembok URL browser.');
    }
    setTimeout(() => setNotifSuccessMsg(null), 4000);
  };

  const handleTestNotification = () => {
    if (onTriggerTestNotification) {
      onTriggerTestNotification();
    } else {
      notificationService.sendBrowserNotification('ArtaQu: Uji Coba Pengingat', {
        body: 'Notifikasi browser berfungsi dengan baik. Cicilan Anda akan diingatkan tepat waktu.',
      });
    }
    setNotifSuccessMsg('Uji coba notifikasi telah dikirim.');
    setTimeout(() => setNotifSuccessMsg(null), 3500);
  };

  const colors = [
    { name: 'blue', value: '#2563eb', label: 'Classic Blue' },
    { name: 'orange', value: '#f97316', label: 'Neon Orange' },
    { name: 'green', value: '#10b981', label: 'Emerald Green' },
    { name: 'purple', value: '#8b5cf6', label: 'Royal Purple' },
    { name: 'red', value: '#ef4444', label: 'Crimson Red' },
  ];

  // Handle Local Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) {
      setProfileMsg({ type: 'error', text: 'Nama pengguna tidak boleh kosong.' });
      return;
    }

    const res = await apiService.updateUserProfile({
      username: usernameInput.trim(),
      email: emailInput.trim() || 'lokal@artaqu.app',
    });

    if (res.success) {
      onUpdateUser(res.user);
      setProfileMsg({ type: 'success', text: 'Profil berhasil diperbarui!' });
      setTimeout(() => setProfileMsg(null), 3500);
    } else {
      setProfileMsg({ type: 'error', text: res.message });
    }
  };

  // Handle Export Backup JSON
  const handleExportJSON = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    setExportError(null);
    try {
      await apiService.exportBackup();
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (e: any) {
      setExportError('Gagal mengekspor data: ' + e.message);
      setTimeout(() => setExportError(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle File Selected for Import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccessMsg(null);
    setPendingBackup(null);

    try {
      const text = await file.text();
      const validation = await apiService.validateBackupFile(text);

      if (validation.valid && validation.payload) {
        setPendingBackup(validation.payload);
      } else {
        setImportError(validation.error || 'Berkas JSON tidak valid atau bukan cadangan ArtaQu.');
      }
    } catch (err: any) {
      setImportError('Gagal membaca file: ' + err.message);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Confirm Import Backup
  const handleConfirmImport = async () => {
    if (!pendingBackup) return;

    setIsProcessingImport(true);
    setImportError(null);

    try {
      const res = await apiService.importBackup(pendingBackup, importMode);
      if (res.success) {
        setImportSuccessMsg(res.message);
        setPendingBackup(null);
        await onDataRestored();
        setTimeout(() => setImportSuccessMsg(null), 5000);
      } else {
        setImportError(res.message);
      }
    } catch (err: any) {
      setImportError('Gagal memulihkan database: ' + err.message);
    } finally {
      setIsProcessingImport(false);
    }
  };

  // Handle Verify & Reset Data
  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '399339' || pinInput === '000000' || pinInput === '123456') {
      setPinError(false);
      await onResetData();
      setResetSuccess(true);
      setPinInput('');
      setShowResetConfirm(false);
      setTimeout(() => setResetSuccess(false), 4000);
    } else {
      setPinError(true);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in pb-12" id="settings-view">
      {/* Settings Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-primary" />
            <span>Pengaturan & Database</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            PWA Full Offline • Kelola database lokal, backup JSON, dan profil
          </p>
        </div>
      </div>

      {/* OFFLINE LOCAL STATUS BADGE */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-800/50 p-4 sm:p-5 rounded-2xl flex items-start gap-3.5 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
          <HardDrive className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-xs sm:text-sm text-emerald-900 dark:text-emerald-200">
              Database Lokal Mandiri (IndexedDB)
            </h3>
            <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-emerald-600 text-white rounded-full">
              100% Offline
            </span>
          </div>
          <p className="text-xs text-emerald-700/90 dark:text-emerald-300/80 mt-1 leading-relaxed">
            Semua data tersimpan aman langsung di perangkat Anda tanpa perlu koneksi internet. Anda dapat mencadangkan (backup) data ke format file JSON kapan saja agar tidak hilang saat berganti perangkat.
          </p>
          <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
            <span>📊 {totalTransactionsCount} Transaksi</span>
            <span>•</span>
            <span>💳 {totalInstallmentsCount} Cicilan</span>
            <span>•</span>
            <span>🎯 {totalSavingsCount} Target</span>
            <span>•</span>
            <span>💼 {totalAssetsCount} Aset</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. BACKUP & RESTORE DATABASE (JSON) */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/70 p-5 sm:p-6 rounded-2xl shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <FileJson className="w-4 h-4 text-primary" />
            <span>Cadangkan & Pulihkan (Backup JSON)</span>
          </h3>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Gunakan fitur ini untuk memindahkan seluruh data keuangan Anda ke perangkat lain (HP baru, laptop, tablet) atau menyimpan arsip berkala secara offline.
        </p>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Export JSON Button */}
          <button
            onClick={handleExportJSON}
            disabled={isExporting}
            className="flex items-center justify-center gap-2.5 p-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isExporting ? 'Membuat Cadangan...' : 'Download Backup (JSON)'}</span>
          </button>

          {/* Import JSON Button */}
          <label className="flex items-center justify-center gap-2.5 p-4 rounded-xl border-2 border-dashed border-primary/40 hover:border-primary bg-primary-light/30 hover:bg-primary-light text-primary dark:text-primary font-bold text-xs transition-all active:scale-[0.98] cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Upload / Pulihkan File JSON</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Last backup time stamp if available */}
        {lastBackupStr && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>Cadangan terakhir diunduh: {new Date(lastBackupStr).toLocaleString('id-ID')}</span>
          </div>
        )}

        {/* Success Export Banner */}
        {exportSuccess && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>Berkas backup JSON berhasil diunduh ke perangkat Anda! Simpan berkas ini dengan aman.</span>
          </div>
        )}

        {/* Success Import Banner */}
        {importSuccessMsg && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{importSuccessMsg}</span>
          </div>
        )}

        {/* Import Error Banner */}
        {importError && (
          <div className="p-3.5 bg-rose-50 dark:bg-red-950/20 text-rose-600 dark:text-red-400 rounded-xl text-xs font-bold border border-rose-100 dark:border-red-900/30 flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{importError}</span>
          </div>
        )}

        {/* Pending Backup File Preview & Mode Selection Modal / Box */}
        {pendingBackup && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-primary/30 space-y-3.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileJson className="w-4 h-4 text-primary" />
                <span>Pratinjau File Cadangan:</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {new Date(pendingBackup.exportedAt).toLocaleDateString('id-ID')}
              </span>
            </div>

            {/* Summary details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-center">
              <div>
                <span className="block text-[10px] text-slate-400">Transaksi</span>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{pendingBackup.summary.totalTransactions}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400">Cicilan</span>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{pendingBackup.summary.totalInstallments}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400">Target</span>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{pendingBackup.summary.totalSavingsGoals}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400">Aset</span>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{pendingBackup.summary.totalAssets}</span>
              </div>
            </div>

            {/* Mode selection: Replace vs Merge */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Metode Pemulihan:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition cursor-pointer ${
                    importMode === 'replace'
                      ? 'border-primary bg-primary-light text-primary dark:text-primary font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="block font-bold">Timpa Total (Replace)</span>
                  <span className="text-[10px] opacity-80">Ganti seluruh data saat ini dengan file cadangan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('merge')}
                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition cursor-pointer ${
                    importMode === 'merge'
                      ? 'border-primary bg-primary-light text-primary dark:text-primary font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="block font-bold">Gabungkan (Merge)</span>
                  <span className="text-[10px] opacity-80">Gabung data tanpa menghapus catatan yang sudah ada</span>
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isProcessingImport}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessingImport ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{isProcessingImport ? 'Memulihkan Data...' : 'Konfirmasi & Terapkan Cadangan'}</span>
              </button>
              <button
                type="button"
                onClick={() => setPendingBackup(null)}
                className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 2. PENGINGAT JATUH TEMPO CICILAN & NOTIFIKASI BROWSER */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/70 p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" />
            <span>Pengingat Cicilan & Notifikasi Browser</span>
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
            Harian Otomatis
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          ArtaQu akan memberikan pengingat lembut harian saat membuka aplikasi dan melalui notifikasi browser untuk cicilan yang mendekati atau telah jatuh tempo.
        </p>

        {notifSuccessMsg && (
          <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/80 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notifSuccessMsg}</span>
          </div>
        )}

        <div className="space-y-3.5 pt-1">
          {/* Toggle 1: Aktifkan Pengingat */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Aktifkan Pengingat Cicilan
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Munculkan kartu pengingat & lencana lonceng jatuh tempo di aplikasi
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifSettings.enabled}
                onChange={(e) => handleToggleNotifEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Toggle 2: Notifikasi Web Browser */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Notifikasi Web Browser (Push API)
                </span>
                {browserPermission === 'granted' ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                    Diizinkan
                  </span>
                ) : browserPermission === 'denied' ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                    Diblokir
                  </span>
                ) : (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                    Perlu Izin
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Kirim notifikasi sistem browser tanpa popup yang mengganggu
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifSettings.browserNotification && browserPermission === 'granted'}
                onChange={(e) => handleToggleBrowserNotif(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Setting 3: Rentang Hari Pengingat */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Rentang Peringatan Jatuh Tempo
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Mulai beri tahu beberapa hari sebelum tanggal jatuh tempo
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {[
                { days: 1, label: 'H-1' },
                { days: 3, label: 'H-3 (Ideal)' },
                { days: 7, label: 'H-7 (1 Minggu)' },
              ].map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => handleChangeDaysAhead(opt.days)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    notifSettings.daysAhead === opt.days
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons for Permissions & Testing */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {browserPermission !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Minta Izin Notifikasi Browser</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleTestNotification}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Uji Coba Pengingat</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. LOCAL USER PROFILE */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/70 p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-500" />
          <span>Profil Pengguna Lokal</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ubah nama panggilan yang ditampilkan pada aplikasi di perangkat ini.
        </p>

        <form onSubmit={handleSaveProfile} className="space-y-3.5 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Nama Pengguna
            </label>
            <input
              type="text"
              required
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Contoh: Dede Suparman"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm dark:bg-slate-950 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Label / Email Lokal (Opsional)
            </label>
            <input
              type="text"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="lokal@artaqu.app"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm dark:bg-slate-950 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
            />
          </div>

          {profileMsg && (
            <p className={`text-xs font-semibold ${profileMsg.type === 'error' ? 'text-rose-500' : 'text-emerald-500'}`}>
              {profileMsg.type === 'error' ? '❌' : '✓'} {profileMsg.text}
            </p>
          )}

          <button
            type="submit"
            className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs transition hover:bg-primary-hover active:scale-95 cursor-pointer shadow"
          >
            Simpan Nama Profil
          </button>
        </form>
      </div>

      {/* ============================================================ */}
      {/* 3. THEME CARD */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/70 p-5 sm:p-6 rounded-2xl shadow-sm">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-500" />
          <span>Tema Tampilan</span>
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onSetTheme('light')}
            className={`py-3 px-4 rounded-xl border font-bold flex justify-center items-center gap-2 transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-primary bg-primary-light/40 text-primary dark:text-primary'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Terang (Light)</span>
          </button>
          <button
            onClick={() => onSetTheme('dark')}
            className={`py-3 px-4 rounded-xl border font-bold flex justify-center items-center gap-2 transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-primary bg-primary-light text-primary dark:text-primary'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Moon className="w-4 h-4 text-indigo-500" />
            <span>Gelap (Dark)</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. ACCENT COLORS CARD */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/70 p-5 sm:p-6 rounded-2xl shadow-sm">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Palette className="w-4 h-4 text-indigo-500" />
          <span>Warna Aksen Aplikasi</span>
        </h3>
        <div className="flex flex-wrap gap-4 items-center">
          {colors.map((color) => (
            <button
              key={color.name}
              onClick={() => onSetAccent(color.name)}
              style={{ backgroundColor: color.value }}
              className={`w-11 h-11 rounded-full cursor-pointer transition-all duration-300 relative hover:scale-110 shadow flex items-center justify-center border-4 ${
                accent === color.name
                  ? 'border-slate-900 dark:border-white scale-105'
                  : 'border-transparent'
              }`}
              title={color.label}
            >
              {accent === color.name && (
                <div className="w-2.5 h-2.5 rounded-full bg-white dark:bg-slate-900" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. DANGER ZONE / RESET LOCAL DATABASE */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-red-950/30 p-5 sm:p-6 rounded-2xl shadow-sm">
        <h3 className="font-bold text-sm text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          <span>Zona Bahaya</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed font-medium">
          Tindakan di bawah ini akan mengosongkan seluruh database lokal di perangkat ini. Pastikan Anda telah mengunduh cadangan (Backup JSON) terlebih dahulu jika masih ingin menyimpan data.
        </p>

        {resetSuccess && (
          <div className="mb-4 p-3 rounded-xl border border-emerald-100 bg-emerald-50 dark:bg-emerald-950/10 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            ✓ Seluruh database lokal berhasil dikosongkan!
          </div>
        )}

        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            Kosongkan Database Lokal
          </button>
        ) : (
          <form onSubmit={handleVerifyAndReset} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-normal">
              ⚠️ Konfirmasi Pengosongan Database: Masukkan PIN Keamanan (Bantuan: 399339 atau 000000) untuk melanjutkan.
            </p>
            
            <div className="max-w-xs">
              <input
                type="password"
                required
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="PIN 6-Digit"
                className="w-full text-center tracking-widest text-lg font-extrabold p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 dark:text-slate-100 outline-none focus:border-red-500"
              />
              {pinError && (
                <p className="text-[10px] text-red-500 font-semibold mt-1">
                  ❌ PIN salah! Gunakan PIN: 399339.
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Ya, Kosongkan Sekarang
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  setPinInput('');
                  setPinError(false);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
