/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Transaction, TransactionType, Installment } from '../types';
import { Plus, Search, Filter, Download, Edit, Trash2, Calendar, FileText, Tag, ArrowDownRight, ArrowUpRight, DollarSign, Wallet, Camera, Loader2 } from 'lucide-react';

interface TransactionsProps {
  transactions: Transaction[];
  installments: Installment[];
  formatRupiah: (num: number) => string;
  formatDate: (dateStr: string) => string;
  onAddTransaction: (trx: Omit<Transaction, 'id'>) => Promise<boolean>;
  onEditTransaction: (trx: Transaction) => Promise<boolean>;
  onDeleteTransaction: (id: string) => Promise<void>;
  showGlobalAdd?: boolean;
  onCloseGlobalAdd?: () => void;
}

export const Transactions: React.FC<TransactionsProps> = ({
  transactions,
  installments,
  formatRupiah,
  formatDate,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  showGlobalAdd,
  onCloseGlobalAdd,
}) => {
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>('Pendapatan');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [installmentId, setInstallmentId] = useState('');

  // AI Scan State
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanError(null);

    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.data) {
        setType('Pengeluaran');
        if (data.data.amount) setAmount(data.data.amount.toString());
        if (data.data.category) setCategory(data.data.category);
        if (data.data.description) setDescription(data.data.description);
      } else {
        setScanError(data.message || 'Gagal memindai struk.');
      }
    } catch (err: any) {
      setScanError(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setIsScanning(false);
      // Reset input value so same file can be selected again
      e.target.value = '';
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Open modal for adding
  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    
    const headers = ['Tanggal', 'Tipe', 'Kategori', 'Jumlah', 'Keterangan'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => 
        [t.date, t.type, t.category, t.amount, `"${t.description.replace(/"/g, '""')}"`].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'ArtaQu_Transaksi.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setDate(new Date().toISOString().split('T')[0]);
    setType('Pendapatan');
    setCategory('');
    setAmount('');
    setDescription('');
    setInstallmentId('');
    setScanError(null);
    setIsModalOpen(true);
  };

  React.useEffect(() => {
    if (showGlobalAdd && onCloseGlobalAdd) {
      handleOpenAddModal();
      onCloseGlobalAdd();
    }
  }, [showGlobalAdd, onCloseGlobalAdd]);

  // Open modal for editing
  const handleOpenEditModal = (trx: Transaction) => {
    setEditingTransaction(trx);
    setDate(trx.date);
    setType(trx.type);
    setCategory(trx.category);
    setAmount(trx.amount.toString());
    setDescription(trx.description);
    setInstallmentId(trx.installment_id || '');
    setIsModalOpen(true);
  };

  // Handle Type Change
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'Cicilan') {
      setCategory('Pembayaran Cicilan');
      // Set to first active installment if available
      const activeInsts = installments.filter((i) => i.status !== 'Lunas');
      if (activeInsts.length > 0) {
        setInstallmentId(activeInsts[0].id);
      }
    } else if (category === 'Pembayaran Cicilan') {
      setCategory('');
      setInstallmentId('');
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      alert('Jumlah uang tidak valid!');
      return;
    }

    if (type === 'Cicilan' && !installmentId) {
      alert('Silakan pilih cicilan yang ingin dibayar!');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      date,
      type,
      category: type === 'Cicilan' ? 'Pembayaran Cicilan' : category,
      amount: parseFloat(amount),
      description,
      installment_id: type === 'Cicilan' ? installmentId : null,
    };

    let success = false;
    if (editingTransaction) {
      success = await onEditTransaction({ ...payload, id: editingTransaction.id });
    } else {
      success = await onAddTransaction(payload);
    }

    setIsSubmitting(false);
    if (success) {
      setIsModalOpen(false);
    }
  };

  // Badge styles
  const getBadgeClass = (trxType: TransactionType) => {
    switch (trxType) {
      case 'Pendapatan':
        return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30';
      case 'Pengeluaran':
        return 'bg-rose-50 dark:bg-red-950/20 text-rose-600 dark:text-red-400 border border-rose-100 dark:border-rose-900/30';
      case 'Piutang':
        return 'bg-primary-light dark:bg-primary-light text-primary dark:text-primary border border-primary dark:border-primary';
      case 'Cicilan':
        return 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30';
    }
  };

  const getAmountColor = (trxType: TransactionType) => {
    switch (trxType) {
      case 'Pendapatan':
      case 'Piutang':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'Pengeluaran':
      case 'Cicilan':
        return 'text-rose-600 dark:text-rose-400';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Riwayat Transaksi</h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Total {transactions.length} transaksi tercatat</p>
        </div>
                <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-4 py-3 rounded-xl text-xs font-semibold transition-all shadow-sm hover:shadow-md flex gap-2 items-center justify-center cursor-pointer"
            title="Ekspor ke CSV"
          >
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">Ekspor</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex-2 sm:flex-none w-full sm:w-auto bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary-hover text-white px-5 py-3 rounded-xl text-xs font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex gap-2 items-center justify-center cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 p-4 rounded-xl shadow-sm">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kategori atau deskripsi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-slate-200"
          />
        </div>

        {/* Type Filter */}
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-slate-200 cursor-pointer appearance-none"
          >
            <option value="all">Semua Jenis</option>
            <option value="Pendapatan">Pendapatan</option>
            <option value="Pengeluaran">Pengeluaran</option>
            <option value="Piutang">Piutang</option>
            <option value="Cicilan">Cicilan</option>
          </select>
        </div>
      </div>

      {/* Transactions Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="text-center p-12 text-slate-400 dark:text-slate-500">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-semibold text-xs">Tidak ada transaksi yang cocok.</p>
            <p className="text-xs mt-1">Coba sesuaikan kata kunci pencarian atau filter Anda.</p>
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-6 py-4">Jenis</th>
                    <th className="px-6 py-4">Kategori</th>
                    <th className="px-6 py-4">Deskripsi</th>
                    <th className="px-6 py-4 text-right">Jumlah</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {filteredTransactions.map((trx) => (
                    <tr 
                      key={trx.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs font-semibold font-mono text-slate-500">
                        {formatDate(trx.date)}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getBadgeClass(trx.type)}`}>
                          {trx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 font-bold text-slate-800 dark:text-slate-200">
                        {trx.category}
                      </td>
                      <td className="px-6 py-4.5 text-slate-500 max-w-[220px] truncate" title={trx.description}>
                        {trx.description || '-'}
                      </td>
                      <td className={`px-6 py-4.5 text-right font-extrabold whitespace-nowrap ${getAmountColor(trx.type)}`}>
                        {trx.type === 'Pendapatan' || trx.type === 'Piutang' ? '+' : '-'} {formatRupiah(trx.amount)}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleOpenEditModal(trx)}
                            className="p-2 text-primary hover:bg-primary-light dark:hover:bg-primary-light rounded-lg cursor-pointer transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(trx.id)}
                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-red-950/30 rounded-lg cursor-pointer transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredTransactions.map((trx) => (
                <div key={trx.id} className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                        {trx.category}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold font-mono">
                        {formatDate(trx.date)}
                      </div>
                    </div>
                    <div className={`text-xs font-extrabold whitespace-nowrap ${getAmountColor(trx.type)}`}>
                      {trx.type === 'Pendapatan' || trx.type === 'Piutang' ? '+' : '-'} {formatRupiah(trx.amount)}
                    </div>
                  </div>

                  {trx.description && (
                    <p className="text-[11px] text-slate-500 truncate" title={trx.description}>
                      {trx.description}
                    </p>
                  )}

                  <div className="flex justify-between items-center pt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getBadgeClass(trx.type)}`}>
                      {trx.type}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEditModal(trx)}
                        className="p-2 text-primary hover:bg-primary-light rounded-lg cursor-pointer"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(trx.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Transaction Modal (Add / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 pt-10 sm:pt-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 dark:border-slate-800 transition-all duration-300">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Tanggal
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    onKeyDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      const target = e.target as HTMLInputElement;
                      if ('showPicker' in target) {
                        try { target.showPicker(); } catch (err) {}
                      }
                    }}
                    onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Tanggal belum diisi!')}
                    onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-xs dark:bg-slate-950 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                  />
                </div>
              </div>

              {/* Type and Category Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                    Jenis
                  </label>
                  <select
                    value={type}
                    onChange={(e) => handleTypeChange(e.target.value as TransactionType)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-xs dark:bg-slate-950 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                  >
                    <option value="Pendapatan">Pendapatan</option>
                    <option value="Pengeluaran">Pengeluaran</option>
                    <option value="Piutang">Piutang (Memberi)</option>
                    <option value="Cicilan">Bayar Cicilan</option>
                  </select>
                </div>

                {/* Category (Hidden/auto-set if type is Cicilan) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                    Kategori
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      disabled={type === 'Cicilan'}
                      value={type === 'Cicilan' ? 'Pembayaran Cicilan' : category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Makanan, Gaji, dll"
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-xs dark:bg-slate-950 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Installment Selector (Only active if type is Cicilan) */}
              {type === 'Cicilan' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                    Pilih Cicilan Aktif
                  </label>
                  <select
                    required
                    value={installmentId}
                    onChange={(e) => setInstallmentId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-xs dark:bg-slate-950 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                  >
                    {installments.filter(i => i.status !== 'Lunas').length === 0 ? (
                      <option value="">-- Tidak ada cicilan berjalan --</option>
                    ) : (
                      installments
                        .filter(i => i.status !== 'Lunas')
                        .map(i => (
                          <option key={i.id} value={i.id}>
                            {i.name} ({i.creditor}) - Sisa: {formatRupiah(i.remaining)}
                          </option>
                        ))
                    )}
                  </select>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Jumlah (Rp)
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</div>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Contoh: 150000"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-xs dark:bg-slate-950 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
                  />
                </div>
              </div>

              {/* Description (Keterangan) */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Keterangan
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Opsional (misal: belanja bulanan supermarket)"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-xs dark:bg-slate-950 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary-hover text-white rounded-lg font-semibold text-xs transition-all duration-300 shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
