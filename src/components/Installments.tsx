/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Installment } from '../types';
import { Plus, Filter, Edit, Trash2, Calendar, FileText, CheckCircle2, Clock, Landmark, Layers, Camera, Upload, X, Search } from 'lucide-react';

interface InstallmentsProps {
  installments: Installment[];
  formatRupiah: (num: number) => string;
  formatDate: (dateStr: string) => string;
  onAddInstallment: (inst: Omit<Installment, 'id' | 'remaining' | 'paid_amount' | 'status'>) => Promise<boolean>;
  onEditInstallment: (inst: Installment) => Promise<boolean>;
  onDeleteInstallment: (id: string) => Promise<void>;
  filterCreditor: string;
  onSetFilterCreditor: (creditor: string) => void;
}

export const Installments: React.FC<InstallmentsProps> = ({
  installments,
  formatRupiah,
  formatDate,
  onAddInstallment,
  onEditInstallment,
  onDeleteInstallment,
  filterCreditor,
  onSetFilterCreditor,
}) => {
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [creditor, setCreditor] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState(''); // For editing only
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [viewReceipt, setViewReceipt] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all unique creditors for filtering
  const uniqueCreditors = Array.from(new Set(installments.map((i) => i.creditor).filter(Boolean)));

  // Filter installments
  const filteredInstallments = installments.filter((i) => {
    const matchCreditor = filterCreditor === 'all' || i.creditor === filterCreditor;
    const matchSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        i.creditor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCreditor && matchSearch;
  });

  // Calculate recap summaries
  let sumTotal = 0;
  let sumPaid = 0;
  let sumRemaining = 0;

  filteredInstallments.forEach((i) => {
    sumTotal += i.total_amount;
    sumPaid += i.paid_amount;
    sumRemaining += i.remaining;
  });

  // Open add modal
  const handleOpenAddModal = () => {
    setEditingInstallment(null);
    setName('');
    setCreditor('');
    setTotalAmount('');
    setPaidAmount('0');
    setStartDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setDescription('');
    setReceiptUrl('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (inst: Installment) => {
    setEditingInstallment(inst);
    setName(inst.name);
    setCreditor(inst.creditor);
    setTotalAmount(inst.total_amount.toString());
    setPaidAmount(inst.paid_amount.toString());
    setStartDate(inst.start_date);
    setDueDate(inst.due_date || '');
    setDescription(inst.description || '');
    setReceiptUrl(inst.receipt_url || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim() || !creditor.trim()) {
      setFormError('Nama dan Kreditur tidak boleh kosong.');
      return;
    }
    if (!totalAmount || isNaN(parseFloat(totalAmount)) || parseFloat(totalAmount) <= 0) {
      setFormError('Total nilai pinjaman harus lebih besar dari 0.');
      return;
    }

    setIsSubmitting(true);

    let success = false;
    if (editingInstallment) {
      const payload: Installment = {
        ...editingInstallment,
        name,
        creditor,
        total_amount: parseFloat(totalAmount),
        paid_amount: parseFloat(paidAmount || '0'),
        remaining: parseFloat(totalAmount) - parseFloat(paidAmount || '0'),
        start_date: startDate,
        due_date: dueDate || null,
        description,
        receipt_url: receiptUrl || null,
        status: parseFloat(paidAmount || '0') >= parseFloat(totalAmount) ? 'Lunas' : 'Berjalan',
      };
      success = await onEditInstallment(payload);
    } else {
      const payload = {
        name,
        creditor,
        total_amount: parseFloat(totalAmount),
        start_date: startDate,
        due_date: dueDate || null,
        description,
        receipt_url: receiptUrl || null,
      };
      success = await onAddInstallment(payload);
    }

    setIsSubmitting(false);
    if (success) {
      setIsModalOpen(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // File size check
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if too large
        const MAX_DIMENSION = 800;
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress as JPEG
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setReceiptUrl(compressedDataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Creditor Filter and Add Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Manajemen Cicilan</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total {installments.length} cicilan terdaftar</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search Filter */}
          <div className="relative flex-1 sm:flex-none sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Barang/Keperluan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none font-semibold text-slate-700 dark:text-slate-300 shadow-sm focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>

          {/* Creditor Filter */}
          <div className="relative flex-1 sm:flex-none sm:w-56">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterCreditor}
              onChange={(e) => onSetFilterCreditor(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none font-semibold text-slate-700 dark:text-slate-300 cursor-pointer appearance-none shadow-sm focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Semua Kreditur</option>
              {uniqueCreditors.map((cred) => (
                <option key={cred} value={cred}>
                  {cred}
                </option>
              ))}
            </select>
          </div>

          {/* Add Installment Button */}
          <button
            onClick={handleOpenAddModal}
            className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-md hover:shadow-lg flex gap-2 items-center justify-center cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            <span>Cicilan Baru</span>
          </button>
        </div>
      </div>

      {/* Loan Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Loan */}
        <div className="bg-primary-light/50 dark:bg-primary-light p-5 rounded-2xl border border-primary/50 dark:border-primary shadow-sm">
          <p className="text-primary dark:text-primary text-xs font-bold uppercase tracking-wider mb-1">
            Total Pinjaman
          </p>
          <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-200">
            {formatRupiah(sumTotal)}
          </h4>
        </div>

        {/* Paid Loan */}
        <div className="bg-emerald-50/50 dark:bg-emerald-950/10 p-5 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/20 shadow-sm">
          <p className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            Sudah Dibayar
          </p>
          <h4 className="text-lg sm:text-xl font-black text-emerald-950 dark:text-emerald-200">
            {formatRupiah(sumPaid)}
          </h4>
        </div>

        {/* Remaining Loan */}
        <div className="bg-rose-50/50 dark:bg-red-950/10 p-5 rounded-2xl border border-rose-100/50 dark:border-red-900/20 shadow-sm">
          <p className="text-rose-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-1">
            Sisa Tagihan
          </p>
          <h4 className="text-lg sm:text-xl font-black text-rose-950 dark:text-red-200">
            {formatRupiah(sumRemaining)}
          </h4>
        </div>
      </div>

      {/* Installments Table/List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden">
        {filteredInstallments.length === 0 ? (
          <div className="text-center p-12 text-slate-400 dark:text-slate-500">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-semibold text-sm">Belum ada cicilan terdaftar.</p>
            <p className="text-xs mt-1">Gunakan tombol "Cicilan Baru" untuk menambahkan cicilan pertama Anda.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4">Barang / Nama</th>
                    <th className="px-6 py-4">Kreditur</th>
                    <th className="px-6 py-4 text-right">Nilai Pinjaman</th>
                    <th className="px-6 py-4 text-right">Sisa</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {filteredInstallments.map((inst) => {
                    const isLunas = inst.status === 'Lunas';
                    return (
                      <tr 
                        key={inst.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                      >
                        <td className="px-6 py-4.5">
                          <div className="font-extrabold text-slate-900 dark:text-slate-100">{inst.name}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold font-mono mt-0.5">
                            Mulai: {formatDate(inst.start_date)}
                          </div>
                          {inst.due_date && (
                            <div className="text-[10px] text-rose-500 font-bold mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Jatuh Tempo: {formatDate(inst.due_date)}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4.5 font-bold text-slate-700 dark:text-slate-300">
                          {inst.creditor}
                        </td>
                        <td className="px-6 py-4.5 text-right whitespace-nowrap">
                          <div className="font-extrabold text-slate-900 dark:text-slate-100">
                            {formatRupiah(inst.total_amount)}
                          </div>
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                            Dibayar: {formatRupiah(inst.paid_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4.5 text-right font-extrabold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          {formatRupiah(inst.remaining)}
                        </td>
                        <td className="px-6 py-4.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                            isLunas
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                          }`}>
                            {isLunas ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                            <span>{inst.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4.5 whitespace-nowrap text-center">
                          <div className="flex gap-2 justify-center">
                            {inst.receipt_url && (
                              <button
                                onClick={() => setViewReceipt(inst.receipt_url!)}
                                className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg cursor-pointer transition-colors"
                                title="Lihat Bukti Bayar"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenEditModal(inst)}
                              className="p-2 text-primary hover:bg-primary-light dark:hover:bg-primary-light rounded-lg cursor-pointer transition-colors"
                              title="Edit / Bayar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteInstallment(inst.id)}
                              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-red-950/30 rounded-lg cursor-pointer transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredInstallments.map((inst) => {
                const isLunas = inst.status === 'Lunas';
                return (
                  <div key={inst.id} className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            isLunas
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                          }`}>
                            <span>{inst.status}</span>
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold truncate max-w-[120px]">
                            {inst.creditor}
                          </span>
                        </div>
                        <div className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                          {inst.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold font-mono">
                          Sisa: <span className="text-rose-600 font-bold">{formatRupiah(inst.remaining)}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                          {formatRupiah(inst.total_amount)}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                          Dibayar: {formatRupiah(inst.paid_amount)}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <div className="text-[10px] text-slate-400 flex flex-col gap-0.5">
                        <span>Mulai: {formatDate(inst.start_date)}</span>
                        {inst.due_date && (
                          <span className="text-rose-500 font-bold flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Jatuh Tempo: {formatDate(inst.due_date)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {inst.receipt_url && (
                          <button
                            onClick={() => setViewReceipt(inst.receipt_url!)}
                            className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg cursor-pointer"
                            title="Lihat Bukti Bayar"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditModal(inst)}
                          className="p-2 text-primary hover:bg-primary-light rounded-lg cursor-pointer"
                          title="Edit / Bayar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteInstallment(inst.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Installment Modal (Add / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 pt-10 sm:pt-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 dark:border-slate-800 transition-all duration-300">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {editingInstallment ? 'Edit / Bayar Cicilan' : 'Tambah Cicilan Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{formError}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Barang / Keperluan
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Cicilan Motor Vario"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm dark:bg-slate-950 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                />
              </div>

              {/* Creditor */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide flex justify-between">
                  <span>Kreditur (Pihak Pemberi Pinjaman)</span>
                  <span className="text-[10px] text-primary font-bold lowercase">Bisa ketik baru</span>
                </label>
                <div className="relative">
                  <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    list="existingCreditors"
                    value={creditor}
                    onChange={(e) => setCreditor(e.target.value)}
                    placeholder="Contoh: FIF Group, Adira Finance, Bank Mandiri"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm dark:bg-slate-950 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <datalist id="existingCreditors">
                    {uniqueCreditors.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Amount Settings (Split into two columns if editing) */}
              <div className={editingInstallment ? 'grid grid-cols-2 gap-4' : 'block'}>
                {/* Total Loan Value */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                    Total Pinjaman (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="Contoh: 15000000"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm dark:bg-slate-950 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
                  />
                </div>

                {/* Paid Amount (Only visible when EDITING) */}
                {editingInstallment && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                      Sudah Dibayar (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      placeholder="Contoh: 5000000"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm dark:bg-slate-950 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
                    />
                  </div>
                )}
              </div>

              {/* Dates Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Start Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    onKeyDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      const target = e.target as HTMLInputElement;
                      if ('showPicker' in target) {
                        try { target.showPicker(); } catch (err) {}
                      }
                    }}
                    onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Tanggal belum diisi!')}
                    onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm dark:bg-slate-950 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                    Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    onKeyDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      const target = e.target as HTMLInputElement;
                      if ('showPicker' in target) {
                        try { target.showPicker(); } catch (err) {}
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm dark:bg-slate-950 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Catatan Tambahan
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Opsional (misal: bunga 0% tenor 12 bulan)"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm dark:bg-slate-950 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Receipt Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Foto Bukti Bayar (Opsional)
                </label>
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center justify-center w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">
                      <Camera className="w-5 h-5 text-slate-500" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    <div className="flex-1">
                      {receiptUrl ? (
                        <div className="relative inline-block">
                          <img src={receiptUrl} alt="Bukti" className="h-12 w-auto object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                          <button 
                            type="button"
                            onClick={() => setReceiptUrl('')} 
                            className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-0.5 shadow hover:bg-rose-600 transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">Belum ada foto</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-sm transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary-hover text-white rounded-lg font-semibold text-sm transition-all duration-300 shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Receipt Modal */}
      {viewReceipt && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 pt-10 sm:pt-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl p-2 shadow-2xl relative">
            <button 
              onClick={() => setViewReceipt(null)} 
              className="absolute -top-4 -right-4 bg-slate-800 text-white p-2 rounded-full hover:bg-slate-700 transition shadow-lg z-50"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center min-h-[300px]">
              <img src={viewReceipt} alt="Bukti Bayar" className="max-w-full max-h-[80vh] object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
