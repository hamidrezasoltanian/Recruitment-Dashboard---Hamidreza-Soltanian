import { Candidate } from '../types';

declare const persianDate: any;

const REMINDER_MS = 24 * 60 * 60 * 1000; // 24 hours before interview
const MAX_TIMEOUT  = 2_000_000_000;        // ~23 days, safe setTimeout max

const toGregorianMs = (interviewDate: string, interviewTime: string): number | null => {
  try {
    const [year, month, day] = interviewDate.split('/').map(Number);
    const pDate = new persianDate([year, month, day]);
    if (interviewTime) {
      const [hour, minute] = interviewTime.split(':').map(Number);
      pDate.hour(hour).minute(minute).second(0);
    } else {
      pDate.hour(9).minute(0).second(0);
    }
    return pDate.toDate().getTime();
  } catch {
    return null;
  }
};

export const notificationService = {
  requestPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const p = await Notification.requestPermission();
    return p === 'granted';
  },

  scheduleReminder: (candidate: Candidate): void => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (!candidate.interviewDate) return;

    const interviewMs = toGregorianMs(candidate.interviewDate, candidate.interviewTime || '');
    if (!interviewMs) return;

    const reminderMs = interviewMs - REMINDER_MS;
    const delay = reminderMs - Date.now();

    if (delay > 0 && delay < MAX_TIMEOUT) {
      setTimeout(() => {
        new Notification(`یادآوری مصاحبه: ${candidate.name}`, {
          body: `مصاحبه ${candidate.name} برای موقعیت "${candidate.position}" امروز است.`,
          icon: '/favicon.ico',
          tag: `interview-${candidate.id}`,
        });
      }, delay);
    }
  },

  scheduleAll: (candidates: Candidate[]): void => {
    candidates.forEach(c => {
      if (c.interviewDate) notificationService.scheduleReminder(c);
    });
  },
};
