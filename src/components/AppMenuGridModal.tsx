/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Layers, 
  ArrowRightLeft, 
  CreditCard, 
  Target, 
  Briefcase, 
  Settings as SettingsIcon, 
  Bell, 
  Crown, 
  Archive, 
  BarChart3, 
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface AppMenuItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Utama' | 'Investasi & Perencanaan' | 'Sistem & Keamanan';
  icon: React.ReactNode;
  colorBg: string;
  colorText: string;
  badge?: string | number;
  badgeType?: 'warning' | 'info' | 'success' | 'pro';
  targetView?: 'dashboard' | 'transactions' | 'installments' | 'savings' | 'assets' | 'settings';
  action?: () => void;
}

interface AppMenuGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: string;
  onNavigate: (view: 'dashboard' | 'transactions' | 'installments' | 'savings' | 'assets' | 'settings') => void;
  onOpenProModal: () => void;
  onOpenNotifModal: () => void;
  onQuickAddTransaction?: () => void;
  isProUser: boolean;
  dueInstallmentsCount: number;
  totalSavingsCount: number;
  totalAssetsCount: number;
}

export const AppMenuGridModal: React.FC<AppMenuGridModalProps> = ({
  isOpen,
  onClose,
  activeView,
  onNavigate,
  onOpenProModal,
  onOpenNotifModal,
  onQuickAddTransaction,
  isProUser,
  dueInstallmentsCount,
  totalSavingsCount,
  totalAssetsCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  const menuItems: AppMenuItem[] = useMemo(() => [
    {
      id: 'dashboard',
      title: 'Dashboard',
      subtitle: 'Ringkasan saldo, arus kas, dan grafik keuangan',
      category: 'Utama',
      icon: <Layers className="w-5 h-5" />,
      colorBg: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
      colorText: 'text-blue-600 dark:text-blue-400',
      targetView: 'dashboard',
    },
    {
      id: 'transactions',
      title: 'Transaksi',
      subtitle: 'Pencatatan pemasukan, pengeluaran, dan riwayat',
      category: 'Utama',
      icon: <ArrowRightLeft className="w-5 h-5" />,
      colorBg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      colorText: 'text-emerald-600 dark:text-emerald-400',
      targetView: 'transactions',
    },
    {
      id: 'installments',
      title: 'Cicilan & Utang',
      subtitle: 'Pantau angsuran, jatuh tempo, dan riwayat bayar',
      category: 'Utama',
      icon: <CreditCard className="w-5 h-5" />,
      colorBg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
      colorText: 'text-amber-600 dark:text-amber-400',
      badge: dueInstallmentsCount > 0 ? `${dueInstallmentsCount} Jatuh Tempo` : undefined,
      badgeType: 'warning',
      targetView: 'installments',
    },
    {
      id: 'savings',
      title: 'Target Tabungan',
      subtitle: 'Celengan impian, progress bar, dan alokasi dana',
      category: 'Investasi & Perencanaan',
      icon: <Target className="w-5 h-5" />,
      colorBg: 'bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400',
      colorText: 'text-violet-600 dark:text-violet-400',
      badge: totalSavingsCount > 0 ? `${totalSavingsCount} Target` : undefined,
      badgeType: 'info',
      targetView: 'savings',
    },
    {
      id: 'assets',
      title: 'Aset Digital',
      subtitle: 'Portofolio investasi saham, kripto, emas & properti',
      category: 'Investasi & Perencanaan',
      icon: <Briefcase className="w-5 h-5" />,
      colorBg: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
      colorText: 'text-indigo-600 dark:text-indigo-400',
      badge: totalAssetsCount > 0 ? `${totalAssetsCount} Aset` : undefined,
      badgeType: 'info',
      targetView: 'assets',
    },
    {
      id: 'notifications',
      title: 'Pengingat Cicilan',
      subtitle: 'Jadwal jatuh tempo dan peringatan tagihan rutin',
      category: 'Utama',
      icon: <Bell className="w-5 h-5" />,
      colorBg: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400',
      colorText: 'text-rose-600 dark:text-rose-400',
      badge: dueInstallmentsCount > 0 ? `${dueInstallmentsCount}` : undefined,
      badgeType: 'warning',
      action: () => {
        onClose();
        onOpenNotifModal();
      },
    },
    {
      id: 'settings',
      title: 'Setelan & Preferensi',
      subtitle: 'Warna tema, mode gelap, PIN dan preferensi akun',
      category: 'Sistem & Keamanan',
      icon: <SettingsIcon className="w-5 h-5" />,
      colorBg: 'bg-slate-500/10 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400',
      colorText: 'text-slate-600 dark:text-slate-400',
      targetView: 'settings',
    },
    {
      id: 'backup',
      title: 'Cadangkan & Pulihkan',
      subtitle: 'Simpan arsip data mandiri atau pulihkan data',
      category: 'Sistem & Keamanan',
      icon: <Archive className="w-5 h-5" />,
      colorBg: 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400',
      colorText: 'text-teal-600 dark:text-teal-400',
      targetView: 'settings',
    },
    {
      id: 'pro_license',
      title: isProUser ? 'Status ArtaQu PRO' : 'Upgrade ArtaQu PRO',
      subtitle: isProUser ? 'Lisensi seumur hidup aktif tanpa batasan' : 'Akses fitur penuh tanpa batas kuota transaksi',
      category: 'Sistem & Keamanan',
      icon: <Crown className="w-5 h-5" />,
      colorBg: 'bg-amber-500/15 dark:bg-amber-500/25 text-amber-600 dark:text-amber-400',
      colorText: 'text-amber-600 dark:text-amber-400',
      badge: isProUser ? 'Aktif' : 'PRO',
      badgeType: 'pro',
      action: () => {
        onClose();
        onOpenProModal();
      },
    },
  ], [isProUser, dueInstallmentsCount, totalSavingsCount, totalAssetsCount, onOpenNotifModal, onOpenProModal, onClose]);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === 'Semua' || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  const categories = ['Semua', 'Utama', 'Investasi & Perencanaan', 'Sistem & Keamanan'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up"
        role="dialog"
        aria-modal="true"
        id="app-menu-grid-modal"
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Menu Utama Aplikasi</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-light text-primary uppercase tracking-wide">
                  Grid Navigasi
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Akses cepat seluruh modul dan fitur ArtaQu
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari menu, modul, atau fitur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Hapus
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Content Area (Responsive Grid) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Tidak ada menu yang sesuai dengan pencarian.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {filteredItems.map((item) => {
                const isActive = item.targetView === activeView;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.action) {
                        item.action();
                      } else if (item.targetView) {
                        onNavigate(item.targetView);
                        onClose();
                      }
                    }}
                    className={`relative group p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between text-left select-none ${
                      isActive
                        ? 'bg-primary/5 dark:bg-primary/10 border-primary shadow-sm ring-1 ring-primary/20'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 hover:border-primary/50 hover:shadow-md hover:bg-slate-50/80 dark:hover:bg-slate-800'
                    }`}
                  >
                    {/* Top Row: Icon & Status Badge */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${item.colorBg}`}>
                        {item.icon}
                      </div>

                      {item.badge ? (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          item.badgeType === 'warning'
                            ? 'bg-rose-500 text-white'
                            : item.badgeType === 'pro'
                            ? 'bg-amber-500 text-white'
                            : 'bg-primary text-white'
                        }`}>
                          {item.badge}
                        </span>
                      ) : isActive ? (
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                      ) : null}
                    </div>

                    {/* Content */}
                    <div>
                      <h4 className={`text-xs sm:text-sm font-black transition-colors ${
                        isActive ? 'text-primary' : 'text-slate-900 dark:text-slate-100 group-hover:text-primary'
                      }`}>
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-2">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Action Shortcuts Bar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Aksi Cepat
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onClose();
                  if (onQuickAddTransaction) {
                    onQuickAddTransaction();
                  } else {
                    onNavigate('transactions');
                  }
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-bold transition text-left cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Catat Transaksi Baru</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onNavigate('installments');
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-bold transition text-left cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Kelola Tagihan & Cicilan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Penyimpanan Lokal Mandiri • 100% Offline</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
