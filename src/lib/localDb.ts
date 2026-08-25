/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { v4 as uuidv4 } from 'uuid';
import { Transaction, Installment, SavingsGoal, Asset, AssetPlatform, AppUser, DashboardData } from '../types';

const DB_NAME = 'ArtaQu_Local_DB';
const DB_VERSION = 1;

// Storage keys for dual-layer persistence (IndexedDB + localStorage backup)
const STORAGE_KEYS = {
  TRANSACTIONS: 'ArtaQu_trxs',
  INSTALLMENTS: 'ArtaQu_insts',
  SAVINGS: 'ArtaQu_savings',
  ASSETS: 'ArtaQu_assets',
  PLATFORMS: 'ArtaQu_asset_platforms',
  USER: 'ArtaQu_user',
  THEME: 'ArtaQu_theme',
  ACCENT: 'ArtaQu_accent',
  CATEGORIES: 'ArtaQu_categories',
  LAST_BACKUP: 'ArtaQu_last_backup_time',
};

export interface BackupPayload {
  appName: string;
  appVersion: string;
  exportedAt: string;
  user: AppUser | null;
  summary: {
    totalTransactions: number;
    totalInstallments: number;
    totalSavingsGoals: number;
    totalAssets: number;
    totalPlatforms: number;
  };
  data: {
    transactions: Transaction[];
    installments: Installment[];
    savingsGoals: SavingsGoal[];
    assets: Asset[];
    assetPlatforms: AssetPlatform[];
    user?: AppUser | null;
    theme?: string;
    accent?: string;
    categories?: string[];
  };
}

// Fallback synchronous localStorage helpers
function getFromLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key} from localStorage`, err);
    return fallback;
  }
}

function saveToLocalStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage`, err);
  }
}

// IndexedDB Handler
class IndexedDBManager {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported in this environment'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result as IDBDatabase;
        const stores = [
          'transactions',
          'installments',
          'savings_goals',
          'assets',
          'asset_platforms',
          'metadata',
        ];

        stores.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = (event: any) => {
        resolve(event.target.result);
      };

      request.onerror = (event: any) => {
        console.error('IndexedDB open error:', event.target.error);
        reject(event.target.error);
      };
    });

    return this.dbPromise;
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`IndexedDB getAll fallback to localStorage for ${storeName}`, e);
      return [];
    }
  }

  async put<T extends { id: string }>(storeName: string, item: T): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(item);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`IndexedDB put fallback for ${storeName}`, e);
    }
  }

  async putBatch<T extends { id: string }>(storeName: string, items: T[]): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        items.forEach((item) => store.put(item));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn(`IndexedDB putBatch fallback for ${storeName}`, e);
    }
  }

  async delete(storeName: string, id: string): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`IndexedDB delete fallback for ${storeName}`, e);
    }
  }

  async clear(storeName: string): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`IndexedDB clear fallback for ${storeName}`, e);
    }
  }

  async clearAllStores(): Promise<void> {
    const stores = ['transactions', 'installments', 'savings_goals', 'assets', 'asset_platforms'];
    for (const store of stores) {
      await this.clear(store);
    }
  }
}

const idb = new IndexedDBManager();

// DEFAULT SEED DATA IF NEEDED
const DEFAULT_PLATFORMS: AssetPlatform[] = [
  {
    id: 'plat-1',
    name: 'Rekening Bank & Tunai',
    total_deposit: 0,
    total_withdraw: 0,
    current_value: 0,
  },
];

export const localDb = {
  // ============================================================
  // USER PROFILE & SESSION (100% OFFLINE)
  // ============================================================
  async getCurrentUser(): Promise<AppUser> {
    let user = getFromLocalStorage<AppUser | null>(STORAGE_KEYS.USER, null);
    if (!user) {
      user = {
        id: 'local-user-' + uuidv4().substring(0, 8),
        username: 'Pengguna ArtaQu',
        email: 'lokal@artaqu.app',
      };
      saveToLocalStorage(STORAGE_KEYS.USER, user);
    }
    return user;
  },

  async updateUserProfile(updates: Partial<AppUser>): Promise<AppUser> {
    const current = await this.getCurrentUser();
    const updated = { ...current, ...updates };
    saveToLocalStorage(STORAGE_KEYS.USER, updated);
    return updated;
  },

  // ============================================================
  // TRANSACTIONS CRUD (LOCAL FIRST & INDEXEDDB)
  // ============================================================
  async getTransactions(): Promise<Transaction[]> {
    let list = await idb.getAll<Transaction>('transactions');
    if (!list || list.length === 0) {
      list = getFromLocalStorage<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
      if (list.length > 0) {
        await idb.putBatch('transactions', list);
      }
    } else {
      // Sync to localStorage
      saveToLocalStorage(STORAGE_KEYS.TRANSACTIONS, list);
    }
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async addTransaction(trx: Omit<Transaction, 'id'>): Promise<Transaction> {
    const newTrx: Transaction = {
      ...trx,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      installment_id: trx.installment_id || null,
    };

    // Save to IndexedDB & LocalStorage
    await idb.put('transactions', newTrx);
    const trxs = await this.getTransactions();
    saveToLocalStorage(STORAGE_KEYS.TRANSACTIONS, [newTrx, ...trxs.filter(t => t.id !== newTrx.id)]);

    // Handle installment linking
    if (trx.type === 'Cicilan' && trx.installment_id) {
      await this.adjustInstallmentPayment(trx.installment_id, trx.amount);
    }

    return newTrx;
  },

  async updateTransaction(trx: Transaction): Promise<Transaction> {
    const oldTrxs = await this.getTransactions();
    const oldTrx = oldTrxs.find(t => t.id === trx.id);

    await idb.put('transactions', trx);
    const updatedList = oldTrxs.map(t => t.id === trx.id ? trx : t);
    saveToLocalStorage(STORAGE_KEYS.TRANSACTIONS, updatedList);

    // Adjust installment diff if applicable
    if (oldTrx && trx.type === 'Cicilan' && trx.installment_id) {
      const diff = trx.amount - oldTrx.amount;
      if (diff !== 0) {
        await this.adjustInstallmentPayment(trx.installment_id, diff);
      }
    }

    return trx;
  },

  async deleteTransaction(id: string): Promise<void> {
    const oldTrxs = await this.getTransactions();
    const oldTrx = oldTrxs.find(t => t.id === id);

    await idb.delete('transactions', id);
    const filtered = oldTrxs.filter(t => t.id !== id);
    saveToLocalStorage(STORAGE_KEYS.TRANSACTIONS, filtered);

    if (oldTrx && oldTrx.type === 'Cicilan' && oldTrx.installment_id) {
      await this.adjustInstallmentPayment(oldTrx.installment_id, -oldTrx.amount);
    }
  },

  // ============================================================
  // INSTALLMENTS CRUD (LOCAL)
  // ============================================================
  async getInstallments(): Promise<Installment[]> {
    let list = await idb.getAll<Installment>('installments');
    if (!list || list.length === 0) {
      list = getFromLocalStorage<Installment[]>(STORAGE_KEYS.INSTALLMENTS, []);
      if (list.length > 0) {
        await idb.putBatch('installments', list);
      }
    } else {
      saveToLocalStorage(STORAGE_KEYS.INSTALLMENTS, list);
    }

    return list.map(inst => ({
      ...inst,
      remaining: Math.max(0, inst.total_amount - (inst.paid_amount || 0)),
      status: ((inst.paid_amount || 0) >= inst.total_amount ? 'Lunas' : 'Berjalan') as 'Lunas' | 'Berjalan',
    })).sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  },

  async addInstallment(inst: Omit<Installment, 'id' | 'remaining' | 'paid_amount' | 'status'>): Promise<Installment> {
    const newInst: Installment = {
      ...inst,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      paid_amount: 0,
      remaining: inst.total_amount,
      status: 'Berjalan',
    };

    await idb.put('installments', newInst);
    const current = await this.getInstallments();
    saveToLocalStorage(STORAGE_KEYS.INSTALLMENTS, [newInst, ...current]);
    return newInst;
  },

  async updateInstallment(inst: Installment): Promise<Installment> {
    const status = (inst.paid_amount >= inst.total_amount ? 'Lunas' : 'Berjalan') as 'Lunas' | 'Berjalan';
    const updated: Installment = {
      ...inst,
      status,
      remaining: Math.max(0, inst.total_amount - (inst.paid_amount || 0)),
    };

    await idb.put('installments', updated);
    const list = await this.getInstallments();
    saveToLocalStorage(STORAGE_KEYS.INSTALLMENTS, list.map(i => i.id === inst.id ? updated : i));
    return updated;
  },

  async deleteInstallment(id: string): Promise<void> {
    await idb.delete('installments', id);
    const list = await this.getInstallments();
    saveToLocalStorage(STORAGE_KEYS.INSTALLMENTS, list.filter(i => i.id !== id));
  },

  async adjustInstallmentPayment(installmentId: string, deltaAmount: number): Promise<void> {
    const list = await this.getInstallments();
    const inst = list.find(i => i.id === installmentId);
    if (!inst) return;

    const newPaid = Math.max(0, (inst.paid_amount || 0) + deltaAmount);
    const updated: Installment = {
      ...inst,
      paid_amount: newPaid,
      remaining: Math.max(0, inst.total_amount - newPaid),
      status: newPaid >= inst.total_amount ? 'Lunas' : 'Berjalan',
    };

    await this.updateInstallment(updated);
  },

  // ============================================================
  // SAVINGS GOALS CRUD (LOCAL)
  // ============================================================
  async getSavingsGoals(): Promise<SavingsGoal[]> {
    let list = await idb.getAll<SavingsGoal>('savings_goals');
    if (!list || list.length === 0) {
      list = getFromLocalStorage<SavingsGoal[]>(STORAGE_KEYS.SAVINGS, []);
      if (list.length > 0) {
        await idb.putBatch('savings_goals', list);
      }
    } else {
      saveToLocalStorage(STORAGE_KEYS.SAVINGS, list);
    }
    return list.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
  },

  async addSavingsGoal(goal: Omit<SavingsGoal, 'id'>): Promise<SavingsGoal> {
    const newGoal: SavingsGoal = {
      ...goal,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      status: goal.current_amount >= goal.target_amount ? 'Tercapai' : 'Berjalan',
    };

    await idb.put('savings_goals', newGoal);
    const current = await this.getSavingsGoals();
    saveToLocalStorage(STORAGE_KEYS.SAVINGS, [newGoal, ...current]);
    return newGoal;
  },

  async updateSavingsGoal(goal: SavingsGoal): Promise<SavingsGoal> {
    const updated = {
      ...goal,
      status: (goal.current_amount >= goal.target_amount ? 'Tercapai' : 'Berjalan') as 'Tercapai' | 'Berjalan',
    };
    await idb.put('savings_goals', updated);
    const list = await this.getSavingsGoals();
    saveToLocalStorage(STORAGE_KEYS.SAVINGS, list.map(g => g.id === goal.id ? updated : g));
    return updated;
  },

  async deleteSavingsGoal(id: string): Promise<void> {
    await idb.delete('savings_goals', id);
    const list = await this.getSavingsGoals();
    saveToLocalStorage(STORAGE_KEYS.SAVINGS, list.filter(g => g.id !== id));
  },

  // ============================================================
  // ASSETS & PLATFORMS CRUD (LOCAL)
  // ============================================================
  async getAssets(): Promise<Asset[]> {
    let list = await idb.getAll<Asset>('assets');
    if (!list || list.length === 0) {
      list = getFromLocalStorage<Asset[]>(STORAGE_KEYS.ASSETS, []);
      if (list.length > 0) {
        await idb.putBatch('assets', list);
      }
    } else {
      saveToLocalStorage(STORAGE_KEYS.ASSETS, list);
    }
    return list;
  },

  async addAsset(asset: Omit<Asset, 'id'>): Promise<Asset> {
    const newAsset: Asset = {
      ...asset,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    await idb.put('assets', newAsset);
    const current = await this.getAssets();
    saveToLocalStorage(STORAGE_KEYS.ASSETS, [newAsset, ...current]);
    return newAsset;
  },

  async updateAsset(id: string, updates: Partial<Asset>): Promise<Asset | null> {
    const list = await this.getAssets();
    const asset = list.find(a => a.id === id);
    if (!asset) return null;

    const updated = { ...asset, ...updates };
    await idb.put('assets', updated);
    saveToLocalStorage(STORAGE_KEYS.ASSETS, list.map(a => a.id === id ? updated : a));
    return updated;
  },

  async deleteAsset(id: string): Promise<void> {
    await idb.delete('assets', id);
    const list = await this.getAssets();
    saveToLocalStorage(STORAGE_KEYS.ASSETS, list.filter(a => a.id !== id));
  },

  async getAssetPlatforms(): Promise<AssetPlatform[]> {
    let list = await idb.getAll<AssetPlatform>('asset_platforms');
    if (!list || list.length === 0) {
      list = getFromLocalStorage<AssetPlatform[]>(STORAGE_KEYS.PLATFORMS, DEFAULT_PLATFORMS);
      if (list.length > 0) {
        await idb.putBatch('asset_platforms', list);
      }
    } else {
      saveToLocalStorage(STORAGE_KEYS.PLATFORMS, list);
    }
    return list;
  },

  async addAssetPlatform(platform: Omit<AssetPlatform, 'id'>): Promise<AssetPlatform> {
    const newPlat: AssetPlatform = {
      ...platform,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    await idb.put('asset_platforms', newPlat);
    const current = await this.getAssetPlatforms();
    saveToLocalStorage(STORAGE_KEYS.PLATFORMS, [newPlat, ...current]);
    return newPlat;
  },

  async updateAssetPlatform(id: string, updates: Partial<AssetPlatform>): Promise<AssetPlatform | null> {
    const list = await this.getAssetPlatforms();
    const plat = list.find(p => p.id === id);
    if (!plat) return null;

    const updated = { ...plat, ...updates };
    await idb.put('asset_platforms', updated);
    saveToLocalStorage(STORAGE_KEYS.PLATFORMS, list.map(p => p.id === id ? updated : p));
    return updated;
  },

  async deleteAssetPlatform(id: string): Promise<void> {
    await idb.delete('asset_platforms', id);
    const list = await this.getAssetPlatforms();
    saveToLocalStorage(STORAGE_KEYS.PLATFORMS, list.filter(p => p.id !== id));
  },

  // ============================================================
  // DASHBOARD CALCULATIONS
  // ============================================================
  async getDashboardData(): Promise<DashboardData> {
    const [trxs, insts, platforms, assets] = await Promise.all([
      this.getTransactions(),
      this.getInstallments(),
      this.getAssetPlatforms(),
      this.getAssets(),
    ]);

    let income = 0;
    let expense = 0;
    let receivable = 0;
    let paidInstallments = 0;
    let installmentOutstanding = 0;
    let totalAssetValue = 0;

    // Digital Assets valuation
    platforms.forEach(p => {
      totalAssetValue += Number(p.current_value || 0);
    });

    if (totalAssetValue === 0 && assets.length > 0) {
      assets.forEach(a => {
        totalAssetValue += (Number(a.quantity || 0) * Number(a.current_price || a.average_price || 0));
      });
    }

    trxs.forEach(t => {
      const amt = Number(t.amount || 0);
      if (t.type === 'Pendapatan') {
        income += amt;
      } else if (t.type === 'Pengeluaran') {
        expense += amt;
      } else if (t.type === 'Piutang') {
        receivable += amt;
      } else if (t.type === 'Cicilan') {
        paidInstallments += amt;
      }
    });

    insts.forEach(i => {
      if (i.status === 'Berjalan') {
        installmentOutstanding += Number(i.remaining || (i.total_amount - (i.paid_amount || 0)));
      }
    });

    const balance = income - expense - paidInstallments;

    return {
      balance,
      income,
      expense,
      debt: installmentOutstanding,
      receivable,
      installmentOutstanding,
      totalAssetValue,
    };
  },

  // ============================================================
  // COMPLETE DATABASE BACKUP & RESTORE (JSON EXPORT / IMPORT)
  // ============================================================
  async createBackupJSON(): Promise<BackupPayload> {
    const [user, trxs, insts, goals, asts, plats] = await Promise.all([
      this.getCurrentUser(),
      this.getTransactions(),
      this.getInstallments(),
      this.getSavingsGoals(),
      this.getAssets(),
      this.getAssetPlatforms(),
    ]);

    const theme = getFromLocalStorage(STORAGE_KEYS.THEME, 'light');
    const accent = getFromLocalStorage(STORAGE_KEYS.ACCENT, 'blue');

    const backupPayload: BackupPayload = {
      appName: 'ArtaQu Financials',
      appVersion: '2.0.0',
      exportedAt: new Date().toISOString(),
      user,
      summary: {
        totalTransactions: trxs.length,
        totalInstallments: insts.length,
        totalSavingsGoals: goals.length,
        totalAssets: asts.length,
        totalPlatforms: plats.length,
      },
      data: {
        transactions: trxs,
        installments: insts,
        savingsGoals: goals,
        assets: asts,
        assetPlatforms: plats,
        user,
        theme,
        accent,
      },
    };

    saveToLocalStorage(STORAGE_KEYS.LAST_BACKUP, new Date().toISOString());
    return backupPayload;
  },

  downloadBackupJSON(backup: BackupPayload): void {
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Format timestamp for filename: artaqu_backup_2026-08-25_143000.json
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const filename = `artaqu_backup_${dateStr}_${timeStr}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  async validateAndParseBackup(jsonText: string): Promise<{ valid: boolean; payload?: BackupPayload; error?: string }> {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: 'File bukan format JSON yang valid.' };
      }

      // Check if it has the data object or direct arrays
      const data = parsed.data || parsed;
      const hasTransactions = Array.isArray(data.transactions) || Array.isArray(parsed.transactions);
      const hasInstallments = Array.isArray(data.installments) || Array.isArray(parsed.installments);

      if (!hasTransactions && !hasInstallments && !data.savingsGoals && !data.assets) {
        return { valid: false, error: 'Format data backup ArtaQu tidak dikenali.' };
      }

      const standardPayload: BackupPayload = {
        appName: parsed.appName || 'ArtaQu Financials',
        appVersion: parsed.appVersion || '1.0.0',
        exportedAt: parsed.exportedAt || new Date().toISOString(),
        user: parsed.user || data.user || null,
        summary: {
          totalTransactions: (data.transactions || parsed.transactions || []).length,
          totalInstallments: (data.installments || parsed.installments || []).length,
          totalSavingsGoals: (data.savingsGoals || parsed.savingsGoals || []).length,
          totalAssets: (data.assets || parsed.assets || []).length,
          totalPlatforms: (data.assetPlatforms || parsed.assetPlatforms || []).length,
        },
        data: {
          transactions: data.transactions || parsed.transactions || [],
          installments: data.installments || parsed.installments || [],
          savingsGoals: data.savingsGoals || parsed.savingsGoals || [],
          assets: data.assets || parsed.assets || [],
          assetPlatforms: data.assetPlatforms || parsed.assetPlatforms || [],
          user: data.user || parsed.user,
          theme: data.theme || parsed.theme,
          accent: data.accent || parsed.accent,
        },
      };

      return { valid: true, payload: standardPayload };
    } catch (e: any) {
      return { valid: false, error: e.message || 'Gagal membaca berkas JSON.' };
    }
  },

  async restoreDatabaseJSON(payload: BackupPayload, mode: 'replace' | 'merge' = 'replace'): Promise<{ success: boolean; message: string }> {
    try {
      const { transactions = [], installments = [], savingsGoals = [], assets = [], assetPlatforms = [], user, theme, accent } = payload.data;

      if (mode === 'replace') {
        // Clear all stores
        await idb.clearAllStores();

        // Write directly
        if (transactions.length > 0) await idb.putBatch('transactions', transactions);
        if (installments.length > 0) await idb.putBatch('installments', installments);
        if (savingsGoals.length > 0) await idb.putBatch('savings_goals', savingsGoals);
        if (assets.length > 0) await idb.putBatch('assets', assets);
        if (assetPlatforms.length > 0) await idb.putBatch('asset_platforms', assetPlatforms);

        saveToLocalStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
        saveToLocalStorage(STORAGE_KEYS.INSTALLMENTS, installments);
        saveToLocalStorage(STORAGE_KEYS.SAVINGS, savingsGoals);
        saveToLocalStorage(STORAGE_KEYS.ASSETS, assets);
        saveToLocalStorage(STORAGE_KEYS.PLATFORMS, assetPlatforms);

        if (user) saveToLocalStorage(STORAGE_KEYS.USER, user);
        if (theme) saveToLocalStorage(STORAGE_KEYS.THEME, theme);
        if (accent) saveToLocalStorage(STORAGE_KEYS.ACCENT, accent);

        return {
          success: true,
          message: `Berhasil memulihkan ${transactions.length} transaksi & ${installments.length} cicilan (Mode Timpa).`,
        };
      } else {
        // Merge mode (deduplicate by id)
        const currentTrxs = await this.getTransactions();
        const trxMap = new Map<string, Transaction>(currentTrxs.map(t => [t.id, t]));
        transactions.forEach(t => trxMap.set(t.id, t));
        const mergedTrxs: Transaction[] = Array.from(trxMap.values());

        const currentInsts = await this.getInstallments();
        const instMap = new Map<string, Installment>(currentInsts.map(i => [i.id, i]));
        installments.forEach(i => instMap.set(i.id, i));
        const mergedInsts: Installment[] = Array.from(instMap.values());

        const currentGoals = await this.getSavingsGoals();
        const goalMap = new Map<string, SavingsGoal>(currentGoals.map(g => [g.id, g]));
        savingsGoals.forEach(g => goalMap.set(g.id, g));
        const mergedGoals: SavingsGoal[] = Array.from(goalMap.values());

        const currentAssets = await this.getAssets();
        const assetMap = new Map<string, Asset>(currentAssets.map(a => [a.id, a]));
        assets.forEach(a => assetMap.set(a.id, a));
        const mergedAssets: Asset[] = Array.from(assetMap.values());

        const currentPlats = await this.getAssetPlatforms();
        const platMap = new Map<string, AssetPlatform>(currentPlats.map(p => [p.id, p]));
        assetPlatforms.forEach(p => platMap.set(p.id, p));
        const mergedPlats: AssetPlatform[] = Array.from(platMap.values());

        await idb.putBatch('transactions', mergedTrxs);
        await idb.putBatch('installments', mergedInsts);
        await idb.putBatch('savings_goals', mergedGoals);
        await idb.putBatch('assets', mergedAssets);
        await idb.putBatch('asset_platforms', mergedPlats);

        saveToLocalStorage(STORAGE_KEYS.TRANSACTIONS, mergedTrxs);
        saveToLocalStorage(STORAGE_KEYS.INSTALLMENTS, mergedInsts);
        saveToLocalStorage(STORAGE_KEYS.SAVINGS, mergedGoals);
        saveToLocalStorage(STORAGE_KEYS.ASSETS, mergedAssets);
        saveToLocalStorage(STORAGE_KEYS.PLATFORMS, mergedPlats);

        return {
          success: true,
          message: `Berhasil menggabungkan data: Total kini ${mergedTrxs.length} transaksi & ${mergedInsts.length} cicilan.`,
        };
      }
    } catch (err: any) {
      console.error('Restore database error:', err);
      return { success: false, message: err.message || 'Gagal memulihkan database.' };
    }
  },

  // ============================================================
  // DATABASE RESET / CLEAR
  // ============================================================
  async resetAllDatabase(): Promise<void> {
    await idb.clearAllStores();
    saveToLocalStorage(STORAGE_KEYS.TRANSACTIONS, []);
    saveToLocalStorage(STORAGE_KEYS.INSTALLMENTS, []);
    saveToLocalStorage(STORAGE_KEYS.SAVINGS, []);
    saveToLocalStorage(STORAGE_KEYS.ASSETS, []);
    saveToLocalStorage(STORAGE_KEYS.PLATFORMS, DEFAULT_PLATFORMS);
  },
};
