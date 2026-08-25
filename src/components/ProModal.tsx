/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Crown, 
  Check, 
  X, 
  Copy, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Smartphone, 
  KeyRound, 
  MessageSquare,
  Wrench,
  Zap,
  Lock
} from 'lucide-react';
import { licenseService, FREE_LIMITS } from '../lib/licenseService';
import { LicenseInfo, UsageQuota } from '../types';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
  licenseInfo: LicenseInfo;
  quota?: UsageQuota;
  onLicenseUpdated: (info: LicenseInfo) => void;
  triggerReason?: string;
}

export const ProModal: React.FC<ProModalProps> = ({
  isOpen,
  onClose,
  licenseInfo,
  quota,
  onLicenseUpdated,
  triggerReason,
}) => {
  const [serialKeyInput, setSerialKeyInput] = useState('');
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedDevId, setCopiedDevId] = useState(false);
  const [copiedWaText, setCopiedWaText] = useState(false);

  if (!isOpen) return null;

  const handleCopyDeviceId = () => {
    navigator.clipboard.writeText(licenseInfo.deviceId);
    setCopiedDevId(true);
    setTimeout(() => setCopiedDevId(false), 2000);
  };

  const handleCopyOrderText = () => {
    const text = `Halo Admin ArtaQu, saya ingin membeli Kode Lisensi ArtaQu PRO Lifetime.\nDevice ID saya: ${licenseInfo.deviceId}`;
    navigator.clipboard.writeText(text);
    setCopiedWaText(true);
    setTimeout(() => setCopiedWaText(false), 2500);
  };

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!serialKeyInput.trim()) {
      setErrorMsg('Masukkan kode lisensi serial terlebih dahulu.');
      return;
    }

    const res = licenseService.activateLicense(serialKeyInput, customerNameInput);
    if (res.success && res.license) {
      setSuccessMsg(res.message);
      onLicenseUpdated(res.license);
      setTimeout(() => {
        onClose();
      }, 1800);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleDeactivate = () => {
    if (confirm('Apakah Anda yakin ingin menonaktifkan lisensi PRO di perangkat ini?')) {
      licenseService.deactivateLicense();
      const updated = licenseService.getLicenseInfo();
      onLicenseUpdated(updated);
      setSuccessMsg('Lisensi berhasil dinonaktifkan.');
      setTimeout(() => setSuccessMsg(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800 transition-all my-auto">
        
        {/* Header Section */}
        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-amber-500/15 via-primary/10 to-transparent border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                  ArtaQu PRO Lifetime
                </h3>
                {licenseInfo.isPro ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-emerald-500 text-white uppercase shadow-xs">
                    Aktif
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                    Free Tier
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Buka seluruh kapasitas pencatatan & manajemen keuangan tanpa batasan.
              </p>
            </div>
          </div>

          {triggerReason && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
              <span>{triggerReason}</span>
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
          
          {/* Active License Status Banner (If Pro) */}
          {licenseInfo.isPro ? (
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    Lisensi PRO Anda Telah Aktif Permanen
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDeactivate}
                  className="text-[11px] font-bold text-rose-500 hover:text-rose-600 underline cursor-pointer"
                >
                  Nonaktifkan
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-emerald-200/60 dark:border-emerald-900/40">
                <div>
                  <span className="text-slate-400 block text-[10px]">Pemegang Lisensi:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {licenseInfo.customerName || 'Pengguna PRO'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Kode Serial:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {licenseInfo.licenseKey}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Activation Input & Device ID Info (If Free) */
            <div className="space-y-4">
              
              {/* Device ID Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    ID Perangkat Anda (Device ID)
                  </span>
                  <span className="text-xs sm:text-sm font-mono font-bold text-slate-800 dark:text-slate-100 truncate block">
                    {licenseInfo.deviceId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyDeviceId}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                >
                  {copiedDevId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Salin ID</span>
                    </>
                  )}
                </button>
              </div>

              {/* Form Input Serial Key */}
              <form onSubmit={handleActivate} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                    <span>Masukkan Kode Serial Lisensi</span>
                  </label>
                  <input
                    type="text"
                    value={serialKeyInput}
                    onChange={(e) => setSerialKeyInput(e.target.value.toUpperCase())}
                    placeholder="Contoh: ARTA-PRO-XXXX-YYYY atau ARTA-PRO-LIFETIME-VIP"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs sm:text-sm font-bold tracking-wide focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase placeholder:normal-case placeholder:font-sans placeholder:font-normal"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customerNameInput}
                    onChange={(e) => setCustomerNameInput(e.target.value)}
                    placeholder="Nama Pemilik Lisensi (Opsional)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition shrink-0 cursor-pointer"
                  >
                    Aktivasi Sekarang
                  </button>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                    <X className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>{successMsg}</span>
                  </div>
                )}
              </form>

              {/* Order / Purchase Assistance */}
              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/15 border border-amber-200/60 dark:border-amber-900/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                    <span>Belum Punya Kode Lisensi?</span>
                  </span>
                  <span className="text-[10px] font-black text-amber-600 uppercase">Sekali Beli Aktif Selamanya</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Dapatkan kode serial resmi dengan mengirimkan Device ID Anda ke penjual atau melalui kontak pemesanan.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyOrderText}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {copiedWaText ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Format Pesan Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Format Pesanan WhatsApp</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Comparison Table: Free vs PRO */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Perbandingan Fitur Free vs PRO
            </h4>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 font-bold text-slate-500 dark:text-slate-400">Fitur & Batasan</th>
                    <th className="p-3 font-bold text-slate-500 dark:text-slate-400 text-center w-28">Versi Gratis</th>
                    <th className="p-3 font-bold text-amber-600 dark:text-amber-400 text-center w-28 bg-amber-500/5">PRO Lifetime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="p-3 font-medium">Kapasitas Transaksi</td>
                    <td className="p-3 text-center text-slate-500">Maks. {FREE_LIMITS.TRANSACTIONS} item</td>
                    <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-amber-500/5">Tanpa Batas</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Jadwal Cicilan & Hutang</td>
                    <td className="p-3 text-center text-slate-500">Maks. {FREE_LIMITS.INSTALLMENTS} item</td>
                    <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-amber-500/5">Tanpa Batas</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Target Tabungan</td>
                    <td className="p-3 text-center text-slate-500">Maks. {FREE_LIMITS.SAVINGS} target</td>
                    <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-amber-500/5">Tanpa Batas</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Portofolio Aset & Investasi</td>
                    <td className="p-3 text-center text-slate-500">Maks. {FREE_LIMITS.ASSETS} aset</td>
                    <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-amber-500/5">Tanpa Batas</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Pengingat Jatuh Tempo Harian</td>
                    <td className="p-3 text-center text-slate-500">Dasar</td>
                    <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-amber-500/5">Prioritas Web</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Cadangan & Pemulihan JSON</td>
                    <td className="p-3 text-center text-slate-500">Ekspor Saja</td>
                    <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-amber-500/5">Ekspor & Impor</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            Lisensi ArtaQu PRO berlaku seumur hidup (Lifetime)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
