/**
 * "오늘의 동화 시간이에요" 로컬 알림 리마인더 유틸.
 * 완전한 서버 Web Push가 아니라, 브라우저/탭이 열려있는 동안
 * 설정한 시각이 지나면 Notification API로 best-effort 알림을 띄우는 방식.
 * 100% 클라이언트 사이드, SSR 안전. 실패 시 조용히 무시한다.
 */

export type ReminderSettings = {
  enabled: boolean;
  hour: number; // 0-23
  minute: number; // 0-59
  lastNotifiedDate: string | null; // 'YYYY-MM-DD', 오늘 이미 알림을 보냈는지 중복 방지용
};

const REMINDER_KEY = 'ideapiece:reminder-settings';

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  hour: 19,
  minute: 0,
  lastNotifiedDate: null,
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

function withBasePath(urlPath: string) {
  if (!basePath) return urlPath;
  return `${basePath}${urlPath}`;
}

function isStorageSupported(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__ideapiece_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function todayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidReminderSettings(value: unknown): value is ReminderSettings {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.enabled === 'boolean' &&
    typeof item.hour === 'number' &&
    typeof item.minute === 'number' &&
    (item.lastNotifiedDate === null || typeof item.lastNotifiedDate === 'string')
  );
}

/**
 * 리마인더 설정 조회 (없으면 기본값: 꺼짐, 19:00)
 */
export function getReminderSettings(): ReminderSettings {
  if (!isStorageSupported()) return DEFAULT_SETTINGS;

  try {
    const raw = window.localStorage.getItem(REMINDER_KEY);
    if (!raw) return DEFAULT_SETTINGS;

    const parsed: unknown = JSON.parse(raw);
    if (!isValidReminderSettings(parsed)) return DEFAULT_SETTINGS;

    return parsed;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * 리마인더 설정 저장
 */
export function saveReminderSettings(settings: ReminderSettings): void {
  if (!isStorageSupported()) return;

  try {
    window.localStorage.setItem(REMINDER_KEY, JSON.stringify(settings));
  } catch {
    // 조용히 무시
  }
}

/**
 * 현재 브라우저가 Notification API를 지원하는지 여부
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * 현재 알림 권한 상태. 미지원 브라우저면 'unsupported' 반환.
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    return Notification.permission;
  } catch {
    return 'unsupported';
  }
}

/**
 * 알림 권한을 요청한다. 미지원 브라우저면 'denied'를 반환한다.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';

  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

/**
 * 현재 시각을 확인해서 조건이 맞으면 알림을 발화한다.
 * - enabled가 true
 * - 알림 권한이 'granted'
 * - 현재 시각(시*60+분) >= 설정 시각(시*60+분)
 * - lastNotifiedDate가 오늘과 다름 (오늘 아직 안 보냄)
 * 위 조건을 모두 만족하면 Notification을 띄우고 lastNotifiedDate를 오늘 날짜로 갱신한다.
 */
export function checkAndFireReminder(): void {
  try {
    const settings = getReminderSettings();
    if (!settings.enabled) return;
    if (getNotificationPermission() !== 'granted') return;

    const today = todayKey();
    if (settings.lastNotifiedDate === today) return;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const targetMinutes = settings.hour * 60 + settings.minute;
    if (currentMinutes < targetMinutes) return;

    new Notification('오늘의 동화 시간이에요! 📚', {
      body: '아이와 함께 오늘의 동화를 만나보세요.',
      icon: withBasePath('/icons/icon.svg'),
    });

    saveReminderSettings({ ...settings, lastNotifiedDate: today });
  } catch {
    // 조용히 무시
  }
}
