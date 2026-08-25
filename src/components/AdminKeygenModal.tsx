/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  Unlock, 
  Copy, 
  CheckCircle2, 
  Zap, 
  MessageSquare, 
  X, 
  History, 
  RefreshCw, 
  User, 
  Smartphone,
  AlertTriangle,
  Crown
} from 'lucide-react';
import { licenseService } from '../lib/licenseService';

interface AdminKeygenModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDeviceId?: string;
}

export const AdminKeygenModal: React.FC<AdminKeygenModalProps> = ({
  isOpen,
  onClose,
  defaultDeviceId = '',
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'generator' | 'history' | 'security'>('generator');

  // Generator State
  const [genKeyType, setGenKeyType] = useState<'device' | 'universal'>('device');
  const [custNameInput, setCustNameInput] = useState('');
  const [targetDevIdInput, setTargetDevIdInput] = useState(defaultDeviceId);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [waReplyText, setWaReplyText] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedWa, setCopiedWa] = useState(false);

  // Key History State
  const [keyHistory, setKeyHistory] = useState<Array<{
    key: string;
    type: 'device' | 'universal';
    targetDeviceId: string;
    customerName: string;
    createdAt: string;
  }>>([]);

  // Change PIN State
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (defaultDeviceId && !targetDevIdInput) {
        setTargetDevIdInput(defaultDeviceId);
      }
      if (isAuthenticated) {
        setKeyHistory(licenseService.getGeneratedKeyHistory());
      }
    }
  }, [isOpen, defaultDeviceId, isAuthenticated]);

  if (!isOpen) return null;

  // Handle Login with PIN
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (licenseService.verifyAdminPin(pinInput)) {
      setIsAuthenticated(true);
      setPinInput('');
      setKeyHistory(licenseService.getGeneratedKeyHistory());
    } else {
      setAuthError('PIN Admin salah. Silakan coba lagi.');
    }
  };

  // Handle Logout / Lock
  const handleLock = () => {
    setIsAuthenticated(false);
    setPinInput('');
    setAuthError(null);
  };

  // Handle Generate Serial Key
  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const custCode = custNameInput.trim() || 'PRO1';
    const targetDev = genKeyType === 'device' ? targetDevIdInput.trim() : undefined;

    if (genKeyType === 'device' && !targetDev) {
      alert('Masukkan Device ID pembeli terlebih dahulu.');
      return;
    }

    const key = licenseService.generateKey(genKeyType, targetDev, custCode);
    setGeneratedKey(key);

    const waText = licenseService.formatBuyerWhatsAppReply(
      custNameInput.trim(),
      key,
      genKeyType === 'device',
      targetDev
    );
    setWaReplyText(waText);

    // Refresh history
    setKeyHistory(licenseService.getGeneratedKeyHistory());
  };

  const handleCopyKey = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyWaText = () => {
    if (!waReplyText) return;
    navigator.clipboard.writeText(waReplyText);
    setCopiedWa(true);
    setTimeout(() => setCopiedWa(false), 2500);
  };

  // Handle Change PIN
  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeMsg(null);

    if (newPinInput !== confirmPinInput) {
      setPinChangeMsg({ type: 'error', text: 'Konfirmasi PIN baru tidak cocok.' });
      return;
    }

    const res = licenseService.changeAdminPin(currentPinInput, newPinInput);
    if (res.success) {
      setPinChangeMsg({ type: 'success', text: res.message });
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
      setTimeout(() => setPinChangeMsg(null), 3000);
    } else {
      setPinChangeMsg({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-1.5 text-white">
                <span>Panel Penjual & Admin Lisensi</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md">
                  Rahasia
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Khusus Admin/Pemilik ArtaQu untuk menerbitkan Serial Key pembeli
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {!isAuthenticated ? (
          /* ============================================================ */
          /* AUTHENTICATION SCREEN */
          /* ============================================================ */
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                <Lock className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Masukkan PIN Master Admin
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Panel ini dilindungi kode keamanan agar tidak dapat diakses sembarang pengguna.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 max-w-xs mx-auto">
              <div>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Masukkan PIN Admin..."
                  autoFocus
                  className="w-full text-center tracking-widest font-mono text-lg font-bold p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
                />
              </div>

              {authError && (
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs font-semibold text-center flex items-center justify-center gap-1.5 animate-shake">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Buka Panel Penjual</span>
              </button>
            </form>
          </div>
        ) : (
          /* ============================================================ */
          /* AUTHENTICATED ADMIN CONSOLE */
          /* ============================================================ */
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Top Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('generator')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'generator'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Buat Lisensi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'history'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Riwayat ({keyHistory.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'security'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Ganti PIN</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleLock}
                className="text-[11px] font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition cursor-pointer"
                title="Kunci Panel"
              >
                <Lock className="w-3 h-3" />
                <span className="hidden sm:inline">Kunci Panel</span>
              </button>
            </div>

            {/* TAB 1: GENERATOR */}
            {activeTab === 'generator' && (
              <div className="space-y-4 animate-fade-in">
                <form onSubmit={handleGenerate} className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Tipe Lisensi
                      </label>
                      <select
                        value={genKeyType}
                        onChange={(e) => setGenKeyType(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100"
                      >
                        <option value="device">Khusus Perangkat (Terkunci Device ID)</option>
                        <option value="universal">Universal (Bisa Semua Perangkat)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Nama / Kode Pembeli
                      </label>
                      <input
                        type="text"
                        value={custNameInput}
                        onChange={(e) => setCustNameInput(e.target.value)}
                        placeholder="Contoh: Budi / DEDE"
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold uppercase text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {genKeyType === 'device' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Target Device ID Pembeli
                      </label>
                      <input
                        type="text"
                        value={targetDevIdInput}
                        onChange={(e) => setTargetDevIdInput(e.target.value)}
                        placeholder="Contoh: ARTA-ABCD-1234"
                        required={genKeyType === 'device'}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-slate-900 dark:text-slate-100"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        * Minta pembeli untuk menyalin Device ID mereka dari menu Upgrade PRO.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Generate Serial Key Pembeli Sekarang</span>
                  </button>
                </form>

                {/* RESULT DISPLAY */}
                {generatedKey && (
                  <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-3 animate-fade-in">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-indigo-700 dark:text-indigo-300 block mb-1">
                        Kode Lisensi Serial Berhasil Dibuat:
                      </span>
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700">
                        <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm sm:text-base tracking-wider select-all">
                          {generatedKey}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyKey}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
                        >
                          {copiedKey ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey ? 'Disalin' : 'Salin Kode'}</span>
                        </button>
                      </div>
                    </div>

                    {/* WhatsApp Reply Template */}
                    {waReplyText && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-emerald-500" />
                            <span>Format Balasan Chat WA Pembeli</span>
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyWaText}
                            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedWa ? 'Teks WA Disalin!' : 'Salin Format WA'}</span>
                          </button>
                        </div>
                        <pre className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed max-h-36 overflow-y-auto">
                          {waReplyText}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: KEY HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Daftar Kunci yang Telah Diterbitkan
                  </span>
                  {keyHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Bersihkan riwayat pembuatan kunci?')) {
                          licenseService.clearKeyHistory();
                          setKeyHistory([]);
                        }
                      }}
                      className="text-[10px] text-red-500 hover:underline cursor-pointer"
                    >
                      Hapus Riwayat
                    </button>
                  )}
                </div>

                {keyHistory.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    Belum ada kunci serial yang dibuat dari perangkat ini.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {keyHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                              {item.key}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {item.type}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                            Pelanggan: <strong className="text-slate-600 dark:text-slate-300">{item.customerName}</strong> • {new Date(item.createdAt).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(item.key);
                            alert(`Kode ${item.key} berhasil disalin!`);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                          title="Salin Serial Key"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: SECURITY / CHANGE PIN */}
            {activeTab === 'security' && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Akses Portal Rahasia Admin</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Portal ini tidak ditampilkan di menu publik manapun. Anda dapat membukanya kembali kapan saja menggunakan salah satu cara berikut:
                  </p>
                  <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                    <li>Tambahkan <code className="font-mono font-bold bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400">?admin=portal</code> di akhir URL browser</li>
                    <li>Atau tambahkan <code className="font-mono font-bold bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400">/#admin</code> di akhir URL browser</li>
                    <li>Atau tekan shortcut keyboard: <code className="font-mono font-bold bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400">Ctrl + Shift + A</code></li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Ganti PIN Master Admin
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Ganti PIN bawaan dengan PIN rahasia Anda sendiri.
                    </p>
                  </div>

                  <form onSubmit={handleChangePin} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      PIN Saat Ini
                    </label>
                    <input
                      type="password"
                      value={currentPinInput}
                      onChange={(e) => setCurrentPinInput(e.target.value)}
                      placeholder="Masukkan PIN saat ini..."
                      required
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      PIN Baru (Min. 4 Karakter)
                    </label>
                    <input
                      type="password"
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value)}
                      placeholder="Masukkan PIN baru..."
                      required
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Konfirmasi PIN Baru
                    </label>
                    <input
                      type="password"
                      value={confirmPinInput}
                      onChange={(e) => setConfirmPinInput(e.target.value)}
                      placeholder="Ulangi PIN baru..."
                      required
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {pinChangeMsg && (
                    <div className={`p-2.5 rounded-xl text-xs font-semibold text-center ${
                      pinChangeMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                    }`}>
                      {pinChangeMsg.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Simpan PIN Baru
                  </button>
                </form>
              </div>
            </div>
            )}

          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            Offline Deterministic License Engine • v2.6
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
