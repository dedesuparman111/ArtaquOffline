import React, { useState } from 'react';
import { Asset, AssetPlatform } from '../types';
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, Briefcase, Bitcoin, BarChart3, Coins, X, ArrowDownToLine, ArrowUpFromLine, RefreshCw, ChevronDown, ChevronUp, Crown } from 'lucide-react';
import { FREE_LIMITS } from '../lib/licenseService';

interface AssetsProps {
  assets: Asset[];
  platforms: AssetPlatform[];
  onAddAsset: (asset: Omit<Asset, 'id'>) => Promise<boolean>;
  onUpdateAsset: (id: string, updates: Partial<Asset>) => Promise<boolean>;
  onDeleteAsset: (id: string) => Promise<boolean>;
  onAddPlatform: (platform: any) => Promise<boolean>;
  onUpdatePlatform: (id: string, updates: any) => Promise<boolean>;
  onDeletePlatform: (id: string) => Promise<boolean>;
  isPro?: boolean;
  onOpenProModal?: (reason?: string) => void;
}

export const Assets: React.FC<AssetsProps> = ({ 
  assets, platforms, onAddAsset, onUpdateAsset, onDeleteAsset, onAddPlatform, onUpdatePlatform, onDeletePlatform,
  isPro = false,
  onOpenProModal,
}) => {
  const [showPlatformForm, setShowPlatformForm] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<AssetPlatform | null>(null);
  const [platformName, setPlatformName] = useState('');

  // Deposit/Withdraw states
  const [showDWForm, setShowDWForm] = useState(false);
  const [dwType, setDwType] = useState<'deposit'|'withdraw'>('deposit');
  const [dwPlatform, setDwPlatform] = useState<AssetPlatform | null>(null);
  const [dwAmount, setDwAmount] = useState('');

  // Update Portfolio Value state
  const [showPortoForm, setShowPortoForm] = useState(false);
  const [portoPlatform, setPortoPlatform] = useState<AssetPlatform | null>(null);
  const [portoValue, setPortoValue] = useState('');

  // Asset detail states
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [activePlatformId, setActivePlatformId] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState<'Kripto'|'Saham'|'Reksadana'|'Emas'|'Lainnya'>('Kripto');
  const [assetQty, setAssetQty] = useState('');
  const [assetAvgPrice, setAssetAvgPrice] = useState('');
  const [assetCurrentPrice, setAssetCurrentPrice] = useState('');

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(number);
  };

  // Platform handlers
  const handleSavePlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlatform) {
      await onUpdatePlatform(editingPlatform.id, { name: platformName });
    } else {
      await onAddPlatform({ name: platformName, total_deposit: 0, total_withdraw: 0, current_value: 0 });
    }
    setShowPlatformForm(false);
    setEditingPlatform(null);
    setPlatformName('');
  };

  const handleDWSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dwPlatform) return;
    const amount = parseFloat(dwAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    if (dwType === 'deposit') {
      await onUpdatePlatform(dwPlatform.id, { total_deposit: dwPlatform.total_deposit + amount });
    } else {
      const netModal = dwPlatform.total_deposit - dwPlatform.total_withdraw;
      if (amount > netModal) {
        alert('Jumlah withdraw tidak boleh melebihi sisa modal.');
        return;
      }
      await onUpdatePlatform(dwPlatform.id, { total_withdraw: dwPlatform.total_withdraw + amount });
    }
    setShowDWForm(false);
    setDwAmount('');
  };

  const handlePortoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portoPlatform) return;
    const val = parseFloat(portoValue);
    if (isNaN(val) || val < 0) return;
    await onUpdatePlatform(portoPlatform.id, { current_value: val });
    setShowPortoForm(false);
    setPortoValue('');
  };

  // Asset handlers
  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(assetQty);
    const avg = parseFloat(assetAvgPrice);
    const cur = parseFloat(assetCurrentPrice);
    if (editingAsset) {
      await onUpdateAsset(editingAsset.id, {
        name: assetName,
        type: assetType,
        quantity: qty,
        average_price: avg,
        current_price: cur,
      });
    } else {
      await onAddAsset({
        platform_id: activePlatformId || undefined,
        name: assetName,
        type: assetType,
        platform: '', // legacy
        quantity: qty,
        average_price: avg,
        current_price: cur,
      });
    }
    setShowAssetForm(false);
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'Kripto': return <Bitcoin className="w-4 h-4" />;
      case 'Saham': return <BarChart3 className="w-4 h-4" />;
      case 'Emas': return <Coins className="w-4 h-4" />;
      default: return <Briefcase className="w-4 h-4" />;
    }
  };

  const getAssetColor = (type: string) => {
    switch (type) {
      case 'Kripto': return 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400';
      case 'Saham': return 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400';
      case 'Emas': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400';
      default: return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400';
    }
  };

  const safePlatforms = Array.isArray(platforms) ? platforms : [];
  const safeAssets = Array.isArray(assets) ? assets : [];

  const totalGlobalValue = safePlatforms.reduce((acc, p) => acc + Number(p.current_value || 0), 0);
  const totalGlobalModal = safePlatforms.reduce((acc, p) => acc + (Number(p.total_deposit || 0) - Number(p.total_withdraw || 0)), 0);
  
  const totalGlobalPnL = totalGlobalValue - totalGlobalModal;
  const isGlobalGain = totalGlobalPnL >= 0;

  return (
    <div className="space-y-6 pb-20 sm:pb-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Portofolio Aset</h2>
            {isPro ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white uppercase shadow-xs flex items-center gap-1">
                <Crown className="w-3 h-3" />
                <span>PRO</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onOpenProModal && onOpenProModal('Upgrade ke PRO untuk mengelola platform aset tanpa batas.')}
                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-850 hover:bg-amber-100 text-slate-600 dark:text-slate-400 hover:text-amber-700 transition cursor-pointer"
                title="Batas Versi Gratis"
              >
                {safePlatforms.length}/{FREE_LIMITS.ASSETS} Free
              </button>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Kelola portofolio Anda di berbagai platform.</p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10">
          <p className="text-indigo-200 text-xs font-semibold mb-1 uppercase tracking-wider">Total Nilai Portofolio</p>
          <h3 className="text-3xl font-black text-white tracking-tight">{formatRupiah(totalGlobalValue)}</h3>
          
          <div className="mt-4 flex items-center gap-2">
            <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${isGlobalGain ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isGlobalGain ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {isGlobalGain ? '+' : ''}{formatRupiah(totalGlobalPnL)} PnL
            </div>
            <div className="text-xs text-indigo-200 font-medium ml-2">
              Sisa Modal: {formatRupiah(totalGlobalModal)}
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            if (!isPro && safePlatforms.length >= FREE_LIMITS.ASSETS) {
              if (onOpenProModal) {
                onOpenProModal(`Batas versi Gratis tercapai (${FREE_LIMITS.ASSETS} platform/aset). Upgrade ke ArtaQu PRO untuk menambah platform tanpa batas!`);
              }
              return;
            }
            setEditingPlatform(null);
            setPlatformName('');
            setShowPlatformForm(true);
          }}
          className="mt-6 w-full py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tambah Platform / Broker
        </button>
      </div>

      {/* Platform List */}
      <div className="space-y-4">
        {safePlatforms.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada platform atau broker.</p>
          </div>
        ) : (
          safePlatforms.map(p => {
            const netModal = (p.total_deposit || 0) - (p.total_withdraw || 0);
            const porto = p.current_value || 0;
            const pnl = porto - netModal;
            const isGain = pnl >= 0;
            const isExpanded = expandedPlatform === p.id;
            const platformAssets = safeAssets.filter(a => a.platform_id === p.id);

            return (
              <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-indigo-500" /> {p.name}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingPlatform(p); setPlatformName(p.name); setShowPlatformForm(true); }} className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDeletePlatform(p.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Deposit</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatRupiah(p.total_deposit || 0)}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Withdraw</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatRupiah(p.total_withdraw || 0)}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Modal Berjalan</p>
                      <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatRupiah(netModal)}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center group cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" 
                         onClick={() => { setPortoPlatform(p); setPortoValue(porto.toString()); setShowPortoForm(true); }}>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Nilai Saat Ini</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatRupiah(porto)}</p>
                      </div>
                      <Edit2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary" />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => { setDwPlatform(p); setDwType('deposit'); setShowDWForm(true); }}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <ArrowDownToLine className="w-3.5 h-3.5" /> Deposit
                      </button>
                      <button 
                        onClick={() => { setDwPlatform(p); setDwType('withdraw'); setShowDWForm(true); }}
                        className="px-3 py-1.5 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <ArrowUpFromLine className="w-3.5 h-3.5" /> Withdraw
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`text-xs font-bold flex items-center gap-1 ${isGain ? 'text-emerald-500' : 'text-rose-500'}`}>
                        Profit/Loss: {isGain ? '+' : ''}{formatRupiah(pnl)}
                      </div>
                      <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
                      <button 
                        onClick={() => setExpandedPlatform(isExpanded ? null : p.id)}
                        className="text-xs font-bold text-slate-500 hover:text-primary transition-colors flex items-center gap-1"
                      >
                        Detail Aset {isExpanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Detail Aset di {p.name}</h4>
                      <button 
                        onClick={() => { 
                          setActivePlatformId(p.id); 
                          setEditingAsset(null);
                          setAssetName(''); setAssetQty(''); setAssetAvgPrice(''); setAssetCurrentPrice('');
                          setShowAssetForm(true); 
                        }}
                        className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah Aset
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {platformAssets.length === 0 ? (
                        <p className="text-xs text-slate-500">Belum ada detail aset dicatat.</p>
                      ) : (
                        platformAssets.map(a => (
                          <div key={a.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${getAssetColor(a.type)}`}>
                                {getAssetIcon(a.type)}
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase">{a.name}</h5>
                                <p className="text-[10px] text-slate-500">{a.quantity} unit @ {formatRupiah(a.average_price)}</p>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-4">
                              <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{formatRupiah(a.quantity * a.current_price)}</p>
                                <p className="text-[10px] text-slate-500">Saat ini: {formatRupiah(a.current_price)}</p>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => {
                                  setActivePlatformId(p.id);
                                  setEditingAsset(a);
                                  setAssetName(a.name); setAssetType(a.type as any); setAssetQty(a.quantity.toString());
                                  setAssetAvgPrice(a.average_price.toString()); setAssetCurrentPrice(a.current_price.toString());
                                  setShowAssetForm(true);
                                }} className="p-1.5 text-slate-400 hover:text-primary bg-slate-50 dark:bg-slate-800 rounded-md">
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button onClick={() => onDeleteAsset(a.id)} className="p-1.5 text-slate-400 hover:text-rose-500 bg-slate-50 dark:bg-slate-800 rounded-md">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODALS */}
      {showPlatformForm && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 pt-10 sm:pt-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
            <button onClick={() => setShowPlatformForm(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-100 shrink-0">
              {editingPlatform ? 'Edit Platform' : 'Tambah Platform'}
            </h3>
            <form onSubmit={handleSavePlatform} className="space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Platform / Broker</label>
                <input
                  type="text" required
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  placeholder="misal: Indodax, Ajaib, Binance"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm dark:bg-slate-950 dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors shrink-0 mt-4">
                Simpan
              </button>
            </form>
          </div>
        </div>
      )}

      {showDWForm && dwPlatform && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 pt-10 sm:pt-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
            <button onClick={() => setShowDWForm(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
            <div className="shrink-0">
              <h3 className="text-lg font-bold mb-1 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                {dwType === 'deposit' ? <ArrowDownToLine className="w-5 h-5 text-emerald-500"/> : <ArrowUpFromLine className="w-5 h-5 text-rose-500"/>}
                {dwType === 'deposit' ? 'Deposit' : 'Withdraw'}
              </h3>
              <p className="text-xs text-slate-500 mb-4">Platform: {dwPlatform.name}</p>
            </div>
            <form onSubmit={handleDWSubmit} className="space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Jumlah (IDR)</label>
                <input
                  type="number" step="any" required
                  value={dwAmount}
                  onChange={(e) => setDwAmount(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm dark:bg-slate-950 dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button type="submit" className={`w-full py-3 text-white font-bold rounded-xl transition-colors mt-4 shrink-0 ${dwType === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                Konfirmasi {dwType === 'deposit' ? 'Deposit' : 'Withdraw'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showPortoForm && portoPlatform && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 pt-10 sm:pt-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
            <button onClick={() => setShowPortoForm(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
            <div className="shrink-0">
              <h3 className="text-lg font-bold mb-1 text-slate-800 dark:text-slate-100">Update Nilai Portofolio</h3>
              <p className="text-xs text-slate-500 mb-4">Platform: {portoPlatform.name}</p>
            </div>
            <form onSubmit={handlePortoSubmit} className="space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Total Nilai Saat Ini (IDR)</label>
                <input
                  type="number" step="any" required
                  value={portoValue}
                  onChange={(e) => setPortoValue(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm dark:bg-slate-950 dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shrink-0 mt-4">
                Simpan Nilai
              </button>
            </form>
          </div>
        </div>
      )}

      {showAssetForm && (
        <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-4 pt-10 sm:pt-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setShowAssetForm(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-100">
              {editingAsset ? 'Edit Detail Aset' : 'Tambah Detail Aset'}
            </h3>
            <form onSubmit={handleSaveAsset} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Tipe</label>
                  <select value={assetType} onChange={(e) => setAssetType(e.target.value as any)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm dark:bg-slate-950 dark:text-slate-200 outline-none">
                    <option value="Kripto">Kripto</option>
                    <option value="Saham">Saham</option>
                    <option value="Reksadana">Reksadana</option>
                    <option value="Emas">Emas</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nama / Simbol</label>
                  <input type="text" required value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="misal: BTC" className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm dark:bg-slate-950 dark:text-slate-200 outline-none uppercase" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Jumlah Unit</label>
                  <input type="number" step="any" required value={assetQty} onChange={(e) => setAssetQty(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm dark:bg-slate-950 dark:text-slate-200 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Harga Beli Avg</label>
                  <input type="number" step="any" required value={assetAvgPrice} onChange={(e) => setAssetAvgPrice(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm dark:bg-slate-950 dark:text-slate-200 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Harga Saat Ini</label>
                  <input type="number" step="any" required value={assetCurrentPrice} onChange={(e) => setAssetCurrentPrice(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm dark:bg-slate-950 dark:text-slate-200 outline-none" />
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-xl mt-4 hover:bg-primary-hover transition-colors">
                Simpan
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
