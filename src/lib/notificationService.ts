/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Installment, NotificationSetting, DueReminderItem } from '../types';

const SETTINGS_KEY = 'ArtaQu_notification_settings';
const LAST_REMINDER_DATE_KEY = 'ArtaQu_last_reminder_date';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSetting = {
  enabled: true,
  daysAhead: 3, // Informs user for due dates within 3 days
  browserNotification: true,
};

export const notificationService = {
  // 1. Get Notification Settings
  getSettings(): NotificationSetting {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_NOTIFICATION_SETTINGS;
  },

  // 2. Save Notification Settings
  saveSettings(settings: Partial<NotificationSetting>): NotificationSetting {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    return updated;
  },

  // 3. Check Browser Notification Permission Status
  getBrowserPermission(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  },

  // 4. Request Browser Notification Permission without alert popups
  async requestBrowserPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  },

  // 5. Calculate Due Installments
  getDueInstallments(installments: Installment[], daysAhead: number = 3): DueReminderItem[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results: DueReminderItem[] = [];

    installments.forEach((inst) => {
      if (inst.status === 'Lunas' || !inst.due_date) return;

      const due = new Date(inst.due_date);
      due.setHours(0, 0, 0, 0);

      // Diff in days
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Include overdue items (diffDays < 0) or upcoming within daysAhead
      if (diffDays <= daysAhead) {
        results.push({
          id: inst.id,
          name: inst.name,
          creditor: inst.creditor,
          remaining: inst.remaining,
          dueDate: inst.due_date,
          daysRemaining: diffDays,
        });
      }
    });

    // Sort: overdue first, then closest due date
    return results.sort((a, b) => a.daysRemaining - b.daysRemaining);
  },

  // 6. Send Browser Web Notification
  sendBrowserNotification(title: string, options?: NotificationOptions): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission !== 'granted') {
      return false;
    }

    try {
      const notif = new Notification(title, {
        icon: '/logo.png',
        badge: '/logo.png',
        silent: false,
        ...options,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };

      return true;
    } catch {
      return false;
    }
  },

  // 7. Check and Trigger Daily Reminder (called on app startup / resume)
  checkAndTriggerDailyReminder(
    installments: Installment[],
    formatRupiah: (num: number) => string,
    force: boolean = false
  ): { triggered: boolean; dueItems: DueReminderItem[]; message?: string } {
    const settings = this.getSettings();
    if (!settings.enabled && !force) {
      return { triggered: false, dueItems: [] };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const lastChecked = localStorage.getItem(LAST_REMINDER_DATE_KEY);

    // If already checked today and not forcing test
    if (!force && lastChecked === todayStr) {
      const dueItems = this.getDueInstallments(installments, settings.daysAhead);
      return { triggered: false, dueItems };
    }

    const dueItems = this.getDueInstallments(installments, settings.daysAhead);
    if (dueItems.length === 0) {
      if (!force) {
        localStorage.setItem(LAST_REMINDER_DATE_KEY, todayStr);
      }
      return { triggered: false, dueItems: [], message: 'Tidak ada cicilan jatuh tempo saat ini.' };
    }

    // Save check date
    localStorage.setItem(LAST_REMINDER_DATE_KEY, todayStr);

    // Prepare notification text
    const overdueCount = dueItems.filter((i) => i.daysRemaining < 0).length;
    const todayCount = dueItems.filter((i) => i.daysRemaining === 0).length;
    const upcomingCount = dueItems.filter((i) => i.daysRemaining > 0).length;

    let body = '';
    if (overdueCount > 0) {
      body += `⚠️ ${overdueCount} cicilan telah lewat jatuh tempo! `;
    }
    if (todayCount > 0) {
      body += `🔔 ${todayCount} cicilan jatuh tempo HARI INI! `;
    }
    if (upcomingCount > 0) {
      body += `📅 ${upcomingCount} cicilan jatuh tempo dalam ${settings.daysAhead} hari ke depan.`;
    }

    // First item highlight
    const primary = dueItems[0];
    const totalRemaining = dueItems.reduce((acc, curr) => acc + curr.remaining, 0);

    const title = `ArtaQu: Pengingat ${dueItems.length} Cicilan`;
    const fullBody = `${body}\nTotal: ${formatRupiah(totalRemaining)} (${primary.name} - ${primary.creditor})`;

    // Send native Web Notification if permission granted
    if (settings.browserNotification && this.getBrowserPermission() === 'granted') {
      this.sendBrowserNotification(title, {
        body: fullBody,
        tag: 'artaqu-due-reminder',
      });
    }

    return {
      triggered: true,
      dueItems,
      message: fullBody,
    };
  },
};
