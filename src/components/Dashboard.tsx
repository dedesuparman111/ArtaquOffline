/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { DashboardData, Installment, Transaction } from '../types';
import { Analytics } from './Analytics';
import { 
  TrendingUp, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  CreditCard, 
  ClipboardList, 
  Building2, 
  PlusCircle, 
  CalendarDays, 
  AlertTriangle, 
  HardDrive,
  Download,
  Target,
  ArrowRight
} from 'lucide-react';

interface DashboardProps {
  data: DashboardData;
  installments: Installment[];
  transactions: Transaction[];
  formatRupiah: (num: number) => string;
  onFilterCreditor: (creditor: string) => void;
  onQuickAddTransaction?: () => void;
  onNavigateTo?: (view: 'transactions' | 'installments' | 'savings' | 'assets' | 'settings') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  data,
  installments,
  transactions,
  formatRupiah,
  onFilterCreditor,
  onQuickAddTransaction,
  onNavigateTo,
}) => {
  // Map creditors and their remaining outstanding amount
  const creditorMap: { [key: string]: number } = {};
  installments.forEach((inst) => {
    if (inst.status !== 'Lunas') {
      const cred = inst.creditor || 'Lainnya';
      creditorMap[cred] = (creditorMap[cred] || 0) + inst.remaining;
    }
  });
  
  // Upcoming Due Dates within next 7 days
  const upcomingDueDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);

    return installments
      .filter(inst => {
        if (inst.status === 'Lunas' || !inst.due_date) return false;
        const dueDate = new Date(inst.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today && dueDate <= next7Days;
      })
      .sort((a, b) => new Date(a.due_date || '').getTime() - new Date(b.due_date || '').getTime());
  }, [installments]);

  const creditors = Object.keys(creditorMap).sort((a, b) => creditorMap[b] - creditorMap[a]);

  // Recent 5 transactions
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  return (
    <div className="space-y-5 animate-fade-in" id="dashboard-view">
      
      {/* 1. HERO BALANCE CARD (MOBILE FIRST) */}
      <div 
        className="rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden transition-all duration-300 bg-gradient-to-br from-primary to-primary-hover"
      >
        <div className="absolute top-0 right-0 p-4 sm:p-6 opacity-10 pointer-events-none">
          <TrendingUp className="w-36 h-36 sm:w-48 sm:h-48" />
        </div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -mb-16 -ml-16 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-white/80 text-[11px] sm:text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Total Saldo Bersih
            </span>
            <span className="text-[10px] bg-white/15 px-2.5 py-0.5 rounded-full font-semibold backdrop-blur-sm border border-white/20">
              Offline Lokal
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight drop-shadow-sm">
            {formatRupiah(data.balance)}
          </h2>

          <div className="mt-4 pt-3.5 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="block text-[10px] text-white/70">Pemasukan</span>
                <span className="font-bold text-white text-xs sm:text-sm">+{formatRupiah(data.income)}</span>
              </div>
              <div className="w-[1px] h-6 bg-white/20"></div>
              <div>
                <span className="block text-[10px] text-white/70">Pengeluaran</span>
                <span className="font-bold text-white text-xs sm:text-sm">-{formatRupiah(data.expense)}</span>
              </div>
            </div>

            {data.installmentOutstanding > 0 && (
              <span className="text-[10px] bg-amber-400/20 text-amber-200 px-2.5 py-1 rounded-lg border border-amber-300/30 font-medium">
                Sisa Cicilan: {formatRupiah(data.installmentOutstanding)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. UPCOMING DUE DATES ALERT (IF ANY) */}
      {upcomingDueDates.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Jatuh Tempo Cicilan Mendatang ({upcomingDueDates.length})</span>
            </h4>
            <button
              onClick={() => onNavigateTo?.('installments')}
              className="text-[10px] font-bold text-amber-700 dark:text-amber-300 hover:underline"
            >
              Lihat Semua
            </button>
          </div>
          <div className="space-y-1.5">
            {upcomingDueDates.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/30"
              >
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">{item.name}</span>
                  <span className="text-[10px] text-slate-400">
                    Tempo: {item.due_date ? new Date(item.due_date).toLocaleDateString('id-ID') : '-'}
                  </span>
                </div>
                <span className="font-extrabold text-rose-500 text-xs">
                  {formatRupiah(item.remaining)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Income */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1.5">
            <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg flex items-center justify-center">
              <ArrowDownCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pendapatan
            </span>
          </div>
          <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
            {formatRupiah(data.income)}
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-red-500 dark:text-red-400 mb-1.5">
            <div className="w-8 h-8 bg-red-50 dark:bg-red-950/30 rounded-lg flex items-center justify-center">
              <ArrowUpCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pengeluaran
            </span>
          </div>
          <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
            {formatRupiah(data.expense)}
          </div>
        </div>

        {/* Cicilan Aktif */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400 mb-1.5">
            <div className="w-8 h-8 bg-amber-50 dark:bg-amber-950/30 rounded-lg flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cicilan Aktif
            </span>
          </div>
          <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
            {formatRupiah(data.debt)}
          </div>
        </div>

        {/* Digital Assets */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400 mb-1.5">
            <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Aset Digital
            </span>
          </div>
          <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
            {formatRupiah(data.totalAssetValue || 0)}
          </div>
        </div>
      </div>

      {/* 5. SISA CICILAN PER KREDITUR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-2xl shadow-sm p-4 sm:p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-500" />
            <span>Cicilan per Kreditur</span>
          </h3>
          <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-full">
            Total: {formatRupiah(data.installmentOutstanding)}
          </span>
        </div>
        
        {creditors.length === 0 ? (
          <div className="text-center text-slate-400 text-xs py-4 border border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
            Tidak ada cicilan aktif saat ini.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {creditors.map((cred) => (
              <button
                key={cred}
                onClick={() => onFilterCreditor(cred)}
                className="text-left bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800/60 p-2.5 rounded-xl transition cursor-pointer"
              >
                <span className="text-[10px] text-slate-400 font-semibold uppercase truncate block">
                  {cred}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                  {formatRupiah(creditorMap[cred])}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 6. RECENT TRANSACTIONS PREVIEW */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-2xl shadow-sm p-4 sm:p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
            Transaksi Terbaru
          </h3>
          <button
            onClick={() => onNavigateTo?.('transactions')}
            className="text-[11px] font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center text-slate-400 text-xs py-6 border border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
            Belum ada catatan transaksi. Tekan tombol <b>+ Catat</b> untuk memulai!
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((trx) => (
              <div
                key={trx.id}
                className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/40"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    trx.type === 'Pendapatan' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500' :
                    trx.type === 'Pengeluaran' ? 'bg-red-50 dark:bg-red-950/30 text-red-500' :
                    trx.type === 'Cicilan' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-500' :
                    'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500'
                  }`}>
                    {trx.type === 'Pendapatan' ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                      {trx.category}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate block">
                      {trx.description || trx.date}
                    </span>
                  </div>
                </div>

                <span className={`text-xs font-extrabold shrink-0 ${
                  trx.type === 'Pendapatan' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                }`}>
                  {trx.type === 'Pendapatan' ? '+' : '-'}{formatRupiah(trx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. VISUAL ANALYTICS */}
      <div className="mt-4">
        <Analytics transactions={transactions} formatRupiah={formatRupiah} />
      </div>
    </div>
  );
};
