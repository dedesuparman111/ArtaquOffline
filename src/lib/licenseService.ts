/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LicenseInfo, LicenseTier, UsageQuota } from '../types';

const LICENSE_STORAGE_KEY = 'ArtaQu_license_data';
const DEVICE_ID_KEY = 'ArtaQu_device_id';
const ADMIN_PIN_KEY = 'ArtaQu_admin_pin_hash';
const ADMIN_HISTORY_KEY = 'ArtaQu_admin_keygen_history';
const SECRET_SALT = 'ARTAQU_SECURE_SALT_2026_OFFLINE';
const DEFAULT_ADMIN_PIN = '998822'; // Default Master PIN for the Seller/Admin

export const FREE_LIMITS = {
  TRANSACTIONS: 25,
  INSTALLMENTS: 2,
  SAVINGS: 2,
  ASSETS: 2,
};

// Simple robust deterministic hash function for offline verification
function simpleHash(input: string): string {
  let hash1 = 5381;
  let hash2 = 52711;

  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash1 = (hash1 * 33) ^ char;
    hash2 = (hash2 * 33) ^ char;
  }

  const h1 = (hash1 >>> 0).toString(16).toUpperCase().padStart(8, '0');
  const h2 = (hash2 >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return (h1 + h2).substring(0, 12);
}

export const licenseService = {
  /**
   * Get or initialize persistent Device ID
   */
  getDeviceId(): string {
    if (typeof window === 'undefined') return 'ARTA-DEV-0000-0000';

    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      // Generate unique device ID
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const timePart = Date.now().toString(36).substring(3, 7).toUpperCase();
      deviceId = `ARTA-${randomPart}-${timePart}`;
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  },

  /**
   * Get current license information
   */
  getLicenseInfo(): LicenseInfo {
    const deviceId = this.getDeviceId();
    if (typeof window === 'undefined') {
      return { tier: 'FREE', isPro: false, deviceId };
    }

    try {
      const raw = localStorage.getItem(LICENSE_STORAGE_KEY);
      if (raw) {
        const parsed: LicenseInfo = JSON.parse(raw);
        // Verify key validity
        if (parsed.licenseKey && this.verifyLicenseKey(parsed.licenseKey, deviceId).valid) {
          return {
            ...parsed,
            tier: 'PRO',
            isPro: true,
            deviceId,
          };
        }
      }
    } catch {
      // invalid stored license
    }

    return {
      tier: 'FREE',
      isPro: false,
      deviceId,
    };
  },

  /**
   * Verify license key format and cryptographic signature
   */
  verifyLicenseKey(rawKey: string, targetDeviceId?: string): { valid: boolean; reason?: string; customerName?: string } {
    if (!rawKey || typeof rawKey !== 'string') {
      return { valid: false, reason: 'Kode lisensi tidak boleh kosong.' };
    }

    const cleanKey = rawKey.trim().toUpperCase().replace(/[\s]/g, '');
    const deviceId = targetDeviceId || this.getDeviceId();

    // Universal Master Promo/Demo keys (for easy offline review/testing)
    const masterKeys = [
      'ARTA-PRO-LIFETIME-VIP',
      'ARTA-PRO-2026-UNLIMITED',
      'ARTA-MASTER-ACTIVATED',
      'ARTA-VIP-OFFLINE-PASS',
    ];

    if (masterKeys.includes(cleanKey)) {
      return { valid: true, customerName: 'Pengguna Lisensi Lifetime' };
    }

    // Pattern 1: Universal Signed Key -> ARTA-UNIV-[HASH1]-[HASH2]
    if (cleanKey.startsWith('ARTA-UNIV-')) {
      const parts = cleanKey.split('-');
      if (parts.length === 4) {
        const payload = parts[2];
        const signature = parts[3];
        const expectedSig = simpleHash(`UNIVERSAL_${payload}_${SECRET_SALT}`).substring(0, 6);
        if (signature === expectedSig) {
          return { valid: true, customerName: `Lisensi Global (${payload})` };
        }
      }
    }

    // Pattern 2: Device-Bound Pro Key -> ARTA-PRO-[DEVICE_FRAG]-[SIG]
    if (cleanKey.startsWith('ARTA-PRO-')) {
      const parts = cleanKey.split('-');
      if (parts.length >= 4) {
        const cleanDev = deviceId.replace(/[^A-Z0-9]/g, '');
        const devFrag = parts[2];
        const sig = parts[3];
        const expectedSig = simpleHash(`${cleanDev}_${devFrag}_${SECRET_SALT}`).substring(0, 6);

        if (sig === expectedSig) {
          return { valid: true, customerName: `Lisensi Perangkat (${devFrag})` };
        }
      }
    }

    return {
      valid: false,
      reason: 'Kode lisensi tidak valid untuk perangkat ini atau format salah.',
    };
  },

  /**
   * Activate license with a serial key
   */
  activateLicense(key: string, customerName?: string): { success: boolean; message: string; license?: LicenseInfo } {
    const deviceId = this.getDeviceId();
    const verification = this.verifyLicenseKey(key, deviceId);

    if (!verification.valid) {
      return {
        success: false,
        message: verification.reason || 'Kode lisensi tidak valid.',
      };
    }

    const licenseInfo: LicenseInfo = {
      tier: 'PRO',
      isPro: true,
      licenseKey: key.trim().toUpperCase(),
      activatedAt: new Date().toISOString(),
      customerName: customerName || verification.customerName || 'Pemilik Lisensi PRO',
      deviceId,
      expiryDate: null, // Lifetime access
    };

    try {
      localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(licenseInfo));
    } catch (e) {
      return { success: false, message: 'Gagal menyimpan lisensi di penyimpanan browser.' };
    }

    return {
      success: true,
      message: 'Selamat! Lisensi ArtaQu PRO Lifetime berhasil diaktifkan.',
      license: licenseInfo,
    };
  },

  /**
   * Deactivate license (return to Free tier)
   */
  deactivateLicense(): void {
    try {
      localStorage.removeItem(LICENSE_STORAGE_KEY);
    } catch {
      // ignore
    }
  },

  /**
   * Check if an action is within allowed quota for Free users
   */
  checkLimit(type: 'transaction' | 'installment' | 'saving' | 'asset', currentCount: number): {
    allowed: boolean;
    max: number;
    current: number;
    isPro: boolean;
    message: string;
  } {
    const isPro = this.getLicenseInfo().isPro;
    if (isPro) {
      return {
        allowed: true,
        max: Infinity,
        current: currentCount,
        isPro: true,
        message: 'Akses PRO: Tanpa Batasan',
      };
    }

    let max = FREE_LIMITS.TRANSACTIONS;
    let label = 'Transaksi';

    if (type === 'installment') {
      max = FREE_LIMITS.INSTALLMENTS;
      label = 'Cicilan Aktif';
    } else if (type === 'saving') {
      max = FREE_LIMITS.SAVINGS;
      label = 'Target Tabungan';
    } else if (type === 'asset') {
      max = FREE_LIMITS.ASSETS;
      label = 'Portofolio Aset';
    }

    const allowed = currentCount < max;
    const message = allowed
      ? `Versi Gratis: ${currentCount}/${max} ${label}`
      : `Batas versi Gratis tercapai (${max} ${label}). Upgrade ke PRO untuk menambah tanpa batas.`;

    return {
      allowed,
      max,
      current: currentCount,
      isPro: false,
      message,
    };
  },

  /**
   * Get complete usage quota overview
   */
  getUsageQuota(counts: { transactions: number; installments: number; savings: number; assets: number }): UsageQuota {
    const isPro = this.getLicenseInfo().isPro;

    return {
      transactions: {
        current: counts.transactions,
        max: isPro ? Infinity : FREE_LIMITS.TRANSACTIONS,
        isUnlimited: isPro,
        isReached: !isPro && counts.transactions >= FREE_LIMITS.TRANSACTIONS,
      },
      installments: {
        current: counts.installments,
        max: isPro ? Infinity : FREE_LIMITS.INSTALLMENTS,
        isUnlimited: isPro,
        isReached: !isPro && counts.installments >= FREE_LIMITS.INSTALLMENTS,
      },
      savings: {
        current: counts.savings,
        max: isPro ? Infinity : FREE_LIMITS.SAVINGS,
        isUnlimited: isPro,
        isReached: !isPro && counts.savings >= FREE_LIMITS.SAVINGS,
      },
      assets: {
        current: counts.assets,
        max: isPro ? Infinity : FREE_LIMITS.ASSETS,
        isUnlimited: isPro,
        isReached: !isPro && counts.assets >= FREE_LIMITS.ASSETS,
      },
    };
  },

  /**
   * Generator Tool (for the Developer / Seller to generate valid serial keys for buyers)
   */
  generateKey(type: 'device' | 'universal', targetDeviceId?: string, customerCode?: string): string {
    const code = (customerCode || Math.random().toString(36).substring(2, 6)).toUpperCase();

    let serial = '';
    if (type === 'universal') {
      const sig = simpleHash(`UNIVERSAL_${code}_${SECRET_SALT}`).substring(0, 6);
      serial = `ARTA-UNIV-${code}-${sig}`;
    } else {
      const dev = (targetDeviceId || this.getDeviceId()).replace(/[^A-Z0-9]/g, '');
      const sig = simpleHash(`${dev}_${code}_${SECRET_SALT}`).substring(0, 6);
      serial = `ARTA-PRO-${code}-${sig}`;
    }

    // Record into local admin key history
    this.recordGeneratedKey({
      key: serial,
      type,
      targetDeviceId: type === 'device' ? (targetDeviceId || this.getDeviceId()) : 'UNIVERSAL',
      customerName: code,
      createdAt: new Date().toISOString(),
    });

    return serial;
  },

  /**
   * Admin Authentication: Verify Admin PIN
   */
  verifyAdminPin(pinInput: string): boolean {
    if (!pinInput) return false;
    const clean = pinInput.trim();
    const storedHash = localStorage.getItem(ADMIN_PIN_KEY);
    const expectedHash = storedHash || simpleHash(`ADMIN_${DEFAULT_ADMIN_PIN}_${SECRET_SALT}`);
    const inputHash = simpleHash(`ADMIN_${clean}_${SECRET_SALT}`);

    // Also support fallback master rescue PIN in emergency
    if (clean === 'ARTA-ADMIN-2026' || clean === '998822') {
      return true;
    }

    return inputHash === expectedHash;
  },

  /**
   * Admin: Change Master PIN
   */
  changeAdminPin(currentPin: string, newPin: string): { success: boolean; message: string } {
    if (!this.verifyAdminPin(currentPin)) {
      return { success: false, message: 'PIN Admin saat ini salah.' };
    }

    if (!newPin || newPin.trim().length < 4) {
      return { success: false, message: 'PIN baru minimal harus 4 karakter / angka.' };
    }

    const newHash = simpleHash(`ADMIN_${newPin.trim()}_${SECRET_SALT}`);
    try {
      localStorage.setItem(ADMIN_PIN_KEY, newHash);
      return { success: true, message: 'PIN Admin berhasil diubah.' };
    } catch {
      return { success: false, message: 'Gagal menyimpan PIN baru.' };
    }
  },

  /**
   * Admin: Get history of generated keys
   */
  getGeneratedKeyHistory(): Array<{
    key: string;
    type: 'device' | 'universal';
    targetDeviceId: string;
    customerName: string;
    createdAt: string;
  }> {
    try {
      const raw = localStorage.getItem(ADMIN_HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Admin: Record a newly generated key
   */
  recordGeneratedKey(record: {
    key: string;
    type: 'device' | 'universal';
    targetDeviceId: string;
    customerName: string;
    createdAt: string;
  }): void {
    try {
      const history = this.getGeneratedKeyHistory();
      // Keep up to 100 recent entries
      const updated = [record, ...history.filter(h => h.key !== record.key)].slice(0, 100);
      localStorage.setItem(ADMIN_HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  },

  /**
   * Admin: Clear history
   */
  clearKeyHistory(): void {
    try {
      localStorage.removeItem(ADMIN_HISTORY_KEY);
    } catch {
      // ignore
    }
  },

  /**
   * Format WhatsApp ready message for buyer
   */
  formatBuyerWhatsAppReply(customerName: string, serialKey: string, isDeviceLocked: boolean, deviceId?: string): string {
    return `Halo Kak ${customerName || 'Pelanggan ArtaQu'},
Terima kasih atas pesanan Kode Lisensi ArtaQu PRO Lifetime! 🌟

Berikut adalah Kode Serial Lisensi Anda:
👉 *${serialKey}*

${isDeviceLocked ? `🔒 *Terkunci khusus untuk Device ID:* ${deviceId || 'Perangkat Anda'}\n` : '🌐 *Tipe Lisensi:* Universal (Dapat dipakai di perangkat Anda)\n'}
*Cara Aktivasi Sangat Mudah:*
1. Buka aplikasi *ArtaQu* di browser / HP Anda
2. Klik tombol *Upgrade PRO* di menu atas atau di Setelan
3. Masukkan Kode Serial di atas pada kolom yang tersedia
4. Klik tombol *'Aktifkan Lisensi PRO'* ✨

Selamat menikmati akses pencatatan keuangan tanpa batas kuota! Jika ada kendala, jangan ragu untuk menghubungi kami.`;
  }
};
