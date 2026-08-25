/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { AppUser, Transaction, Installment, DashboardData, SavingsGoal, Asset, DueReminderItem, LicenseInfo } from './types';
import { apiService } from './lib/supabase';
import { notificationService } from './lib/notificationService';
import { licenseService } from './lib/licenseService';
import { Dashboard } from './components/Dashboard';
import { Savings } from './components/Savings';
import { Transactions } from './components/Transactions';
import { Installments } from './components/Installments';
import { Settings } from './components/Settings';
import { Assets } from './components/Assets';
import { ProModal } from './components/ProModal';
import { 
  Layers, 
  Wallet, 
  CreditCard, 
  Settings as SettingsIcon, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Home, 
  ArrowRightLeft, 
  Target, 
  Briefcase,
  Download,
  HardDrive,
  Bell,
  BellRing,
  Calendar,
  Clock,
  Sparkles,
  X,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Crown
} from 'lucide-react';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error';
}

export default function App() {
  // Session & Navigation State
  const [user, setUser] = useState<AppUser | null>({
    id: 'local-user',
    username: 'Pengguna ArtaQu',
    email: 'lokal@artaqu.app'
  });
  const [activeView, setActiveView] = useState<'dashboard' | 'transactions' | 'installments' | 'savings' | 'assets' | 'settings'>('dashboard');
  const [showGlobalAdd, setShowGlobalAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  // Notification State
  const [dueInstallments, setDueInstallments] = useState<DueReminderItem[]>([]);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // App Core Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetPlatforms, setAssetPlatforms] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    balance: 0,
    income: 0,
    expense: 0,
    debt: 0,
    receivable: 0,
    installmentOutstanding: 0,
    totalAssetValue: 0,
  });

  // UI Customization State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [accent, setAccent] = useState<string>('blue');
  const [filterCreditor, setFilterCreditor] = useState<string>('all');

  // Notification Toast State
  const [toasts, setToasts] = useState<Toast[]>([]);

  // License & Pro Tier State
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo>(() => licenseService.getLicenseInfo());
  const [showProModal, setShowProModal] = useState(false);
  const [proTriggerReason, setProTriggerReason] = useState<string | undefined>(undefined);

  const handleOpenProModal = (reason?: string) => {
    setProTriggerReason(reason);
    setShowProModal(true);
  };

  // Live Quota Calculation
  const quota = licenseService.getUsageQuota({
    transactions: transactions.length,
    installments: installments.length,
    savings: savingsGoals.length,
    assets: assets.length,
  });

  // Show a beautifully animated non-intrusive toast
  const showToast = useCallback((title: string, message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Helper: format numbers to Rupiah
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num || 0);
  };

  // Helper: format standard ISO date string to human-readable
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Dynamic Theme & Accent Application
  const applyThemeAndAccent = (currentTheme: 'light' | 'dark', currentAccent: string) => {
    const root = document.documentElement;
    
    // Theme application
    if (currentTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Accent colors mapping
    const accents: Record<string, { main: string; hover: string; light: string }> = {
      blue: { main: '#2563eb', hover: '#1d4ed8', light: 'rgba(37, 99, 235, 0.08)' },
      orange: { main: '#f97316', hover: '#ea580c', light: 'rgba(249, 115, 22, 0.08)' },
      green: { main: '#10b981', hover: '#059669', light: 'rgba(16, 185, 129, 0.08)' },
      purple: { main: '#8b5cf6', hover: '#7c3aed', light: 'rgba(139, 92, 246, 0.08)' },
      red: { main: '#ef4444', hover: '#dc2626', light: 'rgba(239, 68, 68, 0.08)' },
    };

    const selected = accents[currentAccent] || accents.blue;
    root.style.setProperty('--primary-color', selected.main);
    root.style.setProperty('--primary-hover', selected.hover);
    root.style.setProperty('--primary-light', selected.light);
  };

  // Effect: Initial customization load
  useEffect(() => {
    const savedTheme = (localStorage.getItem('ArtaQu_theme') as 'light' | 'dark') || 'light';
    const savedAccent = localStorage.getItem('ArtaQu_accent') || 'blue';
    setTheme(savedTheme);
    setAccent(savedAccent);
    applyThemeAndAccent(savedTheme, savedAccent);
  }, []);

  // Update theme & accent helpers
  const handleSetTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('ArtaQu_theme', newTheme);
    applyThemeAndAccent(newTheme, accent);
  };

  const handleSetAccent = (newAccent: string) => {
    setAccent(newAccent);
    localStorage.setItem('ArtaQu_accent', newAccent);
    applyThemeAndAccent(theme, newAccent);
  };

  // Load all user records from local database
  const loadCoreData = useCallback(async () => {
    try {
      const [u, trxs, insts, dash, goals, asts, plats] = await Promise.all([
        apiService.getCurrentUser(),
        apiService.getTransactions(),
        apiService.getInstallments(),
        apiService.getDashboardData(),
        apiService.getSavingsGoals(),
        apiService.getAssets(),
        apiService.getAssetPlatforms()
      ]);
      if (u) setUser(u);
      setTransactions(trxs);
      setInstallments(insts);
      setDashboardData(dash);
      setSavingsGoals(goals);
      setAssets(asts);
      setAssetPlatforms(plats);
    } catch (e: any) {
      showToast('Gagal Memuat', e.message || 'Gagal memuat database lokal.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Effect: Core data initialization
  useEffect(() => {
    loadCoreData();
  }, [loadCoreData]);

  // Effect: Daily Due Installments Notification Check
  useEffect(() => {
    if (installments.length > 0) {
      const { dueItems, triggered } = notificationService.checkAndTriggerDailyReminder(installments, formatRupiah, false);
      setDueInstallments(dueItems);
      if (triggered && dueItems.length > 0) {
        showToast('Pengingat Cicilan', `Terdapat ${dueItems.length} cicilan jatuh tempo dalam waktu dekat.`, 'success');
      }
    } else {
      setDueInstallments([]);
    }
  }, [installments, showToast]);

  // Handle Manual Trigger Test Notification
  const handleTriggerTestNotification = useCallback(() => {
    const { dueItems, message } = notificationService.checkAndTriggerDailyReminder(installments, formatRupiah, true);
    setDueInstallments(dueItems);
    if (dueItems.length > 0) {
      showToast('Pengingat Terkirim', `Notifikasi browser & pengingat untuk ${dueItems.length} cicilan telah dijalankan.`, 'success');
    } else {
      notificationService.sendBrowserNotification('ArtaQu: Uji Coba Pengingat', {
        body: 'Notifikasi browser berjalan sempurna. Saat ini belum ada cicilan yang mendekati jatuh tempo.',
      });
      showToast('Uji Coba Berhasil', 'Notifikasi browser berhasil diuji tanpa popup.', 'success');
    }
  }, [installments, showToast]);

  // Effect: PWA Install Prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
    }
    setDeferredPrompt(null);
  };

  // Trigger manual page data refresh
  const handleManualRefresh = async () => {
    setLoading(true);
    await loadCoreData();
    showToast('Database Lokal', 'Data keuangan berhasil disinkronkan & diperbarui.', 'success');
  };

  // Quick 1-click JSON backup
  const handleQuickBackup = async () => {
    try {
      await apiService.exportBackup();
      showToast('Backup Berhasil', 'File cadangan JSON berhasil diunduh.', 'success');
    } catch (err: any) {
      showToast('Gagal Backup', err.message || 'Gagal membuat cadangan JSON.', 'error');
    }
  };

  // Switch view on widget interactions
  const handleFilterCreditor = (creditor: string) => {
    setFilterCreditor(creditor);
    setActiveView('installments');
  };

  // ==========================================
  // CORE DB TRANSACTION OPERATORS
  // ==========================================
  const handleAddTransaction = async (trx: Omit<Transaction, 'id'>) => {
    const res = await apiService.addTransaction(trx);
    if (res.success) {
      showToast('Sukses', res.message || 'Transaksi berhasil disimpan.', 'success');
      await loadCoreData();
      return true;
    } else {
      showToast('Gagal', res.message || 'Gagal menambahkan transaksi.', 'error');
      return false;
    }
  };

  const handleEditTransaction = async (trx: Transaction) => {
    const res = await apiService.updateTransaction(trx);
    if (res.success) {
      showToast('Sukses', res.message || 'Transaksi berhasil diperbarui.', 'success');
      await loadCoreData();
      return true;
    } else {
      showToast('Gagal', res.message || 'Gagal memperbarui transaksi.', 'error');
      return false;
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      const res = await apiService.deleteTransaction(id);
      if (res.success) {
        showToast('Sukses', res.message || 'Transaksi berhasil dihapus.', 'success');
        await loadCoreData();
      } else {
        showToast('Gagal', res.message || 'Gagal menghapus transaksi.', 'error');
      }
    }
  };

  // ==========================================
  // CORE DB INSTALLMENT OPERATORS
  // ==========================================
  const handleAddInstallment = async (inst: Omit<Installment, 'id' | 'remaining' | 'paid_amount' | 'status'>) => {
    const res = await apiService.addInstallment(inst);
    if (res.success) {
      showToast('Sukses', res.message || 'Cicilan baru berhasil disimpan.', 'success');
      await loadCoreData();
      return true;
    } else {
      showToast('Gagal', res.message || 'Gagal menambahkan cicilan.', 'error');
      return false;
    }
  };

  const handleEditInstallment = async (inst: Installment) => {
    const res = await apiService.updateInstallment(inst);
    if (res.success) {
      showToast('Sukses', res.message || 'Cicilan berhasil diperbarui.', 'success');
      await loadCoreData();
      return true;
    } else {
      showToast('Gagal', res.message || 'Gagal memperbarui cicilan.', 'error');
      return false;
    }
  };

  const handleDeleteInstallment = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus cicilan ini? Riwayat transaksi pembayaran tidak akan terhapus.')) {
      const res = await apiService.deleteInstallment(id);
      if (res.success) {
        showToast('Sukses', res.message || 'Cicilan berhasil dihapus.', 'success');
        await loadCoreData();
      } else {
        showToast('Gagal', res.message || 'Gagal menghapus cicilan.', 'error');
      }
    }
  };

  // ==========================================
  // CORE DB SAVINGS OPERATORS
  // ==========================================
  const handleAddSavingsGoal = async (goal: Omit<SavingsGoal, 'id'>) => {
    const res = await apiService.addSavingsGoal(goal);
    if (res.success) {
      showToast('Sukses', 'Target tabungan berhasil ditambahkan.', 'success');
      await loadCoreData();
      return true;
    } else {
      showToast('Gagal', res.message || 'Gagal menambahkan target tabungan.', 'error');
      return false;
    }
  };

  const handleUpdateSavingsGoal = async (goal: SavingsGoal) => {
    const res = await apiService.updateSavingsGoal(goal);
    if (res.success) {
      showToast('Sukses', 'Target tabungan diperbarui.', 'success');
      await loadCoreData();
      return true;
    } else {
      showToast('Gagal', res.message || 'Gagal memperbarui target tabungan.', 'error');
      return false;
    }
  };

  const handleDeleteSavingsGoal = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus target tabungan ini?')) {
      const res = await apiService.deleteSavingsGoal(id);
      if (res.success) {
        showToast('Sukses', 'Target tabungan berhasil dihapus.', 'success');
        await loadCoreData();
      } else {
        showToast('Gagal', res.message || 'Gagal menghapus target tabungan.', 'error');
      }
    }
    return true;
  };

  // ==========================================
  // CORE DB ASSETS OPERATORS
  // ==========================================
  const handleAddPlatform = async (platform: any) => {
    const res = await apiService.addAssetPlatform(platform);
    if (res.success) {
      showToast('Sukses', 'Platform aset ditambahkan.', 'success');
      await loadCoreData();
    }
    return res.success;
  };

  const handleUpdatePlatform = async (id: string, updates: any) => {
    const res = await apiService.updateAssetPlatform(id, updates);
    if (res.success) {
      showToast('Sukses', 'Platform aset diperbarui.', 'success');
      await loadCoreData();
    }
    return res.success;
  };

  const handleDeletePlatform = async (id: string) => {
    if (window.confirm('Yakin hapus platform ini? Semua aset di dalamnya mungkin terpengaruh.')) {
      const res = await apiService.deleteAssetPlatform(id);
      if (res.success) {
        showToast('Sukses', 'Platform aset dihapus.', 'success');
        await loadCoreData();
      }
      return res.success;
    }
    return false;
  };

  const handleAddAsset = async (asset: Omit<Asset, 'id'>) => {
    const res = await apiService.addAsset(asset);
    if (res.success) {
      showToast('Sukses', 'Aset berhasil disimpan.', 'success');
      await loadCoreData();
      return true;
    } else {
      showToast('Gagal', res.message || 'Gagal menambahkan aset.', 'error');
      return false;
    }
  };

  const handleUpdateAsset = async (id: string, updates: Partial<Asset>) => {
    const res = await apiService.updateAsset(id, updates);
    if (res.success) {
      showToast('Sukses', 'Aset berhasil diperbarui.', 'success');
      await loadCoreData();
      return true;
    } else {
      showToast('Gagal', res.message || 'Gagal memperbarui aset.', 'error');
      return false;
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus aset ini?')) {
      const res = await apiService.deleteAsset(id);
      if (res.success) {
        showToast('Sukses', 'Aset berhasil dihapus.', 'success');
        await loadCoreData();
      } else {
        showToast('Gagal', res.message || 'Gagal menghapus aset.', 'error');
      }
    }
    return true;
  };

  const handleResetData = async () => {
    try {
      const res = await apiService.resetDatabase();
      if (res.success) {
        await loadCoreData();
        showToast('Reset Selesai', res.message || 'Seluruh data telah diatur ulang ke angka nol.', 'success');
      } else {
        showToast('Gagal', res.message || 'Gagal mereset database.', 'error');
      }
    } catch (err: any) {
      showToast('Gagal', err.message || 'Terjadi kesalahan saat mengosongkan database.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 transition-colors">
      
      {/* ============================================================ */}
      {/* MOBILE & DESKTOP STICKY HEADER */}
      {/* ============================================================ */}
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-100 dark:border-slate-800/60 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-4xl mx-auto px-4 h-15 sm:h-16 flex items-center justify-between gap-3">
          
          {/* Brand Logo and Offline Pill */}
          <div className="flex items-center gap-2.5 flex-shrink-0 min-w-0">
            <img src="/logo.png" alt="ArtaQu Logo" className="w-9 h-9 object-contain rounded-xl shadow-xs" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                  ArtaQu
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Offline
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[130px] sm:max-w-[200px] leading-tight mt-0.5">
                {user?.username || 'Database Lokal'}
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Pro Status / Upgrade Button */}
            {licenseInfo.isPro ? (
              <button
                onClick={() => handleOpenProModal()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-xl text-xs font-black hover:bg-amber-500/25 transition cursor-pointer shadow-xs"
                title="ArtaQu PRO Aktif"
              >
                <Crown className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span className="text-[11px] uppercase tracking-wider">PRO</span>
              </button>
            ) : (
              <button
                onClick={() => handleOpenProModal('Upgrade ke ArtaQu PRO Lifetime untuk akses unlimited tanpa batasan kuota!')}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 animate-pulse hover:animate-none"
                title="Buka Fitur PRO"
              >
                <Crown className="w-3.5 h-3.5" />
                <span className="text-[11px]">Upgrade PRO</span>
              </button>
            )}

            {/* Notification Bell Button */}
            <button
              onClick={() => setShowNotifModal(true)}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Pengingat Cicilan"
            >
              <Bell className="w-4.5 h-4.5" />
              {dueInstallments.length > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
                  {dueInstallments.length}
                </span>
              )}
            </button>

            {/* Quick 1-Click Backup Button */}
            <button
              onClick={handleQuickBackup}
              className="p-2 sm:px-3 sm:py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              title="Download Backup JSON"
            >
              <Download className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">Backup JSON</span>
            </button>

            {/* Refresh Core Data */}
            <button
              onClick={handleManualRefresh}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Segarkan Database"
            >
              <RefreshCw className={`w-4.5 h-4.5 ${loading ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Desktop only) */}
        <div className="hidden sm:block border-t border-slate-100 dark:border-slate-800/40">
          <div className="max-w-4xl mx-auto px-4 flex gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: <Layers className="w-4 h-4" /> },
              { id: 'transactions', label: 'Transaksi', icon: <Wallet className="w-4 h-4" /> },
              { id: 'installments', label: 'Cicilan',  icon: <CreditCard className="w-4 h-4" /> },
              { id: 'savings', label: 'Target',  icon: <Target className="w-4 h-4" /> },
              { id: 'assets', label: 'Aset Digital',  icon: <Briefcase className="w-4 h-4" /> },
              { id: 'settings', label: 'Setelan & Backup', icon: <SettingsIcon className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`px-4 py-2.5 text-xs font-bold tracking-wide flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeView === tab.id
                    ? 'border-primary text-primary dark:text-primary'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* MAIN CONTAINER */}
      {/* ============================================================ */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 pb-28 sm:pb-12">
        
        {/* Urgent Installments Reminder Banner */}
        {dueInstallments.length > 0 && !dismissedBanner && (
          <div className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 border border-amber-300/60 dark:border-amber-700/50 flex items-start sm:items-center justify-between gap-3 animate-fade-in shadow-xs">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                    Pengingat Cicilan ({dueInstallments.length} Jadwal Jatuh Tempo)
                  </h3>
                  {dueInstallments.some(i => i.daysRemaining < 0) && (
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-rose-600 text-white rounded-full">
                      Lewat Jatuh Tempo
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5 truncate">
                  {dueInstallments[0].name} ({dueInstallments[0].creditor}) • Sisa {formatRupiah(dueInstallments[0].remaining)}
                  {dueInstallments.length > 1 ? ` dan ${dueInstallments.length - 1} cicilan lainnya.` : '.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowNotifModal(true)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
              >
                <span>Lihat</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDismissedBanner(true)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                title="Tutup Pengingat Sesi Ini"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {showInstallPrompt && (
          <div className="bg-primary-light dark:bg-primary-light border border-primary dark:border-primary rounded-2xl p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-primary-hover dark:text-primary">Install PWA ArtaQu</h3>
              <p className="text-xs text-primary dark:text-primary mt-0.5">Jalankan 100% offline langsung dari layar utama perangkat Anda.</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => setShowInstallPrompt(false)}
                className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              >
                Nanti
              </button>
              <button 
                onClick={handleInstallClick}
                className="flex-1 sm:flex-none px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-colors shadow"
              >
                Install Aplikasi
              </button>
            </div>
          </div>
        )}

        {/* View components rendered directly */}
        <div className="view-container">
          {activeView === 'dashboard' && (
            <Dashboard
              data={dashboardData}
              installments={installments}
              transactions={transactions}
              formatRupiah={formatRupiah}
              onFilterCreditor={handleFilterCreditor}
              onQuickAddTransaction={() => {
                setActiveView('transactions');
                setShowGlobalAdd(true);
              }}
              onNavigateTo={(view) => setActiveView(view)}
            />
          )}

          {activeView === 'transactions' && (
            <Transactions
              transactions={transactions}
              installments={installments}
              formatRupiah={formatRupiah}
              formatDate={formatDate}
              onAddTransaction={handleAddTransaction}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              showGlobalAdd={showGlobalAdd}
              onCloseGlobalAdd={() => setShowGlobalAdd(false)}
              isPro={licenseInfo.isPro}
              onOpenProModal={handleOpenProModal}
            />
          )}

          {activeView === 'installments' && (
            <Installments
              installments={installments}
              formatRupiah={formatRupiah}
              formatDate={formatDate}
              onAddInstallment={handleAddInstallment}
              onEditInstallment={handleEditInstallment}
              onDeleteInstallment={handleDeleteInstallment}
              filterCreditor={filterCreditor}
              onSetFilterCreditor={setFilterCreditor}
              isPro={licenseInfo.isPro}
              onOpenProModal={handleOpenProModal}
            />
          )}

          {activeView === 'savings' && (
            <Savings
              savingsGoals={savingsGoals}
              formatRupiah={formatRupiah}
              onAddGoal={handleAddSavingsGoal}
              onUpdateGoal={handleUpdateSavingsGoal}
              onDeleteGoal={handleDeleteSavingsGoal}
              isPro={licenseInfo.isPro}
              onOpenProModal={handleOpenProModal}
            />
          )}

          {activeView === 'assets' && (
            <Assets 
              assets={assets} 
              platforms={assetPlatforms} 
              onAddAsset={handleAddAsset} 
              onUpdateAsset={handleUpdateAsset} 
              onDeleteAsset={handleDeleteAsset} 
              onAddPlatform={handleAddPlatform}
              onUpdatePlatform={handleUpdatePlatform}
              onDeletePlatform={handleDeletePlatform}
              isPro={licenseInfo.isPro}
              onOpenProModal={handleOpenProModal}
            />
          )}

          {activeView === 'settings' && (
            <Settings
              theme={theme}
              onSetTheme={handleSetTheme}
              accent={accent}
              onSetAccent={handleSetAccent}
              user={user}
              onUpdateUser={(updated) => setUser(updated)}
              onResetData={handleResetData}
              onDataRestored={loadCoreData}
              totalTransactionsCount={transactions.length}
              totalInstallmentsCount={installments.length}
              totalSavingsCount={savingsGoals.length}
              totalAssetsCount={assets.length}
              onTriggerTestNotification={handleTriggerTestNotification}
              licenseInfo={licenseInfo}
              quota={quota}
              onOpenProModal={handleOpenProModal}
            />
          )}
        </div>
      </main>

      {/* ============================================================ */}
      {/* IN-APP NOTIFICATION CENTER MODAL (NO BROWSER POPUP) */}
      {/* ============================================================ */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pt-12 sm:pt-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] overflow-hidden border border-slate-100 dark:border-slate-800 transition-all">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center">
                  <Bell className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    Pengingat Jatuh Tempo Cicilan
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {dueInstallments.length > 0 
                      ? `${dueInstallments.length} tagihan perlu perhatian Anda` 
                      : 'Semua tagihan terkendali'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNotifModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Body: List of Due Items */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
              {dueInstallments.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      Tidak Ada Cicilan Mendekati Jatuh Tempo
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Semua pembayaran cicilan Anda saat ini aman atau telah lunas. Pengingat otomatis akan aktif saat mendekati jatuh tempo berikutnya.
                    </p>
                  </div>
                </div>
              ) : (
                dueInstallments.map((item) => {
                  const isOverdue = item.daysRemaining < 0;
                  const isToday = item.daysRemaining === 0;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isOverdue
                          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                          : isToday
                          ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200/70 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                isOverdue
                                  ? 'bg-rose-600 text-white'
                                  : isToday
                                  ? 'bg-amber-500 text-white animate-pulse'
                                  : 'bg-primary text-white'
                              }`}
                            >
                              {isOverdue
                                ? `Lewat ${Math.abs(item.daysRemaining)} Hari`
                                : isToday
                                ? 'Jatuh Tempo Hari Ini'
                                : `${item.daysRemaining} Hari Lagi`}
                            </span>
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                              {item.creditor}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                            {item.name}
                          </h4>

                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {formatDate(item.dueDate)}
                            </span>
                            <span>•</span>
                            <span className="font-bold text-rose-600 dark:text-rose-400">
                              Sisa {formatRupiah(item.remaining)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setShowNotifModal(false);
                            setActiveView('installments');
                            setFilterCreditor('all');
                          }}
                          className="px-3 py-2 bg-white dark:bg-slate-850 hover:bg-primary hover:text-white border border-slate-200 dark:border-slate-700 text-primary rounded-xl text-xs font-bold transition-colors shrink-0 shadow-xs cursor-pointer"
                        >
                          Bayar Cicilan
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowNotifModal(false);
                  setActiveView('settings');
                }}
                className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-primary flex items-center gap-1.5 cursor-pointer"
              >
                <SettingsIcon className="w-3.5 h-3.5" />
                <span>Pengaturan Pengingat & Izin</span>
              </button>

              <button
                onClick={() => setShowNotifModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ============================================================ */}
      {/* ARTAQU PRO UPGRADE & ACTIVATION MODAL */}
      {/* ============================================================ */}
      <ProModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        licenseInfo={licenseInfo}
        quota={quota}
        onLicenseUpdated={(updatedInfo) => {
          setLicenseInfo(updatedInfo);
          showToast(
            updatedInfo.isPro ? 'ArtaQu PRO Aktif!' : 'Lisensi Diperbarui',
            updatedInfo.isPro ? 'Selamat! Semua batasan fitur telah diaktifkan tanpa batas.' : 'Status lisensi telah diperbarui.',
            'success'
          );
        }}
        triggerReason={proTriggerReason}
      />

      {/* ============================================================ */}
      {/* REACT TOAST NOTIFICATIONS */}
      {/* ============================================================ */}
      <div className="fixed top-4 right-4 z-[70] flex flex-col gap-2 pointer-events-none max-w-xs sm:max-w-sm w-full px-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`bg-white dark:bg-slate-900 border-l-4 p-3.5 flex gap-3 items-start rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 animate-fade-in pointer-events-auto ${
              t.type === 'success' ? 'border-emerald-500' : 'border-rose-500'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs truncate">
                {t.title}
              </h4>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 font-medium leading-tight">
                {t.message}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================ */}
      {/* MOBILE BOTTOM NAVIGATION BAR (MOBILE FIRST UX) */}
      {/* ============================================================ */}
      <nav 
        id="mobile-bottom-nav" 
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-100 dark:border-slate-800/80 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] h-[70px] pb-safe"
      >
        <div className="flex justify-between items-center h-full max-w-md mx-auto relative px-1">
          {/* Dashboard */}
          <button
            onClick={() => setActiveView('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all cursor-pointer ${
              activeView === 'dashboard' 
                ? 'text-primary' 
                : 'text-slate-400 dark:text-slate-500 hover:text-primary'
            }`}
          >
            <div className={`transition-transform duration-200 ${activeView === 'dashboard' ? '-translate-y-0.5' : ''}`}>
              <Home className={`w-5 h-5 ${activeView === 'dashboard' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            </div>
            <span className={`text-[10px] font-bold mt-1 transition-all ${activeView === 'dashboard' ? 'text-primary' : 'text-slate-400'}`}>
              Beranda
            </span>
          </button>

          {/* Transactions */}
          <button
            onClick={() => setActiveView('transactions')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all cursor-pointer ${
              activeView === 'transactions' 
                ? 'text-primary' 
                : 'text-slate-400 dark:text-slate-500 hover:text-primary'
            }`}
          >
            <div className={`transition-transform duration-200 ${activeView === 'transactions' ? '-translate-y-0.5' : ''}`}>
              <ArrowRightLeft className={`w-5 h-5 ${activeView === 'transactions' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            </div>
            <span className={`text-[10px] font-bold mt-1 transition-all ${activeView === 'transactions' ? 'text-primary' : 'text-slate-400'}`}>
              Transaksi
            </span>
          </button>

          {/* Center Floating Add Button */}
          <div className="flex-1 flex justify-center items-center h-full relative">
            <button
              onClick={() => {
                setActiveView('transactions');
                setShowGlobalAdd(true);
              }}
              className="absolute -top-3 w-12 h-12 bg-gradient-to-tr from-primary to-indigo-600 hover:from-primary-hover hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-primary/40 transition-all active:scale-90 flex items-center justify-center group z-50 border-4 border-white dark:border-slate-900 cursor-pointer"
              title="Catat Transaksi"
            >
              <Plus className="w-6 h-6 stroke-[3]" />
            </button>
          </div>

          {/* Installments */}
          <button
            onClick={() => setActiveView('installments')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all cursor-pointer ${
              activeView === 'installments' 
                ? 'text-primary' 
                : 'text-slate-400 dark:text-slate-500 hover:text-primary'
            }`}
          >
            <div className={`transition-transform duration-200 ${activeView === 'installments' ? '-translate-y-0.5' : ''}`}>
              <CreditCard className={`w-5 h-5 ${activeView === 'installments' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            </div>
            <span className={`text-[10px] font-bold mt-1 transition-all ${activeView === 'installments' ? 'text-primary' : 'text-slate-400'}`}>
              Cicilan
            </span>
          </button>

          {/* Settings & Backup */}
          <button
            onClick={() => setActiveView('settings')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all cursor-pointer ${
              activeView === 'settings' 
                ? 'text-primary' 
                : 'text-slate-400 dark:text-slate-500 hover:text-primary'
            }`}
          >
            <div className={`transition-transform duration-200 ${activeView === 'settings' ? '-translate-y-0.5' : ''}`}>
              <SettingsIcon className={`w-5 h-5 ${activeView === 'settings' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            </div>
            <span className={`text-[10px] font-bold mt-1 transition-all ${activeView === 'settings' ? 'text-primary' : 'text-slate-400'}`}>
              Setelan
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}
