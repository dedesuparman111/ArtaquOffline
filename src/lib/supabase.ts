/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, Installment, DashboardData, AppUser, SavingsGoal, Asset, AssetPlatform } from '../types';
import { localDb, BackupPayload } from './localDb';

export { localDb };
export type { BackupPayload };

// Check if online
export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

// Supabase mock / optional placeholder (not needed for offline local operation)
export const isSupabaseConfigured = (): boolean => false;
export const supabase = null;

// ==========================================
// UNIFIED LOCAL-FIRST API SERVICE
// ==========================================
export const apiService = {
  // --- ASSET PLATFORMS ---
  async getAssetPlatforms(): Promise<AssetPlatform[]> {
    return await localDb.getAssetPlatforms();
  },

  async addAssetPlatform(platform: Omit<AssetPlatform, 'id'>): Promise<{ success: boolean; data?: AssetPlatform; message?: string }> {
    try {
      const data = await localDb.addAssetPlatform(platform);
      return { success: true, data, message: 'Platform berhasil ditambahkan.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Gagal menambahkan platform.' };
    }
  },

  async updateAssetPlatform(id: string, updates: Partial<AssetPlatform>): Promise<{ success: boolean; data?: AssetPlatform; message?: string }> {
    try {
      const data = await localDb.updateAssetPlatform(id, updates);
      return { success: true, data: data || undefined, message: 'Platform diperbarui.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Gagal memperbarui platform.' };
    }
  },

  async deleteAssetPlatform(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      await localDb.deleteAssetPlatform(id);
      return { success: true, message: 'Platform dihapus.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Gagal menghapus platform.' };
    }
  },

  // --- USER AUTHENTICATION & LOCAL PROFILE ---
  async getCurrentUser(): Promise<AppUser | null> {
    return await localDb.getCurrentUser();
  },

  async updateUserProfile(updates: Partial<AppUser>): Promise<{ success: boolean; user: AppUser; message: string }> {
    try {
      const user = await localDb.updateUserProfile(updates);
      return { success: true, user, message: 'Profil pengguna berhasil diperbarui.' };
    } catch (e: any) {
      const current = await localDb.getCurrentUser();
      return { success: false, user: current, message: e.message || 'Gagal memperbarui profil.' };
    }
  },

  async signIn(email: string, password?: string): Promise<{ success: boolean; user: AppUser | null; message: string }> {
    const user = await localDb.getCurrentUser();
    return { success: true, user, message: 'Berhasil masuk (Mode Offline Lokal).' };
  },

  async signUp(username: string, email: string, password?: string): Promise<{ success: boolean; user: AppUser | null; message: string }> {
    const user = await localDb.updateUserProfile({ username: username.trim() || 'Pengguna ArtaQu', email: email.trim() || 'lokal@artaqu.app' });
    return { success: true, user, message: 'Profil lokal berhasil dibuat!' };
  },

  async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Mode offline aktif: Silakan ubah data profil langsung di menu Pengaturan.' };
  },

  async updatePassword(password: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Password lokal berhasil disimpan.' };
  },

  async signOut(): Promise<void> {
    // In local offline mode, logout switches or resets active session view if requested
  },

  // --- TRANSACTIONS ---
  async getTransactions(): Promise<Transaction[]> {
    return await localDb.getTransactions();
  },

  async addTransaction(trx: Omit<Transaction, 'id'>): Promise<{ success: boolean; data: Transaction | null; message: string }> {
    try {
      const data = await localDb.addTransaction(trx);
      return { success: true, data, message: 'Transaksi berhasil disimpan di database lokal.' };
    } catch (e: any) {
      return { success: false, data: null, message: e.message || 'Gagal menyimpan transaksi.' };
    }
  },

  async updateTransaction(trx: Transaction): Promise<{ success: boolean; data: Transaction | null; message: string }> {
    try {
      const data = await localDb.updateTransaction(trx);
      return { success: true, data, message: 'Transaksi berhasil diperbarui.' };
    } catch (e: any) {
      return { success: false, data: null, message: e.message || 'Gagal memperbarui transaksi.' };
    }
  },

  async deleteTransaction(id: string): Promise<{ success: boolean; message: string }> {
    try {
      await localDb.deleteTransaction(id);
      return { success: true, message: 'Transaksi berhasil dihapus.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Gagal menghapus transaksi.' };
    }
  },

  // --- INSTALLMENTS ---
  async getInstallments(): Promise<Installment[]> {
    return await localDb.getInstallments();
  },

  async addInstallment(inst: Omit<Installment, 'id' | 'remaining' | 'paid_amount' | 'status'>): Promise<{ success: boolean; data: Installment | null; message: string }> {
    try {
      const data = await localDb.addInstallment(inst);
      return { success: true, data, message: 'Cicilan berhasil disimpan di database lokal.' };
    } catch (e: any) {
      return { success: false, data: null, message: e.message || 'Gagal menyimpan cicilan.' };
    }
  },

  async updateInstallment(inst: Installment): Promise<{ success: boolean; data: Installment | null; message: string }> {
    try {
      const data = await localDb.updateInstallment(inst);
      return { success: true, data, message: 'Cicilan berhasil diperbarui.' };
    } catch (e: any) {
      return { success: false, data: null, message: e.message || 'Gagal memperbarui cicilan.' };
    }
  },

  async deleteInstallment(id: string): Promise<{ success: boolean; message: string }> {
    try {
      await localDb.deleteInstallment(id);
      return { success: true, message: 'Cicilan berhasil dihapus.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Gagal menghapus cicilan.' };
    }
  },

  async adjustInstallmentPayment(installmentId: string, amount: number): Promise<void> {
    await localDb.adjustInstallmentPayment(installmentId, amount);
  },

  // --- SAVINGS GOALS ---
  async getSavingsGoals(): Promise<SavingsGoal[]> {
    return await localDb.getSavingsGoals();
  },

  async addSavingsGoal(goal: Omit<SavingsGoal, 'id'>): Promise<{ success: boolean; data?: SavingsGoal; message?: string }> {
    try {
      const data = await localDb.addSavingsGoal(goal);
      return { success: true, data, message: 'Target tabungan disimpan lokal.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Gagal menyimpan target.' };
    }
  },

  async updateSavingsGoal(goal: SavingsGoal): Promise<{ success: boolean; message?: string }> {
    try {
      await localDb.updateSavingsGoal(goal);
      return { success: true, message: 'Target tabungan diperbarui.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Gagal memperbarui target.' };
    }
  },

  async deleteSavingsGoal(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      await localDb.deleteSavingsGoal(id);
      return { success: true, message: 'Target tabungan dihapus.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Gagal menghapus target.' };
    }
  },

  // --- ASSETS ---
  async getAssets(): Promise<Asset[]> {
    return await localDb.getAssets();
  },

  async addAsset(asset: Omit<Asset, 'id'>): Promise<{ success: boolean; data?: Asset; message?: string }> {
    try {
      const data = await localDb.addAsset(asset);
      return { success: true, data, message: 'Aset berhasil disimpan di database lokal.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Gagal menambahkan aset.' };
    }
  },

  async updateAsset(id: string, updates: Partial<Asset>): Promise<{ success: boolean; data?: Asset; message?: string }> {
    try {
      const data = await localDb.updateAsset(id, updates);
      return { success: true, data: data || undefined, message: 'Aset berhasil diperbarui.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Gagal memperbarui aset.' };
    }
  },

  async deleteAsset(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      await localDb.deleteAsset(id);
      return { success: true, message: 'Aset berhasil dihapus.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Gagal menghapus aset.' };
    }
  },

  // --- DASHBOARD DATA ---
  async getDashboardData(): Promise<DashboardData> {
    return await localDb.getDashboardData();
  },

  // --- DATABASE BACKUP & RESTORE JSON ---
  async exportBackup(): Promise<BackupPayload> {
    const backup = await localDb.createBackupJSON();
    localDb.downloadBackupJSON(backup);
    return backup;
  },

  async validateBackupFile(fileContent: string): Promise<{ valid: boolean; payload?: BackupPayload; error?: string }> {
    return await localDb.validateAndParseBackup(fileContent);
  },

  async importBackup(payload: BackupPayload, mode: 'replace' | 'merge' = 'replace'): Promise<{ success: boolean; message: string }> {
    return await localDb.restoreDatabaseJSON(payload, mode);
  },

  // --- DATABASE RESET ---
  async resetDatabase(): Promise<{ success: boolean; message: string }> {
    try {
      await localDb.resetAllDatabase();
      return { success: true, message: 'Database lokal berhasil dikosongkan.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Gagal me-reset database lokal.' };
    }
  },
};
