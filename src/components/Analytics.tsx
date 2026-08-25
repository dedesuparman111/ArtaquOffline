import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { PieChart as PieChartIcon, BarChart3, Calendar } from 'lucide-react';

interface AnalyticsProps {
  transactions: Transaction[];
  formatRupiah: (num: number) => string;
}

const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316'];

export const Analytics: React.FC<AnalyticsProps> = ({ transactions, formatRupiah }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));

  const filteredTransactions = useMemo(() => {
    const start = startOfMonth(parseISO(selectedMonth + '-01'));
    const end = endOfMonth(parseISO(selectedMonth + '-01'));
    return transactions.filter(t => {
      const d = new Date(t.date || new Date());
      return isWithinInterval(d, { start, end });
    });
  }, [transactions, selectedMonth]);

  const expensesByCategory = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'Pengeluaran');
    const grouped = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => Number(b.value) - Number(a.value));
  }, [filteredTransactions]);

  const dailyData = useMemo(() => {
    const daysInMonth = endOfMonth(parseISO(selectedMonth + '-01')).getDate();
    const data = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      Pemasukan: 0,
      Pengeluaran: 0
    }));

    filteredTransactions.forEach(t => {
      const day = new Date(t.date || new Date()).getDate();
      if (t.type === 'Pendapatan') {
        data[day - 1].Pemasukan += t.amount;
      } else if (t.type === 'Pengeluaran') {
        data[day - 1].Pengeluaran += t.amount;
      }
    });

    return data;
  }, [filteredTransactions, selectedMonth]);

  const totalExpense = expensesByCategory.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Statistik Keuangan</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Analisis pengeluaran dan pemasukan bulanan.</p>
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm dark:bg-slate-950 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold w-full sm:w-auto"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Pengeluaran per Kategori</h3>
              <p className="text-xs text-slate-500">Total: {formatRupiah(totalExpense)}</p>
            </div>
          </div>
          
          {expensesByCategory.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatRupiah(value)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
              <PieChartIcon className="w-12 h-12 mb-3 opacity-20" />
              <p>Belum ada data pengeluaran</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Arus Kas Harian</h3>
              <p className="text-xs text-slate-500">Pemasukan vs Pengeluaran</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(val) => {
                     return (val / 1000) + 'k';
                  }}
                />
                <Tooltip 
                  formatter={(value: number) => formatRupiah(value)}
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Bar dataKey="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
