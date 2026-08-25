import React, { useState } from 'react';
import { SavingsGoal } from '../types';
import { Target, Plus, Wallet, Calendar as CalendarIcon, CheckCircle2, MoreVertical, Edit, Trash2 } from 'lucide-react';

interface SavingsProps {
  savingsGoals: SavingsGoal[];
  formatRupiah: (num: number) => string;
  onAddGoal: (goal: Omit<SavingsGoal, 'id'>) => Promise<boolean>;
  onUpdateGoal: (goal: SavingsGoal) => Promise<boolean>;
  onDeleteGoal: (id: string) => Promise<boolean>;
}

export const Savings: React.FC<SavingsProps> = ({
  savingsGoals,
  formatRupiah,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');

  const handleOpenAddModal = () => {
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetDate('');
    setDescription('');
    setEditingGoal(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (goal: SavingsGoal) => {
    setName(goal.name);
    setTargetAmount(goal.target_amount.toString());
    setCurrentAmount(goal.current_amount.toString());
    setTargetDate(goal.target_date || '');
    setDescription(goal.description || '');
    setEditingGoal(goal);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) return;

    const tAmount = parseFloat(targetAmount);
    const cAmount = parseFloat(currentAmount || '0');

    if (tAmount <= 0 || cAmount < 0) return;

    const goalData = {
      name,
      target_amount: tAmount,
      current_amount: cAmount,
      target_date: targetDate || null,
      description,
      status: cAmount >= tAmount ? 'Tercapai' : 'Berjalan',
    } as any;

    let success = false;
    if (editingGoal) {
      success = await onUpdateGoal({ ...editingGoal, ...goalData });
    } else {
      success = await onAddGoal(goalData);
    }

    if (success) {
      setShowAddModal(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Target Tabungan</h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Kelola dan pantau tujuan keuangan Anda</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary-hover text-white px-5 py-3 rounded-xl text-xs font-semibold shadow-md hover:shadow-lg flex gap-2 items-center justify-center transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Target</span>
        </button>
      </div>

      {savingsGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savingsGoals.map(goal => {
            const percentage = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
            const isCompleted = goal.status === 'Tercapai' || percentage >= 100;

            return (
              <div key={goal.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                {isCompleted && (
                  <div className="absolute top-0 right-0 p-4">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                )}
                
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-2xl flex-shrink-0 ${isCompleted ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10' : 'bg-primary/10 text-primary'}`}>
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate pr-8">{goal.name}</h3>
                    {goal.target_date && (
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <CalendarIcon className="w-3 h-3" />
                        Target: {new Date(goal.target_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">Terkumpul</span>
                    <span className="text-slate-900 dark:text-slate-100">{formatRupiah(goal.current_amount)}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-1000 ${isCompleted ? 'bg-emerald-500' : 'bg-primary'}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-medium text-slate-500">
                    <span>{percentage}%</span>
                    <span>Target: {formatRupiah(goal.target_amount)}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => handleOpenEditModal(goal)} className="flex-1 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center justify-center gap-1">
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => onDeleteGoal(goal.id)} className="p-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Belum ada target</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">Mulai rencanakan keuangan Anda dengan membuat target tabungan pertama.</p>
          <button
            onClick={handleOpenAddModal}
            className="mt-6 bg-primary text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            Buat Target
          </button>
        </div>
      )}

      {/* MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 pt-10 sm:pt-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {editingGoal ? 'Edit Target' : 'Buat Target Baru'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-700 transition-colors">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Target</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Dana Darurat, Beli Rumah"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Nominal (Rp)</label>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sudah Terkumpul (Rp)</label>
                <input
                  type="number"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Tanggal Pilihan</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  onKeyDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    const target = e.target as HTMLInputElement;
                    if ('showPicker' in target) {
                      try { target.showPicker(); } catch (err) {}
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white cursor-pointer"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-md transition-all"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
